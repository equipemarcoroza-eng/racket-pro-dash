-- Ajustes da persistência das Miniligas no Lovable Cloud
-- Pode ser executada mais de uma vez sem efeito colateral

-- 1. Presenças de Miniliga: não pertencem a uma turma e passam a guardar a sessão e os pontos
ALTER TABLE public.attendance_logs ALTER COLUMN turma_id DROP NOT NULL;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS miniliga_session_id TEXT;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS miniliga_pontos INTEGER;

-- Um atleta recebe no máximo um crédito por Miniliga, mesmo que ela seja validada de novo
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_miniliga_aluno
  ON public.attendance_logs (miniliga_session_id, aluno_id)
  WHERE miniliga_session_id IS NOT NULL;

-- 2. Sem leitura anônima: as Miniligas trazem nomes de alunos
DROP POLICY IF EXISTS "Anon read on miniliga_sessions" ON public.miniliga_sessions;

-- 3. Tempo real: outros aparelhos recebem as mudanças da mesa de controle
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
