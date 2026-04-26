-- =============================================================
-- Corrige CHECK constraints que bloqueiam novos valores de status
-- nas tabelas students e attendance_logs.
-- =============================================================

-- 1. STUDENTS: Permitir status 'Passado' e 'Extras'
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE public.students ADD CONSTRAINT students_status_check
  CHECK (status IN ('Ativo', 'Inativo', 'Em análise', 'Passado', 'Extras'));

-- 2. ATTENDANCE_LOGS: Permitir presenca 'Miniliga' e 'Reposição'
ALTER TABLE public.attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_presente_check;
ALTER TABLE public.attendance_logs ADD CONSTRAINT attendance_logs_presente_check
  CHECK (presente IN ('Presente', 'Falta', 'Cancelado', 'Miniliga', 'Reposição'));
