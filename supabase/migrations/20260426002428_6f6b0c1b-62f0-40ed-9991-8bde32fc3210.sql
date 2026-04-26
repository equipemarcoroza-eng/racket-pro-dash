ALTER TABLE public.students ADD COLUMN IF NOT EXISTS camiseta text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS kit text;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS data_realizacao date;