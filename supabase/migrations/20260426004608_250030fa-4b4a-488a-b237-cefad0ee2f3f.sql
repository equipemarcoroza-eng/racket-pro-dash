ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE public.students ADD CONSTRAINT students_status_check
  CHECK (status IN ('Ativo', 'Inativo', 'Em análise', 'Passado', 'Extras'));

ALTER TABLE public.attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_presente_check;
ALTER TABLE public.attendance_logs ADD CONSTRAINT attendance_logs_presente_check
  CHECK (presente IN ('Presente', 'Falta', 'Cancelado', 'Miniliga', 'Reposição'));