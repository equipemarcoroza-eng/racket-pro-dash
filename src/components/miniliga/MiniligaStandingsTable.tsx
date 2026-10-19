import React, { useState } from "react";
import { MiniligaParticipant } from "@/types/miniliga";
import { Trophy, Flame, Sparkles, Users, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MiniligaStandingsTableProps {
  standings: MiniligaParticipant[];
  hasTiebreakWarning?: boolean;
}

export const MiniligaStandingsTable: React.FC<MiniligaStandingsTableProps> = ({
  standings,
  hasTiebreakWarning,
}) => {
  const hasGroups =
    standings.some((p) => p.groupNumber === 1) &&
    standings.some((p) => p.groupNumber === 2);

  const [viewMode, setViewMode] = useState<"geral" | "grupos">("geral");

  const sortByScore = (a: MiniligaParticipant, b: MiniligaParticipant) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.pointsBalance !== a.pointsBalance) return b.pointsBalance - a.pointsBalance;
    return b.pointsFor - a.pointsFor;
  };

  const groupA = standings.filter((p) => p.groupNumber === 1).sort(sortByScore);
  const groupB = standings.filter((p) => p.groupNumber === 2).sort(sortByScore);

  const renderTableRows = (list: MiniligaParticipant[], isGroupA?: boolean, isGroupB?: boolean) => {
    return list.map((p, idx) => {
      const isFirst = idx === 0;
      const isSecond = idx === 1;
      const isThird = idx === 2;

      let semiTag: string | null = null;
      if (isGroupA) {
        if (idx === 0) semiTag = "Semi 1 (c/ 1ª B)";
        else if (idx === 1) semiTag = "Semi 2 (c/ 2ª B)";
        else if (idx === 2) semiTag = "Semi 2 (c/ 3ª B)";
        else if (idx === 3) semiTag = "Semi 1 (c/ 4ª B)";
      } else if (isGroupB) {
        if (idx === 0) semiTag = "Semi 1 (c/ 1º A)";
        else if (idx === 1) semiTag = "Semi 2 (c/ 2º A)";
        else if (idx === 2) semiTag = "Semi 2 (c/ 3º A)";
        else if (idx === 3) semiTag = "Semi 1 (c/ 4º A)";
      }

      return (
        <tr
          key={p.id}
          className={`transition-colors hover:bg-muted/30 ${
            isFirst
              ? "bg-amber-500/10 font-bold"
              : isSecond
              ? "bg-slate-300/5"
              : isThird
              ? "bg-amber-700/5"
              : ""
          }`}
        >
          {/* Posição */}
          <td className="py-3.5 px-4 text-center">
            {isFirst ? (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-black font-black text-xs shadow-md shadow-amber-500/30">
                1º
              </span>
            ) : isSecond ? (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-black font-bold text-xs shadow-sm">
                2º
              </span>
            ) : isThird ? (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/80 text-white font-bold text-xs">
                3º
              </span>
            ) : (
              <span className="text-muted-foreground font-semibold text-xs">
                {idx + 1}º
              </span>
            )}
          </td>

          {/* Nome do Aluno */}
          <td className="py-3.5 px-4 font-semibold text-foreground">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary shrink-0">
                {p.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {p.name}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {p.groupNumber && (
                    <span className="text-[10px] text-muted-foreground">
                      Grupo {p.groupNumber === 1 ? "A" : "B"}
                    </span>
                  )}
                  {semiTag && (
                    <span className="text-[10px] font-extrabold text-purple-400 bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.2 rounded">
                      {semiTag}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </td>

          {/* Estatísticas */}
          <td className="py-3.5 px-3 text-center text-muted-foreground">
            {p.matchesPlayed}
          </td>
          <td className="py-3.5 px-3 text-center text-emerald-400 font-bold">
            {p.wins}
          </td>
          <td className="py-3.5 px-3 text-center text-rose-400/80">
            {p.losses}
          </td>
          <td className="py-3.5 px-3 text-center font-mono text-xs">
            {p.pointsFor}
          </td>
          <td className="py-3.5 px-3 text-center font-mono text-xs text-muted-foreground">
            {p.pointsAgainst}
          </td>
          <td className="py-3.5 px-3 text-center font-mono text-xs font-semibold">
            <span
              className={
                p.pointsBalance > 0
                  ? "text-emerald-400"
                  : p.pointsBalance < 0
                  ? "text-rose-400"
                  : "text-muted-foreground"
              }
            >
              {p.pointsBalance > 0 ? `+${p.pointsBalance}` : p.pointsBalance}
            </span>
          </td>

          {/* TOTAL GERAL (PP + Vitórias) */}
          <td className="py-3.5 px-4 text-center font-mono font-black text-base text-amber-400 bg-amber-500/5">
            {p.totalScore}
          </td>

          {/* PONTOS NO ATHLETE CARD */}
          <td className="py-3.5 px-4 text-center">
            <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              +{p.cardPointsAwarded} pts
            </Badge>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xl">
      <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-foreground flex items-center gap-2">
              Classificação da Miniliga
              <Badge variant="outline" className="text-xs bg-muted/40 border-border font-normal">
                Regra Marco Roza: Pontos + Vitórias
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Pontuação atualizada ao vivo a cada bateria
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasGroups && (
            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/80">
              <Button
                size="sm"
                variant={viewMode === "geral" ? "default" : "ghost"}
                className="h-7 text-xs font-bold gap-1 px-2.5"
                onClick={() => setViewMode("geral")}
              >
                <Award className="w-3.5 h-3.5" /> Pódio Geral
              </Button>
              <Button
                size="sm"
                variant={viewMode === "grupos" ? "default" : "ghost"}
                className="h-7 text-xs font-bold gap-1 px-2.5"
                onClick={() => setViewMode("grupos")}
              >
                <Users className="w-3.5 h-3.5" /> Grupos A e B (Playoffs)
              </Button>
            </div>
          )}

          {hasTiebreakWarning && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
              <Flame className="w-3.5 h-3.5" />
              Empate na liderança!
            </div>
          )}
        </div>
      </div>

      {viewMode === "geral" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/40">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Pos</th>
                <th className="py-3 px-4">Aluno / Atleta</th>
                <th className="py-3 px-3 text-center" title="Jogos disputados">J</th>
                <th className="py-3 px-3 text-center text-emerald-400 font-bold" title="Vitórias">V</th>
                <th className="py-3 px-3 text-center text-rose-400" title="Derrotas">D</th>
                <th className="py-3 px-3 text-center text-muted-foreground" title="Pontos Pró feitos">PP</th>
                <th className="py-3 px-3 text-center text-muted-foreground" title="Pontos Contra levados">PC</th>
                <th className="py-3 px-3 text-center" title="Saldo de Pontos (PP - PC)">Saldo</th>
                <th className="py-3 px-4 text-center text-amber-400 font-black text-sm bg-amber-500/5">
                  Total Geral
                </th>
                <th className="py-3 px-4 text-center text-xs">Card XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {renderTableRows(standings)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/60">
          {/* GRUPO A */}
          <div>
            <div className="p-3 bg-zinc-950/40 border-b border-border/40 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Classificação Grupo A (Jogadores)
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold">
                1º ao 4º avançam para as Semifinais
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 text-muted-foreground text-[10px] uppercase font-semibold border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3 text-center">Pos</th>
                    <th className="py-2.5 px-3">Atleta</th>
                    <th className="py-2.5 px-2 text-center">V</th>
                    <th className="py-2.5 px-2 text-center">Saldo</th>
                    <th className="py-2.5 px-3 text-center font-bold text-amber-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {renderTableRows(groupA, true, false)}
                </tbody>
              </table>
            </div>
          </div>

          {/* GRUPO B */}
          <div>
            <div className="p-3 bg-zinc-950/40 border-b border-border/40 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Classificação Grupo B (Jogadoras)
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold">
                1ª à 4ª avançam para as Semifinais
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 text-muted-foreground text-[10px] uppercase font-semibold border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3 text-center">Pos</th>
                    <th className="py-2.5 px-3">Atleta</th>
                    <th className="py-2.5 px-2 text-center">V</th>
                    <th className="py-2.5 px-2 text-center">Saldo</th>
                    <th className="py-2.5 px-3 text-center font-bold text-amber-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {renderTableRows(groupB, false, true)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
