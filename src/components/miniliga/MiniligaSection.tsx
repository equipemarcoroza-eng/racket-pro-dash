import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import {
  MiniligaSession,
  MiniligaParticipant,
  MiniligaParticipantCount,
  MiniligaModelType,
  formatLocalDate,
} from "@/types/miniliga";
import {
  generateMiniligaMatches,
  recalculateMiniligaStandings,
  createBonusFinalMatch,
  createTiebreakSimplesMatch,
  get8PlayersCycleInfo,
  get10PlayersCycleInfo,
  create10PlayersSemifinalsMatches,
  create10PlayersFinalMatch,
} from "@/lib/miniliga-engine";
import { miniligaStorage, MiniligaCloudStatus } from "@/lib/miniliga-storage";
import { MatchTimer } from "@/components/miniliga/MatchTimer";
import { CourtMatchCard } from "@/components/miniliga/CourtMatchCard";
import { AllMatchesOverview } from "@/components/miniliga/AllMatchesOverview";
import { MiniligaStandingsTable } from "@/components/miniliga/MiniligaStandingsTable";
import { MiniligaSummaryModal } from "@/components/miniliga/MiniligaSummaryModal";
import { MiniligaImportModal } from "@/components/miniliga/MiniligaImportModal";
import { MiniligaGuestsPanel } from "@/components/miniliga/MiniligaGuestsPanel";

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
  Cloud,
  LogOut,
  FileSpreadsheet,
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
  const [cloudStatus, setCloudStatus] = useState<MiniligaCloudStatus>("salvo");

  // Modo de visualização de jogos: "todos" (visão panorâmica de 1 por 1) ou "rodada" (foco com cronômetro)
  const [matchViewMode, setMatchViewMode] = useState<"todos" | "rodada">("todos");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<MiniligaSession[]>(() => miniligaStorage.getHistory());
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<"quadra" | "convidados">("quadra");

  const refreshHistory = () => {
    setHistoryList(miniligaStorage.getHistory());
    miniligaStorage.fetchCloudHistory().then((cloudHistory) => {
      if (cloudHistory && cloudHistory.length > 0) {
        setHistoryList(cloudHistory);
      }
    });
  };

  // Carregamento e sincronização com Lovable Cloud (Supabase) na inicialização
  useEffect(() => {
    miniligaStorage.fetchCloudHistory().then((cloudHistory) => {
      if (cloudHistory && cloudHistory.length > 0) {
        setHistoryList(cloudHistory);
      }
    });

    miniligaStorage.fetchCloudActiveSession().then((cloudSession) => {
      if (cloudSession) {
        setSession((prev) => {
          if (!prev) return cloudSession;
          if (prev.isSimulation) return prev;
          if (new Date(cloudSession.updatedAt) > new Date(prev.updatedAt)) {
            return cloudSession;
          }
          return prev;
        });
      }
    });

    miniligaStorage.setStatusListener(setCloudStatus);

    // Tempo real: placares lançados em outro aparelho aparecem aqui sem recarregar
    const unsubscribe = miniligaStorage.subscribe({
      onUpsert: (remote) => {
        setSession((prev) => {
          if (prev?.isSimulation) return prev;
          if (!prev) return remote.status === "finalizada" ? prev : remote;
          if (prev.id !== remote.id) {
            // Outra Miniliga real começou em outro aparelho: assume se a mesa daqui já terminou
            return prev.status === "finalizada" && remote.status !== "finalizada" ? remote : prev;
          }
          return new Date(remote.updatedAt) > new Date(prev.updatedAt) ? remote : prev;
        });
        if (remote.status === "finalizada") refreshHistory();
      },
      onDelete: (id) => {
        setSession((prev) => (prev && !prev.isSimulation && prev.id === id ? null : prev));
        setHistoryList((prev) => prev.filter((h) => h.id !== id));
      },
    });

    return () => {
      unsubscribe();
      miniligaStorage.setStatusListener(null);
    };
  }, []);

  // Auto-salvamento resiliente (Local + Lovable Cloud em Modo Real)
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
    return (
      p1.wins === p2.wins &&
      p1.pointsBalance === p2.pointsBalance &&
      p1.pointsFor === p2.pointsFor &&
      p1.pointsAgainst === p2.pointsAgainst &&
      p1.wins > 0
    );
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

  const handleAdd10PSemifinals = () => {
    if (!session) return;
    const nextRound = session.totalRounds + 1;
    const semis = create10PlayersSemifinalsMatches(session.participants, nextRound);

    if (semis.length < 2) {
      toast.error("Não há participantes suficientes nos Grupos A e B para as Semifinais.");
      return;
    }

    setSession({
      ...session,
      totalRounds: nextRound,
      currentRound: nextRound,
      matches: [...session.matches, ...semis],
      hasSemifinais: true,
      status: "em_andamento",
      updatedAt: new Date().toISOString(),
    });

    toast.success("🏆 Semifinais (1ºA+1ªB vs 4ºA+4ªB e 2ºA+2ªB vs 3ºA+3ªB) criadas nas Quadras 1 e 2!");
  };

  const handleAdd10PFinal = () => {
    if (!session) return;
    const semiMatches = session.matches.filter((m) => m.isSemifinal);
    if (semiMatches.length < 2 || !semiMatches.every((m) => m.isCompleted)) {
      toast.error("Preencha os resultados das duas Semifinais antes de gerar a Grande Final.");
      return;
    }

    const nextRound = session.totalRounds + 1;
    const finalMatch = create10PlayersFinalMatch(semiMatches[0], semiMatches[1], nextRound);
    if (!finalMatch) {
      toast.error("Erro ao gerar a Grande Final.");
      return;
    }

    setSession({
      ...session,
      totalRounds: nextRound,
      currentRound: nextRound,
      matches: [...session.matches, finalMatch],
      hasBonusFinal: true,
      status: "em_andamento",
      updatedAt: new Date().toISOString(),
    });

    toast.success("🏆 Grande Final (Vencedores das Semis) criada na Quadra 1!");
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
      if (
        window.confirm(
          "Esta Miniliga está em Modo Sandbox (Simulação).\n\nDeseja salvar e arquivar o resultado da simulação no histórico local?"
        )
      ) {
        const finalizedSession: MiniligaSession = {
          ...session,
          status: "finalizada",
          updatedAt: new Date().toISOString(),
        };
        miniligaStorage.saveToHistory(finalizedSession);
        miniligaStorage.saveActiveSession(finalizedSession);
        setSession(finalizedSession);
        refreshHistory();
        toast.success("Sessão de simulação arquivada com sucesso!");
      }
      return;
    }

    const linkedCount = session.participants.filter((p) => p.studentId).length;
    const confirmSave = window.confirm(
      `🏆 CONFIRMAR VALIDAÇÃO NO LOVABLE CLOUD:\n\n` +
      `Deseja realmente salvar e validar esta Miniliga Oficial?\n\n` +
      `• O torneio será gravado permanentemente na base de dados do Lovable Cloud.\n` +
      `• Serão computadas presenças e pontos nos Cards de ${linkedCount} atletas vinculados.\n\n` +
      `Clique em OK para Salvar ou em Cancelar para revisar os placares.`
    );
    if (!confirmSave) return;

    setIsSavingPoints(true);
    try {
      const finalizedSession: MiniligaSession = {
        ...session,
        status: "finalizada",
        updatedAt: new Date().toISOString(),
      };

      // Só segue se a nuvem confirmar a gravação
      await miniligaStorage.saveCloudNow(finalizedSession);
      miniligaStorage.saveToHistory(finalizedSession);
      miniligaStorage.saveActiveSession(finalizedSession);

      const todayIso = new Date().toISOString().split("T")[0];
      const newAttendanceLogs = session.participants
        .filter((p) => p.studentId)
        .map((p) => ({
          id: crypto.randomUUID(),
          alunoId: p.studentId!,
          turmaId: "miniliga",
          data: todayIso,
          presente: "Miniliga" as const,
          dataRealizacao: todayIso,
          motivoCancelamento: `Miniliga: ${p.rank}º lugar (+${p.cardPointsAwarded} pts no Card)`,
          miniligaSessionId: session.id,
          miniligaPontos: p.cardPointsAwarded,
        }));

      // Validar de novo (após reabrir) substitui os créditos anteriores desta Miniliga
      setAttendanceLogs((prev) => [
        ...prev.filter((l) => l.miniligaSessionId !== session.id),
        ...newAttendanceLogs,
      ]);

      setSession(finalizedSession);
      refreshHistory();
      toast.success(
        `🏆 Miniliga validada! Torneio e pontos dos ${newAttendanceLogs.length} atletas vinculados gravados no Lovable Cloud.`
      );
    } catch (e) {
      console.error("Erro ao validar Miniliga no Lovable Cloud:", e);
      toast.error(
        "Não foi possível gravar no Lovable Cloud. Nada foi creditado; confira a conexão e tente validar de novo."
      );
    } finally {
      setIsSavingPoints(false);
    }
  };

  const handleReopenSession = () => {
    if (!session) return;
    if (
      window.confirm(
        "Deseja reabrir esta Miniliga para editar placares ou corrigir algum confronto?\n\nApós os ajustes, você poderá validar e salvar novamente no Lovable Cloud."
      )
    ) {
      const reopenedSession: MiniligaSession = {
        ...session,
        status: "em_andamento",
        updatedAt: new Date().toISOString(),
      };
      setSession(reopenedSession);
      miniligaStorage.saveActiveSession(reopenedSession);
      toast.info("Miniliga reaberta para edições. Corrija os placares necessários e valide novamente!");
    }
  };

  const handleExitSession = () => {
    // Desocupa a mesa de trabalho com total segurança: a Miniliga permanece gravada no Histórico e na Nuvem
    miniligaStorage.clearActiveSession(session);
    setSession(null);
    setCustomPlayers([]);
    toast.success("Mesa liberada! A Miniliga permanece salva com segurança no Histórico e no Lovable Cloud.");
  };

  const handleResetSession = () => {
    if (session?.status === "finalizada") {
      handleExitSession();
      return;
    }

    if (
      window.confirm(
        "⚠️ ATENÇÃO: Deseja realmente zerar a Miniliga em andamento?\n\nOs dados da sessão ativa, placares registrados e a escalação atual dos participantes serão limpos."
      )
    ) {
      miniligaStorage.clearActiveSession(session);
      setSession(null);
      setCustomPlayers([]);
      toast.info("Dados da Miniliga limpos com sucesso. Pronto para iniciar uma nova configuração!");
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
                <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/40 font-extrabold text-xs">
                  🧪 Modo Sandbox (Local)
                </Badge>
              ) : (
                <Badge
                  className={`font-extrabold text-xs flex items-center gap-1.5 shadow-sm border ${
                    session && cloudStatus === "erro"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  }`}
                >
                  <Cloud
                    className={`w-3.5 h-3.5 ${
                      session && cloudStatus === "salvando" ? "animate-pulse" : ""
                    }`}
                  />
                  Modo Real Oficial • Lovable Cloud
                  {session && (
                    <span className="font-semibold opacity-80">
                      {cloudStatus === "salvando"
                        ? "· salvando..."
                        : cloudStatus === "erro"
                        ? "· falha ao salvar"
                        : "· salvo"}
                    </span>
                  )}
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Grade com todos os jogos na tela, preenchimento 1 por 1 e pontuação em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setImportModalOpen(true)}
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Importar Planilha (.xlsx)
          </Button>

          <Button
            onClick={() => {
              refreshHistory();
              setHistoryOpen(true);
            }}
            variant="outline"
            size="sm"
            className="gap-1.5 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Histórico ({historyList.length})
          </Button>

          <Button
            onClick={() => setActiveView((prev) => (prev === "convidados" ? "quadra" : "convidados"))}
            variant={activeView === "convidados" ? "default" : "outline"}
            size="sm"
            className={`gap-1.5 font-black text-xs transition-all ${
              activeView === "convidados"
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/25 border border-amber-500"
                : "border-2 border-amber-500/60 text-amber-900 dark:text-amber-300 hover:bg-amber-500/10"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Visitantes & Leads
          </Button>
        </div>

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
                  onClick={handleExitSession}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs"
                  title="Fechar visualização e voltar para a tela inicial de Miniligas"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {session.status === "finalizada" ? "Sair da Miniliga" : "Liberar Mesa"}
                </Button>

                {session.status !== "finalizada" && (
                  <>
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
                  </>
                )}
              </div>
            )}
      </div>

      {/* VISTA DE CONVIDADOS / LEADS OU MESA DE MINILIGA */}
      {activeView === "convidados" ? (
        <MiniligaGuestsPanel
          sessions={historyList}
          onRefresh={refreshHistory}
        />
      ) : !session ? (
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
                            ? "Grupo 1 vs 2 • 4 Rodadas Oficiais (12 baterias • 24 jogos)"
                            : "Grupo A vs B • 6 Rodadas (14 baterias • 26 jogos • Semis e Final)"}
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

                {selectedCount === 12 && (
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="flex items-center gap-1.5 font-black text-xs text-primary">
                        <Flame className="w-3.5 h-3.5 text-amber-400" /> 11 Rodadas Completas (Regra Oficial Marco Roza)
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        3 Quadras simultâneas • 33 jogos • Todos os 12 alunos jogam com todos os outros 11 alunos rigorosamente sem repetição de duplas ou confrontos.
                      </p>
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
          {/* Banner de Operação Validada no Lovable Cloud */}
          {session.status === "finalizada" && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-card border-2 border-emerald-500/50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500 text-black font-black shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    Miniliga Finalizada e Validada no Lovable Cloud!
                    <Badge className="bg-emerald-500 text-black font-extrabold text-[10px]">
                      Salvo na Nuvem
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Os pontos foram computados nos cartões dos atletas e o histórico está disponível em todos os aparelhos.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setSummaryModalOpen(true)}
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-black font-black shadow-md text-xs"
                >
                  <Trophy className="w-4 h-4 fill-current" />
                  Ver Pódio & WhatsApp
                </Button>
                <Button
                  onClick={handleReopenSession}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-border/80 text-foreground hover:bg-muted font-bold text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reabrir para Ajustes
                </Button>
                <Button
                  onClick={handleExitSession}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs"
                  title="Fechar a visualização desta Miniliga e liberar a mesa para o próximo uso"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair da Miniliga / Liberar Mesa
                </Button>
                <Button
                  onClick={handleExitSession}
                  size="sm"
                  className="gap-1.5 bg-primary text-primary-foreground font-bold text-xs shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Miniliga
                </Button>
              </div>
            </div>
          )}

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

            {/* Ações Especiais de Final / Playoffs */}
            <div className="flex items-center gap-2 flex-wrap">
              {session.participantCount === 10 && session.modelType === "intergrupos" ? (
                <>
                  {!session.hasSemifinais && (
                    <Button
                      onClick={handleAdd10PSemifinals}
                      className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold shadow-lg shadow-purple-600/20 text-xs"
                    >
                      <Trophy className="w-3.5 h-3.5 fill-current" />
                      Iniciar Semifinais (1ºA+1ªB vs 4ºA+4ªB e 2ºA+2ªB vs 3ºA+3ªB)
                    </Button>
                  )}
                  {session.hasSemifinais && !session.hasBonusFinal && (
                    <Button
                      onClick={handleAdd10PFinal}
                      className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-extrabold shadow-lg shadow-amber-500/20 text-xs animate-pulse"
                    >
                      <Trophy className="w-3.5 h-3.5 fill-current" />
                      Gerar Grande Final (Vencedores das Semis)
                    </Button>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* CRONÔMETRO OFICIAL DOS JOGOS (Visível e persistente em ambos os modos) */}
          {session.status !== "finalizada" && (
            <MatchTimer
              initialSeconds={session.durationSeconds}
              isActive={session.status === "em_andamento"}
              onTimeEnd={() => {
                toast.info("Tempo de 5 minutos esgotado! Lance os placares da rodada.");
              }}
            />
          )}

          {/* MODO 1: TODOS OS JOGOS NA TELA (O QUE VOCÊ PEDIU!) */}
          {matchViewMode === "todos" ? (
            <AllMatchesOverview
              matches={session.matches}
              participantsMap={participantsMap}
              participants={session.participants}
              onScoreChange={handleScoreChange}
              totalRounds={session.totalRounds}
              modelType={session.modelType}
              participantCount={session.participantCount}
            />
          ) : (
            /* MODO 2: FOCO NA RODADA */
            <div className="space-y-6">
              {session.participantCount === 8 && session.modelType === "intergrupos" ? (() => {
                const isPlayoff = session.currentRound > 12;

                if (isPlayoff) {
                  const isFinal = session.matches.some(m => m.roundNumber === session.currentRound && m.isBonusFinal);
                  return (
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-amber-500 text-black font-black text-xs px-3 py-1 uppercase shadow">
                            {isFinal ? "🏆 GRANDE FINAL (PLAYOFFS)" : "🏆 JOGO EXTRA DE DESEMPATE"}
                          </Badge>
                          <span className="text-xs font-semibold text-zinc-400">
                            Rodada {session.currentRound} de {session.totalRounds}
                          </span>
                        </div>
                        {session.currentRound < session.totalRounds && (
                          <Button
                            onClick={handleNextRound}
                            size="sm"
                            className="gap-1.5 font-bold text-xs bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
                          >
                            Próxima Rodada <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300">
                        {isFinal
                          ? "Grande Final Cruzada: 1º+3º vs 2º+4º disputando o título da Miniliga!"
                          : "Partida de desempate simples entre os líderes."}
                      </p>
                    </div>
                  );
                }

                const cycleInfo = get8PlayersCycleInfo(session.currentRound);
                return (
                  <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-white text-black font-black text-xs px-3 py-1 uppercase shadow">
                          RODADA OFICIAL {cycleInfo.oficialRound} DE 4
                        </Badge>
                        <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs px-2.5 py-1">
                          ⚡ Bateria {cycleInfo.bateriaIndex} de 3
                        </Badge>
                        <span className="text-xs font-semibold text-zinc-400">
                          Entrada Geral {session.currentRound} de {session.totalRounds}
                        </span>
                      </div>

                      {session.currentRound < session.totalRounds && (
                        <Button
                          onClick={handleNextRound}
                          size="sm"
                          className="gap-1.5 font-bold text-xs bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
                        >
                          Próxima Bateria <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Sub-banner das duplas desta rodada oficial */}
                    <div className="flex items-center gap-2 overflow-x-auto pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex-shrink-0 flex items-center gap-1">
                        <Users className="w-3 h-3 text-amber-400" /> Duplas Desta Rodada:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cycleInfo.pairsDescription.map((pair, pIdx) => {
                          const p1 = session.participants[pair.p1Index];
                          const p2 = session.participants[pair.p2Index];
                          return (
                            <span
                              key={pIdx}
                              className="text-[11px] font-semibold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-zinc-300"
                            >
                              <strong className="text-amber-400 mr-1">
                                {pair.codeA}+{pair.codeB}
                              </strong>
                              {p1 ? p1.name.split(" ")[0] : pair.codeA}&{p2 ? p2.name.split(" ")[0] : pair.codeB}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })() : session.participantCount === 10 && session.modelType === "intergrupos" ? (() => {
                const isPlayoff = session.currentRound > 14;
                const cycleInfo = get10PlayersCycleInfo(session.currentRound);

                if (isPlayoff) {
                  const isFinal = session.matches.some(m => m.roundNumber === session.currentRound && m.isBonusFinal);
                  return (
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-amber-500 text-black font-black text-xs px-3 py-1 uppercase shadow">
                            {isFinal ? "🏆 GRANDE FINAL (PLAYOFFS)" : "🏆 SEMIFINAIS (PLAYOFFS)"}
                          </Badge>
                        </div>
                        {session.currentRound < session.totalRounds && (
                          <Button
                            onClick={handleNextRound}
                            size="sm"
                            className="gap-1.5 font-bold text-xs bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
                          >
                            Próxima Rodada <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300">
                        {isFinal
                          ? "Disputa pelo título de Dupla Campeã da Mini Liga Marco Roza!"
                          : "1ºA+1ªB vs 4ºA+4ªB (Quadra 1) e 2ºA+2ªB vs 3ºA+3ªB (Quadra 2)."}
                      </p>
                    </div>
                  );
                }

                if (cycleInfo.type === "sorteio") {
                  return (
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-sky-950/40 border border-sky-500/40">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-sky-500 text-black font-black text-xs px-3 py-1 uppercase shadow gap-1">
                            <Dices className="w-3.5 h-3.5" /> JOGO EXTRA DE SORTEIO
                          </Badge>
                          <span className="text-xs font-semibold text-zinc-400">
                            Entrada Geral {session.currentRound} de {session.totalRounds}
                          </span>
                        </div>
                        {session.currentRound < session.totalRounds && (
                          <Button
                            onClick={handleNextRound}
                            size="sm"
                            className="gap-1.5 font-bold text-xs bg-sky-500 hover:bg-sky-600 text-black font-extrabold"
                          >
                            Próxima Entrada <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-sky-200">
                        Confronto de reposição: a dupla A5/B4 entra em quadra contra a dupla sorteada de apoio para fechar a meta de 10 jogos.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-white text-black font-black text-xs px-3 py-1 uppercase shadow">
                          RODADA OFICIAL {cycleInfo.oficialRound} DE 6
                        </Badge>
                        <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs px-2.5 py-1">
                          ⚡ Bateria {cycleInfo.bateriaIndex} de 2
                        </Badge>
                        <span className="text-xs font-semibold text-zinc-400">
                          Entrada Geral {session.currentRound} de {session.totalRounds}
                        </span>
                      </div>

                      {session.currentRound < session.totalRounds && (
                        <Button
                          onClick={handleNextRound}
                          size="sm"
                          className="gap-1.5 font-bold text-xs bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
                        >
                          Próxima Bateria <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Sub-banner das duplas desta rodada oficial e folga */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-400" /> Duplas:
                        </span>
                        {cycleInfo.pairsDescription.map((pair, pIdx) => {
                          const p1 = session.participants[pair.p1Index];
                          const p2 = session.participants[pair.p2Index];
                          return (
                            <span
                              key={pIdx}
                              className="text-[11px] font-semibold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-zinc-300"
                            >
                              <strong className="text-amber-400 mr-1">{pair.codeA}+{pair.codeB}</strong>
                              {p1 ? p1.name.split(" ")[0] : pair.codeA}&{p2 ? p2.name.split(" ")[0] : pair.codeB}
                            </span>
                          );
                        })}
                      </div>

                      {cycleInfo.restingDescription && (
                        <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg self-start sm:self-auto">
                          💤 Folgam: [{cycleInfo.restingDescription.codeA}] {session.participants[cycleInfo.restingDescription.p1Index]?.name.split(" ")[0]} & [{cycleInfo.restingDescription.codeB}] {session.participants[cycleInfo.restingDescription.p2Index]?.name.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5">
                      Rodada {session.currentRound} de {session.totalRounds}
                    </Badge>
                  </div>
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
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentRoundMatches.map((match) => (
                  <CourtMatchCard
                    key={match.id}
                    match={match}
                    participantsMap={participantsMap}
                    participants={session.participants}
                    modelType={session.modelType}
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
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          📅 {formatLocalDate(h.date)}
                        </span>
                        {champ && (
                          <span className="font-bold text-amber-500 dark:text-amber-400">
                            🥇 1º {champ.name} ({champ.wins ?? 0} {(champ.wins ?? 0) === 1 ? "vitória" : "vitórias"})
                          </span>
                        )}
                        {vice && (
                          <span className="text-slate-600 dark:text-slate-300 font-semibold">
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
                        onClick={async () => {
                          if (
                            window.confirm(
                              `Excluir "${h.title}" do histórico?${
                                h.isSimulation ? "" : "\n\nOs pontos desta Miniliga também saem dos Cards dos atletas."
                              }`
                            )
                          ) {
                            try {
                              await miniligaStorage.deleteFromHistory(h);
                              if (!h.isSimulation) {
                                setAttendanceLogs((prev) =>
                                  prev.filter((l) => l.miniligaSessionId !== h.id)
                                );
                              }
                              if (session?.id === h.id) {
                                miniligaStorage.clearActiveSession(null);
                                setSession(null);
                              }
                              refreshHistory();
                              toast.info("Registro removido do histórico.");
                            } catch (e) {
                              console.error("Erro ao excluir Miniliga do Lovable Cloud:", e);
                              toast.error("Não foi possível excluir no Lovable Cloud. Tente novamente.");
                            }
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

      {/* MODAL DE IMPORTAÇÃO DE PLANILHA */}
      <MiniligaImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={() => {
          refreshHistory();
          setActiveView("convidados");
        }}
      />
    </div>
  );
};
