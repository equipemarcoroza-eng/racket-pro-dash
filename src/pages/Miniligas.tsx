import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useAppContext } from "@/contexts/AppContext";
import {
  MiniligaSession,
  MiniligaParticipant,
  MiniligaParticipantCount,
  MiniligaModelType,
  MiniligaMatch,
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
import { MiniligaStandingsTable } from "@/components/miniliga/MiniligaStandingsTable";
import { MiniligaSummaryModal } from "@/components/miniliga/MiniligaSummaryModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Users,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function Miniligas() {
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

  // Auto-salvamento resiliente no localStorage e banco
  useEffect(() => {
    if (session) {
      miniligaStorage.saveActiveSession(session);
    }
  }, [session]);

  // Alunos com reposições pendentes para facilitar seleção rápida
  const pendingReplacementStudents = useMemo(() => {
    // Alunos com registro 'Falta'
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

    return students.filter((s) => (studentFaltasCount.get(s.id) || 0) > 0);
  }, [students, attendanceLogs]);

  // Filtragem de alunos para adicionar no setup
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students.slice(0, 8);
    return students
      .filter((s) => s.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 10);
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

  // Preencher com sugestão automática para agilizar testes ou uso real
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

    // Se ainda faltar, preenche com alunos ativos normais
    if (newItems.length < needed) {
      const remainingNeeded = needed - newItems.length;
      const otherStudents = students.filter(
        (s) =>
          !customPlayers.some((cp) => cp.studentId === s.id) &&
          !newItems.some((ni) => ni.studentId === s.id)
      );
      otherStudents.slice(0, remainingNeeded).forEach((s) => {
        newItems.push({
          id: `p-${s.id}`,
          name: s.nome,
          studentId: s.id,
        });
      });
    }

    setCustomPlayers((prev) => [...prev, ...newItems]);
    toast.success("Participantes preenchidos com sucesso!");
  };

  // INICIAR A MINILIGA
  const handleStartMiniliga = () => {
    if (customPlayers.length !== selectedCount) {
      toast.error(`Adicione exatamente ${selectedCount} participantes para iniciar.`);
      return;
    }

    // Gerar participantes formatados
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

    // Gerar os confrontos e rodadas pelo motor matemático
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
      durationSeconds: 300, // 5 minutos
      currentRound: 1,
      totalRounds,
      status: "em_andamento",
      participants,
      matches,
      hasBonusFinal: false,
      hasTiebreakSimples: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSession(newSession);
    miniligaStorage.saveActiveSession(newSession);
    toast.success(`Miniliga iniciada! Rodada 1 liberada na(s) ${courtsCount} quadra(s).`);
  };

  // Mapa de participantes para busca O(1)
  const participantsMap = useMemo(() => {
    const map = new Map<string, MiniligaParticipant>();
    if (!session) return map;
    session.participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [session]);

  // Jogos da rodada atual
  const currentRoundMatches = useMemo(() => {
    if (!session) return [];
    return session.matches.filter((m) => m.roundNumber === session.currentRound);
  }, [session]);

  // Quem está folgando na rodada atual
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

  // Atualizar placar de um jogo
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

    // Recalcular classificação em tempo real!
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

  // Avançar para a próxima rodada
  const handleNextRound = () => {
    if (!session) return;

    // Verificar se todos os jogos da rodada foram preenchidos
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
      // Todas as rodadas normais foram concluídas!
      setSession({
        ...session,
        status: "aguardando_final",
        updatedAt: new Date().toISOString(),
      });
      toast.success("Rodadas principais concluídas! Veja a classificação ou dispute a Final!");
    }
  };

  // Verificar empate na liderança
  const hasTieInFirstPlace = useMemo(() => {
    if (!session || session.participants.length < 2) return false;
    const p1 = session.participants[0];
    const p2 = session.participants[1];
    return p1.totalScore === p2.totalScore && p1.totalScore > 0;
  }, [session]);

  // ADICIONAR PARTIDA EXTRA DE SIMPLES (1º vs 2º)
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

  // ADICIONAR GRANDE FINAL (1º+3º vs 2º+4º)
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

  // DISTRIBUIR PONTOS NO ATHLETE CARD & DAR BAIXA EM REPOSIÇÃO
  const handleDistributeCardPoints = async () => {
    if (!session) return;
    setIsSavingPoints(true);

    try {
      // Grava histórico
      miniligaStorage.saveToHistory({
        ...session,
        status: "finalizada",
      });

      // Se houver alunos linkados no sistema, registrar presença tipo "Miniliga"
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

  // REINICIAR / CRIAR NOVA MINILIGA
  const handleResetSession = () => {
    if (window.confirm("Deseja realmente encerrar e iniciar uma nova Miniliga?")) {
      miniligaStorage.clearActiveSession();
      setSession(null);
      setCustomPlayers([]);
      toast.info("Pronto para configurar uma nova Miniliga!");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Helmet>
        <title>Miniligas de Reposição | Equipe Marco Roza</title>
        <meta
          name="description"
          content="Gerenciador oficial de Miniligas de reposição e torneios express da Equipe Marco Roza Beach Tennis."
        />
      </Helmet>

      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20">
            <Trophy className="w-7 h-7 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              Miniligas Marco Roza
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                Torneio Express & Reposição
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gestão automatizada de rodízios, baterias de 5 minutos e pontuação para o Card do Atleta
            </p>
          </div>
        </div>

        {session && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSummaryModalOpen(true)}
              variant="outline"
              className="gap-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-bold"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Ver Pódio
            </Button>
            <Button
              onClick={handleResetSession}
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-rose-400"
            >
              <RotateCcw className="w-4 h-4" />
              Nova Miniliga
            </Button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SE NÃO HOUVER SESSÃO ATIVA: TELA DE CONFIGURAÇÃO (SETUP) */}
      {/* ========================================================= */}
      {!session ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Parâmetros */}
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

                {/* Seleção do Número de Participantes */}
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

                {/* Se for 8 ou 10 alunos: SELETOR DE MODELO */}
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
                            ? "Grupo 1 vs 2 • 12 jogos"
                            : "Grupo 1 vs 2 • 10 jogos"}
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

                {/* Resumo das Regras */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1.5">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Regras Oficiais Aplicadas:
                  </div>
                  <div>• Baterias de 5 minutos por rodada</div>
                  <div>• Pontuação Total = Pontos de Jogo (PP) + Vitórias</div>
                  <div>• Empate no topo = Partida Extra de Simples</div>
                  <div>• Tempo de sobra = Final Opcional (1º+3º vs 2º+4º)</div>
                  <div>• Crédito automático de XP no Card por colocação</div>
                </div>

                <Button
                  onClick={handleStartMiniliga}
                  disabled={customPlayers.length !== selectedCount}
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base shadow-lg shadow-emerald-600/20 h-12"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Iniciar Miniliga ({customPlayers.length}/{selectedCount})
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Seleção de Alunos */}
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

                {/* Input de busca rápida */}
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar aluno cadastrado ou digitar nome avulso..."
                  className="font-medium"
                />

                {/* Lista de alunos adicionados */}
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

                {/* Sugestões de Alunos Disponíveis */}
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
        /* ========================================================= */
        /* SESSÃO ATIVA: MESA DE CONTROLE AO VIVO DA MINILIGA         */
        /* ========================================================= */
        <div className="space-y-6">
          {/* CRONÔMETRO CENTRAL */}
          <MatchTimer
            initialSeconds={session.durationSeconds}
            isActive={session.status === "em_andamento"}
            onTimeEnd={() => {
              toast.info("Tempo de 5 minutos esgotado! Lance os placares da rodada.");
            }}
          />

          {/* BANNER DA RODADA ATUAL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground font-black text-sm px-3 py-1">
                Rodada {session.currentRound} de {session.totalRounds}
              </Badge>
              <span className="text-sm font-bold text-foreground">
                {session.title} • {session.participantCount} Atletas ({session.courtsCount} Quadra(s))
              </span>
            </div>

            {/* Ações da Rodada */}
            <div className="flex items-center gap-2">
              {session.currentRound < session.totalRounds ? (
                <Button
                  onClick={handleNextRound}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
                >
                  Próxima Rodada <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Se houver empate em 1º, destaca o botão de desempate */}
                  {hasTieInFirstPlace && !session.hasTiebreakSimples && (
                    <Button
                      onClick={handleAddTiebreakSimples}
                      className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-lg shadow-rose-600/20 animate-pulse"
                    >
                      <Zap className="w-4 h-4 fill-current" /> Desempate Simples (1º vs 2º)
                    </Button>
                  )}

                  {/* Se sobrou tempo, botão da Grande Final Opcional */}
                  {!session.hasBonusFinal && (
                    <Button
                      onClick={handleAddBonusFinal}
                      variant="outline"
                      className="gap-2 border-amber-500/50 text-amber-300 hover:bg-amber-500/10 font-bold"
                    >
                      <Trophy className="w-4 h-4 text-amber-400" />
                      Grande Final (1º+3º vs 2º+4º)
                    </Button>
                  )}

                  <Button
                    onClick={() => setSummaryModalOpen(true)}
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-lg shadow-amber-500/20"
                  >
                    <Trophy className="w-4 h-4" />
                    Ver Pódio e Concluir
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* QUADRAS ATIVAS DA RODADA */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Quadras em Disputa (Rodada {session.currentRound})
            </h3>
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
          </div>

          {/* BANCO DE DESCANSO / FOLGA (Se houver) */}
          {restingPlayers.length > 0 && (
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3 text-xs">
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

          {/* TABELA DE CLASSIFICAÇÃO GERAL AO VIVO */}
          <MiniligaStandingsTable
            standings={session.participants}
            hasTiebreakWarning={hasTieInFirstPlace && !session.hasTiebreakSimples}
          />
        </div>
      )}

      {/* MODAL DE RESUMO, PÓDIO E DISTRIBUIÇÃO DE PONTOS */}
      {session && (
        <MiniligaSummaryModal
          open={summaryModalOpen}
          onOpenChange={setSummaryModalOpen}
          session={session}
          onDistributeCardPoints={handleDistributeCardPoints}
          isSavingPoints={isSavingPoints}
        />
      )}
    </div>
  );
}
