-- ═══════════════════════════════════════════════════════════════════
-- MIGRACE 006 — Portal Phase 4
-- Projekt: Pod Zlatým návrším
-- Datum: 2026-05-27
--
-- Spustit ručně v Supabase SQL Editoru.
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. blocked_dates — owner_id nullable (admin může blokovat bez owner)
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.blocked_dates ALTER COLUMN owner_id DROP NOT NULL;

-- ───────────────────────────────────────────────────────────────────
-- 2. SVJ Comments
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.svj_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES public.svj_posts(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES public.owners(id) ON DELETE SET NULL,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS svj_comments_post_id_idx ON public.svj_comments(post_id);
CREATE INDEX IF NOT EXISTS svj_comments_created_at_idx ON public.svj_comments(created_at);

ALTER TABLE public.svj_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "svj_comments_select_owners" ON public.svj_comments;
CREATE POLICY "svj_comments_select_owners" ON public.svj_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.owners WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "svj_comments_insert_own" ON public.svj_comments;
CREATE POLICY "svj_comments_insert_own" ON public.svj_comments
  FOR INSERT WITH CHECK (
    author_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "svj_comments_delete_own" ON public.svj_comments;
CREATE POLICY "svj_comments_delete_own" ON public.svj_comments
  FOR DELETE USING (
    author_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );

-- ───────────────────────────────────────────────────────────────────
-- 3. SVJ Documents
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.svj_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category          text NOT NULL DEFAULT 'other'
                    CHECK (category IN ('stanovy', 'zapisy', 'finance', 'other')),
  title             text NOT NULL,
  file_path         text NOT NULL,
  file_size_bytes   int,
  mime_type         text,
  uploaded_by       uuid REFERENCES public.owners(id) ON DELETE SET NULL,
  is_admin_upload   boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS svj_documents_category_idx ON public.svj_documents(category);

ALTER TABLE public.svj_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "svj_documents_select_owners" ON public.svj_documents;
CREATE POLICY "svj_documents_select_owners" ON public.svj_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.owners WHERE user_id = auth.uid() AND is_active = true)
  );

-- ───────────────────────────────────────────────────────────────────
-- 4. Owner Invitations — invite flow (admin pozve majitele)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.owner_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  email        text NOT NULL,
  invited_at   timestamptz NOT NULL DEFAULT now(),
  accepted_at  timestamptz,
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS owner_invitations_owner_id_idx ON public.owner_invitations(owner_id);
CREATE INDEX IF NOT EXISTS owner_invitations_email_idx ON public.owner_invitations(email);

-- Jen service role (admin) zapisuje — žádná user-facing policy
ALTER TABLE public.owner_invitations ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────
-- 5. GRANTS — ERR-01: bez GRANT tichý fail
-- ───────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, DELETE ON public.svj_comments TO authenticated;
GRANT SELECT ON public.svj_documents TO authenticated;
GRANT SELECT ON public.owner_invitations TO authenticated;
