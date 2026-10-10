import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

interface PrivacyContextType {
  isDiscreetMode: boolean;
  toggleDiscreetMode: () => void;
  setDiscreetMode: (val: boolean) => void;
}

const STORAGE_KEY = "racket_privacy_mode";

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDiscreetMode, setIsDiscreetModeState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(STORAGE_KEY) === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  // Atualiza classe no body e atributo no documentElement
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isDiscreetMode) {
        document.body.classList.add("privacy-mode");
        document.documentElement.setAttribute("data-discreet-mode", "true");
      } else {
        document.body.classList.remove("privacy-mode");
        document.documentElement.removeAttribute("data-discreet-mode");
      }
    }
  }, [isDiscreetMode]);

  const setDiscreetMode = useCallback((val: boolean) => {
    setIsDiscreetModeState(val);
    try {
      localStorage.setItem(STORAGE_KEY, String(val));
    } catch {
      // Ignora erro de localStorage
    }
    if (val) {
      toast.info("Modo Discreto ativado: Valores financeiros e métricas sensíveis foram protegidos para exibição na Arena.", {
        description: "Passe o cursor sobre os valores para espiar temporariamente. Atalho: Alt + D",
        duration: 3500,
      });
    } else {
      toast.success("Modo Discreto desativado: Valores e métricas visíveis.", {
        duration: 2500,
      });
    }
  }, []);

  const toggleDiscreetMode = useCallback(() => {
    setDiscreetMode(!isDiscreetMode);
  }, [isDiscreetMode, setDiscreetMode]);

  // Atalho de teclado global: Alt + D ou Alt + P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Verifica se o usuário pressionou Alt + D ou Alt + P (sem estar digitando em input/textarea)
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.getAttribute("contenteditable") === "true");

      if (isInput) return;

      if ((e.altKey && (e.key === "d" || e.key === "D" || e.key === "p" || e.key === "P")) ||
          (e.ctrlKey && e.shiftKey && (e.key === "d" || e.key === "D"))) {
        e.preventDefault();
        toggleDiscreetMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleDiscreetMode]);

  return (
    <PrivacyContext.Provider
      value={{
        isDiscreetMode,
        toggleDiscreetMode,
        setDiscreetMode,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = (): PrivacyContextType => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error("usePrivacy deve ser usado dentro de um PrivacyProvider");
  }
  return context;
};

/**
 * Componente utilitário para envolver valores sensíveis (moedas, métricas, faturamento).
 * Quando o Modo Discreto estiver ativo, aplica blur suave que pode ser temporariamente
 * revelado ao passar o cursor ou clicar.
 */
interface SensitiveValueProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "div" | "p";
  title?: string;
  maskOnly?: boolean;
}

export const SensitiveValue: React.FC<SensitiveValueProps> = ({
  children,
  className = "",
  as: Component = "span",
  title = "Dado sensível protegido pelo Modo Discreto. Passe o cursor para espiar.",
  maskOnly = false,
}) => {
  const { isDiscreetMode } = usePrivacy();

  if (maskOnly && isDiscreetMode) {
    return (
      <Component
        className={`sensitive-data select-none ${className}`}
        title={title}
        data-sensitive="true"
      >
        ••••••
      </Component>
    );
  }

  return (
    <Component
      className={`sensitive-data ${className}`}
      title={isDiscreetMode ? title : undefined}
      data-sensitive="true"
    >
      {children}
    </Component>
  );
};
