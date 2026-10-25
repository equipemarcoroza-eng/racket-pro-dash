import React, { useState, useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { MiniligaSession, MiniligaParticipant, MiniligaMatch, formatLocalDate } from "@/types/miniliga";
import {
  PREPARSED_MARCO_ROZA_MINILIGAS,
  ParsedTournamentData,
  matchStudentByName,
  KNOWN_OFFICIAL_GUESTS,
} from "@/lib/miniliga-excel-parser";
import { miniligaStorage } from "@/lib/miniliga-storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  CheckCircle2,
  Trophy,
  Users,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface MiniligaImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export const MiniligaImportModal: React.FC<MiniligaImportModalProps> = ({
  open,
  onOpenChange,
  onImportComplete,
}) => {
  const { students, setAttendanceLogs } = useAppContext();
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mapeamento manual / ajustes feitos pelo usuário na tela: { "sheetName-playerName": { studentId, isGuest } }
  const [overrides, setOverrides] = useState<{
    [key: string]: { studentId: string | null; isGuest: boolean };
  }>({});

  // Ordenar lista de alunos para o select
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [students]);

  // Mapear cada torneio pré-analisado com os alunos atuais do sistema + overrides do usuário
  const preparedTournaments = useMemo(() => {
    return PREPARSED_MARCO_ROZA_MINILIGAS.map((t) => {
      const participantsWithStudents = t.participants.map((p) => {
        const key = `${t.sheetName}-${p.name}`;
        const manual = overrides[key];

        if (manual) {
          const matched = students.find((s) => s.id === manual.studentId);
          return {
            ...p,
            studentId: manual.studentId,
            matchedStudentName: matched?.nome,
            isGuest: manual.isGuest,
          };
        }

        // Se for comprovadamente um dos convidados oficiais indicados pelo Marco Roza
        const pClean = p.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();

        if (KNOWN_OFFICIAL_GUESTS.has(pClean)) {
          return {
            ...p,
            studentId: null,
            matchedStudentName: undefined,
            isGuest: true,
          };
        }

        // Procura match inteligente entre os alunos
        const matched = matchStudentByName(p.name, students);
        return {
          ...p,
          studentId: matched?.id || null,
          matchedStudentName: matched?.nome,
          // Se não encontrou de imediato, NÃO joga como convidado automaticamente se for aluno
          isGuest: false,
        };
      });

      return {
        ...t,
        participantsWithStudents,
      };
    });
  }, [students, overrides]);

  const currentTournament = preparedTournaments[selectedSheetIndex];

  // Tratar alteração do select de cada participante
  const handleSelectStudent = (
    sheetName: string,
    playerName: string,
    selectedValue: string
  ) => {
    const key = `${sheetName}-${playerName}`;
    if (selectedValue === "guest") {
      setOverrides((prev) => ({
        ...prev,
        [key]: { studentId: null, isGuest: true },
      }));
    } else if (selectedValue === "unlinked") {
      setOverrides((prev) => ({
        ...prev,
        [key]: { studentId: null, isGuest: false },
      }));
    } else {
      setOverrides((prev) => ({
        ...prev,
        [key]: { studentId: selectedValue, isGuest: false },
      }));
    }
  };

  const handleImportAll = async () => {
    setIsProcessing(true);
    try {
      const newAttendanceLogs: any[] = [];

      for (let i = 0; i < preparedTournaments.length; i++) {
        const t = preparedTournaments[i];
        const sessionId = `import-mr-${t.date}-${t.participantCount}p-${i}`;

        // 1. Montar lista de participantes com IDs únicos
        const sessionParticipants: MiniligaParticipant[] = t.participantsWithStudents.map(
          (p, idx) => ({
            id: `p-${sessionId}-${idx + 1}`,
            studentId: p.studentId || null,
            name: p.name,
            groupNumber: idx < t.participantsWithStudents.length / 2 ? 1 : 2,
            assignedNumber: idx + 1,
            matchesPlayed: p.wins + p.losses,
            wins: p.wins,
            losses: p.losses,
            pointsFor: p.pointsFor,
            pointsAgainst: p.pointsAgainst,
            pointsBalance: p.pointsBalance,
            totalScore: p.pointsFor + p.wins,
            rank: p.rank,
            cardPointsAwarded: p.cardPointsAwarded,
            isGuest: p.isGuest,
            leadStatus: p.isGuest ? "novo" : undefined,
          })
        );

        // 2. Montar lista de partidas
        const sessionMatches: MiniligaMatch[] = t.matches.map((m) => {
          const findPId = (name?: string) => {
            if (!name) return "";
            const found = sessionParticipants.find(
              (sp) => sp.name.trim().toLowerCase() === name.trim().toLowerCase()
            );
            return found?.id || `p-${name}`;
          };

          return {
            id: `match-${sessionId}-${m.id}`,
            roundNumber: m.roundNumber,
            courtNumber: m.courtNumber,
            teamA: {
              player1Id: findPId(m.teamA.player1Name),
              player2Id: m.teamA.player2Name ? findPId(m.teamA.player2Name) : undefined,
            },
            teamB: {
              player1Id: findPId(m.teamB.player1Name),
              player2Id: m.teamB.player2Name ? findPId(m.teamB.player2Name) : undefined,
            },
            scoreA: m.scoreA,
            scoreB: m.scoreB,
            isCompleted: true,
            isBonusFinal: m.isBonusFinal || false,
            isSemifinal: m.isSemifinal || false,
            finishedAt: `${t.date}T12:00:00Z`,
          };
        });

        const newSession: MiniligaSession = {
          id: sessionId,
          title: t.title,
          date: t.date,
          participantCount: t.participantCount,
          modelType: t.participantCount === 10 ? "intergrupos" : "rotativo",
          courtsCount: t.participantCount >= 8 ? 2 : 1,
          durationSeconds: 300,
          currentRound: Math.max(...t.matches.map((m) => m.roundNumber), 1),
          totalRounds: Math.max(...t.matches.map((m) => m.roundNumber), 1),
          status: "finalizada",
          isSimulation: false,
          hasBonusFinal: true,
          hasTiebreakSimples: false,
          hasSemifinais: t.participantCount === 10,
          participants: sessionParticipants,
          matches: sessionMatches,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Salvar sessão
        await miniligaStorage.saveSession(newSession);

        // 3. Gerar presenças e pontos nos Cards dos alunos vinculados
        sessionParticipants.forEach((p) => {
          if (p.studentId && !p.isGuest) {
            newAttendanceLogs.push({
              id: `att-${sessionId}-${p.studentId}`,
              alunoId: p.studentId,
              turmaId: "miniliga",
              data: t.date,
              presente: "Miniliga" as const,
              dataRealizacao: t.date,
              motivoCancelamento: `Miniliga Oficial ${t.title} (+${p.cardPointsAwarded} pts no Card)`,
              miniligaSessionId: sessionId,
              miniligaPontos: p.cardPointsAwarded,
            });
          }
        });
      }

      // Atualizar logs no estado global evitando duplicatas para o mesmo dia e sessão
      setAttendanceLogs((prev) => {
        const sessionIds = preparedTournaments.map(
          (t, i) => `import-mr-${t.date}-${t.participantCount}p-${i}`
        );
        const filtered = prev.filter(
          (l) => !sessionIds.includes(l.miniligaSessionId || "")
        );
        return [...filtered, ...newAttendanceLogs];
      });

      toast.success(
        "🎉 Todas as 4 Miniligas foram importadas com sucesso! Pontos e presenças creditados nos Cards!"
      );
      onOpenChange(false);
      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      console.error("Erro detalhado ao importar miniligas:", err);
      const msg = err?.message || "Verifique a conexão com o banco.";
      toast.error(`Erro ao importar: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-950 border-amber-500/40 text-white shadow-2xl p-6 max-h-[92vh] flex flex-col">
        <DialogHeader className="border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                Conferência e Importação de Miniligas
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs">
                  Planilha Marco Roza
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Verifique os vínculos dos alunos abaixo. Os 3 convidados da planilha já vêm marcados como convidados.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Abas dos 4 Torneios */}
        <div className="flex items-center gap-2 overflow-x-auto py-2 border-b border-white/10">
          {preparedTournaments.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSheetIndex(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                selectedSheetIndex === idx
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>{t.title}</span>
              <span className="text-[10px] opacity-80">({t.participantCount}P)</span>
            </button>
          ))}
        </div>

        {/* Detalhes do Torneio Selecionado */}
        {currentTournament && (
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <strong>Data:</strong> {formatLocalDate(currentTournament.date)}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <strong>Jogos Auditados:</strong> {currentTournament.matchesCount} partidas
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Users className="h-4 w-4 text-amber-400" />
                  <strong>Atletas:</strong> {currentTournament.participantCount} participantes
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                  Súmulas Validadas ✓
                </Badge>
              </div>
            </div>

            {/* Tabela de Classificação da Aba com Seletor Interativo de Aluno */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  Classificação Oficial & Vínculo com Alunos
                </h4>
                <span className="text-[11px] text-slate-400">
                  Você pode alterar o aluno correspondente no seletor a qualquer momento
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Colocação</th>
                      <th className="py-2.5 px-3">Nome na Planilha</th>
                      <th className="py-2.5 px-3">Vínculo com Aluno / Convidado</th>
                      <th className="py-2.5 px-3 text-center">V / D</th>
                      <th className="py-2.5 px-3 text-center">Saldo</th>
                      <th className="py-2.5 px-3 text-right">Pontos Card EA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {currentTournament.participantsWithStudents.map((p) => {
                      const selectValue = p.isGuest
                        ? "guest"
                        : p.studentId || "unlinked";

                      return (
                        <tr key={p.name} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-slate-300">
                            {p.rank === 1 ? (
                              <span className="text-amber-300 flex items-center gap-1">🥇 1º</span>
                            ) : p.rank === 2 ? (
                              <span className="text-slate-300 flex items-center gap-1">🥈 2º</span>
                            ) : p.rank === 3 ? (
                              <span className="text-amber-500 flex items-center gap-1">🥉 3º</span>
                            ) : (
                              `${p.rank}º`
                            )}
                          </td>

                          <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                            <span>{p.name}</span>
                          </td>

                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={selectValue}
                                onChange={(e) =>
                                  handleSelectStudent(
                                    currentTournament.sheetName,
                                    p.name,
                                    e.target.value
                                  )
                                }
                                className={`h-8 px-2.5 text-xs rounded-xl border font-medium outline-none transition-colors max-w-[260px] truncate ${
                                  p.isGuest
                                    ? "bg-amber-950/40 border-amber-500/50 text-amber-300 font-bold"
                                    : p.studentId
                                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold"
                                    : "bg-rose-950/40 border-rose-500/50 text-rose-300 font-bold animate-pulse"
                                }`}
                              >
                                <option value="guest" className="bg-slate-900 text-amber-300 font-bold">
                                  👤 Convidado Oficial (Lead CRM)
                                </option>
                                <option value="unlinked" className="bg-slate-900 text-rose-300">
                                  ⚠️ Selecionar Aluno...
                                </option>
                                <optgroup label="Alunos Cadastrados" className="bg-slate-900 text-white font-normal">
                                  {sortedStudents.map((s) => (
                                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                                      {s.nome} {s.status !== "Ativo" ? `(${s.status})` : ""}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>

                              {p.studentId && !p.isGuest && (
                                <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" title="Aluno vinculado com sucesso" />
                              )}
                              {!p.studentId && !p.isGuest && (
                                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" title="Atenção: selecione o aluno no menu" />
                              )}
                            </div>
                          </td>

                          <td className="py-2 px-3 text-center font-mono whitespace-nowrap">
                            <span className="text-emerald-400 font-bold">{p.wins}V</span>
                            <span className="text-slate-500"> - </span>
                            <span className="text-rose-400">{p.losses}D</span>
                          </td>

                          <td className="py-2 px-3 text-center font-mono whitespace-nowrap">
                            <span className={p.pointsBalance >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              {p.pointsBalance >= 0 ? `+${p.pointsBalance}` : p.pointsBalance}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1">
                              ({p.pointsFor}-{p.pointsAgainst})
                            </span>
                          </td>

                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            {p.isGuest ? (
                              <span className="text-xs text-slate-500 font-medium">Sem Card (Lead)</span>
                            ) : (
                              <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                                +{p.cardPointsAwarded} pts
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé e Ação Principal */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Ao importar, as pontuações oficiais dos 4 torneios serão gravadas no histórico e creditadas nos Cards dos alunos vinculados.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleImportAll}
              disabled={isProcessing}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="h-4 w-4 fill-current" />
              {isProcessing ? "Importando..." : "Confirmar Importação das 4 Miniligas"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
