import React, { useState } from "react";
import { MiniligaSession } from "@/types/miniliga";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Share2,
  Check,
  Sparkles,
  Cloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface MiniligaSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: MiniligaSession;
  onDistributeCardPoints: () => void;
  isSavingPoints?: boolean;
}

export const MiniligaSummaryModal: React.FC<MiniligaSummaryModalProps> = ({
  open,
  onOpenChange,
  session,
  onDistributeCardPoints,
  isSavingPoints,
}) => {
  const [copied, setCopied] = useState(false);

  const standings = session.participants;
  const champion = standings[0];
  const vice = standings[1];
  const third = standings[2];
  const isFinalized = session.status === "finalizada";
  const isRealMode = !session.isSimulation;

  const generateWhatsAppText = () => {
    let text = `🏆 *RESULTADO DA MINILIGA DE BEACH TENNIS* 🏆\n`;
    text += `*Equipe Marco Roza* • ${session.title}\n`;
    text += `📅 ${new Date(session.date).toLocaleDateString("pt-BR")}\n\n`;

    text += `🥇 *CAMPEÃO:* ${champion?.name} (${champion?.totalScore} pts)\n`;
    if (vice) text += `🥈 *VICE-CAMPEÃO:* ${vice?.name} (${vice?.totalScore} pts)\n`;
    if (third) text += `🥉 *3º LUGAR:* ${third?.name} (${third?.totalScore} pts)\n\n`;

    text += `📊 *CLASSIFICAÇÃO GERAL & XP NO CARD:*\n`;
    standings.forEach((p, idx) => {
      text += `${idx + 1}º. ${p.name} — ${p.totalScore} pts (+${p.cardPointsAwarded} pts no Card)\n`;
    });

    text += `\n🎾 Parabéns a todos pelo ritmo e pela energia em quadra! 🔥`;
    return text;
  };

  const copyToClipboard = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Texto formatado para WhatsApp copiado com sucesso!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-b from-card via-card/95 to-background border-border/80 shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 text-amber-400">
              <Trophy className="w-6 h-6 fill-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {isFinalized ? "Torneio Finalizado" : "Encerramento da Miniliga"}
              </span>
            </div>
            {isFinalized ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-extrabold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Validado no Lovable Cloud
              </Badge>
            ) : isRealMode ? (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40 font-extrabold text-xs flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 animate-pulse" />
                Aguardando Validação Oficial
              </Badge>
            ) : (
              <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/40 font-extrabold text-xs">
                🧪 Modo Sandbox (Local)
              </Badge>
            )}
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
            Pódio da Miniliga & Premiação
          </DialogTitle>
        </DialogHeader>

        {/* Pódio Visual dos 3 Primeiros */}
        <div className="grid grid-cols-3 gap-3 my-4 items-end text-center">
          {/* 2º Lugar */}
          {vice && (
            <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/30 border border-slate-300/20 order-1">
              <span className="text-2xl mb-1">🥈</span>
              <span className="text-xs font-bold text-muted-foreground uppercase">2º Lugar</span>
              <span className="font-extrabold text-sm text-foreground truncate w-full mt-1">
                {vice.name}
              </span>
              <span className="text-xs font-black text-amber-400 mt-0.5">
                {vice.totalScore} pts
              </span>
              <Badge variant="outline" className="mt-2 text-[10px] text-amber-300 border-amber-500/30">
                +{vice.cardPointsAwarded} pts Card
              </Badge>
            </div>
          )}

          {/* 1º Lugar (Campeão - Destaque Central) */}
          {champion && (
            <div className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-card border border-amber-500/40 shadow-lg shadow-amber-500/10 order-2 -translate-y-2">
              <div className="p-2.5 rounded-full bg-amber-500 text-black shadow-md mb-2">
                <Trophy className="w-6 h-6 fill-current" />
              </div>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Campeão 🥇
              </span>
              <span className="font-black text-base text-foreground truncate w-full mt-1">
                {champion.name}
              </span>
              <span className="text-sm font-black text-amber-400 mt-0.5">
                {champion.totalScore} pts
              </span>
              <Badge className="mt-2 text-xs bg-amber-500 text-black font-extrabold shadow-sm">
                +{champion.cardPointsAwarded} pts Card
              </Badge>
            </div>
          )}

          {/* 3º Lugar */}
          {third && (
            <div className="flex flex-col items-center p-3 rounded-2xl bg-muted/30 border border-amber-700/20 order-3">
              <span className="text-2xl mb-1">🥉</span>
              <span className="text-xs font-bold text-muted-foreground uppercase">3º Lugar</span>
              <span className="font-extrabold text-sm text-foreground truncate w-full mt-1">
                {third.name}
              </span>
              <span className="text-xs font-black text-amber-400 mt-0.5">
                {third.totalScore} pts
              </span>
              <Badge variant="outline" className="mt-2 text-[10px] text-amber-300 border-amber-500/30">
                +{third.cardPointsAwarded} pts Card
              </Badge>
            </div>
          )}
        </div>

        {/* Quadro informativo de Validação */}
        {!isFinalized ? (
          <div className="p-3.5 rounded-xl bg-card border border-border/80 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Validação Obrigatória para Encerramento</span>
            </div>
            <p className="text-muted-foreground">
              {isRealMode
                ? "Ao clicar em 'Salvar e Validar', o torneio será registrado permanentemente no Lovable Cloud e os pontos serão creditados nos cartões dos atletas. Se desejar conferir ou alterar algum placar antes, clique em 'Cancelar / Revisar Placares'."
                : "A Miniliga está em Modo Sandbox (Simulação). Ao salvar, os dados serão arquivados apenas localmente para teste, sem alterar os pontos reais dos alunos."}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Operação validada e salva com sucesso. Todos os pontos e confrontos estão gravados na base de dados.
            </span>
          </div>
        )}

        {/* Ações: Cancelar, Salvar e Compartilhar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/80">
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-2 border-border/80 font-bold text-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Copiado!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-primary" /> Copiar p/ WhatsApp
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isFinalized ? (
              <>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  size="sm"
                  disabled={isSavingPoints}
                  className="gap-1.5 border-border/80 text-muted-foreground hover:text-foreground font-bold text-xs"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Cancelar / Revisar Placares
                </Button>

                <Button
                  onClick={onDistributeCardPoints}
                  disabled={isSavingPoints}
                  size="sm"
                  className={`gap-2 font-black text-xs shadow-lg shadow-emerald-500/20 ${
                    isRealMode
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black"
                  }`}
                >
                  {isSavingPoints ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Gravando no Lovable Cloud...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {isRealMode
                        ? "Salvar e Validar no Lovable Cloud"
                        : "Salvar e Validar Simulação"}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => onOpenChange(false)}
                variant="secondary"
                size="sm"
                className="font-bold text-xs"
              >
                Fechar Pódio
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
