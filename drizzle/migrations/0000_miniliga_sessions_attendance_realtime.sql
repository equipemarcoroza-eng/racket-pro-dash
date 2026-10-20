CREATE TABLE IF NOT EXISTS public.miniliga_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  participant_count INTEGER NOT NULL,
  model_type TEXT NOT NULL,
  courts_count INTEGER NOT NULL DEFAULT 1,
  duration_seconds INTEGER NOT NULL DEFAULT 300,
  current_round INTEGER NOT NULL DEFAULT 1,
  total_rounds INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'configuracao',
  is_simulation BOOLEAN NOT NULL DEFAULT false,
  has_bonus_final BOOLEAN NOT NULL DEFAULT false,
  has_tiebreak_simples BOOLEAN NOT NULL DEFAULT false,
  has_semifinais BOOLEAN NOT NULL DEFAULT false,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  matches JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.miniliga_sessions TO authenticated;
GRANT ALL ON public.miniliga_sessions TO service_role;
ALTER TABLE public.miniliga_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users all on miniliga_sessions" ON public.miniliga_sessions;
CREATE POLICY "Auth users all on miniliga_sessions"
  ON public.miniliga_sessions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anon read on miniliga_sessions" ON public.miniliga_sessions;
CREATE INDEX IF NOT EXISTS idx_miniliga_sessions_status ON public.miniliga_sessions(status);
CREATE INDEX IF NOT EXISTS idx_miniliga_sessions_date ON public.miniliga_sessions(date);
CREATE INDEX IF NOT EXISTS idx_miniliga_sessions_is_sim ON public.miniliga_sessions(is_simulation);
ALTER TABLE public.attendance_logs ALTER COLUMN turma_id DROP NOT NULL;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS miniliga_session_id TEXT;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS miniliga_pontos INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_miniliga_aluno
  ON public.attendance_logs (miniliga_session_id, aluno_id)
  WHERE miniliga_session_id IS NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'miniliga_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.miniliga_sessions;
  END IF;
END $$;