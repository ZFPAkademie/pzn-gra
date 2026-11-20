#!/usr/bin/env python3
"""
security_probe.py — útočný test Supabase projektu: co SKUTEČNĚ dostane nepřihlášený návštěvník.

Proč existuje: supabase_rls_check.sh čte katalog (policy, granty) a usuzuje. Tenhle skript
to zkouší — anon klíčem z internetu a rolí anon uvnitř databáze. Katalog nevidí všechno:
23. 9. anon klíč četl 166 řádků s tajnými tokeny přes policy, která „vypadala" v pořádku.

Tři části, žádná nic nezapíše a žádná nevypíše data:
  1 ČTENÍ   anon klíčem přes REST (PostgREST): jen HEAD s počtem řádků, nikdy obsah
  2 ZÁPIS   UPDATE/DELETE jednoho řádku každé tabulky pod rolí anon, uvnitř subtransakce,
            která se VŽDY vrátí (rollback). Tabulky s triggery volajícími HTTP se přeskočí.
  3 API     statická kontrola route.ts pod /api/admin (má kontrolu přihlášení?) + živý GET
            bez přihlášení na admin GET routy (jen s --url)
  4 PŘIHLÁŠENÝ CIZINEC (od 15. 10. 2026) — v transakci s rollbackem, uvnitř databáze:
            - JWT neexistujícího uživatele (role authenticated): kolik řádků vidí, smí INSERT?
            - totéž s podvrženými user_metadata (role=admin…) — vidí víc? = policy jim věří
            - anon i přihlášený INSERT řádku bez vazby na uživatele (RLS se vyhodnocuje před NOT NULL,
              takže 42501 = odmítnuto, jiná chyba = prošel přes RLS)
            - prázdné tabulky dostanou syntetický řádek (replica: bez triggerů a FK), aby 0 něco znamenala
            - sekvence se nevolají (nextval rollback nevrací — číselné řady); posun se hlásí
            - u cloudu vypíše, jestli je registrace otevřená (kdo se cizím přihlášeným může stát)

  5 HLAVIČKY (od 1. 11. 2026, jen s url) — bezpečnostní hlavičky úvodní stránky: CSP, ochrana
            proti vložení do cizí stránky (X-Frame-Options / frame-ancestors), nosniff,
            Referrer-Policy, HSTS. Zatím jen varování: chyběly skoro všude a nález by
            zablokoval /ship všech projektů najednou. (KJM 30. 10.: upozornil cizí „expert“.)

Výsledek je test: 0 = prošlo, 1 = nález, 2 = chyba konfigurace.
Záměrně veřejné věci (články, ceník, formulář poptávky) se povolí v <projekt>/.vibekodex/security.json:
  { "ref": "abc…", "url": "https://web.cz",
    "allow_read":   ["articles", "pricing"],        # anon smí číst tyto tabulky/view
    "allow_insert": ["leads"],                      # anon smí INSERT (formulář) — i pro přihlášené
    "allow_read_auth":   ["catalog"],               # každý přihlášený smí číst (navíc k allow_read)
    "allow_insert_auth": ["comments"],              # každý přihlášený smí INSERT bez vazby na sebe
    "allow_api":    ["/api/admin/health"] }         # admin routy bez přihlášení záměrně

Použití:
  security_probe.py <složka-projektu>            ref a url z .vibekodex/security.json nebo z .env*
  security_probe.py <složka> --url https://…     přidá živý test API
  security_probe.py --ref <ref>                  jen databáze, bez složky
  security_probe.py … --no-write                 vynechá část 2
  security_probe.py … --json                     strojový výstup (pro security_all.sh / CI)
  security_probe.py <složka> --auth-only         jen část 4 (cloud)
  security_probe.py <složka> --local <kontejner> jen část 4 proti lokálnímu QA stacku (supabase_db_<projekt>)
"""
import argparse, base64, glob, json, os, re, subprocess, sys, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
SENS = re.compile(r'(^|_)(e?mail|phone|telefon|tel|ico|dic|password|passwd|heslo|token|secret|iban|birth|rodne|commission|provize|internal|address|adresa|pin|key|api_?key|billing)($|_)', re.I)


# ---------------------------------------------------------------- přístup
def keychain(name):
    try:
        raw = subprocess.run(['security', 'find-generic-password', '-s', name, '-w'],
                             capture_output=True, text=True).stdout.strip()
    except FileNotFoundError:
        return ''
    if raw.startswith('go-keyring-base64:'):
        return base64.b64decode(raw.split(':', 1)[1]).decode()
    return raw

def tokens():
    out = []
    if os.environ.get('SUPABASE_ACCESS_TOKEN'): out.append(os.environ['SUPABASE_ACCESS_TOKEN'])
    for n in ('Supabase CLI', 'Supabase CLI osobni'):
        t = keychain(n)
        if t: out.append(t)
    return out

def http(method, url, headers=None, body=None, timeout=30):
    # Přes curl, ne urllib: python.org Python na macOS nemá systémové certifikáty.
    # Hlavičky (i klíče) jdou curlu přes stdin konfigurační soubor, ne na příkazovou řádku.
    import tempfile
    cfg = [f'url = "{url}"', f'request = "{method}"', 'silent', f'max-time = {timeout}',
           'user-agent = "vibekodex-security-probe"']
    if method == 'HEAD': cfg.append('head')
    for k, v in (headers or {}).items(): cfg.append(f'header = "{k}: {v}"')
    with tempfile.TemporaryDirectory() as d:
        hf, bf = os.path.join(d, 'h'), os.path.join(d, 'b')
        cfg += [f'dump-header = "{hf}"', f'output = "{bf}"', 'write-out = "%{http_code}"']
        if body is not None:
            df = os.path.join(d, 'd'); open(df, 'w').write(json.dumps(body))
            cfg += ['header = "Content-Type: application/json"', f'data-binary = "@{df}"']
        p = subprocess.run(['curl', '-K', '-'], input='\n'.join(cfg), capture_output=True, text=True)
        code = int(p.stdout.strip() or 0) if p.stdout.strip().isdigit() else 0
        hdr = {}
        if os.path.exists(hf):
            for line in open(hf, errors='ignore'):
                if ':' in line:
                    k, v = line.split(':', 1); hdr[k.strip()] = v.strip()
        raw = open(bf, 'rb').read() if os.path.exists(bf) else p.stderr.encode()
        return code, hdr, raw

def mgmt(ref, path, method='GET', body=None):
    """Management API — zkusí tokeny po řadě (firemní, osobní), vrátí (kód, json)."""
    last = (0, None)
    for t in tokens():
        code, _, raw = http(method, f'https://api.supabase.com/v1/projects/{ref}{path}',
                            {'Authorization': f'Bearer {t}'}, body, timeout=90)
        if code in (401, 403, 404):
            last = (code, None); continue
        try: return code, json.loads(raw)
        except Exception: return code, raw.decode(errors='ignore')
    return last

def anon_key(ref):
    code, keys = mgmt(ref, '/api-keys')
    if code != 200 or not isinstance(keys, list): return None
    for k in keys:
        if k.get('name') == 'anon' and k.get('api_key'): return k['api_key']
    for k in keys:
        if k.get('type') == 'publishable' and k.get('api_key'): return k['api_key']
    return None


# ---------------------------------------------------------------- konfigurace projektu
def load_cfg(folder):
    cfg = {}
    if folder:
        p = os.path.join(folder, '.vibekodex', 'security.json')
        if os.path.exists(p):
            cfg = json.load(open(p))
        if not cfg.get('ref'):
            for f in sorted(glob.glob(os.path.join(folder, '.env*'))):
                if f.endswith('.example'): continue
                m = re.search(r'SUPABASE_URL=\s*["\']?https://([a-z0-9]{20})\.supabase\.co', open(f, errors='ignore').read())
                if m: cfg['ref'] = m.group(1); break
    return cfg


