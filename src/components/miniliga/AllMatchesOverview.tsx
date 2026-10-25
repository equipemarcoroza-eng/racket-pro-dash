import React from "react";
import { MiniligaMatch, MiniligaParticipant, MiniligaModelType, MiniligaParticipantCount } from "@/types/miniliga";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Trophy, Zap, AlertCircle, Layers, Users, Dices } from "lucide-react";
import { get8PlayersCycleInfo, get10PlayersCycleInfo, getPlayerGroupCode } from "@/lib/miniliga-engine";

interface AllMatchesOverviewProps {
  matches: MiniligaMatch[];
  participantsMap: Map<string, MiniligaParticipant>;
  participants?: MiniligaParticipant[];
  onScoreChange: (matchId: string, scoreA: number | null, scoreB: number | null) => void;
  totalRounds: number;
  modelType?: MiniligaModelType;
  participantCount?: MiniligaParticipantCount;
}

export const AllMatchesOverview: React.FC<AllMatchesOverviewProps> = ({
  matches,
  participantsMap,
  participants = [],
  onScoreChange,
  totalRounds,
  modelType,
  participantCount,
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

  const is8PIntergrupos = participantCount === 8 && modelType === "intergrupos";
  const is10PIntergrupos = participantCount === 10 && modelType === "intergrupos";

  // Renderizador de um Card de Bateria / Rodada
  const renderBateriaCard = (
    roundNum: number,
    roundMatches: MiniligaMatch[],
    bateriaNumberInCycle?: number,
    totalBateriasInCycle?: number
  ) => {
    if (!roundMatches || roundMatches.length === 0) return null;
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
        {/* Header da Bateria / Rodada */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
          <div className="flex items-center gap-2 flex-wrap">
            {bateriaNumberInCycle ? (
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs px-2.5 py-0.5">
                ⚡ Bateria {bateriaNumberInCycle} de {totalBateriasInCycle ?? 3}
              </Badge>
            ) : null}

            <Badge
              className={`font-black text-xs px-2.5 py-0.5 ${
                roundCompleted
                  ? "bg-emerald-500 text-black font-extrabold"
                  : "bg-primary/20 text-primary border border-primary/30"
              }`}
            >
              Entrada Geral {roundNum} de {totalRounds}
            </Badge>

            <span className="text-xs font-semibold text-muted-foreground">
              {roundMatches.length} confronto{roundMatches.length > 1 ? "s" : ""} simultâneo{roundMatches.length > 1 ? "s" : ""}
            </span>
          </div>

          {roundCompleted ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Bateria Concluída
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Preenchendo placares
            </span>
          )}
        </div>

        {/* Lista dos jogos da bateria em Grid */}
        <div className={`grid grid-cols-1 ${roundMatches.length >= 3 ? "lg:grid-cols-3 md:grid-cols-2" : "md:grid-cols-2"} gap-3`}>
          {roundMatches.map((m) => {
            const p1A = m.teamA?.player1Id ? participantsMap.get(m.teamA.player1Id) : null;
            const p2A = m.teamA?.player2Id ? participantsMap.get(m.teamA.player2Id) : null;
            const p1B = m.teamB?.player1Id ? participantsMap.get(m.teamB.player1Id) : null;
            const p2B = m.teamB?.player2Id ? participantsMap.get(m.teamB.player2Id) : null;

            const codeP1A = m.teamA?.player1Id ? getPlayerGroupCode(m.teamA.player1Id, participants, modelType) : null;
            const codeP2A = m.teamA?.player2Id ? getPlayerGroupCode(m.teamA.player2Id, participants, modelType) : null;
            const codeP1B = m.teamB?.player1Id ? getPlayerGroupCode(m.teamB.player1Id, participants, modelType) : null;
            const codeP2B = m.teamB?.player2Id ? getPlayerGroupCode(m.teamB.player2Id, participants, modelType) : null;

            const aWinning = (m.scoreA ?? 0) > (m.scoreB ?? 0);
            const bWinning = (m.scoreB ?? 0) > (m.scoreA ?? 0);

            return (
              <div
                key={m.id}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  m.isBonusFinal
                    ? "bg-amber-500/10 border-amber-500/40"
                    : m.isSemifinal
                    ? "bg-purple-500/10 border-purple-500/40"
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
                      <Trophy className="w-3 h-3" /> Grande Final
                    </span>
                  )}
                  {m.isSemifinal && (
                    <span className="text-[11px] font-black text-purple-400 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Semifinal
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
                      {codeP1A && <span className="text-amber-400 font-mono font-extrabold mr-1">[{codeP1A}]</span>}
                      {p1A?.name ?? "P1"}
                    </span>
                    {p2A && (
                      <span className="text-xs font-bold text-foreground truncate">
                        {codeP2A && <span className="text-amber-400 font-mono font-extrabold mr-1">[{codeP2A}]</span>}
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
                      {codeP1B && <span className="text-amber-400 font-mono font-extrabold mr-1">[{codeP1B}]</span>}
                      {p1B?.name ?? "P2"}
                    </span>
                    {p2B && (
                      <span className="text-xs font-bold text-foreground truncate">
                        {codeP2B && <span className="text-amber-400 font-mono font-extrabold mr-1">[{codeP2B}]</span>}
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
  };

  // =========================================================================
  // CASO 1: 8 PARTICIPANTES INTERGRUPOS (MÉTODO OFICIAL MARCO ROZA)
  // Agrupado em 4 Rodadas Oficiais (Ciclos) com 3 Baterias cada
  // =========================================================================
  if (is8PIntergrupos) {
    const officialCycles = [1, 2, 3, 4];
    const playoffRounds = Array.from(matchesByRound.keys()).filter((r) => r > 12);

    return (
      <div className="space-y-8">
        {/* Banner Informativo Superior */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-zinc-300 flex items-start gap-3">
          <Layers className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-white block text-sm">
              Estrutura Oficial de 8 Participantes (Método Marco Roza)
            </span>
            <p className="text-zinc-400">
              A competição é dividida em <strong className="text-amber-300">4 Rodadas Oficiais</strong> (Ciclos de Parcerias fixas entre Grupo A e Grupo B). Cada Rodada Oficial contém <strong className="text-amber-300">3 Baterias</strong> de confrontos simultâneos nas 2 quadras. Total: 12 Baterias / entradas em quadra (12 jogos por participante).
            </p>
          </div>
        </div>

        {/* 4 Blocos de Rodadas Oficiais */}
        {officialCycles.map((cycleNum) => {
          const sampleRound = (cycleNum - 1) * 3 + 1;
          const cycleInfo = get8PlayersCycleInfo(sampleRound);
          const round1Num = (cycleNum - 1) * 3 + 1;
          const round2Num = (cycleNum - 1) * 3 + 2;
          const round3Num = (cycleNum - 1) * 3 + 3;

          const matchesR1 = matchesByRound.get(round1Num) || [];
          const matchesR2 = matchesByRound.get(round2Num) || [];
          const matchesR3 = matchesByRound.get(round3Num) || [];

          const allCycleMatches = [...matchesR1, ...matchesR2, ...matchesR3];
          const cycleCompleted = allCycleMatches.length > 0 && allCycleMatches.every((m) => m.isCompleted);

          return (
            <div
              key={cycleNum}
              className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 sm:p-5 shadow-lg"
            >
              {/* Tarja Oficial da Rodada (Estilo Planilha do Marco) */}
              <div className="rounded-xl border border-zinc-700/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-4 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-white text-black font-black text-xs px-3 py-1 shadow uppercase tracking-wider">
                      RODADA {cycleNum}
                    </Badge>
                    <div>
                      <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                        Rodada Oficial {cycleNum} de 4
                        <span className="text-xs font-semibold text-zinc-400">
                          (Ciclo de Parcerias • 3 Baterias)
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Cada dupla formada disputa 3 baterias de 7 minutos nas 2 quadras.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cycleCompleted ? (
                      <Badge className="bg-emerald-500 text-black font-extrabold text-xs gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Rodada {cycleNum} Concluída
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-300 border-amber-500/40 bg-amber-500/10 font-bold text-xs">
                        6 Confrontos no total
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Duplas Formadas desta Rodada Oficial */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    Parcerias Fixas Desta Rodada Oficial:
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {cycleInfo.pairsDescription.map((pair, pIdx) => {
                      const p1 = participants[pair.p1Index];
                      const p2 = participants[pair.p2Index];
                      return (
                        <div
                          key={pIdx}
                          className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col gap-0.5"
                        >
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-wide">
                            {pair.tag} ({pair.codeA} + {pair.codeB})
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {p1?.name ? p1.name.split(" ")[0] : pair.codeA} & {p2?.name ? p2.name.split(" ")[0] : pair.codeB}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* As 3 Baterias da Rodada Oficial */}
              <div className="space-y-3">
                {renderBateriaCard(round1Num, matchesR1, 1, 3)}
                {renderBateriaCard(round2Num, matchesR2, 2, 3)}
                {renderBateriaCard(round3Num, matchesR3, 3, 3)}
              </div>
            </div>
          );
        })}

        {/* Playoff: Grande Final e Desempates (Rounds > 12) */}
        {playoffRounds.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 p-4 sm:p-5 shadow-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-amber-500/30">
              <div className="p-2.5 rounded-xl bg-amber-500 text-black font-black">
                <Trophy className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Fase Final / Playoffs (Grande Final 1º+3º vs 2º+4º)
                </h3>
                <p className="text-xs text-zinc-400">
                  Disputa decisiva pelo título entre as melhores duplas da classificação geral
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {playoffRounds.map((rNum) => {
                const pMatches = matchesByRound.get(rNum) || [];
                return renderBateriaCard(rNum, pMatches);
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CASO 2: 10 PARTICIPANTES INTERGRUPOS (MINI LIGA MISTA / REPOSIÇÕES MARCO ROZA)
  // 6 Rodadas Oficiais com 2 Baterias cada + 2 Jogos de Sorteio (19h57 e 20h52) + Playoffs
  // =========================================================================
  if (is10PIntergrupos) {
    // Blocos ordenados conforme a tabela oficial do Marco Roza
    const blocks = [
      { type: "rodada", oficialRound: 1, r1: 1, r2: 2 },
      { type: "rodada", oficialRound: 2, r1: 3, r2: 4 },
      { type: "rodada", oficialRound: 3, r1: 5, r2: 6 },
      { type: "sorteio", roundNum: 7, label: "Sorteio 1 (Equilíbrio de Jogos A5/B4)" },
      { type: "rodada", oficialRound: 4, r1: 8, r2: 9 },
      { type: "rodada", oficialRound: 5, r1: 10, r2: 11 },
      { type: "rodada", oficialRound: 6, r1: 12, r2: 13 },
      { type: "sorteio", roundNum: 14, label: "Sorteio 2 (Equilíbrio de Jogos A5/B4)" },
    ];

    // Jogos de Semifinais e Finais (se existirem na sessão)
    const playoffRounds = Array.from(matchesByRound.keys()).filter((r) => r > 14);

    return (
      <div className="space-y-8">
        {/* Banner Informativo Superior */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-zinc-300 flex items-start gap-3">
          <Layers className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-white block text-sm">
              Tabela de Jogos - Mini Liga Mista / Reposições (Método Marco Roza - 10 Participantes)
            </span>
            <p className="text-zinc-400">
              A competição conta com <strong className="text-amber-300">6 Rodadas Oficiais</strong> de 2 baterias cada e <strong className="text-amber-300">2 Jogos Extras de Sorteio</strong> para a dupla que folgou. Total de 26 confrontos na classificatória, garantindo exatamente <strong className="text-amber-300">10 jogos para cada um dos 10 participantes</strong>. Seguido de Semifinais (1ºA+1ªB vs 4ºA+4ªB e 2ºA+2ªB vs 3ºA+3ªB) e Grande Final!
            </p>
          </div>
        </div>

        {/* Blocos de Rodadas e Sorteios */}
        {blocks.map((b, idx) => {
          if (b.type === "sorteio") {
            const roundMatches = matchesByRound.get(b.roundNum!) || [];
            if (roundMatches.length === 0) return null;
            const roundCompleted = roundMatches.every((m) => m.isCompleted);

            return (
              <div
                key={`sorteio-${b.roundNum}`}
                className="space-y-3 rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 sm:p-5 shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-sky-500/20">
                  <div className="flex items-center gap-2.5">
                    <Badge className="bg-sky-500 text-black font-black text-xs px-2.5 py-0.5 shadow uppercase tracking-wide gap-1">
                      <Dices className="w-3.5 h-3.5" /> JOGO EXTRA DE SORTEIO
                    </Badge>
                    <span className="text-xs font-semibold text-zinc-400">
                      Entrada Geral {b.roundNum} de {totalRounds}
                    </span>
                  </div>

                  {roundCompleted ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Jogo Concluído
                    </span>
                  ) : (
                    <span className="text-xs text-sky-300/80">
                      Jogo da dupla A5/B4 contra dupla de apoio sorteada (10º jogo de A5/B4)
                    </span>
                  )}
                </div>

                <div className="pt-1">
                  {renderBateriaCard(b.roundNum!, roundMatches)}
                </div>
              </div>
            );
          }

          // Bloco de Rodada Oficial
          const cycleInfo = get10PlayersCycleInfo(b.r1!);
          const matchesR1 = matchesByRound.get(b.r1!) || [];
          const matchesR2 = matchesByRound.get(b.r2!) || [];
          const allMatches = [...matchesR1, ...matchesR2];
          const cycleCompleted = allMatches.length > 0 && allMatches.every((m) => m.isCompleted);

          const restingP1 = cycleInfo.restingDescription ? participants[cycleInfo.restingDescription.p1Index] : null;
          const restingP2 = cycleInfo.restingDescription ? participants[cycleInfo.restingDescription.p2Index] : null;

          return (
            <div
              key={`rodada-${b.oficialRound}`}
              className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 sm:p-5 shadow-lg"
            >
              {/* Tarja Oficial da Rodada */}
              <div className="rounded-xl border border-zinc-700/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-4 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-white text-black font-black text-xs px-3 py-1 shadow uppercase tracking-wider">
                      RODADA {b.oficialRound}
                    </Badge>
                    <div>
                      <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                        Rodada Oficial {b.oficialRound} de 6
                        <span className="text-xs font-semibold text-zinc-400">
                          (2 Baterias nas Quadras 1 e 2)
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400">
                        4 duplas em quadra • 1 dupla folga nesta rodada
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cycleCompleted ? (
                      <Badge className="bg-emerald-500 text-black font-extrabold text-xs gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Rodada {b.oficialRound} Concluída
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-300 border-amber-500/40 bg-amber-500/10 font-bold text-xs">
                        4 Confrontos simultâneos
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Duplas Formadas e Folgas da Rodada Oficial */}
                <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      Parcerias Desta Rodada Oficial:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {cycleInfo.pairsDescription.map((pair, pIdx) => {
                        const p1 = participants[pair.p1Index];
                        const p2 = participants[pair.p2Index];
                        return (
                          <div
                            key={pIdx}
                            className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col gap-0.5"
                          >
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wide">
                              {pair.codeA} + {pair.codeB}
                            </span>
                            <span className="text-xs font-bold text-white truncate">
                              {p1?.name ? p1.name.split(" ")[0] : pair.codeA} & {p2?.name ? p2.name.split(" ")[0] : pair.codeB}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {cycleInfo.restingDescription && (
                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 md:w-56 flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        💤 Folgam Nesta Rodada:
                      </span>
                      <span className="text-xs font-extrabold text-amber-300">
                        [{cycleInfo.restingDescription.codeA}] {restingP1?.name ? restingP1.name.split(" ")[0] : ""} & [{cycleInfo.restingDescription.codeB}] {restingP2?.name ? restingP2.name.split(" ")[0] : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* As 2 Baterias da Rodada Oficial */}
              <div className="space-y-3">
                {renderBateriaCard(b.r1!, matchesR1, 1, 2)}
                {renderBateriaCard(b.r2!, matchesR2, 2, 2)}
              </div>
            </div>
          );
        })}

        {/* Playoff: Semifinais e Finais */}
        {playoffRounds.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 p-4 sm:p-5 shadow-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-amber-500/30">
              <div className="p-2.5 rounded-xl bg-amber-500 text-black font-black">
                <Trophy className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Fase Final / Playoffs (Método Oficial Marco Roza)
                </h3>
                <p className="text-xs text-zinc-400">
                  Semifinais: 1ºA+1ªB vs 4ºA+4ªB e 2ºA+2ªB vs 3ºA+3ªB • Grande Final
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {playoffRounds.map((rNum) => {
                const pMatches = matchesByRound.get(rNum) || [];
                return renderBateriaCard(rNum, pMatches);
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CASO 3: OUTROS MODELOS (12 Jogadores, Rotativos, etc.)
  // =========================================================================
  return (
    <div className="space-y-5">
      {participantCount === 12 && (
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-zinc-300 flex items-start gap-3">
          <Layers className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-white block text-sm">
              Modelo de 12 Participantes (11 Rodadas Completas)
            </span>
            <p className="text-zinc-400">
              São 11 rodadas completas em 3 quadras simultâneas (100% de ocupação, zero folgas). Todos os 12 alunos jogam 11 vezes. As 66 duplas são 100% inéditas.
            </p>
          </div>
        </div>
      )}

      {Array.from(matchesByRound.entries()).map(([roundNum, roundMatches]) => {
        return renderBateriaCard(roundNum, roundMatches);
      })}
    </div>
  );
};
