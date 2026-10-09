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

Výsledek je test: 0 = prošlo, 1 = nález, 2 = chyba konfigurace.
Záměrně veřejné věci (články, ceník, formulář poptávky) se povolí v <projekt>/.vibekodex/security.json:
  { "ref": "abc…", "url": "https://web.cz",
    "allow_read":   ["articles", "pricing"],        # anon smí číst tyto tabulky/view
    "allow_insert": ["leads"],                      # (informativní, insert se nezkouší)
    "allow_api":    ["/api/admin/health"] }         # admin routy bez přihlášení záměrně

Použití:
  security_probe.py <složka-projektu>            ref a url z .vibekodex/security.json nebo z .env*
  security_probe.py <složka> --url https://…     přidá živý test API
  security_probe.py --ref <ref>                  jen databáze, bez složky
  security_probe.py … --no-write                 vynechá část 2
  security_probe.py … --json                     strojový výstup (pro security_all.sh / CI)
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


# ---------------------------------------------------------------- 3 API
GUARD = re.compile(r'(getUser|getSession|getServerSession|auth\(\)|currentUser|require\w*(Auth|Admin|User|Role|Session)|'
                   r'assert\w*(Admin|Auth)|isAdmin|checkAuth|verify\w*(Token|Session|Auth|Admin|Signature)|'
                   r'withAuth|withAdmin|guard\w*\(|CRON_SECRET|authorization|x-api-key|constructEvent|'
                   r'unauthori[sz]ed|status:\s*40[13]|require[A-Z]\w*\(|guard\.ok|\w+ByToken\(|signature|verif\w*\(|(is|check|assert|ensure|verify|has|validate)\w*(Cron|Auth|Admin|Secret|Staff|Access|Key|Token)\w*\(|current\w*User\()', re.I)
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
                head[head.find(h):head.find(h) + 1500])]
            guard = by_mw or bool(GUARD.search(body)) or any(re.search(r'\b%s\s*\(' % h, body) for h in helpers)
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


# ---------------------------------------------------------------- vyhodnocení
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('folder', nargs='?')
    ap.add_argument('--ref'); ap.add_argument('--url')
    ap.add_argument('--no-write', action='store_true'); ap.add_argument('--json', action='store_true')
    ap.add_argument('--api-only', action='store_true',
                    help='jen statická kontrola API rout — bez databáze a bez tokenu (pro CI)')
    ap.add_argument('--baseline', action='store_true',
                    help='zapíše současné nálezy do <projekt>/.vibekodex/security-baseline.json jako známé')
    a = ap.parse_args()

    folder = os.path.abspath(a.folder) if a.folder else None
    cfg = load_cfg(folder)
    ref = a.ref or cfg.get('ref')
    url = a.url or cfg.get('url')
    # allow_api: řetězce "/api/x" nebo "POST /api/x", případně {"route": "POST /api/x", "why": "…"}
    allow_api = {x['route'] if isinstance(x, dict) else x for x in cfg.get('allow_api', [])}
    allow_read = {x['table'] if isinstance(x, dict) else x for x in cfg.get('allow_read', [])}
    if not ref and not a.api_only:
        print('Chybí ref: zadej --ref, nebo složku s .env* / .vibekodex/security.json', file=sys.stderr); sys.exit(2)

    fails, warns = [], []
    report = {'ref': ref, 'folder': folder, 'url': url}

    key = None if a.api_only else anon_key(ref)
    if not key and not a.api_only:
        print(f'{ref}: anon klíč nejde získat (žádný token k projektu, nebo projekt pozastavený).', file=sys.stderr)
        sys.exit(2)

    meta, reads = ({}, []) if a.api_only else probe_read(ref, key)
    report['read'] = reads
    # chyba testu = NÁLEZ, ne varování: neproběhlý test nesmí vypadat jako PROŠLO
    if meta.get('error'): fails.append('TEST ČTENÍ NEPROBĚHL: ' + meta['error'])
    bad = [r['obj'] for r in reads if r.get('error')]
    if bad: fails.append(f"čtení nejde ověřit (chyba/timeout/429) u {len(bad)} objektů: " + ', '.join(bad[:6]))

    allow_rpc = {x['name'] if isinstance(x, dict) else x for x in cfg.get('allow_rpc', [])}
    rmeta, rpcs = ({}, []) if a.api_only else probe_rpc(ref)
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

    if not a.no_write and not a.api_only:
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

    routes = probe_api(folder, url, allow_api)
    report['api'] = routes
    for r in routes:
        if allowed(r['path'], r['method'], allow_api) or DEFAULT_PUBLIC.search(r['path']): continue
        if r['method'] == 'DELETE' and re.search(r'[/-](auth|session)$', r['path']): continue   # odhlášení
        if not r['guard'] and r['method'] != 'GET':
            fails.append(f"{r['method']} {r['path']} bez rozpoznané kontroly přihlášení"
                         " (veřejná záměrně, např. formulář? → allow_api)")
        if r['live'] == 200:
            fails.append(f"GET {r['path']} vrací 200 bez přihlášení, přestože kód vypadá chráněně")
    open_get = [r['path'] for r in routes if not r['guard'] and r['method'] == 'GET'
                and not allowed(r['path'], 'GET', allow_api) and not DEFAULT_PUBLIC.search(r['path'])]
    if open_get:
        warns.append(f"{len(open_get)} GET rout bez rozpoznané kontroly (veřejná data? ověřit → allow_api): "
                     + ', '.join(open_get[:8]) + (' …' if len(open_get) > 8 else ''))

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
        else:
            print(f'  čtení: {n_tab} objektů v public, anon klíč projde u {n_open}, data vidí v {n_read}')
        if not a.no_write and not a.api_only:
            ws = report.get('write', [])
            den = sum(1 for w in ws if w.get('update') == 'denied' and w.get('delete') == 'denied')
            print(f"  zápis: vyzkoušeno {len(ws)} tabulek, {den} odmítnuto oprávněním, zbytek 0 řádků"
                  f" · kontrola testu {'OK' if report.get('write_canary') else 'SELHALA'}"
                  f" · rollback {'ověřen' if report.get('write_rollback') else 'NEOVĚŘEN'}")
        live = [r for r in routes if r['live'] is not None]
        print(f"  API:   {len(routes)} metod v {len({r['path'] for r in routes})} routách, "
              f"s rozpoznanou kontrolou {sum(r['guard'] for r in routes)}"
              + (f", živě ověřeno {len(live)} (401/403/3xx: {sum(1 for r in live if r['live'] != 200)})"
                 if url else ', živý test ne (chybí url)'))
        for f in fails: print('  FAIL  ' + f)
        for k in known: print('  známé ' + k)
        for w in warns: print('  pozor ' + w)
        print('  VÝSLEDEK: ' + ('NÁLEZ' if fails else 'PROŠLO') + (f' (známé z baseline: {len(known)})' if known else ''))
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
