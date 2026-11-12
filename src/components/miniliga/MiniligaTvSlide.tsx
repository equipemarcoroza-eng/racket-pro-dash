import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Swords, Trophy, Medal } from "lucide-react";
import type { MiniligaMatch, MiniligaParticipant, MiniligaSession } from "@/types/miniliga";
import { compareMiniligaParticipants, getPlayerGroupCode } from "@/lib/miniliga-engine";

interface MiniligaTvSlideProps {
  session: MiniligaSession;
  index: number;
}

const shortName = (name?: string) => {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || "?";
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
};

const matchLabel = (m: MiniligaMatch) => {
  if (m.isBonusFinal) return "Grande Final";
  if (m.isSemifinal) return "Semifinal";
  if (m.isTiebreakSimples) return "Desempate";
  return `Quadra ${m.courtNumber}`;
};

/** Slide do telão (Arena Live) para uma Miniliga: jogos da rodada + classificação ao vivo */
export const MiniligaTvSlide: React.FC<MiniligaTvSlideProps> = ({ session, index }) => {
  const finished = session.status === "finalizada";
  const participants = useMemo(() => session.participants || [], [session.participants]);
  const map = useMemo(() => new Map(participants.map((p) => [p.id, p])), [participants]);

  const standings = useMemo(
    () => [...participants].sort(compareMiniligaParticipants),
    [participants]
  );
  const hasGroups =
    session.modelType === "intergrupos" &&
    participants.some((p) => p.groupNumber === 1) &&
    participants.some((p) => p.groupNumber === 2);

  const roundMatches = useMemo(() => {
    const all = session.matches || [];
    const cur = all.filter((m) => m.roundNumber === session.currentRound);
    return cur.length > 0 ? cur : all.slice(-session.courtsCount);
  }, [session]);

  const totalMatches = (session.matches || []).length;
  const doneMatches = (session.matches || []).filter((m) => m.isCompleted).length;

  const renderTeam = (p1?: MiniligaParticipant, p2?: MiniligaParticipant) => (
    <div className="flex flex-col gap-0.5 min-w-0">
      {[p1, p2].filter(Boolean).map((p) => {
        const code = getPlayerGroupCode(p!.id, participants, session.modelType);
        return (
          <span key={p!.id} className="flex items-center gap-1.5 text-base md:text-lg font-bold text-white truncate">
            {code && <span className="text-[10px] font-black text-amber-300/80 w-6 shrink-0">{code}</span>}
            <span className="truncate">{shortName(p!.name)}</span>
            {p!.isGuest && (
              <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-500/20 border border-amber-400/40 px-1 rounded shrink-0">
                Conv.
              </span>
            )}
          </span>
        );
      })}
    </div>
  );

  const renderRow = (p: MiniligaParticipant, pos: number) => (
    <div
      key={p.id}
      className={`flex items-center gap-3 px-3 py-1.5 rounded-xl ${
        pos === 1
          ? "bg-amber-500/20 border border-amber-400/40"
          : pos === 2
          ? "bg-slate-300/10 border border-slate-300/20"
          : pos === 3
          ? "bg-amber-700/15 border border-amber-700/30"
          : "bg-white/[0.03]"
      }`}
    >
      <span className="w-6 text-center font-black text-amber-300 font-mono">{pos}</span>
      <span className="flex-1 truncate font-bold text-white text-sm md:text-base flex items-center gap-1.5">
        {pos === 1 && finished && <Crown className="h-4 w-4 text-amber-300 shrink-0" />}
        <span className="truncate">{p.name}</span>
        {p.isGuest && (
          <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-500/20 border border-amber-400/40 px-1 rounded shrink-0">
            Convidado
          </span>
        )}
      </span>
      <span className="w-10 text-center font-black text-white font-mono">{p.wins ?? 0}V</span>
      <span
        className={`w-12 text-right font-mono font-bold ${
          (p.pointsBalance ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {(p.pointsBalance ?? 0) > 0 ? `+${p.pointsBalance}` : p.pointsBalance ?? 0}
      </span>
      <span className="w-12 text-right font-mono text-slate-300">{p.totalScore ?? 0} pts</span>
    </div>
  );

  const groupA = standings.filter((p) => p.groupNumber === 1);
  const groupB = standings.filter((p) => p.groupNumber === 2);

  return (
    <div className="w-full max-w-7xl space-y-5 animate-in fade-in zoom-in-95 duration-500 py-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs uppercase tracking-wider">
              Liga {index + 1} · {session.participantCount} atletas · {session.courtsCount}{" "}
              {session.courtsCount === 1 ? "quadra" : "quadras"}
            </Badge>
            {finished ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Trophy className="h-3 w-3" /> Finalizada · Pódio
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" /> Ao vivo
              </Badge>
            )}
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Swords className="h-8 w-8 text-amber-400" />
            {session.title}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-2xl md:text-3xl font-black font-mono text-amber-300">
            Rodada {Math.min(session.currentRound, session.totalRounds)}/{session.totalRounds}
          </div>
          <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
            {doneMatches}/{totalMatches} jogos concluídos
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Jogos da rodada atual */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <Swords className="h-3.5 w-3.5 text-amber-400" />
            {finished ? "Últimos jogos" : "Jogos desta rodada"}
          </div>
          {roundMatches.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-slate-900/40 rounded-2xl border border-white/10">
              Aguardando sorteio dos jogos
            </div>
          ) : (
            roundMatches.map((m) => {
              const scored = m.scoreA !== null && m.scoreB !== null;
              const aWins = scored && (m.scoreA ?? 0) > (m.scoreB ?? 0);
              const bWins = scored && (m.scoreB ?? 0) > (m.scoreA ?? 0);
              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border backdrop-blur-xl ${
                    m.isCompleted
                      ? "bg-slate-900/70 border-emerald-500/30"
                      : "bg-gradient-to-br from-slate-900/90 to-blue-950/40 border-amber-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-black text-amber-300">
                      {matchLabel(m)}
                    </span>
                    {m.isCompleted ? (
                      <span className="text-[10px] uppercase font-bold text-emerald-400">Encerrado</span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-slate-400">Em jogo</span>
                    )}
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className={aWins ? "opacity-100" : scored ? "opacity-60" : ""}>
                      {renderTeam(map.get(m.teamA.player1Id), m.teamA.player2Id ? map.get(m.teamA.player2Id) : undefined)}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono font-black text-2xl md:text-3xl text-white px-2">
                      <span className={aWins ? "text-amber-300" : ""}>{m.scoreA ?? "–"}</span>
                      <span className="text-slate-500 text-lg">x</span>
                      <span className={bWins ? "text-amber-300" : ""}>{m.scoreB ?? "–"}</span>
                    </div>
                    <div className={`text-right ${bWins ? "opacity-100" : scored ? "opacity-60" : ""}`}>
                      <div className="flex justify-end">
                        {renderTeam(map.get(m.teamB.player1Id), m.teamB.player2Id ? map.get(m.teamB.player2Id) : undefined)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Classificação */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <Medal className="h-3.5 w-3.5 text-amber-400" />
            {finished ? "Classificação final" : "Classificação ao vivo"}
            <span className="ml-auto flex gap-3 font-mono normal-case tracking-normal text-slate-500">
              <span className="w-10 text-center">Vit.</span>
              <span className="w-12 text-right">Saldo</span>
              <span className="w-12 text-right">Pts</span>
            </span>
          </div>
          {hasGroups ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Grupo A", list: groupA },
                { label: "Grupo B", list: groupB },
              ].map((g) => (
                <div key={g.label} className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 space-y-1">
                  <div className="text-xs font-black uppercase tracking-widest text-amber-300 px-2 pb-1">{g.label}</div>
                  {g.list.map((p, i) => renderRow(p, i + 1))}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 space-y-1 max-h-[62vh] overflow-y-auto">
              {standings.map((p, i) => renderRow(p, i + 1))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
