import React from "react";
import { MiniligaMatch, MiniligaParticipant } from "@/types/miniliga";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Swords, Trophy, Zap } from "lucide-react";

interface CourtMatchCardProps {
  match: MiniligaMatch;
  participantsMap: Map<string, MiniligaParticipant>;
  onScoreChange: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
}

export const CourtMatchCard: React.FC<CourtMatchCardProps> = ({
  match,
  participantsMap,
  onScoreChange,
}) => {
  const p1A = participantsMap.get(match.teamA.player1Id);
  const p2A = match.teamA.player2Id ? participantsMap.get(match.teamA.player2Id) : null;

  const p1B = participantsMap.get(match.teamB.player1Id);
  const p2B = match.teamB.player2Id ? participantsMap.get(match.teamB.player2Id) : null;

  const handleScoreAChange = (val: string) => {
    const num = val === "" ? null : Math.max(0, parseInt(val, 10) || 0);
    onScoreChange(match.id, num, match.scoreB);
  };

  const handleScoreBChange = (val: string) => {
    const num = val === "" ? null : Math.max(0, parseInt(val, 10) || 0);
    onScoreChange(match.id, match.scoreA, num);
  };

  const aWinning = (match.scoreA ?? 0) > (match.scoreB ?? 0);
  const bWinning = (match.scoreB ?? 0) > (match.scoreA ?? 0);

  return (
    <div
      className={`relative rounded-2xl p-5 border transition-all duration-300 backdrop-blur-md shadow-lg ${
        match.isBonusFinal
          ? "bg-gradient-to-br from-amber-500/15 via-card/90 to-card border-amber-500/40 shadow-amber-500/10"
          : match.isTiebreakSimples
          ? "bg-gradient-to-br from-rose-500/15 via-card/90 to-card border-rose-500/40 shadow-rose-500/10"
          : match.isCompleted
          ? "bg-card/90 border-emerald-500/30"
          : "bg-card/70 border-border hover:border-primary/40"
      }`}
    >
      {/* Header do Card com Quadra e Status */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 font-black px-2.5 py-0.5 text-xs uppercase tracking-wider"
          >
            Quadra {match.courtNumber}
          </Badge>
          {match.isBonusFinal && (
            <Badge className="bg-amber-500 text-black font-extrabold text-xs gap-1">
              <Trophy className="w-3 h-3 fill-current" /> Grande Final (1º+3º vs 2º+4º)
            </Badge>
          )}
          {match.isTiebreakSimples && (
            <Badge className="bg-rose-500 text-white font-extrabold text-xs gap-1">
              <Zap className="w-3 h-3 fill-current" /> Desempate Simples (1º vs 2º)
            </Badge>
          )}
          {match.supportPairPlayerIds && match.supportPairPlayerIds.length > 0 && (
            <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold text-xs gap-1">
              🎲 Dupla Sorteada ({match.supportPairPlayerIds.map(id => participantsMap.get(id)?.name?.split(" ")[0]).filter(Boolean).join(" & ")})
            </Badge>
          )}
        </div>

        {match.isCompleted && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Placar Registrado
          </span>
        )}
      </div>

      {/* Confronto / Times e Placar */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">
        {/* TIME A */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
            match.isCompleted && aWinning
              ? "bg-emerald-500/10 border-emerald-500/30 font-bold"
              : "bg-muted/30 border-border/40"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">
              {p1A?.name ?? "Jogador 1"}
            </span>
            {p2A && (
              <span className="text-sm font-bold text-foreground">
                {p2A.name}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {p2A ? "Dupla A" : "Simples"}
            </span>
          </div>

          <Input
            type="number"
            min={0}
            max={99}
            value={match.scoreA ?? ""}
            onChange={(e) => handleScoreAChange(e.target.value)}
            placeholder="0"
            className="w-16 h-12 text-center text-xl font-mono font-black bg-background border-border shadow-inner"
          />
        </div>

        {/* Ícone VS no meio */}
        <div className="flex justify-center text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center border border-border/60">
            <Swords className="w-4 h-4 text-primary" />
          </div>
        </div>

        {/* TIME B */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
            match.isCompleted && bWinning
              ? "bg-emerald-500/10 border-emerald-500/30 font-bold"
              : "bg-muted/30 border-border/40"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">
              {p1B?.name ?? "Jogador 2"}
            </span>
            {p2B && (
              <span className="text-sm font-bold text-foreground">
                {p2B.name}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {p2B ? "Dupla B" : "Simples"}
            </span>
          </div>

          <Input
            type="number"
            min={0}
            max={99}
            value={match.scoreB ?? ""}
            onChange={(e) => handleScoreBChange(e.target.value)}
            placeholder="0"
            className="w-16 h-12 text-center text-xl font-mono font-black bg-background border-border shadow-inner"
          />
        </div>
      </div>
    </div>
  );
};
