-- Migração 002: ancoragem de tópicos a shows da Timeline.
-- Andre já rodou no Supabase em 2026-05-27 (vindo do setlists-pj-ev).
-- Mantida aqui pra repo ficar com source-of-truth do schema.

ALTER TABLE forum_topics
  ADD COLUMN IF NOT EXISTS anchor_show_id text;

CREATE INDEX IF NOT EXISTS idx_forum_topics_anchor_show
  ON forum_topics (anchor_show_id)
  WHERE anchor_show_id IS NOT NULL;
