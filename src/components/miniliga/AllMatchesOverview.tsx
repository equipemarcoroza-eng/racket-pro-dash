import React from "react";
import { MiniligaMatch, MiniligaParticipant } from "@/types/miniliga";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Swords, Trophy, Zap, AlertCircle } from "lucide-react";

interface AllMatchesOverviewProps {
  matches: MiniligaMatch[];
  participantsMap: Map<string, MiniligaParticipant>;
  onScoreChange: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
  totalRounds: number;
}

export const AllMatchesOverview: React.FC<AllMatchesOverviewProps> = ({
  matches,
  participantsMap,
  onScoreChange,
  totalRounds,
}) => {
  // Agrupar jogos por rodada
  const matchesByRound = React.useMemo(() => {
    const map = new Map<number, MiniligaMatch[]>();
    for (let r = 1; r <= totalRounds; r++) {
      map.set(r, []);
    }
    matches.forEach((m) => {
      const list = map.get(m.roundNumber) || [];
      list.push(m);
      map.set(m.roundNumber, list);
    });
    return map;
  }, [matches, totalRounds]);

  return (
    <div className="space-y-5">
      {Array.from(matchesByRound.entries()).map(([roundNum, roundMatches]) => {
        if (roundMatches.length === 0) return null;

        const roundCompleted = roundMatches.every((m) => m.isCompleted);

        return (
          <div
            key={roundNum}
            className={`p-4 rounded-2xl border transition-all duration-300 backdrop-blur-md shadow-sm ${
              roundCompleted
                ? "bg-card/90 border-emerald-500/30 shadow-emerald-500/5"
                : "bg-card/70 border-border"
            }`}
          >
            {/* Header da Rodada */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Badge
                  className={`font-black text-xs px-2.5 py-0.5 ${
                    roundCompleted
                      ? "bg-emerald-500 text-black font-extrabold"
                      : "bg-primary/20 text-primary border border-primary/30"
                  }`}
                >
                  Rodada {roundNum}
                </Badge>
                <span className="text-xs font-semibold text-muted-foreground">
                  {roundMatches.length} confronto{roundMatches.length > 1 ? "s" : ""}
                </span>
              </div>

              {roundCompleted ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Rodada Concluída
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Preenchendo placares
                </span>
              )}
            </div>

            {/* Lista dos jogos da rodada em Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roundMatches.map((m) => {
                const p1A = participantsMap.get(m.teamA.player1Id);
                const p2A = m.teamA.player2Id ? participantsMap.get(m.teamA.player2Id) : null;
                const p1B = participantsMap.get(m.teamB.player1Id);
                const p2B = m.teamB.player2Id ? participantsMap.get(m.teamB.player2Id) : null;

                const aWinning = (m.scoreA ?? 0) > (m.scoreB ?? 0);
                const bWinning = (m.scoreB ?? 0) > (m.scoreA ?? 0);

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      m.isBonusFinal
                        ? "bg-amber-500/10 border-amber-500/40"
                        : m.isTiebreakSimples
                        ? "bg-rose-500/10 border-rose-500/40"
                        : m.isCompleted
                        ? "bg-background/80 border-border/80"
                        : "bg-muted/20 border-border/50 hover:border-primary/40"
                    }`}
                  >
                    {/* Topo do Card de Jogo */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <Badge
                        variant="outline"
                        className="bg-muted/40 font-bold text-[10px] uppercase text-muted-foreground"
                      >
                        Quadra {m.courtNumber}
                      </Badge>
                      {m.isBonusFinal && (
                        <span className="text-[11px] font-black text-amber-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Grande Final (1º+3º vs 2º+4º)
                        </span>
                      )}
                      {m.isTiebreakSimples && (
                        <span className="text-[11px] font-black text-rose-400 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Desempate Simples (1º vs 2º)
                        </span>
                      )}
                      {m.supportPairPlayerIds && m.supportPairPlayerIds.length > 0 && (
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-500/30 flex items-center gap-1">
                          🎲 Dupla Sorteada ({m.supportPairPlayerIds.map(id => participantsMap.get(id)?.name?.split(" ")[0]).filter(Boolean).join(" & ")})
                        </span>
                      )}
                    </div>

                    {/* Placar & Duplas */}
                    <div className="grid grid-cols-[1fr,auto,auto,auto,1fr] items-center gap-2">
                      {/* Time A */}
                      <div className="flex flex-col text-right truncate">
                        <span className="text-xs font-bold text-foreground truncate">
                          {p1A?.name ?? "P1"}
                        </span>
                        {p2A && (
                          <span className="text-xs font-bold text-foreground truncate">
                            {p2A.name}
                          </span>
                        )}
                      </div>

                      {/* Input A */}
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        value={m.scoreA ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
                          onScoreChange(m.id, val, m.scoreB);
                        }}
                        placeholder="0"
                        className={`w-12 h-10 text-center font-mono font-black text-base shadow-inner p-1 ${
                          m.isCompleted && aWinning
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-extrabold"
                            : ""
                        }`}
                      />

                      {/* X */}
                      <span className="text-xs font-bold text-muted-foreground px-0.5">x</span>

                      {/* Input B */}
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        value={m.scoreB ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
                          onScoreChange(m.id, m.scoreA, val);
                        }}
                        placeholder="0"
                        className={`w-12 h-10 text-center font-mono font-black text-base shadow-inner p-1 ${
                          m.isCompleted && bWinning
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-extrabold"
                            : ""
                        }`}
                      />

                      {/* Time B */}
                      <div className="flex flex-col text-left truncate">
                        <span className="text-xs font-bold text-foreground truncate">
                          {p1B?.name ?? "P2"}
                        </span>
                        {p2B && (
                          <span className="text-xs font-bold text-foreground truncate">
                            {p2B.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
