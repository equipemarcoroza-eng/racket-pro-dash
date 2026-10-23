DROP POLICY IF EXISTS "Auth users all on miniliga_sessions" ON public.miniliga_sessions;
CREATE POLICY "Admins manage miniliga_sessions" ON public.miniliga_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));