# ---------------------------------------------------------------- 1 ČTENÍ
CATALOG_SQL = """
select c.relname::text as obj, c.relkind::text as kind,
       coalesce((select string_agg(a.attname::text, ',') from pg_attribute a
                  where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped), '') as cols,
       coalesce((select string_agg(cp.column_name::text, ',') from information_schema.column_privileges cp
                  where cp.table_schema = 'public' and cp.table_name = c.relname
                    and cp.grantee = 'anon' and cp.privilege_type = 'SELECT'), '') as anon_cols
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind in ('r','v','m','p','f')
   and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
 order by 1;"""

def probe_read(ref, key):
    # Seznam objektů z katalogu (OpenAPI schéma je po utažení z 23. 9. pro anon zavřené — správně),
    # pak KAŽDÝ objekt zkusit anon klíčem zvenku. Jen HEAD s počtem, obsah nikdy.
    code, cat = mgmt(ref, '/database/query', 'POST', {'query': CATALOG_SQL})
    if code not in (200, 201) or not isinstance(cat, list):
        return {'error': f'katalog {code}'}, []
    base = f'https://{ref}.supabase.co/rest/v1/'
    res = []
    for o in cat:
        c, hd, _ = http('HEAD', base + o['obj'] + '?select=*', {'apikey': key, 'Authorization': f'Bearer {key}',
                                                              'Prefer': 'count=exact', 'Range': '0-0'})
        cr = hd.get('Content-Range') or hd.get('content-range') or ''
        n = None
        if c in (200, 206) and '/' in cr:
            tail = cr.split('/')[-1]
            n = int(tail) if tail.isdigit() else None
        cols = [x for x in o['cols'].split(',') if x]
        anon_cols = [x for x in (o.get('anon_cols') or '').split(',') if x]
        seen = cols
        # sloupcové granty: select=* spadne na 401/42501, ale jednotlivé sloupce čitelné být můžou
        if c not in (200, 206) and anon_cols and set(anon_cols) != set(cols):
            c2, hd2, _ = http('HEAD', base + o['obj'] + '?select=' + ','.join(anon_cols),
                              {'apikey': key, 'Authorization': f'Bearer {key}', 'Prefer': 'count=exact', 'Range': '0-0'})
            cr2 = hd2.get('Content-Range') or hd2.get('content-range') or ''
            if c2 in (200, 206) and '/' in cr2 and cr2.split('/')[-1].isdigit():
                c, n, seen = c2, int(cr2.split('/')[-1]), anon_cols
        res.append({'obj': o['obj'], 'kind': o['kind'], 'status': c, 'rows': n,
                    'error': c == 0 or c >= 500 or c == 429,
                    'sensitive': [x for x in seen if SENS.search(x) and 'link' not in x]})
    return {}, res


# ---------------------------------------------------------------- 2 ZÁPIS (vždy rollback)
WRITE_SQL = r"""
do $probe$
declare
  r record; n int; res text := ''; col text; st text; d text;
begin
  set local lock_timeout = '2s';
  set local statement_timeout = '60s';
  begin
    -- Kontrolní tabulka: anon do ní zapisovat SMÍ. Když ji test nenajde jako zapisovatelnou,
    -- je rozbitý test, ne databáze. Vzniká uvnitř subtransakce, rollback ji odstraní.
    create table public._vk_probe_canary (id int primary key, v int);
    insert into public._vk_probe_canary values (1, 1);
    alter table public._vk_probe_canary enable row level security;
    create policy vk_probe_all on public._vk_probe_canary for all to anon using (true) with check (true);
    grant select, update, delete on public._vk_probe_canary to anon;
    set local role anon;
    for r in
      select c.oid, c.relname::text as t
        from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
       where ns.nspname = 'public' and c.relkind = 'r'
         and not exists (select 1 from pg_depend dp where dp.objid = c.oid and dp.deptype = 'e')
         and not exists (                      -- trigger, který by mohl volat ven: přeskočit
               select 1 from pg_trigger tg join pg_proc pr on pr.oid = tg.tgfoid
                where tg.tgrelid = c.oid and not tg.tgisinternal
                  and pr.prosrc ~* '(net\.http|http_post|http_get|extensions\.http|pg_net)')
       order by 2
    loop
      select a.attname into col
        from pg_attribute a
        left join pg_index i on i.indrelid = a.attrelid and i.indisprimary and a.attnum = any(i.indkey)
       where a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped and a.attgenerated = ''
         and a.attidentity <> 'a'
       order by (i.indrelid is null), a.attnum limit 1;
      if col is null then continue; end if;
      begin
        execute format('update public.%I set %I = %I where ctid = (select ctid from public.%I limit 1)', r.t, col, col, r.t);
        get diagnostics n = row_count;
        res := res || r.t || '|update|' || n || '|' || E'\n';
      exception when others then
        res := res || r.t || '|update|x|' || sqlstate || E'\n';
      end;
      begin
        execute format('delete from public.%I where ctid = (select ctid from public.%I limit 1)', r.t, r.t);
        get diagnostics n = row_count;
        res := res || r.t || '|delete|' || n || '|' || E'\n';
      exception when others then
        res := res || r.t || '|delete|x|' || sqlstate || E'\n';
      end;
    end loop;
    raise exception 'VK_PROBE_ROLLBACK' using detail = res;   -- vrátí VŠE, co se výše stalo
  exception when others then
    get stacked diagnostics st = message_text, d = pg_exception_detail;
    if st <> 'VK_PROBE_ROLLBACK' then raise; end if;
    perform set_config('vk.probe', d, false);
  end;
end
$probe$;
select current_setting('vk.probe', true) as res,
       (select string_agg(c.relname::text, ',') from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
         where ns.nspname='public' and c.relkind='r' and exists (
           select 1 from pg_trigger tg join pg_proc pr on pr.oid=tg.tgfoid
            where tg.tgrelid=c.oid and not tg.tgisinternal
              and pr.prosrc ~* '(net\.http|http_post|http_get|extensions\.http|pg_net)')) as skipped;
"""

RPC_SQL = r"""
select p.proname::text as name, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as definer
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and pg_get_function_result(p.oid) <> 'trigger'
   and has_function_privilege('anon', p.oid, 'EXECUTE')
   and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
   and p.provolatile <> 'i'
   and not exists (select 1 from pg_policies pp where pp.schemaname = 'public'
                   and (coalesce(pp.qual,'') || coalesce(pp.with_check,'')) ilike '%' || p.proname || '(%')
 order by 1;"""

def probe_rpc(ref):
    code, out = mgmt(ref, '/database/query', 'POST', {'query': RPC_SQL})
    if code not in (200, 201) or not isinstance(out, list):
        return {'error': f'RPC katalog {code}'}, []
    return {}, out

def probe_write(ref):
    code, out = mgmt(ref, '/database/query', 'POST', {'query': WRITE_SQL})
    if code not in (200, 201) or not isinstance(out, list) or not out:
        return {'error': f'SQL {code}: {str(out)[:200]}'}, []
    raw = out[-1].get('res') or ''
    skipped = [s for s in (out[-1].get('skipped') or '').split(',') if s]
    res = {}
    for line in raw.strip().splitlines():
        t, op, n, err = (line.split('|') + ['', '', '', ''])[:4]
        res.setdefault(t, {})[op] = int(n) if n.isdigit() else ('denied' if err == '42501' else f'err {err}')
    canary = res.pop('_vk_probe_canary', {})
    meta = {'skipped': skipped, 'canary_ok': canary.get('update') == 1 and canary.get('delete') == 1}
    # rollback opravdu proběhl? kontrolní tabulka nesmí existovat
    c2, chk = mgmt(ref, '/database/query', 'POST', {'query': "select to_regclass('public._vk_probe_canary') is null as gone"})
    meta['rollback_ok'] = isinstance(chk, list) and bool(chk) and chk[0].get('gone') is True
    return meta, [{'table': t, **v} for t, v in sorted(res.items())]


