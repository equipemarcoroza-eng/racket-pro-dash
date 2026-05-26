
-- Tighten RLS to admin-only on tables currently using USING(true)/WITH CHECK(true)

-- activities
DROP POLICY IF EXISTS "Auth users all on activities" ON public.activities;
CREATE POLICY "Admins read activities" ON public.activities FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update activities" ON public.activities FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete activities" ON public.activities FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- lesson_plans
DROP POLICY IF EXISTS "Auth users all on lesson_plans" ON public.lesson_plans;
CREATE POLICY "Admins read lesson_plans" ON public.lesson_plans FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert lesson_plans" ON public.lesson_plans FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update lesson_plans" ON public.lesson_plans FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete lesson_plans" ON public.lesson_plans FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- lesson_types
DROP POLICY IF EXISTS "Auth users all on lesson_types" ON public.lesson_types;
CREATE POLICY "Admins read lesson_types" ON public.lesson_types FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert lesson_types" ON public.lesson_types FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update lesson_types" ON public.lesson_types FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete lesson_types" ON public.lesson_types FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- tests
DROP POLICY IF EXISTS "Auth users all on tests" ON public.tests;
CREATE POLICY "Admins read tests" ON public.tests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert tests" ON public.tests FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update tests" ON public.tests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete tests" ON public.tests FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- test_results
DROP POLICY IF EXISTS "Auth users all on test_results" ON public.test_results;
CREATE POLICY "Admins read test_results" ON public.test_results FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert test_results" ON public.test_results FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update test_results" ON public.test_results FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete test_results" ON public.test_results FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- revenues
DROP POLICY IF EXISTS "Auth users read revenues" ON public.revenues;
DROP POLICY IF EXISTS "Auth users insert revenues" ON public.revenues;
DROP POLICY IF EXISTS "Auth users update revenues" ON public.revenues;
DROP POLICY IF EXISTS "Auth users delete revenues" ON public.revenues;
CREATE POLICY "Admins read revenues" ON public.revenues FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert revenues" ON public.revenues FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update revenues" ON public.revenues FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete revenues" ON public.revenues FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
