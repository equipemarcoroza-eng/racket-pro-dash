-- Criação de tabela opcional para Gestão de Leads de Convidados da Miniliga
-- Executável no Lovable Cloud / Supabase
CREATE TABLE IF NOT EXISTS public.miniliga_guests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    miniliga_session_id TEXT REFERENCES public.miniliga_sessions(id) ON DELETE CASCADE,
    miniliga_title TEXT NOT NULL,
    date DATE NOT NULL,
    rank INTEGER,
    wins INTEGER DEFAULT 0,
    lead_status TEXT NOT NULL DEFAULT 'novo', -- 'novo', 'contatado', 'convertido'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.miniliga_guests ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Auth users all on miniliga_guests' 
        AND polrelid = 'public.miniliga_guests'::regclass
    ) THEN
        CREATE POLICY "Auth users all on miniliga_guests" 
        ON public.miniliga_guests 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_miniliga_guests_session ON public.miniliga_guests(miniliga_session_id);
CREATE INDEX IF NOT EXISTS idx_miniliga_guests_status ON public.miniliga_guests(lead_status);
