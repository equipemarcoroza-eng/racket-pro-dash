import React from "react";
import { MiniligaMatch, MiniligaParticipant, MiniligaModelType } from "@/types/miniliga";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Swords, Trophy, Zap } from "lucide-react";
import { getPlayerGroupCode } from "@/lib/miniliga-engine";

interface CourtMatchCardProps {
  match: MiniligaMatch;
  participantsMap: Map<string, MiniligaParticipant>;
  participants?: MiniligaParticipant[];
  modelType?: MiniligaModelType;
  onScoreChange: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
}

export const CourtMatchCard: React.FC<CourtMatchCardProps> = ({
  match,
  participantsMap,
  participants = [],
  modelType,
  onScoreChange,
}) => {
  const p1A = match.teamA?.player1Id ? participantsMap.get(match.teamA.player1Id) : null;
  const p2A = match.teamA?.player2Id ? participantsMap.get(match.teamA.player2Id) : null;

  const p1B = match.teamB?.player1Id ? participantsMap.get(match.teamB.player1Id) : null;
  const p2B = match.teamB?.player2Id ? participantsMap.get(match.teamB.player2Id) : null;

  const codeP1A = match.teamA?.player1Id ? getPlayerGroupCode(match.teamA.player1Id, participants, modelType) : null;
  const codeP2A = match.teamA?.player2Id ? getPlayerGroupCode(match.teamA.player2Id, participants, modelType) : null;
  const codeP1B = match.teamB?.player1Id ? getPlayerGroupCode(match.teamB.player1Id, participants, modelType) : null;
  const codeP2B = match.teamB?.player2Id ? getPlayerGroupCode(match.teamB.player2Id, participants, modelType) : null;

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

  const renderGroupBadge = (code: string | null) => {
    if (!code) return null;
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25 mr-1.5 shrink-0">
        [{code}]
      </span>
    );
  };

  const getInputClass = (isWinner: boolean, isCompleted: boolean) => {
    if (isCompleted && isWinner) {
      return "w-14 h-11 text-center text-lg font-mono font-bold rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-2xs transition-colors";
    }
    if (isCompleted) {
      return "w-14 h-11 text-center text-lg font-mono font-medium rounded-xl border border-border/70 bg-muted/20 text-muted-foreground transition-colors";
    }
    return "w-14 h-11 text-center text-lg font-mono font-medium rounded-xl border border-border/60 bg-background text-foreground hover:border-primary/40 focus:border-primary transition-colors";
  };

  return (
    <div
      className={`relative rounded-2xl p-5 border transition-all duration-200 shadow-xs ${
        match.isBonusFinal
          ? "bg-amber-500/5 border-amber-500/35 shadow-xs"
          : match.isTiebreakSimples
          ? "bg-rose-500/5 border-rose-500/35 shadow-xs"
          : match.isCompleted
          ? "bg-card border-border/80 shadow-2xs"
          : "bg-card/80 border-border/60 hover:border-primary/40"
      }`}
    >
      {/* Header do Card com Quadra e Status */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-muted/40 text-muted-foreground border-border/60 font-semibold px-2.5 py-0.5 text-xs uppercase tracking-wider"
          >
            Quadra {match.courtNumber}
          </Badge>
          {match.isSemifinal && (
            <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold text-xs gap-1">
              <Trophy className="w-3 h-3 fill-current" />
              {match.courtNumber === 1
                ? "Semifinal 1 (1ºA + 1ªB vs 4ºA + 4ªB)"
                : "Semifinal 2 (2ºA + 2ªB vs 3ºA + 3ªB)"}
            </Badge>
          )}
          {match.isBonusFinal && (
            <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/35 font-bold text-xs gap-1">
              <Trophy className="w-3 h-3 fill-current" /> Grande Final
            </Badge>
          )}
          {match.isTiebreakSimples && (
            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold text-xs gap-1">
              <Zap className="w-3 h-3 fill-current" /> Desempate Simples (1º vs 2º)
            </Badge>
          )}
          {match.supportPairPlayerIds && match.supportPairPlayerIds.length > 0 && (
            <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold text-xs gap-1">
              🎲 Dupla Sorteada ({match.supportPairPlayerIds.map(id => participantsMap.get(id)?.name?.split(" ")[0]).filter(Boolean).join(" & ")})
            </Badge>
          )}
        </div>

        {match.isCompleted && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
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
              ? "bg-emerald-500/10 border-emerald-500/30 font-semibold"
              : "bg-muted/20 border-border/50"
          }`}
        >
          <div className="flex flex-col truncate">
            <span className="text-sm font-semibold text-foreground truncate">
              {renderGroupBadge(codeP1A)}
              {p1A?.name ?? "Jogador 1"}
            </span>
            {p2A && (
              <span className="text-sm font-semibold text-foreground truncate">
                {renderGroupBadge(codeP2A)}
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
            className={getInputClass(aWinning, match.isCompleted)}
          />
        </div>

        {/* Ícone VS no meio */}
        <div className="flex justify-center text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center border border-border/60">
            <Swords className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* TIME B */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
            match.isCompleted && bWinning
              ? "bg-emerald-500/10 border-emerald-500/30 font-semibold"
              : "bg-muted/20 border-border/50"
          }`}
        >
          <div className="flex flex-col truncate">
            <span className="text-sm font-semibold text-foreground truncate">
              {renderGroupBadge(codeP1B)}
              {p1B?.name ?? "Jogador 2"}
            </span>
            {p2B && (
              <span className="text-sm font-semibold text-foreground truncate">
                {renderGroupBadge(codeP2B)}
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
            className={getInputClass(bWinning, match.isCompleted)}
          />
        </div>
      </div>
    </div>
  );
};
