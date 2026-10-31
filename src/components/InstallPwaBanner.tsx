import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import logo from "@/assets/logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Verificar se já está rodando em modo aplicativo nativo/standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Verificar se o usuário já dispensou o aviso recentemente (nas últimas 24h)
    const dismissedUntil = localStorage.getItem("pwa_install_dismissed_until");
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // 3. Detectar iOS Safari
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);

    if (isIosDevice && isSafari) {
      setIsIos(true);
      setShowBanner(true);
      return;
    }

    // 4. Capturar evento de instalação do Chrome/Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // Esconde por 24 horas
    localStorage.setItem("pwa_install_dismissed_until", String(Date.now() + 24 * 60 * 60 * 1000));
    setShowBanner(false);
    setShowIosGuide(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-[#0f1236]/95 p-4 text-white shadow-2xl backdrop-blur-xl">
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#1c2394]/40 blur-2xl" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo Equipe Marco Roza"
              className="h-12 w-12 rounded-xl object-contain bg-white/10 p-1 border border-white/20 shadow-md"
            />
            <div>
              <h4 className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                App Equipe Marco Roza
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PWA
                </span>
              </h4>
              <p className="text-xs text-white/70 line-clamp-1">
                Instale no seu celular para acesso rápido e direto.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="rounded-full p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showIosGuide ? (
          <div className="mt-3 rounded-xl bg-white/10 p-3 text-xs text-white/90 border border-white/15 space-y-2">
            <p className="font-medium text-white flex items-center gap-1.5">
              <Share className="h-4 w-4 text-sky-400" /> Como instalar no iPhone:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-white/80">
              <li>Toque no botão <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima na barra do Safari).</li>
              <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
              <li>Confirme clicando em <strong>Adicionar</strong> no canto superior direito.</li>
            </ol>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] transition-all"
            >
              <Download className="h-4 w-4" />
              {isIos ? "Como Adicionar ao Celular" : "Instalar Aplicativo"}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl px-3 py-2.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Agora não
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