# ---------------------------------------------------------------- 4 CIZÍ PŘIHLÁŠENÝ, INSERT, PRÁZDNÉ TABULKY (vždy rollback)
# Slepá místa částí 1–2 (SETUP_IMPROVEMENTS_3 bod 5, 15. 10. 2026):
#   - role authenticated: „rodič viděl cizí trénink" — přihlášený cizinec, ne anon
#   - podvržené user_metadata: uživatel si je nastaví sám (auth.updateUser) → policy jim nesmí věřit
#   - INSERT: části 1–2 zkoušely jen čtení, UPDATE a DELETE
#   - prázdné tabulky: 0 řádků přes anon nic nedokazuje → syntetický řádek (jen v transakci)
# Vše v subtransakci, která se vždy vrátí. Sekvence se NEVOLAJÍ (nextval rollback nevrací —
# díra v číselné řadě faktur): sloupce se sekvencí/identity dostanou hodnotu explicitně.
STRANGER = '00000000-0000-4000-8000-00000000b0b0'
AUTH_SQL = r"""
do $probe$
declare
  r record; c record; n int; ex boolean; res text := ''; st text; d text; s text; v text;
  cols text; vals text; ov text; seed_cols text; seed_vals text; seed_ov text;
  ins jsonb := '{}'; seeded text := '';
  claims jsonb := jsonb_build_object(
    'anon',   jsonb_build_object('role', 'anon'),
    'auth',   jsonb_build_object('sub', '__SUB__', 'role', 'authenticated', 'aud', 'authenticated',
                'email', 'vk-probe@invalid.example', 'app_metadata', jsonb_build_object('provider', 'email'),
                'user_metadata', '{}'::jsonb),
    'forged', jsonb_build_object('sub', '__SUB__', 'role', 'authenticated', 'aud', 'authenticated',
                'email', 'vk-probe@invalid.example', 'app_metadata', jsonb_build_object('provider', 'email'),
                'user_metadata', jsonb_build_object('role', 'admin', 'user_role', 'admin', 'app_role', 'admin',
                  'is_admin', true, 'admin', true, 'is_super_admin', true, 'roles', jsonb_build_array('admin', 'super_admin'))));
  seq_before text; seq_after text;
begin
  set local lock_timeout = '2s';
  set local statement_timeout = '120s';
  select string_agg(schemaname || '.' || sequencename || '=' || coalesce(last_value, 0), ',' order by 1)
    into seq_before from pg_sequences where schemaname = 'public';
  begin
    for r in
      select cl.oid, cl.relname::text as t, cl.relkind::text as k
        from pg_class cl join pg_namespace ns on ns.oid = cl.relnamespace
       where ns.nspname = 'public' and cl.relkind in ('r', 'p', 'v', 'm')
         and not exists (select 1 from pg_depend dp where dp.objid = cl.oid and dp.deptype = 'e')
         and not exists (select 1 from pg_trigger tg join pg_proc pr on pr.oid = tg.tgfoid
                          where tg.tgrelid = cl.oid and not tg.tgisinternal
                            and pr.prosrc ~* '(net\.http|http_post|http_get|extensions\.http|pg_net)')
       order by 2
    loop
      if r.k not in ('r', 'p') then continue; end if;
      cols := ''; vals := ''; ov := ''; seed_cols := ''; seed_vals := ''; seed_ov := '';
      for c in
        select a.attname::text as nm, a.attnum, a.atttypid, format_type(a.atttypid, a.atttypmod) as ty, t.typtype,
               a.attidentity, a.attnotnull, pg_get_expr(ad.adbin, ad.adrelid) as def
          from pg_attribute a join pg_type t on t.oid = a.atttypid
          left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
         where a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped and a.attgenerated = ''
         order by a.attnum
      loop
        -- CHECK (col = ANY (ARRAY['a', 'b'])) / (col = 'a') → první povolená hodnota
        select coalesce(substring(pg_get_constraintdef(co.oid) from '\m' || c.nm || ' = ANY \(ARRAY\[''([^'']*)'''),
                        substring(pg_get_constraintdef(co.oid) from '\m' || c.nm || ' = ''([^'']*)'''))
          into v from pg_constraint co
         where co.conrelid = r.oid and co.contype = 'c' and pg_get_constraintdef(co.oid) ~ ('\m' || c.nm || ' = ')
         limit 1;
        v := case
          when v is not null then quote_literal(v) || '::' || c.ty
          when c.typtype = 'e' then (select quote_literal(e.enumlabel) from pg_enum e where e.enumtypid = c.atttypid
                                      order by e.enumsortorder limit 1) || '::' || c.ty
          when c.ty like '%[]' then '''{}''::' || c.ty
          when c.ty = 'uuid' then 'gen_random_uuid()'
          when c.ty = 'boolean' then 'false'
          when c.ty ~ '^(smallint|integer|bigint|numeric|real|double precision)' then '1'
          -- pořadí sloupců = pořadí dat (check_in < check_out)
          when c.ty ~ '^(timestamp|date)' then format('(now() + interval ''%s days'')::%s', c.attnum, c.ty)
          when c.ty ~ '^time' then '''00:00''::' || c.ty
          when c.ty in ('json', 'jsonb') then '''{}''::' || c.ty
          when c.ty = 'bytea' then '''\x00''::bytea'
          when c.ty = 'inet' then '''127.0.0.1''::inet'
          else '''v''::' || c.ty end;
        -- sekvence / identity: vždy explicitně (nextval se nevrací rollbackem)
        if c.attidentity in ('a', 'd') or coalesce(c.def, '') ilike '%nextval(%' then
          cols := cols || ',' || quote_ident(c.nm); vals := vals || ',' || v;
          seed_cols := seed_cols || ',' || quote_ident(c.nm); seed_vals := seed_vals || ',' || v;
          if c.attidentity = 'a' then ov := ' overriding system value'; seed_ov := ov; end if;
        elsif c.attnotnull and c.def is null then
          seed_cols := seed_cols || ',' || quote_ident(c.nm); seed_vals := seed_vals || ',' || v;
        end if;
      end loop;
      ins := ins || jsonb_build_object(r.t, case when cols = '' then 'default values'
                    else format('(%s)%s values (%s)', substr(cols, 2), ov, substr(vals, 2)) end);
      -- prázdná tabulka → syntetický řádek jako vlastník, bez triggerů a FK (replica)
      execute format('select exists(select 1 from public.%I)', r.t) into ex;
      if not ex then
        begin
          set local session_replication_role = replica;
          if seed_cols = '' then execute format('insert into public.%I default values', r.t);
          else execute format('insert into public.%I (%s)%s values (%s)', r.t, substr(seed_cols, 2), seed_ov, substr(seed_vals, 2)); end if;
          seeded := seeded || r.t || ',';
          set local session_replication_role = origin;
        exception when others then
          set local session_replication_role = origin;
          res := res || r.t || '|seed|x|' || sqlstate || E'\n';
        end;
      end if;
    end loop;

    -- Triggery (BEFORE INSERT) běží PŘED kontrolou RLS: jejich chyba (P0001, 22P02) by se četla jako
    -- „prošel přes RLS". Replica je vypne → výsledek INSERTu = čistě policy, a bez vedlejších účinků.
    set local session_replication_role = replica;
    -- nejdřív všechna čtení, pak zápisy — jinak by řádek vložený přihlášeným „viděl navíc" podvržený
    foreach s in array array['anon', 'auth', 'forged', 'ins_anon', 'ins_auth'] loop
      v := case when s like 'ins_%' then substr(s, 5) else s end;   -- scénář pro claims
      perform set_config('request.jwt.claims', (claims -> v)::text, true);
      perform set_config('request.jwt.claim.sub', coalesce(claims -> v ->> 'sub', ''), true);
      perform set_config('request.jwt.claim.role', claims -> v ->> 'role', true);
      execute format('set local role %I', claims -> v ->> 'role');
      for r in
        select cl.relname::text as t, cl.relkind::text as k
          from pg_class cl join pg_namespace ns on ns.oid = cl.relnamespace
         where ns.nspname = 'public' and cl.relkind in ('r', 'p', 'v', 'm')
           and not exists (select 1 from pg_depend dp where dp.objid = cl.oid and dp.deptype = 'e')
         order by 1
      loop
        if s not like 'ins_%' then
          begin
            execute format('select count(*) from (select 1 from public.%I limit 1000) x', r.t) into n;
            res := res || r.t || '|read_' || s || '|' || n || '|' || E'\n';
          exception when others then
            res := res || r.t || '|read_' || s || '|x|' || sqlstate || E'\n';
          end;
        elsif ins ? r.t then
          begin
            execute format('insert into public.%I %s', r.t, ins ->> r.t);
            res := res || r.t || '|insert_' || v || '|1|' || E'\n';
          exception when others then
            res := res || r.t || '|insert_' || v || '|x|' || sqlstate || E'\n';
          end;
        end if;
      end loop;
      reset role;
    end loop;
    set local session_replication_role = origin;
    select string_agg(schemaname || '.' || sequencename || '=' || coalesce(last_value, 0), ',' order by 1)
      into seq_after from pg_sequences where schemaname = 'public';
    raise exception 'VK_PROBE_ROLLBACK' using detail = res || E'\n#seeded|' || seeded || E'\n#seq|'
      || coalesce(seq_before, '') || '|' || coalesce(seq_after, '');
  exception when others then
    get stacked diagnostics st = message_text, d = pg_exception_detail;
    if st <> 'VK_PROBE_ROLLBACK' then raise; end if;
    perform set_config('vk.probe_auth', d, false);
  end;
end
$probe$;
select current_setting('vk.probe_auth', true) as res,
       (select string_agg(p.tablename || ':' || p.policyname, ',') from pg_policies p where p.schemaname = 'public'
         and (coalesce(p.qual, '') || coalesce(p.with_check, '')) ~* '(user_metadata|raw_user_meta_data)') as meta_policies,
       (select string_agg(x, ',') from (
          select distinct cp.table_name || '.' || cp.column_name as x
            from information_schema.column_privileges cp
           where cp.table_schema = 'public' and cp.grantee = 'authenticated' and cp.privilege_type = 'UPDATE'
             and cp.column_name ~* '^(.*role.*|.*admin.*|is_.*|.*_?(org|club|tenant|organization|team|company)_id|plan|tier|status|verified.*|verification.*|.*_level|credit.*|balance|paid.*|amount|price.*|approved.*|expires_at|valid_until|score|keys)$'
             and exists (select 1 from pg_policies pp where pp.schemaname = 'public' and pp.tablename = cp.table_name
                          and pp.cmd in ('UPDATE', 'ALL') and (pp.roles::text ~ '(authenticated|public)')
                          and coalesce(pp.qual, '') ~* '(\m\w+\s*=\s*auth\.uid\(\)|auth\.uid\(\)\s*=\s*\w+)'
                          and coalesce(pp.qual, '') !~* '\mexists\M')   -- „vlastní řádek“, ne kontrola role přes EXISTS
          ) z) as self_update,
       (select string_agg(distinct pr.proname::text, ',') from pg_proc pr join pg_namespace n on n.oid = pr.pronamespace
         where n.nspname = 'public' and pr.prosrc ~* '(user_metadata|raw_user_meta_data)'
           and exists (select 1 from pg_policies p where p.schemaname = 'public'
                        and (coalesce(p.qual, '') || coalesce(p.with_check, '')) ilike '%' || pr.proname || '(%')) as meta_funcs;
""".replace('__SUB__', STRANGER)

