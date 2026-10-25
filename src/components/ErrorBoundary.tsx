import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary capturou um erro não tratado:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="border-2 border-rose-500/40 bg-card/90 backdrop-blur-md shadow-2xl my-6">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">
                {this.props.fallbackTitle || "Ocorreu uma instabilidade ao carregar os dados desta tela"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {this.state.error?.message || "Erro de renderização temporário. Clique abaixo para reiniciar a visualização de forma segura."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={this.handleReset}
                size="sm"
                className="gap-2 bg-primary text-primary-foreground font-bold text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recarregar Visualização
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    localStorage.removeItem("racket_miniliga_active_session");
                  } catch (e) {}
                  window.location.reload();
                }}
                className="gap-2 border-border text-xs font-bold"
              >
                <Home className="w-3.5 h-3.5" />
                Reiniciar Mesa
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
