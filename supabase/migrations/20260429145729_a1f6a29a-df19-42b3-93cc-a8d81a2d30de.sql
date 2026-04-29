CREATE TABLE IF NOT EXISTS public.lesson_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lesson_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data DATE NOT NULL,
    turma_id UUID NOT NULL REFERENCES public.schedule_slots(id) ON DELETE CASCADE,
    quadra TEXT,
    lesson_type_id UUID NOT NULL REFERENCES public.lesson_types(id) ON DELETE CASCADE,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lesson_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users all on lesson_types"
ON public.lesson_types FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Auth users all on lesson_plans"
ON public.lesson_plans FOR ALL TO authenticated
USING (true) WITH CHECK (true);