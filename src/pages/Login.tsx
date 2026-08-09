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
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-[#06070c] via-[#090b17] to-[#12152b] relative">
      {/* Efeitos de Luz de Fundo na Página */}
      <div className="absolute top-1/6 left-1/6 h-[400px] w-[400px] rounded-full bg-[#de392a]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/6 right-1/6 h-[500px] w-[500px] rounded-full bg-[#1c2394]/10 blur-[150px] pointer-events-none" />

      {/* Card Container Principal (Compacto e Elegante) */}
      <div className="relative w-full max-w-4xl min-h-[550px] flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-[#0e101f] z-10">
        
        {/* Painel Esquerdo - Apresentação (Premium Brand Gradient) */}
        <div className="relative hidden md:flex md:w-[45%] flex-col justify-between p-8 text-white bg-gradient-to-br from-[#0f1236] via-[#1c2394] to-[#de392a] overflow-hidden">
          {/* Overlay de Vidro / Textura */}
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          {/* Cabeçalho de Marca */}
          <div className="flex items-center gap-3 z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 p-1.5 backdrop-blur-md border border-white/10 shadow-lg">
              <img src={logo} alt="Logo" className="h-full w-full object-contain rounded-lg" />
            </div>
            <div>
              <span className="font-black text-xs tracking-wider text-white">EQUIPE MARCO ROZA</span>
              <p className="text-[8px] text-white/70 tracking-widest uppercase font-bold">Racket Pro</p>
            </div>
          </div>

          {/* Texto Central */}
          <div className="my-auto space-y-4 z-10 pt-8">
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
              A nova era do seu<br />
              treinamento de <span className="text-white bg-white/15 px-2 py-0.5 rounded-lg border border-white/20">tênis &amp; BT.</span>
            </h1>
            <p className="text-white/70 text-xs lg:text-sm leading-relaxed max-w-xs">
              Acompanhe sua frequência, planos, relatórios e evolua no esporte com uma plataforma intuitiva e de alta performance.
            </p>

            <div className="h-px bg-white/15 my-6 w-full" />

            {/* Indicadores de Qualidade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-white">
                  <Shield className="h-4 w-4 text-white" />
                  <span className="text-lg font-black">100%</span>
                </div>
                <p className="text-[9px] text-white/60 uppercase tracking-wider font-bold">
                  CRIPTOGRAFADO
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-white">
                  <Zap className="h-4 w-4 text-white" />
                  <span className="text-lg font-black">24/7</span>
                </div>
                <p className="text-[9px] text-white/60 uppercase tracking-wider font-bold">
                  ATIVO
                </p>
              </div>
            </div>
          </div>

          {/* Rodapé Esquerdo */}
          <div className="flex items-center gap-2 text-[10px] text-white/40 z-10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>EQUIPE MARCO ROZA • V2.0</span>
          </div>
        </div>

        {/* Painel Direito - Formulário de Digitação (Luminoso e Premium) */}
        <div className="w-full md:w-[55%] flex flex-col justify-center p-8 lg:p-12 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-slate-800 relative">
          
          {/* Logo em Mobile */}
          <div className="flex md:hidden flex-col items-center mb-6">
            <img src={logo} alt="Equipe Marco Roza" className="h-16 w-16 rounded-full mb-2 shadow-lg border border-slate-200" />
            <h1 className="text-xl font-black text-slate-900">EQUIPE MARCO ROZA</h1>
            <p className="text-[9px] text-[#de392a] uppercase tracking-widest font-bold">Performance no Tênis</p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
                Acesse seu Painel
              </h2>
              <p className="mt-2 text-xs lg:text-sm text-slate-500 font-medium">
                Bem-vindo de volta! Insira seus dados abaixo.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-[10px] uppercase tracking-wider font-black text-slate-500">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1c2394] focus:ring-[#1c2394] pl-11 h-11 rounded-xl shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-[10px] uppercase tracking-wider font-black text-slate-500">
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); setForgotOpen(true); }}
                    className="text-[10px] font-bold text-[#de392a] hover:text-[#c12e20] hover:underline uppercase tracking-wider"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1c2394] focus:ring-[#1c2394] pl-11 h-11 rounded-xl shadow-sm transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-gradient-to-r from-[#1c2394] to-[#242bb5] hover:from-[#151970] hover:to-[#1c2294] text-white font-bold rounded-xl shadow-md shadow-[#1c2394]/15 flex items-center justify-center gap-2 group transition-all mt-6"
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
      </div>

      {/* Modal Esqueci a Senha */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="bg-white text-slate-850 border-slate-200 max-w-sm rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Redefinir senha</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Informe o e-mail cadastrado. Enviaremos um link de redefinição.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-[10px] uppercase tracking-wider font-black text-slate-500">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 focus:border-[#1c2394] rounded-xl h-11"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={resetSubmitting}
                className="w-full bg-[#de392a] hover:bg-[#c12e20] text-white font-bold rounded-xl h-11"
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