READABLE_COLS_SQL = """
select c.relname::text as obj,
       string_agg(a.attname::text, ',') filter (where has_column_privilege('authenticated', c.oid, a.attnum, 'SELECT')) as cols
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
 where n.nspname = 'public' and c.relkind in ('r','v','m','p')
 group by 1 order by 1;"""

def run_sql(ref, sql):
    """Management API (cloud), nebo lokální QA stack: ref 'local:<kontejner>' → docker exec psql.
    Vrací (chyba | None, řádky posledního SELECT jako list dictů)."""
    if ref.startswith('local:'):
        wrapped = sql.rstrip().rstrip(';')
        head, _, last = wrapped.rpartition('\nselect ')
        q = f"{head}\nselect row_to_json(z)::text from (select {last}) z;"
        p = subprocess.run(['docker', 'exec', '-i', ref[6:], 'psql', '-U', 'postgres', '-d', 'postgres',
                            '-At', '-q', '-v', 'ON_ERROR_STOP=1'], input=q, capture_output=True, text=True)
        if p.returncode != 0: return f'psql: {p.stderr.strip()[:200]}', []
        lines = [l for l in p.stdout.strip().splitlines() if l.startswith('{')]
        return None, [json.loads(l) for l in lines]
    code, out = mgmt(ref, '/database/query', 'POST', {'query': sql})
    if code not in (200, 201) or not isinstance(out, list) or not out:
        return f'SQL {code}: {str(out)[:200]}', []
    return None, out

def probe_auth(ref):
    err, out = run_sql(ref, AUTH_SQL)
    if err: return {'error': err}, {}
    row = out[-1]
    raw = row.get('res') or ''
    res, seeded, seq = {}, [], ('', '')
    for line in raw.splitlines():
        if line.startswith('#seeded|'): seeded = [x for x in line[8:].split(',') if x]; continue
        if line.startswith('#seq|'): seq = tuple((line[5:].split('|') + ['', ''])[:2]); continue
        t, op, n, err2 = (line.split('|') + ['', '', '', ''])[:4]
        if not t: continue
        res.setdefault(t, {})[op] = int(n) if n.isdigit() else ('denied' if err2 == '42501' else f'err {err2}')
    meta = {'seeded': seeded, 'seq_moved': seq[0] != seq[1], 'seq': seq,
            'meta_policies': [x for x in (row.get('meta_policies') or '').split(',') if x],
            'meta_funcs': [x for x in (row.get('meta_funcs') or '').split(',') if x],
            'self_update': [x for x in (row.get('self_update') or '').split(',') if x]}
    return meta, res


# ---------------------------------------------------------------- 3 API
GUARD = re.compile(r'(getUser|getSession|getServerSession|auth\(\)|currentUser|require\w*(Auth|Admin|User|Role|Session)|'
                   r'assert\w*(Admin|Auth)|isAdmin|checkAuth|verify\w*(Token|Session|Auth|Admin|Signature)|'
                   r'withAuth|withAdmin|guard\w*\(|CRON_SECRET|authorization|x-api-key|constructEvent|'
                   r'unauthori[sz]ed|status:\s*40[13]|require[A-Z]\w*\(|guard\.ok|\bauthori[sz]e\w*\(|\bget\w*(Admin|Context|Caller|Auth|Profile)\w*\(|unauthenticated|\w+ByToken\(|signature|verif\w*\(|(is|check|assert|ensure|verify|has|validate)\w*(Cron|Auth|Admin|Secret|Staff|Access|Key|Token)\w*\(|current\w*User\()', re.I)
