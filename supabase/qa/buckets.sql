-- Storage buckety z produkce (jen definice). Generuje os/qa/local_db.sh --dump-schema.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('apartmany', 'apartmany', true, null, null) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('dokumenty', 'dokumenty', false, null, null) on conflict (id) do nothing;
