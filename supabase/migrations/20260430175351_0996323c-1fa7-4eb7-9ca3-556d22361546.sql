-- 1. Atividades Técnicas
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    quantidade_lancamentos INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Provas (Cabeçalho)
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    slot_id UUID NOT NULL REFERENCES public.schedule_slots(id) ON DELETE CASCADE,
    atividades_ids UUID[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Resultados das Provas
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    atividade_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    acertos INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para usuários autenticados
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Auth users all on activities' AND polrelid = 'public.activities'::regclass) THEN
        CREATE POLICY "Auth users all on activities" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Auth users all on tests' AND polrelid = 'public.tests'::regclass) THEN
        CREATE POLICY "Auth users all on tests" ON public.tests FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Auth users all on test_results' AND polrelid = 'public.test_results'::regclass) THEN
        CREATE POLICY "Auth users all on test_results" ON public.test_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;