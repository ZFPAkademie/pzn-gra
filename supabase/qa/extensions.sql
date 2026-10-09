-- Rozšíření z produkce (jen CREATE EXTENSION). Generuje os/qa/local_db.sh --dump-schema.
create schema if not exists "extensions";
create extension if not exists "pg_stat_statements" with schema "extensions";
create schema if not exists "extensions";
create extension if not exists "pgcrypto" with schema "extensions";
create schema if not exists "vault";
create extension if not exists "supabase_vault" with schema "vault";
create schema if not exists "extensions";
create extension if not exists "uuid-ossp" with schema "extensions";
