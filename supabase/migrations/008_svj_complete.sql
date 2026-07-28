-- ═══════════════════════════════════════════════════════════════════
-- MIGRACE 008 — SVJ dotažení: ankety, soft delete, dokumenty bucket
-- Evoluční — pouze ALTER/ADD, žádné DROP.
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. SVJ_POSTS — definice ankety + soft delete
--    Hlasy zůstávají odděleně v svj_poll_votes (gotcha z CLAUDE.md:
--    votes[] v jsonb nelze chránit přes RLS a vznikají race conditions).
--    options = [{"key": "ano", "label": "Ano"}, ...] pouze pro type='poll'
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE public.svj_posts ADD COLUMN IF NOT EXISTS options jsonb;
ALTER TABLE public.svj_posts ADD COLUMN IF NOT EXISTS poll_deadline timestamptz;
ALTER TABLE public.svj_posts ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS svj_posts_archived_at_idx ON public.svj_posts(archived_at);

-- ───────────────────────────────────────────────────────────────────
-- 2. SVJ_POLL_VOTES — změna hlasu (upsert přes UNIQUE(post_id, owner_id))
-- ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "svj_poll_votes_update_own" ON public.svj_poll_votes;
CREATE POLICY "svj_poll_votes_update_own" ON public.svj_poll_votes
  FOR UPDATE USING (
    owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );

-- ───────────────────────────────────────────────────────────────────
-- 3. GRANT pro service_role (DB-06 — bez GRANT tichý fail)
-- ───────────────────────────────────────────────────────────────────

GRANT ALL ON TABLE public.svj_posts TO service_role;
GRANT ALL ON TABLE public.svj_comments TO service_role;
GRANT ALL ON TABLE public.svj_documents TO service_role;
GRANT ALL ON TABLE public.svj_poll_votes TO service_role;
GRANT ALL ON TABLE public.owner_documents TO service_role;
GRANT ALL ON TABLE public.maintenance_requests TO service_role;
GRANT ALL ON TABLE public.owner_invitations TO service_role;

-- ───────────────────────────────────────────────────────────────────
-- 4. STORAGE — privátní bucket pro dokumenty (SVJ + klientské)
--    Čtení výhradně přes signed URLs generované server actions
--    (admin client + ownership check), žádný veřejný přístup.
-- ───────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('dokumenty', 'dokumenty', false)
ON CONFLICT (id) DO NOTHING;
