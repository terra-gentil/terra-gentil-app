-- Migracao 004: moderacao admin — status em reports, bloqueio de usuarios.
-- Rodar no Supabase SQL Editor. Idempotente.

-- Status dos reports: pendente | resolvido | descartado
ALTER TABLE forum_reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';

ALTER TABLE forum_reports
  DROP CONSTRAINT IF EXISTS forum_reports_status_chk;
ALTER TABLE forum_reports
  ADD CONSTRAINT forum_reports_status_chk
  CHECK (status IN ('pendente', 'resolvido', 'descartado'));

-- Indice para buscar so os pendentes rapidamente
CREATE INDEX IF NOT EXISTS idx_forum_reports_status ON forum_reports(status);

-- Bloqueio de usuarios
ALTER TABLE forum_users
  ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_forum_users_bloqueado ON forum_users(bloqueado) WHERE bloqueado = TRUE;
