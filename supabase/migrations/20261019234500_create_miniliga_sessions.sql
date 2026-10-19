-- Criação da tabela para persistência de Miniligas no Lovable Cloud / Supabase
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

-- Ativar RLS (Row Level Security)
ALTER TABLE public.miniliga_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para acesso completo aos usuários autenticados
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Auth users all on miniliga_sessions' 
        AND polrelid = 'public.miniliga_sessions'::regclass
    ) THEN
        CREATE POLICY "Auth users all on miniliga_sessions" 
        ON public.miniliga_sessions 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- Permitir também acesso anônimo se o modo demo for utilizado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Anon read on miniliga_sessions' 
        AND polrelid = 'public.miniliga_sessions'::regclass
    ) THEN
        CREATE POLICY "Anon read on miniliga_sessions" 
        ON public.miniliga_sessions 
        FOR SELECT 
        TO anon 
        USING (true);
    END IF;
END $$;

-- Índice para busca rápida de sessões ativas e histórico por data
CREATE INDEX IF NOT EXISTS idx_miniliga_sessions_status ON public.miniliga_sessions(status);
CREATE INDEX IF NOT EXISTS idx_miniliga_sessions_date ON public.miniliga_sessions(date);
CREATE INDEX IF NOT EXISTS idx_miniliga_sessions_is_sim ON public.miniliga_sessions(is_simulation);