# Routy veřejné z podstaty (přihlášení samo, odhlášení, reporty prohlížeče) — nehlásit
DEFAULT_PUBLIC = re.compile(r'/(login|logout|signup|register|reset-password|forgot-password|magic-link|csp-report|health|vapid[\w-]*)$', re.I)

# Routy, které něco SPOUŠTĚJÍ — živě se nevolají nikdy, ani GETem (nechráněný cron by se rozjel).
DANGEROUS = re.compile(r'(cron|send|prune|resume|retry|finali[sz]e|promote|merge|rollup|webhook|import|sync|'
                       r'delete|reset|seed|notify|push|mail|work|run|trigger|process|ai)(/|$|-)', re.I)
METHOD_RE = re.compile(r'export\s+(?:async\s+)?(?:function\s+|const\s+)(GET|POST|PUT|PATCH|DELETE)\b')

def middleware_info(folder):
    """Kryje middleware /api? Které /api cesty v něm stojí jako veřejné výjimky?"""
    for p in ('middleware.ts', 'src/middleware.ts', 'middleware.js', 'src/middleware.js'):
        f = os.path.join(folder, p)
        if not os.path.exists(f): continue
        src = open(f, errors='ignore').read()
        for imp in re.findall(r'from\s+["\'](@/[^"\']+|\.{1,2}/[^"\']+)["\']', src):
            base = os.path.join(folder, 'src', imp[2:]) if imp.startswith('@/') else os.path.join(os.path.dirname(f), imp)
            for ext in ('.ts', '.js', '/index.ts'):
                if os.path.exists(base + ext):
                    src += '\n' + open(base + ext, errors='ignore').read(); break
        # middleware se počítá jako ochrana /api, jen když s /api výslovně pracuje A vrací 401/403
        has401 = bool(re.search(r'40[13]|unauthori[sz]ed', src, re.I))
        skip_all_api = bool(re.search(r'startsWith\(\s*["\'`]/api["\'`]\s*\)\s*\|\|', src))   # „/api přeskoč" není ochrana
        specific = [p for p in re.findall(r'startsWith\(\s*["\'`](/api/[^"\'`]+)["\'`]', src)]
        covers = has401 and bool(re.search(r'["\'`]/api', src)) and (not skip_all_api or bool(specific))
        # chráněné prefixy: startsWith("/api…") a matcher "/api/…/:path*"
        prefixes = set(re.findall(r'startsWith\(\s*["\'`](/api[^"\'`]*)["\'`]', src))
        prefixes |= {re.sub(r'/?:path\*$', '', m) for m in re.findall(r'["\'`](/api/[^"\'`]*:path\*)["\'`]', src)}
        # veřejné výjimky: jen přesné porovnání (pathname === "/api/x") nebo pole PUBLIC/ALLOW/OPEN
        public = set(re.findall(r'===\s*["\'`](/api/[^"\'`]+)["\'`]', src))
        for arr in re.findall(r'(?:PUBLIC|ALLOW|OPEN)\w*\s*=\s*(?:new Set\()?\[([^\]]*)\]', src, re.I):
            public |= set(re.findall(r'["\'`](/api/[^"\'`]+)["\'`]', arr))
        if skip_all_api: prefixes = {p for p in prefixes if p.rstrip('/') != '/api'}   # „/api" je tu výjimka, ne ochrana
        return covers, (prefixes or ({'/api'} if not skip_all_api else set()), public)
    return False, (set(), set())

def allowed(path, method, allow):
    return path in allow or f'{method} {path}' in allow

def imported_guards(folder, src):
    """Importované funkce z projektu (@/… nebo ./…), jejichž tělo obsahuje kontrolu přihlášení.
    uvasprovas: route volá spustKroky() z @/lib/cron, ta jako první volá assertCron (16. 10. 2026)."""
    out = set()
    for names, mod in re.findall(r'import\s*\{([^}]*)\}\s*from\s*["\'](@/[^"\']+)["\']', src):
        base = os.path.join(folder, 'src', mod[2:])
        if not any(os.path.exists(base + e) for e in ('.ts', '.js', '.tsx')):
            base = os.path.join(folder, mod[2:])
        f = next((base + e for e in ('.ts', '.js', '.tsx', '/index.ts') if os.path.exists(base + e)), None)
        if not f: continue
        lib = open(f, errors='ignore').read()
        for n in [x.strip().split(' as ')[-1].strip() for x in names.split(',') if x.strip()]:
            orig = n
            m = re.search(r'(?:export\s+)?(?:async\s+)?function\s+%s\s*\(' % re.escape(orig), lib)
            if m and GUARD.search(lib[m.end(): m.end() + 1200]): out.add(n)
    return out

def probe_api(folder, url, allow):
    routes = []
    if not folder: return routes
    mw_covers, (mw_prefixes, mw_public) = middleware_info(folder)
    for f in (glob.glob(os.path.join(folder, '**', 'app', '**', 'route.ts*'), recursive=True)
                  + glob.glob(os.path.join(folder, '**', 'app', '**', 'route.js*'), recursive=True)):
        if 'node_modules' in f or '/.next/' in f: continue
        rel = f.split('/app/', 1)[1]
        path = '/' + re.sub(r'/route\.[jt]sx?$', '', rel)
        path = re.sub(r'/\([^)]*\)', '', path)            # route groups (x)
        if not path.startswith('/api/'): continue
        src = open(f, errors='ignore').read()
        # každou exportovanou metodu posoudit zvlášť: GET může mít kontrolu a POST ne
        marks = [(m.start(), m.group(1)) for m in METHOD_RE.finditer(src)]
        head = src[:marks[0][0]] if marks else src
        by_mw = (mw_covers and any(path == p or path.startswith(p.rstrip('/') + '/') for p in mw_prefixes)
                 and path not in mw_public)
        done = {}
        for i, (pos, meth) in enumerate(marks):
            body = src[pos: marks[i + 1][0] if i + 1 < len(marks) else len(src)]
            # guard v těle metody, nebo helper z hlavičky souboru, který tělo volá
            helpers = [h for h in re.findall(r'(?:function|const)\s+(\w+)', head) if GUARD.search(
                head[head.find(h):head.find(h) + 1500])] + list(imported_guards(folder, head))
            # helper volaný v těle (`handler(req)`), nebo předaný wrapperu jako argument:
            # `export const POST = withCronRun("emails", handler)` — vzor SHIP-04, kontrola CRON_SECRET
            # zůstává v handleru (pikhartapartments 17. 11. 2026: 4 cron POST routy hlásily FAIL)
            guard = by_mw or bool(GUARD.search(body)) or any(
                re.search(r'\b%s\s*\(' % h, body) or re.search(r'\w+\([^)]*\b%s\b' % h, body) for h in helpers)
            guarded_methods = {m for m, g in done.items() if g}
            # POST = GET / return GET(req): zdědí ochranu metody, kterou volá
            if not guard and any(re.search(r'\b%s\b' % m, body[4:]) for m in guarded_methods): guard = True
            done[meth] = guard
            r = {'path': path, 'method': meth, 'guard': guard, 'by_middleware': by_mw, 'live': None}
            if (url and meth == 'GET' and guard and '[' not in path
                    and not DANGEROUS.search(path) and not allowed(path, meth, allow)):
                c, _, _ = http('GET', url.rstrip('/') + path, timeout=20)
                r['live'] = c
            routes.append(r)
    return sorted(routes, key=lambda x: (x['path'], x['method']))


