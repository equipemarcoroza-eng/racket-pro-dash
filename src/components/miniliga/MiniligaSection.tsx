import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import {
  MiniligaSession,
  MiniligaParticipant,
  MiniligaParticipantCount,
  MiniligaModelType,
} from "@/types/miniliga";
import {
  generateMiniligaMatches,
  recalculateMiniligaStandings,
  createBonusFinalMatch,
  createTiebreakSimplesMatch,
} from "@/lib/miniliga-engine";
import { miniligaStorage } from "@/lib/miniliga-storage";
import { MatchTimer } from "@/components/miniliga/MatchTimer";
import { CourtMatchCard } from "@/components/miniliga/CourtMatchCard";
import { AllMatchesOverview } from "@/components/miniliga/AllMatchesOverview";
import { MiniligaStandingsTable } from "@/components/miniliga/MiniligaStandingsTable";
import { MiniligaSummaryModal } from "@/components/miniliga/MiniligaSummaryModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  Users,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Plus,
  Trash2,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Dices,
  ListOrdered,
  LayoutGrid,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export const MiniligaSection: React.FC = () => {
  const { students, attendanceLogs, setAttendanceLogs } = useAppContext();

  // Estado da Sessão Ativa
  const [session, setSession] = useState<MiniligaSession | null>(() => {
    return miniligaStorage.getActiveSession();
  });

  // Configuração inicial (Passo 1: Setup)
  const [title, setTitle] = useState("Miniliga de Reposição");
  const [selectedCount, setSelectedCount] = useState<MiniligaParticipantCount>(5);
  const [selectedModel, setSelectedModel] = useState<MiniligaModelType>("intergrupos");
  const [customPlayers, setCustomPlayers] = useState<
    Array<{ id: string; name: string; studentId?: string }>
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [isSavingPoints, setIsSavingPoints] = useState(false);

  // Modo de visualização de jogos: "todos" (visão panorâmica de 1 por 1) ou "rodada" (foco com cronômetro)
  const [matchViewMode, setMatchViewMode] = useState<"todos" | "rodada">("todos");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<MiniligaSession[]>(() => miniligaStorage.getHistory());

  const refreshHistory = () => {
    setHistoryList(miniligaStorage.getHistory());
  };

  // Auto-salvamento resiliente no localStorage
  useEffect(() => {
    if (session) {
      miniligaStorage.saveActiveSession(session);
    }
  }, [session]);

  // Alunos ATIVOS com reposições pendentes para seleção rápida
  const pendingReplacementStudents = useMemo(() => {
    const studentFaltasCount = new Map<string, number>();
    attendanceLogs.forEach((log) => {
      if (log.presente === "Falta") {
        studentFaltasCount.set(
          log.alunoId,
          (studentFaltasCount.get(log.alunoId) || 0) + 1
        );
      } else if (log.presente === "Reposição" || log.presente === "Miniliga") {
        const cur = studentFaltasCount.get(log.alunoId) || 0;
        if (cur > 0) studentFaltasCount.set(log.alunoId, cur - 1);
      }
    });

    return students.filter(
      (s) => s.status === "Ativo" && (studentFaltasCount.get(s.id) || 0) > 0
    );
  }, [students, attendanceLogs]);

  // Filtragem de alunos para adicionar no setup (APENAS ATIVOS)
  const filteredStudents = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "Ativo");
    if (!searchTerm.trim()) return activeStudents.slice(0, 10);
    return activeStudents
      .filter((s) => s.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 12);
  }, [students, searchTerm]);

  // Adicionar aluno na lista do torneio
  const handleAddPlayer = (name: string, studentId?: string) => {
    if (customPlayers.length >= selectedCount) {
      toast.error(`Limite de ${selectedCount} participantes atingido!`);
      return;
    }
    if (customPlayers.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Este participante já está adicionado.");
      return;
    }
    setCustomPlayers((prev) => [
      ...prev,
      { id: `p-${Date.now()}-${Math.random()}`, name, studentId },
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    setCustomPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  // Preencher com sugestão automática de alunos ATIVOS com reposição pendente
  const handleAutoFillWithReplacements = () => {
    const needed = selectedCount - customPlayers.length;
    if (needed <= 0) return;

    const available = pendingReplacementStudents.filter(
      (s) => !customPlayers.some((cp) => cp.studentId === s.id)
    );

    const toAdd = available.slice(0, needed);
    const newItems = toAdd.map((s) => ({
      id: `p-${s.id}`,
      name: s.nome,
      studentId: s.id,
    }));

    // Se ainda faltar, preenche estritamente com outros alunos ATIVOS
    if (newItems.length < needed) {
      const remainingNeeded = needed - newItems.length;
      const otherActiveStudents = students.filter(
        (s) =>
          s.status === "Ativo" &&
          !customPlayers.some((cp) => cp.studentId === s.id) &&
          !newItems.some((ni) => ni.studentId === s.id)
      );
      otherActiveStudents.slice(0, remainingNeeded).forEach((s) => {
        newItems.push({
          id: `p-${s.id}`,
          name: s.nome,
          studentId: s.id,
        });
      });
    }

    setCustomPlayers((prev) => [...prev, ...newItems]);
    toast.success("Participantes preenchidos com sucesso (apenas alunos ativos)!");
  };

  // INICIAR A MINILIGA (Modo Simulação por padrão para segurança)
  const handleStartMiniliga = (isSimulation: boolean = true) => {
    if (customPlayers.length !== selectedCount) {
      toast.error(`Adicione exatamente ${selectedCount} participantes para iniciar.`);
      return;
    }

    const participants: MiniligaParticipant[] = customPlayers.map((cp, idx) => {
      let groupNumber: 1 | 2 | undefined = undefined;
      if (selectedCount === 8) {
        groupNumber = idx < 4 ? 1 : 2;
      } else if (selectedCount === 10) {
        groupNumber = idx < 5 ? 1 : 2;
      }

      return {
        id: cp.id,
        studentId: cp.studentId,
        name: cp.name,
        groupNumber,
        assignedNumber: idx + 1,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsBalance: 0,
        totalScore: 0,
        rank: idx + 1,
        cardPointsAwarded: Math.max(1, selectedCount - idx),
      };
    });

    const { matches, totalRounds, courtsCount } = generateMiniligaMatches(
      participants,
      selectedModel
    );

    const newSession: MiniligaSession = {
      id: `miniliga-${Date.now()}`,
      title: title.trim() || "Miniliga de Reposição",
      date: new Date().toISOString(),
      participantCount: selectedCount,
      modelType: selectedModel,
      courtsCount,
      durationSeconds: 300,
      currentRound: 1,
      totalRounds,
      status: "em_andamento",
      participants,
      matches,
      hasBonusFinal: false,
      hasTiebreakSimples: false,
      isSimulation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSession(newSession);
    miniligaStorage.saveActiveSession(newSession);
    toast.success(
      isSimulation
        ? "🧪 Modo Simulação iniciado! Todos os jogos listados na tela."
        : "🟢 Miniliga Real iniciada com sucesso!"
    );
  };

  const participantsMap = useMemo(() => {
    const map = new Map<string, MiniligaParticipant>();
    if (!session) return map;
    session.participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [session]);

  const currentRoundMatches = useMemo(() => {
    if (!session) return [];
    return session.matches.filter((m) => m.roundNumber === session.currentRound);
  }, [session]);

  const restingPlayers = useMemo(() => {
    if (!session) return [];
    const playingIds = new Set<string>();
    currentRoundMatches.forEach((m) => {
      playingIds.add(m.teamA.player1Id);
      if (m.teamA.player2Id) playingIds.add(m.teamA.player2Id);
      playingIds.add(m.teamB.player1Id);
      if (m.teamB.player2Id) playingIds.add(m.teamB.player2Id);
    });

    return session.participants.filter((p) => !playingIds.has(p.id));
  }, [session, currentRoundMatches]);

  // Atualizar placar de um jogo (1 por 1 direto na grade)
  const handleScoreChange = (
    matchId: string,
    scoreA: number | null,
    scoreB: number | null
  ) => {
    if (!session) return;

    const updatedMatches = session.matches.map((m) => {
      if (m.id === matchId) {
        const isCompleted = scoreA !== null && scoreB !== null && (scoreA > 0 || scoreB > 0);
        return {
          ...m,
          scoreA,
          scoreB,
          isCompleted,
          finishedAt: isCompleted ? new Date().toISOString() : null,
        };
      }
      return m;
    });

    const updatedStandings = recalculateMiniligaStandings(
      session.participants,
      updatedMatches
    );

    const updatedSession: MiniligaSession = {
      ...session,
      matches: updatedMatches,
      participants: updatedStandings,
      updatedAt: new Date().toISOString(),
    };

    setSession(updatedSession);
  };

  // BOTÃO MÁGICO: GERAR PLACARES SIMULADOS EM 1 CLIQUE
  const handleGenerateRandomScores = () => {
    if (!session) return;

    const updatedMatches = session.matches.map((m) => {
      // Gera placares realistas de Beach Tennis nos 5 minutos (entre 4 e 10 pontos)
      const sA = Math.floor(Math.random() * 6) + 4;
      let sB = Math.floor(Math.random() * 6) + 4;
      if (sB === sA) sB += 1; // evita empate no jogo individual

      return {
        ...m,
        scoreA: sA,
        scoreB: sB,
        isCompleted: true,
        finishedAt: new Date().toISOString(),
      };
    });

    const updatedStandings = recalculateMiniligaStandings(
      session.participants,
      updatedMatches
    );

    setSession({
      ...session,
      matches: updatedMatches,
      participants: updatedStandings,
      status: "aguardando_final",
      updatedAt: new Date().toISOString(),
    });

    toast.success("Placares de simulação gerados para todos os jogos!");
  };

  const handleNextRound = () => {
    if (!session) return;

    const allCompleted = currentRoundMatches.every((m) => m.isCompleted);
    if (!allCompleted) {
      toast.warning("Por favor, preencha o placar de todos os jogos da rodada atual.");
      return;
    }

    if (session.currentRound < session.totalRounds) {
      const nextRound = session.currentRound + 1;
      setSession({
        ...session,
        currentRound: nextRound,
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Avançando para a Rodada ${nextRound}!`);
    } else {
      setSession({
        ...session,
        status: "aguardando_final",
        updatedAt: new Date().toISOString(),
      });
      toast.success("Rodadas principais concluídas! Veja a classificação ou dispute a Final!");
    }
  };

  const hasTieInFirstPlace = useMemo(() => {
    if (!session || session.participants.length < 2) return false;
    const p1 = session.participants[0];
    const p2 = session.participants[1];
    return p1.totalScore === p2.totalScore && p1.totalScore > 0;
  }, [session]);

  const handleAddTiebreakSimples = () => {
    if (!session) return;
    const p1 = session.participants[0];
    const p2 = session.participants[1];
    const nextRound = session.totalRounds + 1;

    const tiebreakMatch = createTiebreakSimplesMatch(p1, p2, nextRound);

    setSession({
      ...session,
      totalRounds: nextRound,
      currentRound: nextRound,
      matches: [...session.matches, tiebreakMatch],
      hasTiebreakSimples: true,
      status: "em_andamento",
      updatedAt: new Date().toISOString(),
    });

    toast.success("Partida de Desempate de Simples criada na Quadra 1!");
  };

  const handleAddBonusFinal = () => {
    if (!session) return;
    const nextRound = session.totalRounds + 1;
    const bonusFinal = createBonusFinalMatch(session.participants, nextRound);

    if (!bonusFinal) {
      toast.error("Não há participantes suficientes para a Grande Final.");
      return;
    }

    setSession({
      ...session,
      totalRounds: nextRound,
      currentRound: nextRound,
      matches: [...session.matches, bonusFinal],
      hasBonusFinal: true,
      status: "em_andamento",
      updatedAt: new Date().toISOString(),
    });

    toast.success("Grande Final (1º+3º vs 2º+4º) criada na Quadra 1!");
  };

  // Alternar Simulação para Modo Real
  const handlePromoteToReal = () => {
    if (!session) return;
    if (window.confirm("Deseja ativar esta Miniliga como Modo Real Oficial para creditar pontos?")) {
      setSession({
        ...session,
        isSimulation: false,
        updatedAt: new Date().toISOString(),
      });
      toast.success("🏆 Miniliga convertida para Modo Real Oficial!");
    }
  };

  const handleDistributeCardPoints = async () => {
    if (!session) return;
    if (session.isSimulation) {
      toast.info("A Miniliga está em Modo Simulação. Mude para Modo Real para creditar pontos.");
      return;
    }

    setIsSavingPoints(true);
    try {
      miniligaStorage.saveToHistory({
        ...session,
        status: "finalizada",
      });

      const todayIso = new Date().toISOString().split("T")[0];
      const newAttendanceLogs = session.participants
        .filter((p) => p.studentId)
        .map((p) => ({
          id: `att-miniliga-${p.studentId}-${Date.now()}`,
          alunoId: p.studentId!,
          turmaId: "miniliga",
          data: todayIso,
          presente: "Miniliga" as const,
          dataRealizacao: todayIso,
          motivoCancelamento: `Miniliga: ${p.rank}º lugar (+${p.cardPointsAwarded} pts no Card)`,
        }));

      if (newAttendanceLogs.length > 0) {
        setAttendanceLogs((prev) => [...prev, ...newAttendanceLogs]);
      }

      toast.success(
        `🏆 Pontos creditados nos Cards dos ${session.participants.length} atletas com sucesso!`
      );
      setSummaryModalOpen(false);
      setSession({
        ...session,
        status: "finalizada",
      });
    } catch (e) {
      toast.error("Erro ao creditar pontos.");
    } finally {
      setIsSavingPoints(false);
    }
  };

  const handleResetSession = () => {
    if (window.confirm("Deseja realmente reiniciar a Miniliga?")) {
      miniligaStorage.clearActiveSession();
      setSession(null);
      setCustomPlayers([]);
      toast.info("Pronto para configurar ou simular uma nova Miniliga!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner da Miniliga com Alternador Simulação / Real */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-card border border-amber-500/30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              Miniligas Marco Roza
              {session?.isSimulation ? (
                <Badge className="bg-sky-500 text-white font-extrabold text-xs">
                  🧪 Modo Simulação (Sandbox)
                </Badge>
              ) : (
                <Badge className="bg-emerald-500 text-black font-extrabold text-xs">
                  🟢 Modo Real Oficial
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Grade com todos os jogos na tela, preenchimento 1 por 1 e pontuação em tempo real
            </p>
          </div>
        </div>

            <Button
              onClick={() => {
                refreshHistory();
                setHistoryOpen(true);
              }}
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/80 text-foreground hover:bg-muted font-bold text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Histórico ({historyList.length})
            </Button>

            {session && (
              <div className="flex items-center gap-2 flex-wrap">
                {session.isSimulation && (
                  <>
                    <Button
                      onClick={handleGenerateRandomScores}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-sky-500/40 text-sky-400 hover:bg-sky-500/10 text-xs font-bold"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      Auto-Preencher Resultados
                    </Button>

                    <Button
                      onClick={handlePromoteToReal}
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ativar Modo Real
                    </Button>
                  </>
                )}

                <Button
                  onClick={() => setSummaryModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Pódio & XP
                </Button>
                <Button
                  onClick={handleResetSession}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 font-bold text-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  Trocar Participantes
                </Button>

                <Button
                  onClick={handleResetSession}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-rose-400 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Zerar Tudo
                </Button>
              </div>
            )}
      </div>

      {/* SETUP (QUANDO NÃO HÁ SESSÃO ATIVA) */}
      {!session ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur-md shadow-xl">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <Layers className="w-4 h-4" /> 1. Configurar Miniliga
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Título / Identificação do Evento
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Miniliga Sábado Manhã"
                    className="mt-1 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                    <span>Quantidade de Participantes</span>
                    <span className="text-primary font-bold">
                      {selectedCount === 5 || selectedCount === 6
                        ? "1 Quadra"
                        : selectedCount === 12
                        ? "3 Quadras"
                        : "2 Quadras"}
                    </span>
                  </label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {([5, 6, 8, 10, 12] as MiniligaParticipantCount[]).map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setSelectedCount(count);
                          setCustomPlayers([]);
                          if (count === 6) setSelectedModel("rotativo_5jogos");
                          else if (count === 8 || count === 10) setSelectedModel("intergrupos");
                          else setSelectedModel("rotativo");
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedCount === count
                            ? "bg-primary text-primary-foreground border-primary font-black shadow-md shadow-primary/20 scale-105"
                            : "bg-muted/40 hover:bg-muted/70 text-foreground border-border/80 font-bold"
                        }`}
                      >
                        <span className="text-lg block leading-none">{count}</span>
                        <span className="text-[10px] block opacity-80 mt-1">Alunos</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCount === 6 && (
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Modelo para 6 Participantes
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div
                        onClick={() => setSelectedModel("rotativo_5jogos")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedModel === "rotativo_5jogos"
                            ? "bg-amber-500/15 border-amber-500/50 shadow-sm"
                            : "bg-muted/30 border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs text-amber-400">
                          <Flame className="w-3.5 h-3.5" /> 5 Jogos (Regra Marco Roza)
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          8 Rodadas • 5 jogos p/ todos + Dupla Sorteada na 8ª rodada (40 min)
                        </p>
                      </div>

                      <div
                        onClick={() => setSelectedModel("rotativo")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedModel === "rotativo"
                            ? "bg-primary/15 border-primary/50 shadow-sm"
                            : "bg-muted/30 border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs text-primary">
                          <RotateCcw className="w-3.5 h-3.5" /> 4 Jogos (Isonomia Direta)
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          6 Rodadas • 4 jogos e 2 folgas iguais para todos (30 min)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedCount === 8 || selectedCount === 10) && (
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Modelo de Disputa
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div
                        onClick={() => setSelectedModel("intergrupos")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedModel === "intergrupos"
                            ? "bg-amber-500/15 border-amber-500/50 shadow-sm"
                            : "bg-muted/30 border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs text-amber-400">
                          <Flame className="w-3.5 h-3.5" /> Intergrupos (Marco Roza)
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {selectedCount === 8
                            ? "Grupo 1 vs 2 • 12 rodadas (24 jogos)"
                            : "Grupo 1 vs 2 • 10 jogos (5 rodadas)"}
                        </p>
                      </div>

                      <div
                        onClick={() => setSelectedModel("rotativo")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedModel === "rotativo"
                            ? "bg-primary/15 border-primary/50 shadow-sm"
                            : "bg-muted/30 border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs text-primary">
                          <RotateCcw className="w-3.5 h-3.5" /> Rodízio Geral
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Todos contra todos rotativo
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1.5">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Regras Oficiais Aplicadas:
                  </div>
                  <div>• Tabela de todos os jogos na tela para preenchimento 1 por 1</div>
                  <div>• Pontuação Total = Pontos de Jogo (PP) + Vitórias</div>
                  <div>• Empate no topo = Partida Extra de Simples</div>
                  <div>• Tempo de sobra = Final Opcional (1º+3º vs 2º+4º)</div>
                  <div>• Modo Simulação seguro antes de efetivar no Real</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => handleStartMiniliga(true)}
                    disabled={customPlayers.length !== selectedCount}
                    size="lg"
                    className="w-full gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-black text-sm shadow-md"
                  >
                    <Dices className="w-4 h-4" />
                    Iniciar Simulação ({customPlayers.length}/{selectedCount})
                  </Button>

                  <Button
                    onClick={() => handleStartMiniliga(false)}
                    disabled={customPlayers.length !== selectedCount}
                    size="lg"
                    className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Iniciar Modo Real
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Card className="border-border/80 bg-card/70 backdrop-blur-md shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                    <Users className="w-4 h-4" /> 2. Selecionar {selectedCount} Alunos
                  </div>

                  <Button
                    onClick={handleAutoFillWithReplacements}
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs font-bold border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Preencher c/ Reposições
                  </Button>
                </div>

                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar aluno cadastrado ou digitar nome avulso..."
                  className="font-medium"
                />

                <div className="p-3 rounded-xl bg-background/50 border border-border/80 min-h-[140px]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                    Escalados para a Miniliga ({customPlayers.length}/{selectedCount}):
                  </span>

                  {customPlayers.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      Nenhum aluno adicionado ainda. Clique abaixo ou use o preenchimento automático.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customPlayers.map((player, idx) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/60 text-sm font-semibold text-foreground"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="truncate">{player.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePlayer(player.id)}
                            className="text-muted-foreground hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Sugestões de Alunos:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {filteredStudents.map((s) => {
                      const alreadyAdded = customPlayers.some((cp) => cp.studentId === s.id);
                      return (
                        <Button
                          key={s.id}
                          onClick={() => handleAddPlayer(s.nome, s.id)}
                          disabled={alreadyAdded || customPlayers.length >= selectedCount}
                          variant={alreadyAdded ? "secondary" : "outline"}
                          size="sm"
                          className="gap-1.5 text-xs font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {s.nome}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* MESA DE CONTROLE: GRADE DE TODOS OS JOGOS + CLASSIFICAÇÃO */
        <div className="space-y-6">
          {/* Seletor do Modo de Visualização dos Jogos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-foreground">
                Visualização dos Jogos:
              </span>
              <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/80">
                <Button
                  size="sm"
                  variant={matchViewMode === "todos" ? "default" : "ghost"}
                  className="h-8 text-xs font-bold gap-1.5"
                  onClick={() => setMatchViewMode("todos")}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  Todos os Jogos (1 por 1)
                </Button>
                <Button
                  size="sm"
                  variant={matchViewMode === "rodada" ? "default" : "ghost"}
                  className="h-8 text-xs font-bold gap-1.5"
                  onClick={() => setMatchViewMode("rodada")}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Foco na Rodada Ativa
                </Button>
              </div>
            </div>

            {/* Ações Especiais de Final */}
            <div className="flex items-center gap-2">
              {hasTieInFirstPlace && !session.hasTiebreakSimples && (
                <Button
                  onClick={handleAddTiebreakSimples}
                  className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-lg shadow-rose-600/20 text-xs animate-pulse"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" /> Desempate Simples (1º vs 2º)
                </Button>
              )}

              {!session.hasBonusFinal && (
                <Button
                  onClick={handleAddBonusFinal}
                  variant="outline"
                  className="gap-2 border-amber-500/50 text-amber-300 hover:bg-amber-500/10 font-bold text-xs"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Grande Final (1º+3º vs 2º+4º)
                </Button>
              )}
            </div>
          </div>

          {/* MODO 1: TODOS OS JOGOS NA TELA (O QUE VOCÊ PEDIU!) */}
          {matchViewMode === "todos" ? (
            <AllMatchesOverview
              matches={session.matches}
              participantsMap={participantsMap}
              onScoreChange={handleScoreChange}
              totalRounds={session.totalRounds}
            />
          ) : (
            /* MODO 2: FOCO NA RODADA COM CRONÔMETRO */
            <div className="space-y-6">
              <MatchTimer
                initialSeconds={session.durationSeconds}
                isActive={session.status === "em_andamento"}
                onTimeEnd={() => {
                  toast.info("Tempo de 5 minutos esgotado! Lance os placares da rodada.");
                }}
              />

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
                <Badge className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5">
                  Rodada {session.currentRound} de {session.totalRounds}
                </Badge>
                {session.currentRound < session.totalRounds && (
                  <Button
                    onClick={handleNextRound}
                    size="sm"
                    className="gap-1.5 font-bold text-xs"
                  >
                    Próxima Rodada <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentRoundMatches.map((match) => (
                  <CourtMatchCard
                    key={match.id}
                    match={match}
                    participantsMap={participantsMap}
                    onScoreChange={handleScoreChange}
                  />
                ))}
              </div>

              {restingPlayers.length > 0 && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-primary" />
                    Descansando nesta rodada:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {restingPlayers.map((rp) => (
                      <Badge key={rp.id} variant="outline" className="bg-background text-foreground font-semibold">
                        {rp.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TABELA DE CLASSIFICAÇÃO GERAL AO VIVO */}
          <MiniligaStandingsTable
            standings={session.participants}
            hasTiebreakWarning={hasTieInFirstPlace && !session.hasTiebreakSimples}
          />
        </div>
      )}

      {session && (
        <MiniligaSummaryModal
          open={summaryModalOpen}
          onOpenChange={setSummaryModalOpen}
          session={session}
          onDistributeCardPoints={handleDistributeCardPoints}
          isSavingPoints={isSavingPoints}
        />
      )}

      {/* MODAL DE HISTÓRICO E EDIÇÃO */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl bg-card border-border shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Histórico de Miniligas Salvas
            </DialogTitle>
          </DialogHeader>

          {historyList.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Nenhuma Miniliga salva no histórico ainda. Quando você concluir uma sessão no Modo Real ou salvar, ela aparecerá aqui para consulta e reedição!
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {historyList.map((h) => {
                const champ = h.participants[0];
                const vice = h.participants[1];
                return (
                  <div
                    key={h.id}
                    className="p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-foreground">
                          {h.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {h.participantCount} Atletas
                        </Badge>
                        {h.isSimulation && (
                          <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px]">
                            Simulação
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span>📅 {new Date(h.date).toLocaleDateString("pt-BR")}</span>
                        {champ && (
                          <span className="font-bold text-amber-400">
                            🥇 1º {champ.name} ({champ.totalScore} pts)
                          </span>
                        )}
                        {vice && (
                          <span className="text-slate-300">
                            🥈 2º {vice.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSession(h);
                          setHistoryOpen(false);
                          toast.success(`Miniliga "${h.title}" carregada na mesa para consulta e edição!`);
                        }}
                        className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground"
                      >
                        Reabrir / Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm(`Excluir "${h.title}" do histórico?`)) {
                            miniligaStorage.deleteFromHistory(h.id);
                            refreshHistory();
                            toast.info("Registro removido do histórico.");
                          }
                        }}
                        className="h-8 text-xs text-muted-foreground hover:text-rose-400 p-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
