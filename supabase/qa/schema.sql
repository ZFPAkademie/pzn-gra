


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."coop_check_capacity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  taken int;
BEGIN
  IF NEW.archived_at IS NULL AND NEW.status IN ('reservation', 'owner') THEN
    PERFORM pg_advisory_xact_lock(hashtext('coop_contacts_capacity'));
    SELECT COALESCE(SUM(share_count), 0) INTO taken
      FROM public.coop_contacts
     WHERE archived_at IS NULL
       AND status IN ('reservation', 'owner')
       AND id <> NEW.id;
    IF taken + COALESCE(NEW.share_count, 0) > 50 THEN
      RAISE EXCEPTION 'COOP_CAPACITY:%', 50 - taken USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."coop_check_capacity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_leads_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_leads_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_aggregate"("p_from" timestamp with time zone, "p_to" timestamp with time zone) RETURNS TABLE("metric" "text", "dim" "text", "dim_value" "text", "n" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with v as (
    select * from vk_visits where started_at >= p_from and started_at < p_to and not is_bot
  ),
  ev as (
    select e.* from vk_events e join v on v.id = e.visit_id
  ),
  conv as (
    select e.visit_id, e.name from ev e join vk_event_defs d on d.name = e.name and d.is_conversion
    group by e.visit_id, e.name
  ),
  vx as (
    select v.*,
           exists (select 1 from conv c where c.visit_id = v.id) as conv_any,
           (v.active_seconds >= 10 or v.pageviews >= 2 or exists (select 1 from conv c where c.visit_id = v.id)) as eng
    from v
  ),
  dims as (
    select id, sid, eng, conv_any, active_seconds, unnest(array['total','channel','source','device','screen_bucket','country','entry_path']) as dim,
           unnest(array['total', coalesce(channel,'?'), coalesce(source,'(none)'), coalesce(device,'?'),
                        coalesce(screen_bucket,'?'), coalesce(country,'?'), coalesce(entry_path,'?')]) as dim_value
    from vx
  )
  select 'visits', dim, dim_value, count(*) from dims group by dim, dim_value
  union all select 'visitors', dim, dim_value, count(distinct sid) from dims group by dim, dim_value
  union all select 'engaged', dim, dim_value, count(*) filter (where eng) from dims group by dim, dim_value
  union all select 'converted', dim, dim_value, count(*) filter (where conv_any) from dims group by dim, dim_value
  union all select 'active_seconds', dim, dim_value, coalesce(sum(active_seconds),0) from dims group by dim, dim_value
  union all select 'conversion:' || c.name, d.dim, d.dim_value, count(*)
            from conv c join dims d on d.id = c.visit_id group by c.name, d.dim, d.dim_value
  union all select 'pageviews', 'total', 'total', count(*) from ev where name = 'page_view'
  union all select 'pageviews', 'path', coalesce(path,'?'), count(*) from ev where name = 'page_view' group by path
  union all select 'pageviews', 'channel', coalesce(v.channel,'?'), count(*) from ev join v on v.id = ev.visit_id where ev.name = 'page_view' group by v.channel
  union all select 'pageviews', 'device', coalesce(v.device,'?'), count(*) from ev join v on v.id = ev.visit_id where ev.name = 'page_view' group by v.device
  union all select 'page_visitors', 'path', coalesce(path,'?'), count(distinct sid) from ev where name = 'page_view' group by path
  union all select 'page_seconds', 'path', coalesce(path,'?'), coalesce(sum((props->>'seconds')::int),0) from ev where name = 'engaged_time' group by path
  union all select 'scroll_bucket', 'path', coalesce(path,'?') || '|' || (props->>'pct'), count(*) from ev where name = 'scroll' group by path, props->>'pct'
  union all select 'article_read', 'path', coalesce(path,'?'), count(*) from ev where name = 'article_read' and (props->>'read')::boolean group by path
  union all select 'article_unread', 'path', coalesce(path,'?'), count(*) from ev where name = 'article_read' and not (props->>'read')::boolean group by path
  union all select 'status_404', 'path', coalesce(path,'?'), count(*) from ev where name = 'page_view' and props->>'status' = '404' group by path
  union all select 'event', 'event', name, count(*) from ev where name not in ('page_view','engaged_time','scroll','click','set_props') group by name
  union all select 'exit', 'path', coalesce(exit_path,'?'), count(*) from vx group by exit_path
  union all select 'bots', 'total', 'total', count(*) from vk_visits where started_at >= p_from and started_at < p_to and is_bot
  union all select 'bot_reason', 'reason', r, count(*) from vk_visits, unnest(bot_reasons) r where started_at >= p_from and started_at < p_to and is_bot group by r
$$;


ALTER FUNCTION "public"."vk_aggregate"("p_from" timestamp with time zone, "p_to" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_aggregate_day"("p_day" "date") RETURNS TABLE("metric" "text", "dim" "text", "dim_value" "text", "n" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select a.metric, a.dim, left(a.dim_value, 300), a.n from vk_day_bounds(p_day) b, lateral vk_aggregate(b.d_from, b.d_to) a where a.n > 0
$$;


ALTER FUNCTION "public"."vk_aggregate_day"("p_day" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_ai_queue"("p_limit" integer DEFAULT 100, "p_min_age_days" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "text" "text", "priority" boolean, "topic" "text", "last_run" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select p.id, p.text, p.priority, p.topic,
         max(r.run_at) filter (where r.error is null) as last_run
  from vk_ai_prompts p
  left join vk_ai_runs r on r.prompt_id = p.id
  where p.active
  group by p.id, p.text, p.priority, p.topic
  having p_min_age_days <= 0
      or max(r.run_at) filter (where r.error is null) is null
      or max(r.run_at) filter (where r.error is null) < now() - (p_min_age_days || ' days')::interval
  order by p.priority desc, max(r.run_at) asc nulls first
  limit p_limit
$$;


ALTER FUNCTION "public"."vk_ai_queue"("p_limit" integer, "p_min_age_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_ai_scores"("p_from" "date", "p_to" "date") RETURNS TABLE("engine" "text", "kind" "text", "topic" "text", "runs" bigint, "mentioned" bigint, "cited" bigint, "pos" bigint, "neg" bigint, "competitor_mentions" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select r.engine, p.kind, coalesce(p.topic,'') as topic,
         count(distinct r.id) as runs,
         count(distinct r.id) filter (where m.is_own and m.mentioned) as mentioned,
         count(distinct r.id) filter (where m.is_own and m.mention_kind = 'cited') as cited,
         count(distinct r.id) filter (where m.is_own and m.sentiment = 'pos') as pos,
         count(distinct r.id) filter (where m.is_own and m.sentiment = 'neg') as neg,
         count(*) filter (where not m.is_own and m.mentioned) as competitor_mentions
  from vk_ai_runs r join vk_ai_prompts p on p.id = r.prompt_id
  left join vk_ai_mentions m on m.run_id = r.id
  where r.run_date >= p_from and r.run_date <= p_to and r.error is null
  group by 1,2,3
$$;


ALTER FUNCTION "public"."vk_ai_scores"("p_from" "date", "p_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_ai_sov"("p_from" "date", "p_to" "date") RETURNS TABLE("brand" "text", "is_own" boolean, "mentions" bigint, "cited" bigint, "pos" bigint, "neg" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select m.brand, bool_or(m.is_own), count(*) filter (where m.mentioned),
         count(*) filter (where m.mention_kind = 'cited'),
         count(*) filter (where m.sentiment = 'pos'), count(*) filter (where m.sentiment = 'neg')
  from vk_ai_mentions m join vk_ai_runs r on r.id = m.run_id
  where r.run_date >= p_from and r.run_date <= p_to and r.error is null
  group by m.brand order by 3 desc
$$;


ALTER FUNCTION "public"."vk_ai_sov"("p_from" "date", "p_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_ai_stability"("p_to" "date") RETURNS TABLE("prompt_id" "uuid", "prompt" "text", "engine" "text", "runs" bigint, "mentioned" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with last5 as (
    select r.id, r.prompt_id, r.engine,
           row_number() over (partition by r.prompt_id, r.engine order by r.run_at desc) rn
    from vk_ai_runs r where r.run_date <= p_to and r.error is null
  )
  select l.prompt_id, p.text, l.engine, count(*), count(*) filter (where m.mentioned)
  from last5 l join vk_ai_prompts p on p.id = l.prompt_id
  left join vk_ai_mentions m on m.run_id = l.id and m.is_own
  where l.rn <= 5 group by 1,2,3
$$;


ALTER FUNCTION "public"."vk_ai_stability"("p_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_ai_status"("p_interval_days" integer DEFAULT 14) RETURNS TABLE("aktivnich" bigint, "ceka" bigint, "nikdy" bigint, "posledni_beh" timestamp with time zone, "naklady_30d" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  with last as (
    select p.id, max(r.run_at) as lr
    from vk_ai_prompts p left join vk_ai_runs r on r.prompt_id = p.id and r.error is null
    where p.active group by p.id
  )
  select count(*),
         count(*) filter (where lr is null or lr < now() - (p_interval_days || ' days')::interval),
         count(*) filter (where lr is null),
         max(lr),
         (select coalesce(sum(cost_usd), 0) from vk_ai_runs where run_at > now() - interval '30 days')
  from last
$$;


ALTER FUNCTION "public"."vk_ai_status"("p_interval_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_bot_histogram"("p_from" timestamp with time zone, "p_to" timestamp with time zone) RETURNS TABLE("score_bucket" integer, "n" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select (bot_score / 10) * 10, count(*) from vk_visits where started_at >= p_from and started_at < p_to group by 1 order by 1
$$;


ALTER FUNCTION "public"."vk_bot_histogram"("p_from" timestamp with time zone, "p_to" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_click_points"("p_path" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_bucket" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 3000) RETURNS TABLE("x_pct" numeric, "y_px" integer, "doc_h" integer, "kind" "text", "screen_bucket" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select c.x_pct, c.y_px, c.doc_h, c.kind, c.screen_bucket from vk_clicks c join vk_visits v on v.id = c.visit_id and not v.is_bot
  where c.path = p_path and c.ts >= p_from and c.ts < p_to and (p_bucket is null or c.screen_bucket = p_bucket)
  order by c.ts desc limit p_limit
$$;


ALTER FUNCTION "public"."vk_click_points"("p_path" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_bucket" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_click_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) RETURNS TABLE("path" "text", "kind" "text", "n" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select c.path, c.kind, count(*) from vk_clicks c join vk_visits v on v.id = c.visit_id and not v.is_bot
  where c.ts >= p_from and c.ts < p_to group by c.path, c.kind order by 3 desc limit 500
$$;


ALTER FUNCTION "public"."vk_click_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_crawler_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) RETURNS TABLE("bot" "text", "path" "text", "n" bigint, "last_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    AS $$
  select bot, path, count(*), max(ts) from vk_crawler_hits where ts >= p_from and ts < p_to
  group by bot, path order by 3 desc limit 500
$$;


ALTER FUNCTION "public"."vk_crawler_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_day_bounds"("p_day" "date", OUT "d_from" timestamp with time zone, OUT "d_to" timestamp with time zone) RETURNS "record"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select (p_day::timestamp at time zone 'Europe/Prague'),
         ((p_day + 1)::timestamp at time zone 'Europe/Prague')
$$;


ALTER FUNCTION "public"."vk_day_bounds"("p_day" "date", OUT "d_from" timestamp with time zone, OUT "d_to" timestamp with time zone) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."vk_visits" (
    "id" "text" NOT NULL,
    "sid" "text" NOT NULL,
    "identity_id" "uuid",
    "started_at" timestamp with time zone NOT NULL,
    "last_seen_at" timestamp with time zone NOT NULL,
    "entry_path" "text",
    "exit_path" "text",
    "pageviews" integer DEFAULT 0 NOT NULL,
    "events_n" integer DEFAULT 0 NOT NULL,
    "active_seconds" integer DEFAULT 0 NOT NULL,
    "max_scroll" integer DEFAULT 0 NOT NULL,
    "conversion_names" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "engaged" boolean DEFAULT false NOT NULL,
    "converted" boolean DEFAULT false NOT NULL,
    "source" "text",
    "medium" "text",
    "campaign" "text",
    "term" "text",
    "content" "text",
    "channel" "text" DEFAULT 'direct'::"text" NOT NULL,
    "referrer_host" "text",
    "click_id_kind" "text",
    "had_query" boolean DEFAULT false NOT NULL,
    "device" "text",
    "os" "text",
    "browser" "text",
    "viewport_w" integer,
    "viewport_h" integer,
    "screen_bucket" "text",
    "dark_mode" boolean,
    "lang" "text",
    "country" "text",
    "region" "text",
    "city" "text",
    "bot_score" integer DEFAULT 0 NOT NULL,
    "bot_reasons" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_bot" boolean DEFAULT false NOT NULL,
    "props" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."vk_visits" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_first_touch"("p_sid" "text") RETURNS SETOF "public"."vk_visits"
    LANGUAGE "sql" STABLE
    AS $$
  with ids as (select identity_id from vk_visits where sid = p_sid and identity_id is not null limit 1)
  select v.* from vk_visits v
   where v.sid = p_sid or v.identity_id = (select identity_id from ids)
   order by v.started_at asc limit 1
$$;


ALTER FUNCTION "public"."vk_first_touch"("p_sid" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_forget"("p_key" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_id uuid; n int;
begin
  select id into v_id from vk_identities where identity_key = p_key;
  if v_id is null then return 0; end if;
  update vk_visits set identity_id = null where identity_id = v_id;
  get diagnostics n = row_count;
  delete from vk_identities where id = v_id;
  return n;
end $$;


ALTER FUNCTION "public"."vk_forget"("p_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_identify"("p_key" "text", "p_sid" "text", "p_ref" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_id uuid;
begin
  insert into vk_identities (identity_key, sids, external_ref)
  values (p_key, array[p_sid], p_ref)
  on conflict (identity_key) do update set
    last_seen_at = now(),
    sids = (select coalesce(array_agg(distinct x), '{}') from unnest(vk_identities.sids || array[p_sid]) x),
    external_ref = coalesce(excluded.external_ref, vk_identities.external_ref)
  returning id into v_id;
  update vk_visits set identity_id = v_id where sid = p_sid and (identity_id is null or identity_id <> v_id);
  return v_id;
end $$;


ALTER FUNCTION "public"."vk_identify"("p_key" "text", "p_sid" "text", "p_ref" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_identity_summary"("p_limit" integer DEFAULT 50) RETURNS TABLE("identity_id" "uuid", "identity_key" "text", "external_ref" "text", "first_seen_at" timestamp with time zone, "last_seen_at" timestamp with time zone, "devices" integer, "visits" bigint, "first_channel" "text", "first_source" "text", "converted" boolean, "seconds_to_conversion" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select i.id, i.identity_key, i.external_ref, i.first_seen_at, i.last_seen_at, cardinality(i.sids),
         count(v.id),
         (array_agg(v.channel order by v.started_at))[1], (array_agg(v.source order by v.started_at))[1],
         bool_or(v.converted),
         extract(epoch from (min(v.started_at) filter (where v.converted) - min(v.started_at)))::bigint
  from vk_identities i left join vk_visits v on v.identity_id = i.id
  group by i.id order by i.last_seen_at desc limit p_limit
$$;


ALTER FUNCTION "public"."vk_identity_summary"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_identity_visits"("p_identity" "uuid") RETURNS SETOF "public"."vk_visits"
    LANGUAGE "sql" STABLE
    AS $$
  select * from vk_visits where identity_id = p_identity order by started_at asc limit 200
$$;


ALTER FUNCTION "public"."vk_identity_visits"("p_identity" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_ingest"("p" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_sid       text := p->>'sid';
  v_vid       text := p->'visit'->>'id';
  v_first     jsonb := p->'visit'->'first';
  v_ev        jsonb := coalesce(p->'events', '[]'::jsonb);
  v_clicks    jsonb := coalesce(p->'clicks', '[]'::jsonb);
  v_score     int := coalesce((p->'visit'->>'bot_score')::int, 0);
  v_reasons   text[] := coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p->'visit'->'bot_reasons','[]'::jsonb)) x), '{}');
  v_props     jsonb := coalesce(p->'visit'->'props', '{}'::jsonb);
  v_min_ts    timestamptz;
  v_max_ts    timestamptz;
  v_pv        int;
  v_secs      int;
  v_scroll    int;
  v_first_path text;
  v_last_path  text;
  v_existing_sid text;
begin
  if v_sid is null then return; end if;

  -- 0.3.0: bez id návštěvy ji dohledá server podle mezery v čase (viz sql/004).
  if v_vid is null then
    select min((e->>'ts')::timestamptz) into v_min_ts from jsonb_array_elements(v_ev) e;
    v_vid := vk_resolve_visit(v_sid, coalesce(v_min_ts, now()));
    v_min_ts := null;
  end if;

  select sid into v_existing_sid from vk_visits where id = v_vid;
  if v_existing_sid is not null and v_existing_sid <> v_sid then
    return; -- cizí visit_id — ignorovat
  end if;

  select min((e->>'ts')::timestamptz), max((e->>'ts')::timestamptz),
         count(*) filter (where e->>'name' = 'page_view'),
         coalesce(sum(case when e->>'name' = 'engaged_time' then (e->'props'->>'seconds')::int else 0 end), 0),
         coalesce(max(case when e->>'name' = 'scroll' then (e->'props'->>'pct')::int else 0 end), 0)
    into v_min_ts, v_max_ts, v_pv, v_secs, v_scroll
    from jsonb_array_elements(v_ev) e;

  select e->>'path' into v_first_path from jsonb_array_elements(v_ev) e
    where e->>'name' = 'page_view' order by (e->>'ts')::timestamptz, (e->>'seq')::int limit 1;
  select e->>'path' into v_last_path from jsonb_array_elements(v_ev) e
    where e->>'name' = 'page_view' order by (e->>'ts')::timestamptz desc, (e->>'seq')::int desc limit 1;

  if v_min_ts is null then v_min_ts := now(); v_max_ts := now(); end if;

  insert into vk_visits (id, sid, started_at, last_seen_at, entry_path, exit_path,
      pageviews, events_n, active_seconds, max_scroll,
      source, medium, campaign, term, content, channel, referrer_host, click_id_kind, had_query,
      device, os, browser, viewport_w, viewport_h, screen_bucket, dark_mode, lang,
      country, region, city, bot_score, bot_reasons, props)
  values (v_vid, v_sid, v_min_ts, v_max_ts, v_first_path, v_last_path,
      coalesce(v_pv,0), jsonb_array_length(v_ev), v_secs, v_scroll,
      v_first->>'source', v_first->>'medium', v_first->>'campaign', v_first->>'term', v_first->>'content',
      coalesce(v_first->>'channel','direct'), v_first->>'referrer_host', v_first->>'click_id_kind',
      coalesce((v_first->>'had_query')::boolean, false),
      v_first->>'device', v_first->>'os', v_first->>'browser',
      (v_first->>'viewport_w')::int, (v_first->>'viewport_h')::int, v_first->>'screen_bucket',
      (v_first->>'dark_mode')::boolean, v_first->>'lang',
      v_first->>'country', v_first->>'region', v_first->>'city',
      v_score, v_reasons, v_props)
  on conflict (id) do update set
      last_seen_at   = greatest(vk_visits.last_seen_at, excluded.last_seen_at),
      exit_path      = coalesce(excluded.exit_path, vk_visits.exit_path),
      entry_path     = coalesce(vk_visits.entry_path, excluded.entry_path),
      pageviews      = vk_visits.pageviews + excluded.pageviews,
      events_n       = vk_visits.events_n + excluded.events_n,
      active_seconds = vk_visits.active_seconds + excluded.active_seconds,
      max_scroll     = greatest(vk_visits.max_scroll, excluded.max_scroll),
      bot_score      = greatest(vk_visits.bot_score, excluded.bot_score),
      bot_reasons    = (select coalesce(array_agg(distinct x), '{}') from unnest(vk_visits.bot_reasons || excluded.bot_reasons) x),
      props          = vk_visits.props || excluded.props,
      -- first-touch a zařízení se nikdy nepřepisují, jen doplní když chyběly
      device         = coalesce(vk_visits.device, excluded.device),
      os             = coalesce(vk_visits.os, excluded.os),
      browser        = coalesce(vk_visits.browser, excluded.browser),
      country        = coalesce(vk_visits.country, excluded.country),
      region         = coalesce(vk_visits.region, excluded.region),
      city           = coalesce(vk_visits.city, excluded.city);

  insert into vk_events (sid, visit_id, ts, name, path, props, seq)
  select v_sid, v_vid, (e->>'ts')::timestamptz, e->>'name', e->>'path',
         nullif(e->'props', 'null'::jsonb), coalesce((e->>'seq')::int, 0)
    from jsonb_array_elements(v_ev) e;

  insert into vk_clicks (ts, visit_id, path, x_pct, y_px, doc_h, viewport_w, screen_bucket, selector, text, href, kind)
  select (c->>'ts')::timestamptz, v_vid, c->>'path', (c->>'x_pct')::numeric, (c->>'y_px')::int,
         (c->>'doc_h')::int, (c->>'viewport_w')::int, c->>'screen_bucket',
         left(c->>'selector', 200), left(c->>'text', 80), left(c->>'href', 300), coalesce(c->>'kind','other')
    from jsonb_array_elements(v_clicks) c;
end $$;


ALTER FUNCTION "public"."vk_ingest"("p" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_link_ctr"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_path" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 200) RETURNS TABLE("path" "text", "href" "text", "text" "text", "kind" "text", "clicks" bigint, "pageviews" bigint, "ctr" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  with pvs as (
    select e.path, count(*) as pv from vk_events e join vk_visits v on v.id = e.visit_id and not v.is_bot
    where e.name = 'page_view' and e.ts >= p_from and e.ts < p_to and (p_path is null or e.path = p_path) group by e.path
  ),
  cl as (
    select c.path, coalesce(c.href,'') href, coalesce(c.text,'') text, c.kind, count(*) clicks
    from vk_clicks c join vk_visits v on v.id = c.visit_id and not v.is_bot
    where c.ts >= p_from and c.ts < p_to and (p_path is null or c.path = p_path) group by 1,2,3,4
  )
  select cl.path, cl.href, cl.text, cl.kind, cl.clicks, coalesce(pvs.pv,0),
         case when coalesce(pvs.pv,0) > 0 then round(cl.clicks::numeric / pvs.pv * 100, 1) else null end
  from cl left join pvs on pvs.path = cl.path order by cl.clicks desc limit p_limit
$$;


ALTER FUNCTION "public"."vk_link_ctr"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_path" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_paths_before_conversion"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer DEFAULT 30) RETURNS TABLE("conversion" "text", "step_minus3" "text", "step_minus2" "text", "step_minus1" "text", "n" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with firstconv as (
    select e.visit_id, min(e.ts) as cts, (array_agg(e.name order by e.ts))[1] as cname
    from vk_events e join vk_event_defs d on d.name = e.name and d.is_conversion
    join vk_visits v on v.id = e.visit_id and not v.is_bot
    where e.ts >= p_from and e.ts < p_to group by e.visit_id
  ),
  pv as (
    select e.visit_id, e.path, row_number() over (partition by e.visit_id order by e.ts desc, e.seq desc) rn
    from vk_events e join firstconv f on f.visit_id = e.visit_id and e.ts <= f.cts
    where e.name = 'page_view'
  )
  select f.cname, coalesce(p3.path,''), coalesce(p2.path,''), coalesce(p1.path,''), count(*)
  from firstconv f
  left join pv p1 on p1.visit_id = f.visit_id and p1.rn = 1
  left join pv p2 on p2.visit_id = f.visit_id and p2.rn = 2
  left join pv p3 on p3.visit_id = f.visit_id and p3.rn = 3
  group by 1,2,3,4 order by 5 desc limit p_limit
$$;


ALTER FUNCTION "public"."vk_paths_before_conversion"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_paths_next"("p_path" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer DEFAULT 30) RETURNS TABLE("step1" "text", "step2" "text", "step3" "text", "n" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with pv as (
    select e.visit_id, e.path, e.ts, e.seq,
           lead(e.path,1) over w as n1, lead(e.path,2) over w as n2, lead(e.path,3) over w as n3
    from vk_events e join vk_visits v on v.id = e.visit_id and not v.is_bot
    where e.name = 'page_view' and e.ts >= p_from and e.ts < p_to
    window w as (partition by e.visit_id order by e.ts, e.seq)
  )
  select coalesce(n1,'(odchod)'), coalesce(n2, case when n1 is null then '' else '(odchod)' end),
         coalesce(n3, case when n2 is null then '' else '(odchod)' end), count(*)
  from pv where path = p_path
  group by 1,2,3 order by 4 desc limit p_limit
$$;


ALTER FUNCTION "public"."vk_paths_next"("p_path" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_props_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) RETURNS TABLE("key" "text", "value" "text", "visits" bigint, "converted" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select kv.key, left(kv.value, 60), count(*), count(*) filter (where v.converted)
  from vk_visits v, jsonb_each_text(v.props) kv
  where v.started_at >= p_from and v.started_at < p_to and not v.is_bot
  group by 1,2 order by 3 desc limit 200
$$;


ALTER FUNCTION "public"."vk_props_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_prune"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare n int := 0; m int; days int := vk_setting_int('retention_days', 730); cdays int := vk_setting_int('clicks_retention_days', 90);
begin
  loop
    delete from vk_events where id in (select id from vk_events where ts < now() - (days || ' days')::interval limit 10000);
    get diagnostics m = row_count; n := n + m; exit when m = 0;
  end loop;
  delete from vk_clicks where ts < now() - (cdays || ' days')::interval;
  delete from vk_crawler_hits where ts < now() - interval '365 days';
  return n;
end $$;


ALTER FUNCTION "public"."vk_prune"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_rescore"("p_threshold" integer DEFAULT NULL::integer) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare t int := coalesce(p_threshold, vk_setting_int('bot_threshold', 70)); n int;
begin
  update vk_visits set is_bot = (bot_score >= t) where is_bot is distinct from (bot_score >= t);
  get diagnostics n = row_count;
  return n;
end $$;


ALTER FUNCTION "public"."vk_rescore"("p_threshold" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_resolve_visit"("p_sid" "text", "p_ts" timestamp with time zone, "p_gap_min" integer DEFAULT 30) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_id text;
begin
  select id into v_id
    from vk_visits
   where sid = p_sid
     and last_seen_at > p_ts - make_interval(mins => p_gap_min)
     and started_at <= p_ts + interval '5 minutes'
   order by last_seen_at desc
   limit 1;

  if v_id is not null then return v_id; end if;
  return replace(gen_random_uuid()::text, '-', '');
end $$;


ALTER FUNCTION "public"."vk_resolve_visit"("p_sid" "text", "p_ts" timestamp with time zone, "p_gap_min" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_rollup"("p_day" "date") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare b record; v_n int; cap int := vk_setting_int('daily_sid_cap', 2000);
begin
  select * into b from vk_day_bounds(p_day);

  -- objemoví boti
  update vk_visits v set
    bot_score = greatest(v.bot_score, 80),
    bot_reasons = (select coalesce(array_agg(distinct x), '{}') from unnest(v.bot_reasons || array['volume']) x)
  from (select sid from vk_events where ts >= b.d_from and ts < b.d_to group by sid having count(*) > cap) big
  where v.sid = big.sid and v.started_at >= b.d_from and v.started_at < b.d_to and not ('volume' = any(v.bot_reasons));

  perform vk_rescore();

  -- konverze a engagement podle aktuálních definic
  update vk_visits v set
    conversion_names = coalesce(c.names, '{}'),
    converted = coalesce(c.names, '{}') <> '{}',
    engaged = (v.active_seconds >= 10 or v.pageviews >= 2 or coalesce(c.names, '{}') <> '{}')
  from (
    select vv.id, (select array_agg(distinct e.name) from vk_events e join vk_event_defs d on d.name = e.name and d.is_conversion where e.visit_id = vv.id) as names
    from vk_visits vv where vv.started_at >= b.d_from and vv.started_at < b.d_to
  ) c where c.id = v.id;

  delete from vk_daily where day = p_day;
  insert into vk_daily (day, metric, dim, dim_value, n)
  select p_day, a.metric, a.dim, left(a.dim_value, 300), a.n from vk_aggregate(b.d_from, b.d_to) a where a.n > 0;
  get diagnostics v_n = row_count;
  return v_n;
end $$;


ALTER FUNCTION "public"."vk_rollup"("p_day" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_setting_int"("p_key" "text", "p_default" integer) RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce((select (value)::text::int from vk_settings where key = p_key), p_default)
$$;


ALTER FUNCTION "public"."vk_setting_int"("p_key" "text", "p_default" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vk_summary"("p_from" "date", "p_to" "date") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  with today as (select (now() at time zone 'Europe/Prague')::date as d),
  src as (
    select day, metric, dim, dim_value, n from vk_daily
     where day >= p_from and day <= least(p_to, (select d from today) - 1)
    union all
    select (select d from today), a.metric, a.dim, a.dim_value, a.n
      from vk_aggregate_day((select d from today)) a
     where p_to >= (select d from today) and p_from <= (select d from today)
  ),
  totals as (
    select metric, dim, dim_value, sum(n) as n, row_number() over (partition by metric, dim order by sum(n) desc) as rn
      from src group by metric, dim, dim_value
  ),
  series as (select day, metric, sum(n) as n from src where dim = 'total' group by day, metric)
  select jsonb_build_object(
    'totals', coalesce((select jsonb_agg(jsonb_build_object('metric', metric, 'dim', dim, 'dim_value', dim_value, 'n', n)) from totals where rn <= 300), '[]'::jsonb),
    'series', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'metric', metric, 'n', n) order by day) from series), '[]'::jsonb)
  )
$$;


ALTER FUNCTION "public"."vk_summary"("p_from" "date", "p_to" "date") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apartment_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "alt_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category" "text",
    CONSTRAINT "apartment_images_category_check" CHECK (("category" = ANY (ARRAY['interior'::"text", 'winter'::"text", 'exterior'::"text", 'plan'::"text"])))
);


ALTER TABLE "public"."apartment_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apartment_owners" (
    "apartment_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."apartment_owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apartments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "building" "text",
    "unit" "text",
    "layout" "text",
    "area_m2" numeric(6,2),
    "floor" integer,
    "owner_id" "uuid",
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "for_sale" boolean DEFAULT false NOT NULL,
    "for_rent" boolean DEFAULT false NOT NULL,
    "in_rental_program" boolean DEFAULT false NOT NULL,
    "features" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "base_price_cents" integer DEFAULT 250000 NOT NULL,
    "max_guests" integer DEFAULT 4 NOT NULL,
    "ical_export_token" "text" DEFAULT ("gen_random_uuid"())::"text",
    "description" "text",
    "orientation" "text",
    "rooms" "jsonb",
    "subtitle" "text",
    "fdm_room_use_id" integer,
    "title_en" "text",
    "subtitle_en" "text",
    "orientation_en" "text",
    "description_en" "text",
    "features_en" "jsonb",
    "title_pl" "text",
    "subtitle_pl" "text",
    "orientation_pl" "text",
    "description_pl" "text",
    "features_pl" "jsonb",
    "extra_beds" smallint,
    "bathroom" "text",
    "floors_total" smallint,
    CONSTRAINT "apartments_bathroom_check" CHECK ((("bathroom" IS NULL) OR ("bathroom" = ANY (ARRAY['shower'::"text", 'bath'::"text"])))),
    CONSTRAINT "apartments_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'reserved'::"text", 'sold'::"text"])))
);


ALTER TABLE "public"."apartments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid",
    "action" "text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "actor_role" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blocked_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "owner_id" "uuid",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text" DEFAULT 'owner_use'::"text" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'owner'::"text" NOT NULL,
    "external_uid" "text",
    "channel_connection_id" "uuid",
    CONSTRAINT "blocked_dates_dates_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "blocked_dates_reason_check" CHECK (("reason" = ANY (ARRAY['owner_use'::"text", 'maintenance'::"text", 'other'::"text"]))),
    CONSTRAINT "blocked_dates_source_check" CHECK (("source" = ANY (ARRAY['owner'::"text", 'booking_com'::"text", 'airbnb'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."blocked_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "sender_role" "text" NOT NULL,
    "sender_name" "text",
    "content" "text" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "booking_messages_sender_role_check" CHECK (("sender_role" = ANY (ARRAY['guest'::"text", 'admin'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."booking_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "guest_first_name" "text" NOT NULL,
    "guest_last_name" "text" NOT NULL,
    "guest_email" "text" NOT NULL,
    "guest_phone" "text",
    "guests_count" integer DEFAULT 1 NOT NULL,
    "check_in" "date" NOT NULL,
    "check_out" "date" NOT NULL,
    "nights" integer NOT NULL,
    "total_amount_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'CZK'::"text" NOT NULL,
    "payment_method" "text" DEFAULT 'bank_transfer'::"text" NOT NULL,
    "stripe_checkout_session_id" "text",
    "stripe_payment_intent_id" "text",
    "paid_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "confirmation_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(16), 'hex'::"text") NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checkin_info" "jsonb",
    "fdm_reservation_code" "text",
    "fdm_guest_account_id" "text",
    "fdm_sync_status" "text" DEFAULT 'skipped'::"text" NOT NULL,
    "fdm_sync_error" "text",
    "fdm_synced_at" timestamp with time zone,
    "language" "text" DEFAULT 'cs'::"text" NOT NULL,
    CONSTRAINT "bookings_fdm_sync_status_check" CHECK (("fdm_sync_status" = ANY (ARRAY['pending'::"text", 'synced'::"text", 'failed'::"text", 'skipped'::"text"]))),
    CONSTRAINT "bookings_language_check" CHECK (("language" = ANY (ARRAY['cs'::"text", 'en'::"text", 'pl'::"text"]))),
    CONSTRAINT "bookings_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['bank_transfer'::"text", 'stripe'::"text"]))),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."channel_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "channel" "text" NOT NULL,
    "label" "text",
    "ical_url" "text" NOT NULL,
    "sync_enabled" boolean DEFAULT true NOT NULL,
    "last_synced_at" timestamp with time zone,
    "last_sync_count" integer,
    "last_sync_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "channel_connections_channel_check" CHECK (("channel" = ANY (ARRAY['booking_com'::"text", 'airbnb'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."channel_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coop_contact_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "body" "text",
    "old_status" "text",
    "new_status" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coop_contact_events_kind_check" CHECK (("kind" = ANY (ARRAY['created'::"text", 'status'::"text", 'note'::"text", 'call'::"text", 'meeting'::"text", 'email'::"text", 'file_added'::"text", 'file_removed'::"text", 'archived'::"text", 'restored'::"text"])))
);


ALTER TABLE "public"."coop_contact_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coop_contact_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size_bytes" bigint,
    "mime_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coop_contact_files_category_check" CHECK (("category" = ANY (ARRAY['application'::"text", 'contract'::"text", 'id_document'::"text", 'payment'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."coop_contact_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coop_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "street" "text",
    "city" "text",
    "postal_code" "text",
    "country" "text",
    "birth_date" "date",
    "company_name" "text",
    "company_id" "text",
    "share_count" integer,
    "source" "text" DEFAULT 'other'::"text" NOT NULL,
    "referred_by" "text",
    "assigned_to" "text",
    "next_step" "text",
    "next_step_date" "date",
    "reserved_at" "date",
    "contract_signed_at" "date",
    "paid_at" "date",
    "paid_amount" numeric(12,2),
    "gdpr_consent" boolean DEFAULT false NOT NULL,
    "gdpr_consent_at" timestamp with time zone,
    "marketing_consent" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "language" "text",
    "lead_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    CONSTRAINT "coop_contacts_share_count_check" CHECK ((("share_count" IS NULL) OR (("share_count" >= 1) AND ("share_count" <= 50)))),
    CONSTRAINT "coop_contacts_shares_required" CHECK ((("status" <> ALL (ARRAY['reservation'::"text", 'owner'::"text"])) OR ("share_count" IS NOT NULL))),
    CONSTRAINT "coop_contacts_source_check" CHECK (("source" = ANY (ARRAY['web'::"text", 'referral'::"text", 'advisor'::"text", 'other'::"text"]))),
    CONSTRAINT "coop_contacts_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'reservation'::"text", 'owner'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."coop_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cron_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "duration_ms" integer,
    "status" integer,
    "processed" integer DEFAULT 0 NOT NULL,
    "delivered" integer DEFAULT 0 NOT NULL,
    "skipped" integer DEFAULT 0 NOT NULL,
    "failed" integer DEFAULT 0 NOT NULL,
    "error" "text"
);


ALTER TABLE "public"."cron_runs" OWNER TO "postgres";


COMMENT ON TABLE "public"."cron_runs" IS 'Evidence běhů cronů (Vibekodex SHIP-04). Zapisuje withCronRun(), čte prod_check.py. Retence: řádky starší 90 dní maže sám wrapper při každém ~100. běhu.';



CREATE TABLE IF NOT EXISTS "public"."fdm_calendar" (
    "apartment_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "available" boolean DEFAULT false NOT NULL,
    "price_cents" integer,
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "min_stay" integer,
    "closed" boolean DEFAULT false NOT NULL,
    "synced_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fdm_calendar" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fdm_sync_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "apartments" integer DEFAULT 0 NOT NULL,
    "days" integer DEFAULT 0 NOT NULL,
    "error" "text"
);


ALTER TABLE "public"."fdm_sync_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "apartment_slug" "text",
    "apartment_title" "text",
    "source_url" "text",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "message" "text",
    "preferred_dates" "text",
    "guest_count" integer,
    "gdpr_consent" boolean DEFAULT false NOT NULL,
    "terms_accepted" boolean DEFAULT false NOT NULL,
    "marketing_consent" boolean DEFAULT false,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "notes" "text",
    "language" "text" DEFAULT 'cs'::"text",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "leads_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'in_progress'::"text", 'closed'::"text", 'spam'::"text"]))),
    CONSTRAINT "leads_type_check" CHECK (("type" = ANY (ARRAY['rent_inquiry'::"text", 'sale_inquiry'::"text", 'investment_inquiry'::"text", 'investment_share_request'::"text", 'general_inquiry'::"text"])))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "admin_note" "text",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "maintenance_requests_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'urgent'::"text"]))),
    CONSTRAINT "maintenance_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."maintenance_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owner_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "apartment_id" "uuid",
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size_bytes" integer,
    "mime_type" "text",
    "uploaded_by" "text" DEFAULT 'admin'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "owner_documents_category_check" CHECK (("category" = ANY (ARRAY['purchase_contract'::"text", 'handover_protocol'::"text", 'insurance'::"text", 'other'::"text"]))),
    CONSTRAINT "owner_documents_uploaded_by_check" CHECK (("uploaded_by" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))
);


ALTER TABLE "public"."owner_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owner_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL
);


ALTER TABLE "public"."owner_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "phone" "text",
    "bank_account" "text",
    "commission_rate" numeric(5,4),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_name" "text",
    "company_id" "text",
    "company_vat_id" "text",
    "company_address" "text"
);


ALTER TABLE "public"."owners" OWNER TO "postgres";


COMMENT ON COLUMN "public"."owners"."company_name" IS 'Společnost, která apartmán vlastní (majitel = kontaktní osoba)';



COMMENT ON COLUMN "public"."owners"."company_id" IS 'IČO společnosti';



COMMENT ON COLUMN "public"."owners"."company_vat_id" IS 'DIČ společnosti';



COMMENT ON COLUMN "public"."owners"."company_address" IS 'Sídlo společnosti';



CREATE TABLE IF NOT EXISTS "public"."pricing_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "price_per_night_cents" integer NOT NULL,
    "min_nights" integer DEFAULT 2,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pricing_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svj_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."svj_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svj_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size_bytes" integer,
    "mime_type" "text",
    "uploaded_by" "uuid",
    "is_admin_upload" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "svj_documents_category_check" CHECK (("category" = ANY (ARRAY['stanovy'::"text", 'zapisy'::"text", 'finance'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."svj_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svj_poll_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "option_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."svj_poll_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svj_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid",
    "type" "text" DEFAULT 'announcement'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "is_pinned" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "options" "jsonb",
    "poll_deadline" timestamp with time zone,
    "archived_at" timestamp with time zone,
    CONSTRAINT "svj_posts_type_check" CHECK (("type" = ANY (ARRAY['announcement'::"text", 'discussion'::"text", 'poll'::"text", 'document'::"text"])))
);


ALTER TABLE "public"."svj_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vk_ai_competitors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "domain" "text",
    "aliases" "text"[] DEFAULT '{}'::"text"[] NOT NULL
);


ALTER TABLE "public"."vk_ai_competitors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vk_ai_mentions" (
    "run_id" "uuid" NOT NULL,
    "brand" "text" NOT NULL,
    "is_own" boolean DEFAULT false NOT NULL,
    "mentioned" boolean DEFAULT false NOT NULL,
    "mention_kind" "text" DEFAULT 'none'::"text" NOT NULL,
    "position" integer,
    "cited_url" "text",
    "sentiment" "text",
    CONSTRAINT "vk_ai_mentions_mention_kind_check" CHECK (("mention_kind" = ANY (ARRAY['cited'::"text", 'paraphrased'::"text", 'passing'::"text", 'none'::"text"]))),
    CONSTRAINT "vk_ai_mentions_sentiment_check" CHECK (("sentiment" = ANY (ARRAY['pos'::"text", 'neu'::"text", 'neg'::"text"])))
);


ALTER TABLE "public"."vk_ai_mentions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vk_ai_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "text" "text" NOT NULL,
    "kind" "text" DEFAULT 'unbranded'::"text" NOT NULL,
    "topic" "text",
    "lang" "text" DEFAULT 'cs'::"text" NOT NULL,
    "priority" boolean DEFAULT false NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vk_ai_prompts_kind_check" CHECK (("kind" = ANY (ARRAY['branded'::"text", 'unbranded'::"text", 'comparison'::"text"])))
);


ALTER TABLE "public"."vk_ai_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vk_ai_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_id" "uuid" NOT NULL,
    "engine" "text" NOT NULL,
    "model" "text",
    "run_date" "date" NOT NULL,
    "slot" integer DEFAULT 0 NOT NULL,
    "run_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "answer" "text",
    "citations" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "cost_usd" numeric(8,4),
    "error" "text",
    CONSTRAINT "vk_ai_runs_engine_check" CHECK (("engine" = ANY (ARRAY['openai'::"text", 'anthropic'::"text", 'perplexity'::"text", 'gemini'::"text"])))
);


ALTER TABLE "public"."vk_ai_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vk_clicks" (
    "id" bigint NOT NULL,
    "ts" timestamp with time zone NOT NULL,
    "visit_id" "text" NOT NULL,
    "path" "text" NOT NULL,
    "x_pct" numeric(5,2),
    "y_px" integer,
    "doc_h" integer,
    "viewport_w" integer,
    "screen_bucket" "text",
    "selector" "text",
    "text" "text",
    "href" "text",
    "kind" "text" DEFAULT 'other'::"text" NOT NULL
);


ALTER TABLE "public"."vk_clicks" OWNER TO "postgres";


ALTER TABLE "public"."vk_clicks" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vk_clicks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."vk_crawler_hits" (
    "id" bigint NOT NULL,
    "ts" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bot" "text" NOT NULL,
    "path" "text" NOT NULL,
    "status" integer,
    "ua" "text"
);


ALTER TABLE "public"."vk_crawler_hits" OWNER TO "postgres";


ALTER TABLE "public"."vk_crawler_hits" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vk_crawler_hits_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."vk_daily" (
    "day" "date" NOT NULL,
    "metric" "text" NOT NULL,
    "dim" "text" NOT NULL,
    "dim_value" "text" NOT NULL,
    "n" bigint NOT NULL
);


ALTER TABLE "public"."vk_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vk_event_defs" (
    "name" "text" NOT NULL,
    "label" "text" NOT NULL,
    "is_conversion" boolean DEFAULT false NOT NULL,
    "value" numeric,
    "funnel_step" integer,
    "color" "text",
    CONSTRAINT "vk_event_defs_name_check" CHECK (("name" ~ '^[a-z][a-z0-9_]{1,40}$'::"text"))
);


ALTER TABLE "public"."vk_event_defs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vk_events" (
    "id" bigint NOT NULL,
    "sid" "text" NOT NULL,
    "visit_id" "text" NOT NULL,
    "ts" timestamp with time zone NOT NULL,
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "path" "text",
    "props" "jsonb",
    "seq" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "vk_events_name_check" CHECK (("name" ~ '^[a-z][a-z0-9_]{1,40}$'::"text"))
);


ALTER TABLE "public"."vk_events" OWNER TO "postgres";


ALTER TABLE "public"."vk_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vk_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."vk_identities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identity_key" "text" NOT NULL,
    "first_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "external_ref" "text"
);


ALTER TABLE "public"."vk_identities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vk_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vk_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."apartment_images"
    ADD CONSTRAINT "apartment_images_apartment_id_storage_path_key" UNIQUE ("apartment_id", "storage_path");



ALTER TABLE ONLY "public"."apartment_images"
    ADD CONSTRAINT "apartment_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apartment_owners"
    ADD CONSTRAINT "apartment_owners_pkey" PRIMARY KEY ("apartment_id", "owner_id");



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_fdm_room_use_id_key" UNIQUE ("fdm_room_use_id");



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_ical_export_token_key" UNIQUE ("ical_export_token");



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_messages"
    ADD CONSTRAINT "booking_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_confirmation_token_key" UNIQUE ("confirmation_token");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channel_connections"
    ADD CONSTRAINT "channel_connections_apartment_id_channel_key" UNIQUE ("apartment_id", "channel");



ALTER TABLE ONLY "public"."channel_connections"
    ADD CONSTRAINT "channel_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coop_contact_events"
    ADD CONSTRAINT "coop_contact_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coop_contact_files"
    ADD CONSTRAINT "coop_contact_files_file_path_key" UNIQUE ("file_path");



ALTER TABLE ONLY "public"."coop_contact_files"
    ADD CONSTRAINT "coop_contact_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coop_contacts"
    ADD CONSTRAINT "coop_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cron_runs"
    ADD CONSTRAINT "cron_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fdm_calendar"
    ADD CONSTRAINT "fdm_calendar_pkey" PRIMARY KEY ("apartment_id", "date");



ALTER TABLE ONLY "public"."fdm_sync_log"
    ADD CONSTRAINT "fdm_sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owner_documents"
    ADD CONSTRAINT "owner_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owner_invitations"
    ADD CONSTRAINT "owner_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_rules"
    ADD CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svj_comments"
    ADD CONSTRAINT "svj_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svj_documents"
    ADD CONSTRAINT "svj_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svj_poll_votes"
    ADD CONSTRAINT "svj_poll_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svj_poll_votes"
    ADD CONSTRAINT "svj_poll_votes_post_id_owner_id_key" UNIQUE ("post_id", "owner_id");



ALTER TABLE ONLY "public"."svj_posts"
    ADD CONSTRAINT "svj_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vk_ai_competitors"
    ADD CONSTRAINT "vk_ai_competitors_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."vk_ai_competitors"
    ADD CONSTRAINT "vk_ai_competitors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vk_ai_mentions"
    ADD CONSTRAINT "vk_ai_mentions_pkey" PRIMARY KEY ("run_id", "brand");



ALTER TABLE ONLY "public"."vk_ai_prompts"
    ADD CONSTRAINT "vk_ai_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vk_ai_runs"
    ADD CONSTRAINT "vk_ai_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vk_ai_runs"
    ADD CONSTRAINT "vk_ai_runs_prompt_id_engine_run_date_slot_key" UNIQUE ("prompt_id", "engine", "run_date", "slot");



ALTER TABLE ONLY "public"."vk_clicks"
    ADD CONSTRAINT "vk_clicks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vk_crawler_hits"
    ADD CONSTRAINT "vk_crawler_hits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vk_daily"
    ADD CONSTRAINT "vk_daily_pkey" PRIMARY KEY ("day", "metric", "dim", "dim_value");



ALTER TABLE ONLY "public"."vk_event_defs"
    ADD CONSTRAINT "vk_event_defs_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."vk_events"
    ADD CONSTRAINT "vk_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vk_identities"
    ADD CONSTRAINT "vk_identities_identity_key_key" UNIQUE ("identity_key");



ALTER TABLE ONLY "public"."vk_identities"
    ADD CONSTRAINT "vk_identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vk_settings"
    ADD CONSTRAINT "vk_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."vk_visits"
    ADD CONSTRAINT "vk_visits_pkey" PRIMARY KEY ("id");



CREATE INDEX "apartment_images_apartment_idx" ON "public"."apartment_images" USING "btree" ("apartment_id", "sort_order");



CREATE INDEX "apartment_owners_owner_id_idx" ON "public"."apartment_owners" USING "btree" ("owner_id");



CREATE INDEX "apartments_owner_id_idx" ON "public"."apartments" USING "btree" ("owner_id");



CREATE INDEX "apartments_slug_idx" ON "public"."apartments" USING "btree" ("slug");



CREATE INDEX "blocked_dates_apartment_idx" ON "public"."blocked_dates" USING "btree" ("apartment_id");



CREATE INDEX "blocked_dates_dates_idx" ON "public"."blocked_dates" USING "btree" ("apartment_id", "start_date", "end_date");



CREATE INDEX "blocked_dates_external_uid_idx" ON "public"."blocked_dates" USING "btree" ("channel_connection_id", "external_uid") WHERE ("external_uid" IS NOT NULL);



CREATE INDEX "booking_messages_booking_id_idx" ON "public"."booking_messages" USING "btree" ("booking_id");



CREATE INDEX "booking_messages_created_at_idx" ON "public"."booking_messages" USING "btree" ("booking_id", "created_at");



CREATE INDEX "bookings_apartment_id_idx" ON "public"."bookings" USING "btree" ("apartment_id");



CREATE INDEX "bookings_dates_idx" ON "public"."bookings" USING "btree" ("apartment_id", "check_in", "check_out");



CREATE INDEX "bookings_fdm_reservation_code_idx" ON "public"."bookings" USING "btree" ("fdm_reservation_code") WHERE ("fdm_reservation_code" IS NOT NULL);



CREATE INDEX "bookings_guest_email_idx" ON "public"."bookings" USING "btree" ("guest_email");



CREATE INDEX "bookings_status_idx" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "bookings_token_idx" ON "public"."bookings" USING "btree" ("confirmation_token");



CREATE INDEX "coop_contact_events_contact_idx" ON "public"."coop_contact_events" USING "btree" ("contact_id", "occurred_at" DESC);



CREATE INDEX "coop_contact_files_contact_idx" ON "public"."coop_contact_files" USING "btree" ("contact_id", "created_at" DESC);



CREATE INDEX "coop_contacts_created_idx" ON "public"."coop_contacts" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "coop_contacts_lead_uniq" ON "public"."coop_contacts" USING "btree" ("lead_id") WHERE ("lead_id" IS NOT NULL);



CREATE INDEX "coop_contacts_status_idx" ON "public"."coop_contacts" USING "btree" ("status") WHERE ("archived_at" IS NULL);



CREATE INDEX "cron_runs_job_idx" ON "public"."cron_runs" USING "btree" ("job", "started_at" DESC);



CREATE INDEX "fdm_calendar_date_idx" ON "public"."fdm_calendar" USING "btree" ("date");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_email" ON "public"."leads" USING "btree" ("email");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_leads_type" ON "public"."leads" USING "btree" ("type");



CREATE INDEX "maintenance_owner_id_idx" ON "public"."maintenance_requests" USING "btree" ("owner_id");



CREATE INDEX "maintenance_status_idx" ON "public"."maintenance_requests" USING "btree" ("status");



CREATE INDEX "owner_documents_owner_id_idx" ON "public"."owner_documents" USING "btree" ("owner_id");



CREATE INDEX "owner_invitations_email_idx" ON "public"."owner_invitations" USING "btree" ("email");



CREATE INDEX "owner_invitations_owner_id_idx" ON "public"."owner_invitations" USING "btree" ("owner_id");



CREATE INDEX "owners_email_idx" ON "public"."owners" USING "btree" ("email");



CREATE INDEX "owners_user_id_idx" ON "public"."owners" USING "btree" ("user_id");



CREATE INDEX "svj_comments_created_at_idx" ON "public"."svj_comments" USING "btree" ("created_at");



CREATE INDEX "svj_comments_post_id_idx" ON "public"."svj_comments" USING "btree" ("post_id");



CREATE INDEX "svj_documents_category_idx" ON "public"."svj_documents" USING "btree" ("category");



CREATE INDEX "svj_posts_archived_at_idx" ON "public"."svj_posts" USING "btree" ("archived_at");



CREATE INDEX "svj_posts_created_at_idx" ON "public"."svj_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "svj_posts_type_idx" ON "public"."svj_posts" USING "btree" ("type");



CREATE INDEX "vk_ai_runs_date_idx" ON "public"."vk_ai_runs" USING "btree" ("run_date" DESC);



CREATE INDEX "vk_clicks_path_idx" ON "public"."vk_clicks" USING "btree" ("path", "ts");



CREATE INDEX "vk_crawler_hits_bot_idx" ON "public"."vk_crawler_hits" USING "btree" ("bot", "ts");



CREATE INDEX "vk_crawler_hits_ts_idx" ON "public"."vk_crawler_hits" USING "btree" ("ts" DESC);



CREATE INDEX "vk_events_name_idx" ON "public"."vk_events" USING "btree" ("name", "ts");



CREATE INDEX "vk_events_ts_idx" ON "public"."vk_events" USING "btree" ("ts" DESC);



CREATE INDEX "vk_events_visit_idx" ON "public"."vk_events" USING "btree" ("visit_id", "ts", "seq");



CREATE INDEX "vk_visits_bot_idx" ON "public"."vk_visits" USING "btree" ("is_bot");



CREATE INDEX "vk_visits_channel_idx" ON "public"."vk_visits" USING "btree" ("channel", "started_at");



CREATE INDEX "vk_visits_identity_idx" ON "public"."vk_visits" USING "btree" ("identity_id") WHERE ("identity_id" IS NOT NULL);



CREATE INDEX "vk_visits_sid_idx" ON "public"."vk_visits" USING "btree" ("sid", "started_at");



CREATE INDEX "vk_visits_started_idx" ON "public"."vk_visits" USING "btree" ("started_at" DESC);



CREATE OR REPLACE TRIGGER "coop_contacts_capacity" BEFORE INSERT OR UPDATE OF "status", "share_count", "archived_at" ON "public"."coop_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."coop_check_capacity"();



CREATE OR REPLACE TRIGGER "leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_leads_updated_at"();



ALTER TABLE ONLY "public"."apartment_images"
    ADD CONSTRAINT "apartment_images_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."apartment_owners"
    ADD CONSTRAINT "apartment_owners_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."apartment_owners"
    ADD CONSTRAINT "apartment_owners_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_channel_connection_id_fkey" FOREIGN KEY ("channel_connection_id") REFERENCES "public"."channel_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_messages"
    ADD CONSTRAINT "booking_messages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."channel_connections"
    ADD CONSTRAINT "channel_connections_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coop_contact_events"
    ADD CONSTRAINT "coop_contact_events_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."coop_contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coop_contact_files"
    ADD CONSTRAINT "coop_contact_files_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."coop_contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coop_contacts"
    ADD CONSTRAINT "coop_contacts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fdm_calendar"
    ADD CONSTRAINT "fdm_calendar_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_documents"
    ADD CONSTRAINT "owner_documents_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."owner_documents"
    ADD CONSTRAINT "owner_documents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_invitations"
    ADD CONSTRAINT "owner_invitations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pricing_rules"
    ADD CONSTRAINT "pricing_rules_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svj_comments"
    ADD CONSTRAINT "svj_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."svj_comments"
    ADD CONSTRAINT "svj_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."svj_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svj_documents"
    ADD CONSTRAINT "svj_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."svj_poll_votes"
    ADD CONSTRAINT "svj_poll_votes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svj_poll_votes"
    ADD CONSTRAINT "svj_poll_votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."svj_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svj_posts"
    ADD CONSTRAINT "svj_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vk_ai_mentions"
    ADD CONSTRAINT "vk_ai_mentions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."vk_ai_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vk_ai_runs"
    ADD CONSTRAINT "vk_ai_runs_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."vk_ai_prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vk_visits"
    ADD CONSTRAINT "vk_visits_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "public"."vk_identities"("id") ON DELETE SET NULL;



CREATE POLICY "Anyone can insert leads" ON "public"."leads" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Service role can manage leads" ON "public"."leads" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."apartment_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "apartment_images_public_read" ON "public"."apartment_images" FOR SELECT USING (true);



ALTER TABLE "public"."apartment_owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."apartments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "apartments_owner_read" ON "public"."apartments" FOR SELECT USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "apartments_public_read" ON "public"."apartments" FOR SELECT USING ((("for_sale" = true) OR ("for_rent" = true)));



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blocked_dates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blocked_dates_delete_own" ON "public"."blocked_dates" FOR DELETE USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "blocked_dates_insert_own" ON "public"."blocked_dates" FOR INSERT WITH CHECK (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "blocked_dates_select_all" ON "public"."blocked_dates" FOR SELECT USING (true);



CREATE POLICY "blocked_dates_select_own" ON "public"."blocked_dates" FOR SELECT USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."booking_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookings_owner_select" ON "public"."bookings" FOR SELECT USING (("apartment_id" IN ( SELECT "a"."id"
   FROM ("public"."apartments" "a"
     JOIN "public"."owners" "o" ON (("o"."id" = "a"."owner_id")))
  WHERE ("o"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."channel_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coop_contact_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coop_contact_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coop_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cron_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fdm_calendar" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fdm_sync_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maintenance_insert_own" ON "public"."maintenance_requests" FOR INSERT WITH CHECK (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."maintenance_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maintenance_select_own" ON "public"."maintenance_requests" FOR SELECT USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."owner_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_documents_insert_own" ON "public"."owner_documents" FOR INSERT WITH CHECK ((("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))) AND ("uploaded_by" = 'owner'::"text")));



CREATE POLICY "owner_documents_select_own" ON "public"."owner_documents" FOR SELECT USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."owner_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."owners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owners_select_own" ON "public"."owners" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."pricing_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pricing_rules_select_published" ON "public"."pricing_rules" FOR SELECT USING (true);



ALTER TABLE "public"."svj_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svj_comments_delete_own" ON "public"."svj_comments" FOR DELETE USING (("author_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "svj_comments_insert_own" ON "public"."svj_comments" FOR INSERT WITH CHECK (("author_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "svj_comments_select_owners" ON "public"."svj_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."owners"
  WHERE (("owners"."user_id" = "auth"."uid"()) AND ("owners"."is_active" = true)))));



ALTER TABLE "public"."svj_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svj_documents_select_owners" ON "public"."svj_documents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."owners"
  WHERE (("owners"."user_id" = "auth"."uid"()) AND ("owners"."is_active" = true)))));



ALTER TABLE "public"."svj_poll_votes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svj_poll_votes_delete_own" ON "public"."svj_poll_votes" FOR DELETE USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "svj_poll_votes_insert_own" ON "public"."svj_poll_votes" FOR INSERT WITH CHECK (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



CREATE POLICY "svj_poll_votes_select" ON "public"."svj_poll_votes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."owners"
  WHERE (("owners"."user_id" = "auth"."uid"()) AND ("owners"."is_active" = true)))));



CREATE POLICY "svj_poll_votes_update_own" ON "public"."svj_poll_votes" FOR UPDATE USING (("owner_id" IN ( SELECT "owners"."id"
   FROM "public"."owners"
  WHERE ("owners"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."svj_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svj_posts_select_owners" ON "public"."svj_posts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."owners"
  WHERE (("owners"."user_id" = "auth"."uid"()) AND ("owners"."is_active" = true)))));



ALTER TABLE "public"."vk_ai_competitors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_ai_mentions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_ai_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_ai_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_clicks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_crawler_hits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_event_defs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vk_visits" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."coop_check_capacity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."coop_check_capacity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_leads_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_leads_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_leads_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_aggregate"("p_from" timestamp with time zone, "p_to" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_aggregate"("p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_aggregate_day"("p_day" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_aggregate_day"("p_day" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_ai_queue"("p_limit" integer, "p_min_age_days" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_ai_queue"("p_limit" integer, "p_min_age_days" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_ai_scores"("p_from" "date", "p_to" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_ai_scores"("p_from" "date", "p_to" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_ai_sov"("p_from" "date", "p_to" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_ai_sov"("p_from" "date", "p_to" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_ai_stability"("p_to" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_ai_stability"("p_to" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_ai_status"("p_interval_days" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_ai_status"("p_interval_days" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_bot_histogram"("p_from" timestamp with time zone, "p_to" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_bot_histogram"("p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_click_points"("p_path" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_bucket" "text", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_click_points"("p_path" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_bucket" "text", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_click_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_click_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_crawler_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_crawler_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_day_bounds"("p_day" "date", OUT "d_from" timestamp with time zone, OUT "d_to" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_day_bounds"("p_day" "date", OUT "d_from" timestamp with time zone, OUT "d_to" timestamp with time zone) TO "service_role";



GRANT ALL ON TABLE "public"."vk_visits" TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_first_touch"("p_sid" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_first_touch"("p_sid" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_forget"("p_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_forget"("p_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_identify"("p_key" "text", "p_sid" "text", "p_ref" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_identify"("p_key" "text", "p_sid" "text", "p_ref" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_identity_summary"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_identity_summary"("p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_identity_visits"("p_identity" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_identity_visits"("p_identity" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_ingest"("p" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_ingest"("p" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_link_ctr"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_path" "text", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_link_ctr"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_path" "text", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_paths_before_conversion"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_paths_before_conversion"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_paths_next"("p_path" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_paths_next"("p_path" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_props_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_props_summary"("p_from" timestamp with time zone, "p_to" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_prune"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_prune"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_rescore"("p_threshold" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_rescore"("p_threshold" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_resolve_visit"("p_sid" "text", "p_ts" timestamp with time zone, "p_gap_min" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_resolve_visit"("p_sid" "text", "p_ts" timestamp with time zone, "p_gap_min" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_rollup"("p_day" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_rollup"("p_day" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_setting_int"("p_key" "text", "p_default" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_setting_int"("p_key" "text", "p_default" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."vk_summary"("p_from" "date", "p_to" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."vk_summary"("p_from" "date", "p_to" "date") TO "service_role";



GRANT ALL ON TABLE "public"."apartment_images" TO "anon";
GRANT ALL ON TABLE "public"."apartment_images" TO "authenticated";
GRANT ALL ON TABLE "public"."apartment_images" TO "service_role";



GRANT ALL ON TABLE "public"."apartment_owners" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."apartments" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."apartments" TO "authenticated";
GRANT ALL ON TABLE "public"."apartments" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("id") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("slug") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("slug") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("building") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("building") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("unit") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("unit") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("layout") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("layout") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("area_m2") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("area_m2") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("floor") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("floor") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("owner_id") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("status") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("status") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("for_sale") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("for_sale") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("for_rent") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("for_rent") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("in_rental_program") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("in_rental_program") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("features") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("features") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("created_at") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("created_at") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("updated_at") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("updated_at") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("title") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("title") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("base_price_cents") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("base_price_cents") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("max_guests") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("max_guests") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("description") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("description") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("orientation") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("orientation") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("rooms") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("rooms") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("subtitle") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("subtitle") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("title_en") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("title_en") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("subtitle_en") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("subtitle_en") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("orientation_en") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("orientation_en") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("description_en") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("description_en") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("features_en") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("features_en") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("title_pl") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("title_pl") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("subtitle_pl") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("subtitle_pl") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("orientation_pl") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("orientation_pl") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("description_pl") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("description_pl") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("features_pl") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("features_pl") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("extra_beds") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("extra_beds") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("bathroom") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("bathroom") ON TABLE "public"."apartments" TO "authenticated";



GRANT SELECT("floors_total") ON TABLE "public"."apartments" TO "anon";
GRANT SELECT("floors_total") ON TABLE "public"."apartments" TO "authenticated";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."blocked_dates" TO "anon";
GRANT ALL ON TABLE "public"."blocked_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."blocked_dates" TO "service_role";



GRANT ALL ON TABLE "public"."booking_messages" TO "anon";
GRANT ALL ON TABLE "public"."booking_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_messages" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."channel_connections" TO "anon";
GRANT ALL ON TABLE "public"."channel_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."channel_connections" TO "service_role";



GRANT ALL ON TABLE "public"."coop_contact_events" TO "service_role";



GRANT ALL ON TABLE "public"."coop_contact_files" TO "service_role";



GRANT ALL ON TABLE "public"."coop_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."cron_runs" TO "service_role";



GRANT ALL ON TABLE "public"."fdm_calendar" TO "service_role";



GRANT ALL ON TABLE "public"."fdm_sync_log" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_requests" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "service_role";



GRANT ALL ON TABLE "public"."owner_documents" TO "anon";
GRANT ALL ON TABLE "public"."owner_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_documents" TO "service_role";



GRANT ALL ON TABLE "public"."owner_invitations" TO "anon";
GRANT ALL ON TABLE "public"."owner_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."owners" TO "anon";
GRANT ALL ON TABLE "public"."owners" TO "authenticated";
GRANT ALL ON TABLE "public"."owners" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_rules" TO "anon";
GRANT ALL ON TABLE "public"."pricing_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_rules" TO "service_role";



GRANT ALL ON TABLE "public"."svj_comments" TO "anon";
GRANT ALL ON TABLE "public"."svj_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."svj_comments" TO "service_role";



GRANT ALL ON TABLE "public"."svj_documents" TO "anon";
GRANT ALL ON TABLE "public"."svj_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."svj_documents" TO "service_role";



GRANT ALL ON TABLE "public"."svj_poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."svj_poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."svj_poll_votes" TO "service_role";



GRANT ALL ON TABLE "public"."svj_posts" TO "anon";
GRANT ALL ON TABLE "public"."svj_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."svj_posts" TO "service_role";



GRANT ALL ON TABLE "public"."vk_ai_competitors" TO "service_role";



GRANT ALL ON TABLE "public"."vk_ai_mentions" TO "service_role";



GRANT ALL ON TABLE "public"."vk_ai_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."vk_ai_runs" TO "service_role";



GRANT ALL ON TABLE "public"."vk_clicks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vk_clicks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vk_crawler_hits" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vk_crawler_hits_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vk_daily" TO "service_role";



GRANT ALL ON TABLE "public"."vk_event_defs" TO "service_role";



GRANT ALL ON TABLE "public"."vk_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vk_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."vk_identities" TO "service_role";



GRANT ALL ON TABLE "public"."vk_settings" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