def probe_headers(url):
    """Bezpečnostní hlavičky úvodní stránky. Vrací (přehled, seznam chybějících)."""
    code, hdr, _ = http('GET', url, timeout=20)
    h = {k.lower(): v for k, v in hdr.items()}
    csp = h.get('content-security-policy', '')
    got = {
        'csp': 'ano' if csp else ('jen report-only' if h.get('content-security-policy-report-only') else 'ne'),
        'frame': bool(h.get('x-frame-options')) or 'frame-ancestors' in csp,
        'nosniff': h.get('x-content-type-options', '').lower() == 'nosniff',
        'referrer': bool(h.get('referrer-policy')),
        'hsts': bool(h.get('strict-transport-security')),
        'code': code,
    }
    missing = []
    if got['csp'] != 'ano': missing.append('Content-Security-Policy' + (' (je jen report-only)' if got['csp'] == 'jen report-only' else ''))
    if not got['frame']: missing.append('ochrana proti vložení do cizí stránky (X-Frame-Options / frame-ancestors)')
    if not got['nosniff']: missing.append('X-Content-Type-Options: nosniff')
    if not got['referrer']: missing.append('Referrer-Policy')
    if not got['hsts']: missing.append('Strict-Transport-Security')
    return got, missing


ACTION_RE = re.compile(r'export\s+async\s+function\s+(\w+)|export\s+const\s+(\w+)\s*=\s*async')

SERVICE_USE = re.compile(r'createAdminClient|createServiceClient|serviceClient|supabaseAdmin|adminClient|'
                         r'SERVICE_ROLE|service_role|getAdmin\w*\(|\badmin\(\)|\badmin\.from\(')

def mw_page_prefixes(folder):
    """Stránkové prefixy, které middleware chrání (matcher „/admin/:path*“, startsWith('/salon')) —
    jen když middleware odmítá (401/403) nebo přesměrovává na přihlášení."""
    for p in ('middleware.ts', 'src/middleware.ts', 'middleware.js', 'src/middleware.js', 'proxy.ts', 'src/proxy.ts'):
        f = os.path.join(folder, p)
        if not os.path.exists(f): continue
        src = open(f, errors='ignore').read()
        if not re.search(r'40[13]|unauthori[sz]ed|redirect\([^)]*(login|signin|prihlas)', src, re.I): return set()
        pre = {re.sub(r'/?:path\*$', '', m) for m in re.findall(r'["\'`](/[a-z][^"\'`]*:path\*)["\'`]', src)}
        pre |= set(re.findall(r'startsWith\(\s*["\'`](/[a-z][^"\'`]*)["\'`]', src))
        return {x for x in pre if x and not x.startswith('/api') and not x.startswith('/_next')}
    return set()

def probe_actions(folder):
    """Server actions ('use server' soubory): exportovaná akce bez rozpoznané kontroly přihlášení.
    Akce je veřejný POST endpoint. Next 14.2–16 ji volanou přes cizí stránku přepošle skutečným
    HTTP požadavkem na stránku, kde je definovaná (ověřeno v kódu Next 16. 10. 2026) — middleware
    tedy chrání akce stránek pod chráněnou cestou. Jinak musí kontrolu udělat akce sama (AUTH-06)."""
    out = []
    if not folder: return out
    mw_prefixes = mw_page_prefixes(folder)
    files = [f for ext in ('ts', 'tsx', 'js', 'jsx') for f in glob.glob(os.path.join(folder, '**', f'*.{ext}'), recursive=True)
             if 'node_modules' not in f and '/.next/' not in f and '/dist/' not in f]
    for f in files:
        src = open(f, errors='ignore').read()
        if not re.match(r'\s*(//[^\n]*\n\s*)*[\'"]use server[\'"]', src): continue
        rel = os.path.relpath(f, folder)
        route = '/' + re.sub(r'/\([^)]*\)', '', ('/' + rel).split('/app/', 1)[1]).rsplit('/', 1)[0] if '/app/' in '/' + rel else None   # i app/ bez src/
        by_mw = bool(route and any(route == p or route.startswith(p.rstrip('/') + '/') for p in mw_prefixes))
        marks = [(m.start(), m.group(1) or m.group(2)) for m in ACTION_RE.finditer(src)]
        head = src[:marks[0][0]] if marks else src
        helpers = [h for h in re.findall(r'(?:function|const)\s+(\w+)', head) if GUARD.search(head[head.find(h):head.find(h) + 1500])]
        for i, (pos, name) in enumerate(marks):
            body = src[pos: marks[i + 1][0] if i + 1 < len(marks) else len(src)]
            guard = bool(GUARD.search(body)) or any(re.search(r'\b%s\s*\(' % h, body) for h in helpers)
            # bez servisního klienta pracuje akce jako přihlášený → rozsah hlídá RLS (část 4)
            svc = bool(SERVICE_USE.search(body)) or (bool(SERVICE_USE.search(head)) and not re.search(r'createClient|createServerSupabase|createServerClient', body))
            out.append({'file': rel, 'action': name, 'guard': guard, 'by_middleware': by_mw, 'service': svc})
    return out


