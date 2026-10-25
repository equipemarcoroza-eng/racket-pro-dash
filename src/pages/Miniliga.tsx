import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { MiniligaSection } from "@/components/miniliga/MiniligaSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import logo from "@/assets/logo.png";

const Miniliga: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner Miniligas Marco Roza */}
      <Card className="bg-gradient-to-br from-[#0f1236] via-[#1c2394] to-[#de392a] text-white border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-amber-400" />
              <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/40 text-[10px] uppercase font-bold tracking-widest">
                Competição Pedagógica Oficial
              </Badge>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
              Miniligas Marco Roza
              <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs">
                EXPRESS
              </Badge>
            </CardTitle>
            <p className="text-xs text-white/80 mt-1 max-w-2xl">
              Torneios dinâmicos com rodízio inteligente de duplas (8 ou 10 atletas), cronômetro ao vivo,
              classificação instantânea e pontuação gamificada para reposição ou eventos da academia.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-white/70">Equipe Marco Roza</span>
              <span className="text-sm font-bold text-amber-300">Beach Tennis & Tênis</span>
            </div>
            <img src={logo} alt="Logo" className="h-10 w-auto object-contain drop-shadow" />
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo Completo do Sistema de Miniliga com Error Boundary */}
      <ErrorBoundary fallbackTitle="Instabilidade ao carregar a Mesa de Miniligas">
        <MiniligaSection />
      </ErrorBoundary>
    </div>
  );
};

export default Miniliga;
