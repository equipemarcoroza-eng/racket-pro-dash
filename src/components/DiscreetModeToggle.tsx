import React from "react";
import { Eye, EyeOff, Shield, ShieldCheck } from "lucide-react";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DiscreetModeToggleProps {
  variant?: "header" | "sidebar" | "floating";
  isCollapsed?: boolean;
  className?: string;
}

export const DiscreetModeToggle: React.FC<DiscreetModeToggleProps> = ({
  variant = "header",
  isCollapsed = false,
  className = "",
}) => {
  const { isDiscreetMode, toggleDiscreetMode } = usePrivacy();

  // 1. Variante para o Header Superior (Barra do App)
  if (variant === "header") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={toggleDiscreetMode}
            variant={isDiscreetMode ? "default" : "outline"}
            size="sm"
            className={cn(
              "relative h-9 px-3 gap-2 font-medium transition-all duration-300 rounded-full border cursor-pointer select-none",
              isDiscreetMode
                ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-500 shadow-md shadow-amber-500/20 animate-in fade-in"
                : "bg-background/80 hover:bg-muted text-foreground/80 border-border/80 hover:text-foreground",
              className
            )}
            aria-label={isDiscreetMode ? "Desativar Modo Discreto" : "Ativar Modo Discreto"}
          >
            {isDiscreetMode ? (
              <>
                <EyeOff className="w-4 h-4 text-white shrink-0 animate-pulse" />
                <span className="hidden sm:inline text-xs font-semibold">
                  Modo Discreto
                </span>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                </span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="hidden sm:inline text-xs font-medium">
                  Modo Discreto
                </span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs text-xs">
          <p className="font-semibold flex items-center gap-1.5">
            {isDiscreetMode ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Modo Discreto ATIVO
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                Modo Discreto INATIVO
              </>
            )}
          </p>
          <p className="text-muted-foreground text-[11px] mt-1">
            {isDiscreetMode
              ? "Valores e métricas confidenciais estão ocultos para uso seguro na Arena. Passe o cursor nos números para espiar."
              : "Proteja faturamento, saldos e valores confidenciais de olhares curiosos na Arena."}
          </p>
          <p className="text-[10px] text-primary/80 mt-1 font-mono">
            Atalho rápido: <kbd className="px-1 py-0.5 bg-muted rounded border border-border">Alt + D</kbd>
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // 2. Variante para a Barra Lateral (Sidebar)
  if (variant === "sidebar") {
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleDiscreetMode}
              className={cn(
                "w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer relative",
                isDiscreetMode
                  ? "bg-amber-600 text-white shadow-sm"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground/70 hover:text-sidebar-foreground",
                className
              )}
              aria-label="Alternar Modo Discreto"
            >
              {isDiscreetMode ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {isDiscreetMode && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 border border-sidebar" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            <p className="font-semibold">
              {isDiscreetMode ? "Modo Discreto Ativo (Alt+D)" : "Ativar Modo Discreto (Alt+D)"}
            </p>
            <p className="text-muted-foreground text-[11px]">
              Oculta dados financeiros na Arena
            </p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <button
        type="button"
        onClick={toggleDiscreetMode}
        className={cn(
          "w-full text-left p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none",
          isDiscreetMode
            ? "bg-amber-600/15 border-amber-500/40 text-sidebar-foreground hover:bg-amber-600/25"
            : "bg-sidebar-accent/30 border-sidebar-border hover:bg-sidebar-accent/60 text-sidebar-foreground/80 hover:text-sidebar-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
              isDiscreetMode
                ? "bg-amber-600 text-white"
                : "bg-sidebar-accent text-sidebar-foreground/70"
            )}
          >
            {isDiscreetMode ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight truncate flex items-center gap-1.5">
              Modo Discreto
              {isDiscreetMode && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </p>
            <p className="text-[10px] text-sidebar-foreground/60 leading-tight truncate">
              {isDiscreetMode ? "Protegido na Arena" : "Ocultar na Arena (Alt+D)"}
            </p>
          </div>
        </div>

        {/* Chave liga/desliga visual */}
        <div
          className={cn(
            "w-8 h-4 rounded-full transition-colors relative shrink-0 p-0.5",
            isDiscreetMode ? "bg-amber-600" : "bg-sidebar-border"
          )}
        >
          <div
            className={cn(
              "w-3 h-3 rounded-full bg-white transition-transform duration-200",
              isDiscreetMode ? "translate-x-4" : "translate-x-0"
            )}
          />
        </div>
      </button>
    );
  }

  // 3. Variante Flutuante (Floating Action Pill para tablet / mobile)
  return (
    <div className={cn("fixed bottom-5 right-5 z-50 sm:hidden", className)}>
      <Button
        type="button"
        onClick={toggleDiscreetMode}
        size="sm"
        className={cn(
          "rounded-full shadow-lg border px-3.5 py-2 h-auto flex items-center gap-2 text-xs font-semibold backdrop-blur-md cursor-pointer",
          isDiscreetMode
            ? "bg-amber-600 text-white border-amber-500 shadow-amber-600/30"
            : "bg-card/90 text-foreground border-border hover:bg-card shadow-black/10"
        )}
      >
        {isDiscreetMode ? (
          <>
            <EyeOff className="w-4 h-4 shrink-0 text-white" />
            <span>Discreto: Ativo</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span>Modo Discreto</span>
          </>
        )}
      </Button>
    </div>
  );
};
