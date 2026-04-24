-- Corrigir políticas RLS da tabela revenues para permitir operações
-- por qualquer usuário autenticado (não apenas admin).
-- Isso resolve o problema de registros avulsos não sendo persistidos.

-- Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Admins insert revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admins read revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admins update revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admins delete revenues" ON public.revenues;

-- Criar políticas que permitem qualquer usuário autenticado operar
CREATE POLICY "Auth users read revenues" ON public.revenues 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth users insert revenues" ON public.revenues 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth users update revenues" ON public.revenues 
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth users delete revenues" ON public.revenues 
  FOR DELETE TO authenticated USING (true);