# ---------------------------------------------------------------- vyhodnocení
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('folder', nargs='?')
    ap.add_argument('--ref'); ap.add_argument('--url')
    ap.add_argument('--no-write', action='store_true'); ap.add_argument('--json', action='store_true')
    ap.add_argument('--api-only', action='store_true',
                    help='jen statická kontrola API rout — bez databáze a bez tokenu (pro CI)')
    ap.add_argument('--local', metavar='KONTEJNER',
                    help='jen část 4 proti lokálnímu QA stacku (docker kontejner DB, např. supabase_db_lunchos)')
    ap.add_argument('--auth-only', action='store_true', help='jen část 4 (cizí přihlášený, INSERT, prázdné tabulky)')
    ap.add_argument('--baseline', action='store_true',
                    help='zapíše současné nálezy do <projekt>/.vibekodex/security-baseline.json jako známé')
    a = ap.parse_args()

    folder = os.path.abspath(a.folder) if a.folder else None
    cfg = load_cfg(folder)
    ref = ('local:' + a.local) if a.local else (a.ref or cfg.get('ref'))
    if a.local: a.auth_only = True
    url = a.url or cfg.get('url')
    # allow_api: řetězce "/api/x" nebo "POST /api/x", případně {"route": "POST /api/x", "why": "…"}
    allow_api = {x['route'] if isinstance(x, dict) else x for x in cfg.get('allow_api', [])}
    allow_read = {x['table'] if isinstance(x, dict) else x for x in cfg.get('allow_read', [])}
    if not ref and not a.api_only:
        print('Chybí ref: zadej --ref, nebo složku s .env* / .vibekodex/security.json', file=sys.stderr); sys.exit(2)

    fails, warns = [], []
    report = {'ref': ref, 'folder': folder, 'url': url}

    key = None if (a.api_only or a.auth_only) else anon_key(ref)
    if not key and not (a.api_only or a.auth_only):
        print(f'{ref}: anon klíč nejde získat (žádný token k projektu, nebo projekt pozastavený).', file=sys.stderr)
        sys.exit(2)

    meta, reads = ({}, []) if (a.api_only or a.auth_only) else probe_read(ref, key)
    report['read'] = reads
    # chyba testu = NÁLEZ, ne varování: neproběhlý test nesmí vypadat jako PROŠLO
    if meta.get('error'): fails.append('TEST ČTENÍ NEPROBĚHL: ' + meta['error'])
    bad = [r['obj'] for r in reads if r.get('error')]
    if bad: fails.append(f"čtení nejde ověřit (chyba/timeout/429) u {len(bad)} objektů: " + ', '.join(bad[:6]))

    allow_rpc = {x['name'] if isinstance(x, dict) else x for x in cfg.get('allow_rpc', [])}
    rmeta, rpcs = ({}, []) if (a.api_only or a.auth_only) else probe_rpc(ref)
    report['rpc'] = rpcs
    if rmeta.get('error'): fails.append('TEST RPC NEPROBĚHL: ' + rmeta['error'])
    for f in rpcs:
        if f['name'] in allow_rpc: continue
        if f['definer']:
            fails.append(f"anon smí volat SECURITY DEFINER funkci {f['name']}({f['args']}) přes /rest/v1/rpc — běží s právy vlastníka")
        else:
            warns.append(f"anon smí volat funkci {f['name']}() (invoker — RLS platí; záměr? → allow_rpc)")
    for r in reads:
        if r['rows'] and r['obj'] not in allow_read:
            (fails if r['sensitive'] else warns).append(
                f"anon čte {r['obj']}: {r['rows']} řádků" + (f" · citlivé sloupce: {', '.join(r['sensitive'])}" if r['sensitive'] else ' (bez citlivých sloupců — veřejný obsah? → allow_read)'))

    if not a.no_write and not a.api_only and not a.auth_only:
        wmeta, writes = probe_write(ref)
        report['write'] = writes; report['write_skipped'] = wmeta.get('skipped', [])
        report['write_canary'] = wmeta.get('canary_ok'); report['write_rollback'] = wmeta.get('rollback_ok')
        if wmeta.get('error'): fails.append('TEST ZÁPISU NEPROBĚHL: ' + wmeta['error'])
        elif not wmeta.get('canary_ok'):
            fails.append('TEST NEFUNGUJE: kontrolní tabulka nebyla rozpoznána jako zapisovatelná — výsledek zápisu neplatí')
        if not wmeta.get('error') and not wmeta.get('rollback_ok'):
            fails.append('ROLLBACK NEOVĚŘEN: kontrolní tabulka _vk_probe_canary v databázi zůstala — zkontrolovat ručně')
        for w in writes:
            for op in ('update', 'delete'):
                if isinstance(w.get(op), int) and w[op] > 0:
                    fails.append(f"anon smí {op.upper()} v {w['table']} (zkoušeno 1 řádek, vráceno rollbackem)")
        if wmeta.get('skipped'):
            warns.append('zápis nezkoušen (trigger volá HTTP): ' + ', '.join(wmeta['skipped']))

    # 4 — cizí přihlášený, podvržená metadata, INSERT, prázdné tabulky
    allow_read_auth = allow_read | {x['table'] if isinstance(x, dict) else x for x in cfg.get('allow_read_auth', [])}
    allow_ins = {x['table'] if isinstance(x, dict) else x for x in cfg.get('allow_insert', [])}
    allow_ins_auth = allow_ins | {x['table'] if isinstance(x, dict) else x for x in cfg.get('allow_insert_auth', [])}
    auth = {}
    if not a.no_write and not a.api_only:
        ameta, auth = probe_auth(ref)
        if not ref.startswith('local:'):
            _, acfg = mgmt(ref, '/config/auth')
            if isinstance(acfg, dict):
                ameta['signup_open'] = not acfg.get('disable_signup')
                ameta['anon_signin'] = bool(acfg.get('external_anonymous_users_enabled'))
        report['auth'] = auth; report['auth_meta'] = ameta
        if ameta.get('error'):
            fails.append('TEST PŘIHLÁŠENÉHO NEPROBĚHL: ' + ameta['error'])
        else:
            # citlivé jen sloupce, které role opravdu přečte (sloupcové granty — Břeclav advisors)
            _, cat = run_sql(ref, READABLE_COLS_SQL)
            sens = {o['obj']: [x for x in (o['cols'] or '').split(',') if x and SENS.search(x) and 'link' not in x] for o in cat}
            seeded = set(ameta['seeded'])
            note = lambda t: ' (tabulka je prázdná — zkoušeno syntetickým řádkem)' if t in seeded else ''
            for t, v in sorted(auth.items()):
                ra, rf, rn = v.get('read_auth'), v.get('read_forged'), v.get('read_anon')
                # anon: neprázdné tabulky pokrývá část 1 (REST); tady jen ty prázdné
                if t in seeded and isinstance(rn, int) and rn > 0 and t not in allow_read:
                    fails.append(f"anon by četl nové řádky v {t}{note(t)} (veřejná záměrně? → allow_read)")
                if isinstance(ra, int) and ra > 0 and t not in allow_read_auth:
                    msg = (f"cizí přihlášený (bez vazby na data) čte {t}: {ra}{'+' if ra >= 1000 else ''} řádků{note(t)}"
                           + (f" · citlivé sloupce: {', '.join(sens.get(t, []))}" if sens.get(t) else ''))
                    (fails if sens.get(t) or t in seeded else warns).append(
                        msg + ('' if sens.get(t) else ' (pro každého přihlášeného záměrně? → allow_read_auth)'))
                if isinstance(ra, int) and isinstance(rf, int) and rf > ra:
                    fails.append(f"podvržená user_metadata (role=admin…) odemknou {t}: {ra} → {rf} řádků — "
                                 "uživatel si metadata nastaví sám, oprávnění patří do app_metadata / tabulky rolí")
                for who, key_, allow in (('anon', 'insert_anon', allow_ins), ('cizí přihlášený', 'insert_auth', allow_ins_auth)):
                    r_ = v.get(key_)
                    if r_ is None or r_ == 'denied' or t in allow: continue
                    how = 'vložil řádek' if r_ == 1 else f'prošel přes RLS (zastavilo ho až omezení {r_[4:]})'
                    fails.append(f"{who} smí INSERT do {t}: {how}, vráceno rollbackem"
                                 + (' (formulář záměrně? → allow_insert)' if who == 'anon' else
                                    ' (řádek bez vazby na uživatele — policy WITH CHECK nic nehlídá)'))
            if ameta.get('anon_signin'):
                fails.append('anonymní přihlášení je zapnuté — anonym dostane roli authenticated a všechno, co smí přihlášený')
            # UPDATE vlastního řádku s citlivým sloupcem (uvasprovas 25. 10.: profiles.role → admin)
            allow_upd = {x['column'] if isinstance(x, dict) else x for x in cfg.get('allow_self_update', [])}
            for x in ameta.get('self_update', []):
                if x in allow_upd: continue
                col = x.split('.', 1)[1]
                if re.match(r'^(.*role.*|.*admin.*|is_.*|.*_?(org|club|tenant|organization|team|company)_id)$', col, re.I):   # platform_role (czechaiacademy)
                    fails.append(f"přihlášený si smí přepsat {x} ve vlastním řádku — eskalace (role/tenant); "
                                 "zápis přes server, nebo sloupcový grant bez tohoto sloupce")
                else:
                    warns.append(f"přihlášený si smí přepsat {x} ve vlastním řádku (záměr? → allow_self_update)")
            for x in ameta['meta_policies']:
                fails.append(f"policy {x} čte user_metadata — ty si uživatel mění sám")
            for x in ameta['meta_funcs']:
                fails.append(f"funkce {x}() použitá v policy čte user_metadata — ty si uživatel mění sám")
            bad_seed = [t for t, v in auth.items() if str(v.get('seed', '')).startswith(('err', 'denied'))]
            if bad_seed:
                warns.append(f"{len(bad_seed)} prázdných tabulek nejde naplnit syntetickým řádkem (čtení nových řádků neověřeno): "
                             + ', '.join(sorted(bad_seed)[:8]))
            if ameta['seq_moved']:
                warns.append('SEKVENCE SE POSUNULY během testu (trigger s nextval?) — zkontrolovat číselné řady: '
                             + ameta['seq'][1][:200])

    routes = [] if (a.local or a.auth_only) else probe_api(folder, url, allow_api)
    report['api'] = routes
    for r in routes:
        if allowed(r['path'], r['method'], allow_api) or DEFAULT_PUBLIC.search(r['path']): continue
        if r['method'] == 'DELETE' and re.search(r'[/-](auth|session)$', r['path']): continue   # odhlášení
        if not r['guard'] and r['method'] != 'GET':
            fails.append(f"{r['method']} {r['path']} bez rozpoznané kontroly přihlášení"
                         " (veřejná záměrně, např. formulář? → allow_api)")
        # Vercel Cron volá GET — cron GET bez CRON_SECRET spustí kdokoli. Do 19. 11. 2026 jen „pozor";
        # odhalil to kanárek v security_all.sh hned při prvním běhu.
        if not r['guard'] and r['method'] == 'GET' and re.search(r'/cron(/|$)', r['path']):
            fails.append(f"GET {r['path']} je cron bez kontroly CRON_SECRET — spustí ho kdokoli (Vercel Cron volá GET)")
        if r['live'] == 200:
            fails.append(f"GET {r['path']} vrací 200 bez přihlášení, přestože kód vypadá chráněně")
    allow_action = {x['action'] if isinstance(x, dict) else x for x in cfg.get('allow_action', [])}
    actions = [] if (a.local or a.auth_only) else probe_actions(folder)
    report['actions'] = actions
    open_act = [x for x in actions if not x['guard'] and not x['by_middleware'] and x['service'] and x['action'] not in allow_action]
    if open_act:
        warns.append(f"{len(open_act)} server actions se servisním klientem bez rozpoznané kontroly přihlášení (veřejná záměrně? → allow_action): "
                     + ', '.join(f"{x['action']} ({x['file'].split('/')[-2] if '/' in x['file'] else x['file']})" for x in open_act[:8])
                     + (' …' if len(open_act) > 8 else ''))
    open_get = [r['path'] for r in routes if not r['guard'] and r['method'] == 'GET'
                and not allowed(r['path'], 'GET', allow_api) and not DEFAULT_PUBLIC.search(r['path'])
                and not re.search(r'/cron(/|$)', r['path'])]
    if open_get:
        warns.append(f"{len(open_get)} GET rout bez rozpoznané kontroly (veřejná data? ověřit → allow_api): "
                     + ', '.join(open_get[:8]) + (' …' if len(open_get) > 8 else ''))

    # 5 — bezpečnostní hlavičky (jen s url; zatím varování, viz hlavička souboru)
    if url and not (a.local or a.auth_only or a.api_only):
        hdrs, missing = probe_headers(url)
        report['headers'] = hdrs; report['headers_missing'] = missing
        if not hdrs['code']:
            warns.append(f'hlavičky neověřeny: {url} neodpovídá')
        elif missing:
            warns.append(f'chybí bezpečnostní hlavičky ({len(missing)}): ' + '; '.join(missing))

    # Baseline: známé nálezy (zapsané vědomě přes --baseline) nezastaví /ship, jen nové ano.
    # Stejný princip jako typecheck proti baseline — brána, která padá na starém dluhu, se naučí ignorovat.
    known = []
    bpath = os.path.join(folder, '.vibekodex', 'security-baseline.json') if folder else None
    if a.baseline and bpath:
        os.makedirs(os.path.dirname(bpath), exist_ok=True)
        json.dump({'note': 'Známé nálezy security_probe.py. Každý má mít v projektu úkol s termínem; '
                           'po opravě ho odsud smaž.', 'fails': sorted(fails)}, open(bpath, 'w'), ensure_ascii=False, indent=2)
        print(f'Baseline zapsána: {len(fails)} známých nálezů → {bpath}', file=sys.stderr)
    if bpath and os.path.exists(bpath):
        base = set(json.load(open(bpath)).get('fails', []))
        known = [f for f in fails if f in base]
        fails = [f for f in fails if f not in base]
        gone = sorted(base - set(known))
        if gone: warns.append(f'{len(gone)} nálezů z baseline už neplatí — smaž je z security-baseline.json: ' + '; '.join(gone[:3]))
    report['fails'] = fails; report['warns'] = warns; report['known'] = known
    if a.json:
        print(json.dumps(report, ensure_ascii=False))
    else:
        name = os.path.basename(folder) if folder else ref
        print(f'Bezpečnostní test: {name} ({ref})' + (f' · {url}' if url else ''))
        n_read = sum(1 for r in reads if r['rows']); n_tab = len(reads)
        n_open = sum(1 for r in reads if r['status'] in (200, 206))
        if a.api_only:
            print('  databáze: přeskočena (--api-only) — čtení, zápis a RPC ověřuje /ship a týdenní běh')
        elif a.auth_only:
            print('  části 1–3 přeskočeny (--auth-only / --local)')
        else:
            print(f'  čtení: {n_tab} objektů v public, anon klíč projde u {n_open}, data vidí v {n_read}')
        if not a.no_write and not a.api_only and not a.auth_only:
            ws = report.get('write', [])
            den = sum(1 for w in ws if w.get('update') == 'denied' and w.get('delete') == 'denied')
            print(f"  zápis: vyzkoušeno {len(ws)} tabulek, {den} odmítnuto oprávněním, zbytek 0 řádků"
                  f" · kontrola testu {'OK' if report.get('write_canary') else 'SELHALA'}"
                  f" · rollback {'ověřen' if report.get('write_rollback') else 'NEOVĚŘEN'}")
        if auth:
            n_auth = sum(1 for v in auth.values() if isinstance(v.get('read_auth'), int))
            den = sum(1 for v in auth.values() if v.get('insert_auth') == 'denied')
            print(f"  přihlášený cizinec: čtení {n_auth} objektů, INSERT zkoušen u "
                  f"{sum(1 for v in auth.values() if 'insert_auth' in v)} tabulek ({den} odmítnuto),"
                  f" prázdných naplněno {len(report['auth_meta']['seeded'])}, podvržená metadata ano")
            am = report['auth_meta']
            if 'signup_open' in am:
                print('  registrace: ' + ('OTEVŘENÁ — přihlášeným cizincem se stane kdokoli s e-mailem' if am['signup_open']
                      else 'zavřená (cizí přihlášený = pozvaný uživatel jiného klienta/týmu)')
                      + (' · ANONYMNÍ PŘIHLÁŠENÍ ZAPNUTÉ (anonym = authenticated)' if am.get('anon_signin') else ''))
        live = [r for r in routes if r['live'] is not None]
        if actions:
            print(f"  akce:  {len(actions)} server actions, s kontrolou {sum(x['guard'] for x in actions)},"
                  f" za middlewarem {sum(1 for x in actions if x['by_middleware'] and not x['guard'])},"
                  f" jen přes RLS {sum(1 for x in actions if not x['guard'] and not x['by_middleware'] and not x['service'])}")
        if not a.auth_only: print(f"  API:   {len(routes)} metod v {len({r['path'] for r in routes})} routách, "
              f"s rozpoznanou kontrolou {sum(r['guard'] for r in routes)}"
              + (f", živě ověřeno {len(live)} (401/403/3xx: {sum(1 for r in live if r['live'] != 200)})"
                 if url else ', živý test ne (chybí url)'))
        if report.get('headers'):
            hh = report['headers']
            print(f"  hlavičky: CSP {hh['csp']} · vložení do cizí stránky {'blokováno' if hh['frame'] else 'NECHRÁNĚNO'}"
                  f" · nosniff {'ano' if hh['nosniff'] else 'ne'} · Referrer-Policy {'ano' if hh['referrer'] else 'ne'}"
                  f" · HSTS {'ano' if hh['hsts'] else 'ne'}")
        for f in fails: print('  FAIL  ' + f)
        for k in known: print('  známé ' + k)
        for w in warns: print('  pozor ' + w)
        print('  VÝSLEDEK: ' + ('NÁLEZ' if fails else 'PROŠLO') + (f' (známé z baseline: {len(known)})' if known else ''))
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
