import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import { ArrowRight, Shield, Zap, Mail, Lock } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha inválidos" : error.message);
      return;
    }
    toast.success("Bem-vindo!");
    navigate("/dashboard", { replace: true });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Enviamos um e-mail com instruções para redefinir sua senha.");
    setForgotOpen(false);
    setResetEmail("");
  };

  return (
    <div className="flex min-h-screen w-screen overflow-hidden bg-[#0b0c16]">
      {/* Painel Esquerdo - Apresentação de Marca (Premium) */}
      <div className="relative hidden w-1/2 flex-col justify-between p-12 text-white md:flex bg-gradient-to-br from-[#0c0f24] via-[#0e1231] to-[#12163b] border-r border-white/5">
        {/* Efeitos de Luz de Fundo */}
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-[#de392a]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-[#1c2394]/15 blur-[150px] pointer-events-none" />

        {/* Logo e Nome da Marca */}
        <div className="flex items-center gap-3 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 p-1.5 backdrop-blur-md border border-white/10 shadow-lg">
            <img src={logo} alt="Logo" className="h-full w-full object-contain rounded-lg" />
          </div>
          <div>
            <span className="font-extrabold text-sm lg:text-base tracking-wider text-white">EQUIPE MARCO ROZA</span>
            <p className="text-[9px] text-[#de392a] tracking-widest uppercase font-bold">Racket Pro Dashboard</p>
          </div>
        </div>

        {/* Conteúdo Central */}
        <div className="my-auto space-y-6 z-10">
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight">
            A nova era do seu<br />
            treinamento de <span className="text-[#de392a]">tênis &amp; beach tennis.</span>
          </h1>
          <p className="text-white/60 text-sm lg:text-base font-normal max-w-md leading-relaxed">
            Acompanhe sua frequência, planos, relatórios e evolua no esporte com uma plataforma intuitiva de alta performance administrativa.
          </p>

          <div className="h-px bg-white/10 my-8 w-full max-w-sm" />

          {/* Indicadores de Qualidade */}
          <div className="grid grid-cols-2 gap-6 max-w-sm">
            <div>
              <div className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-[#de392a]" />
                <span className="text-xl lg:text-2xl font-black">100%</span>
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">
                SEGURO &amp; CRIPTOGRAFADO
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-white">
                <Zap className="h-5 w-5 text-[#de392a]" />
                <span className="text-xl lg:text-2xl font-black">24/7</span>
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">
                MONITORAMENTO ATIVO
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé do Painel Esquerdo */}
        <div className="flex items-center gap-2 text-xs text-white/30 z-10">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SISTEMAS EQUIPE MARCO ROZA • V2.0</span>
        </div>
      </div>

      {/* Painel Direito - Formulário de Login */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12 bg-[#080911] relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#1c2394]/5 blur-[100px] pointer-events-none" />

        <div className="mx-auto w-full max-w-md space-y-8 z-10">
          {/* Logo exibido apenas em dispositivos móveis */}
          <div className="flex md:hidden flex-col items-center mb-6">
            <img src={logo} alt="Equipe Marco Roza" className="h-20 w-20 rounded-full mb-3 shadow-lg shadow-[#1c2394]/20 border border-white/10" />
            <h1 className="text-2xl font-black text-white text-center">EQUIPE MARCO ROZA</h1>
            <p className="text-[10px] text-[#de392a] uppercase tracking-widest font-bold text-center mt-1">Performance no Tênis</p>
          </div>

          <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Acesse seu Painel
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Bem-vindo de volta! Insira seus dados para continuar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-xs uppercase tracking-widest font-black text-gray-400">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <Input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-white/[0.02] border-white/10 text-white placeholder-gray-600 focus:border-[#de392a] focus:ring-[#de392a] pl-12 h-12 rounded-lg transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs uppercase tracking-widest font-black text-gray-400">
                  Senha
                </Label>
                <button
                  type="button"
                  onClick={() => { setResetEmail(email); setForgotOpen(true); }}
                  className="text-xs font-bold text-[#de392a] hover:underline uppercase tracking-widest"
                >
                  Esqueceu?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <Input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="bg-white/[0.02] border-white/10 text-white placeholder-gray-600 focus:border-[#de392a] focus:ring-[#de392a] pl-12 h-12 rounded-lg transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-gradient-to-r from-[#1c2394] to-[#2d36ab] hover:from-[#151970] hover:to-[#222991] text-white font-bold rounded-lg shadow-lg shadow-[#1c2394]/30 flex items-center justify-center gap-2 group transition-all"
            >
              {submitting ? "Entrando..." : (
                <>
                  ENTRAR NA PLATAFORMA
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Modal Esqueci a Senha */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="bg-[#0b0c16] text-white border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Redefinir senha</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Informe o e-mail cadastrado. Enviaremos um link de redefinição.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-xs uppercase tracking-widest font-black text-gray-400">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="bg-white/[0.02] border-white/10 text-white placeholder-gray-600 focus:border-[#de392a]"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={resetSubmitting}
                className="w-full bg-[#de392a] hover:bg-[#c12e20] text-white font-bold"
              >
                {resetSubmitting ? "Enviando..." : "Enviar link de redefinição"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
