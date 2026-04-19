-- =============== ROLES & PROFILES ===============
CREATE TYPE public.app_role AS ENUM ('admin', 'professor', 'aluno');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Auto-create profile + admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profile policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Role policies (read only; writes via trigger / future admin tools)
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============== BUSINESS TABLES ===============
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  turno TEXT NOT NULL,
  frequencia TEXT NOT NULL,
  periodicidade TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp_aluno TEXT,
  responsavel TEXT,
  whatsapp_responsavel TEXT,
  data_nascimento DATE,
  sexo TEXT CHECK (sexo IN ('M','F')),
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT NOT NULL CHECK (categoria IN ('Infantil','Juvenil','Adulto')),
  plano_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  vencimento TEXT NOT NULL CHECK (vencimento IN ('05','10','15','20','25','30')),
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo','Inativo','Em análise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quadra TEXT NOT NULL,
  dia TEXT NOT NULL,
  horario TEXT NOT NULL,
  turma_codigo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.schedule_slots(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, turma_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.schedule_slots(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  presente TEXT NOT NULL CHECK (presente IN ('Presente','Falta','Cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, turma_id, data)
);
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  aluno_nome TEXT NOT NULL,
  plano_nome TEXT NOT NULL,
  vencimento DATE NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Gerada' CHECK (status IN ('Pago','Em atraso','Gerada','Isento')),
  pago_em DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_revenues_updated BEFORE UPDATE ON public.revenues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL UNIQUE,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.scheduled_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em Aberto' CHECK (status IN ('Em Aberto','Pago')),
  pago_em DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_scheduled_payments_updated BEFORE UPDATE ON public.scheduled_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== ADMIN-ONLY POLICIES FOR BUSINESS TABLES ===============
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['plans','students','schedule_slots','enrollments','attendance_logs','revenues','expense_categories','scheduled_payments']) LOOP
    EXECUTE format('CREATE POLICY "Admins read %I" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))', t, t);
    EXECUTE format('CREATE POLICY "Admins insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))', t, t);
    EXECUTE format('CREATE POLICY "Admins update %I" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin''))', t, t);
    EXECUTE format('CREATE POLICY "Admins delete %I" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))', t, t);
  END LOOP;
END $$;

-- Indexes
CREATE INDEX idx_enrollments_aluno ON public.enrollments(aluno_id);
CREATE INDEX idx_enrollments_turma ON public.enrollments(turma_id);
CREATE INDEX idx_attendance_data ON public.attendance_logs(data);
CREATE INDEX idx_revenues_venc ON public.revenues(vencimento);
CREATE INDEX idx_payments_venc ON public.scheduled_payments(vencimento);