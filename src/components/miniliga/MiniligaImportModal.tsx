import React, { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { MiniligaSession, MiniligaParticipant, MiniligaMatch } from "@/types/miniliga";
import {
  PREPARSED_MARCO_ROZA_MINILIGAS,
  ParsedTournamentData,
  matchStudentByName,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Trophy,
  Users,
  Calendar,
  Sparkles,
  Flame,
  ArrowRight,
  ShieldCheck,
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
  const { students, attendanceLogs, setAttendanceLogs } = useAppContext();
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mapear cada torneio pré-analisado com os alunos atuais do sistema
  const preparedTournaments = PREPARSED_MARCO_ROZA_MINILIGAS.map((t) => {
    const participantsWithStudents = t.participants.map((p) => {
      // Se for convidado conhecido, mantém como convidado
      if (p.isGuest) {
        return { ...p, studentId: null, isGuest: true };
      }

      // Procura match inteligente entre os alunos
      const matched = matchStudentByName(p.name, students);
      return {
        ...p,
        studentId: matched?.id || null,
        matchedStudentName: matched?.nome,
        isGuest: p.isGuest || !matched,
      };
    });

    return {
      ...t,
      participantsWithStudents,
    };
  });

  const currentTournament = preparedTournaments[selectedSheetIndex];

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
          currentRound: t.participantCount === 10 ? 6 : 4,
          totalRounds: t.participantCount === 10 ? 6 : 4,
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

        // 3. Gerar/Atualizar presenças dos alunos vinculados
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
    } catch (err) {
      console.error("Erro ao importar miniligas:", err);
      toast.error("Erro ao importar miniligas. Verifique a conexão com o banco.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-950 border-amber-500/40 text-white shadow-2xl p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                Importador Oficial de Miniligas
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs">
                  Planilha Marco Roza
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Identificação automática de alunos, cálculo de classificação oficial e segregação dos convidados para CRM.
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
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <strong>Data:</strong> {new Date(currentTournament.date).toLocaleDateString("pt-BR")}
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

            {/* Tabela de Classificação da Aba */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                Classificação Oficial e Pontuação do Card EA
              </h4>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Colocação</th>
                      <th className="py-2.5 px-3">Participante</th>
                      <th className="py-2.5 px-3 text-center">Tipo</th>
                      <th className="py-2.5 px-3 text-center">V / D</th>
                      <th className="py-2.5 px-3 text-center">Saldo</th>
                      <th className="py-2.5 px-3 text-right">Pontos Card EA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {currentTournament.participantsWithStudents.map((p) => (
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
                        <td className="py-2 px-3 font-bold text-white">
                          <div className="flex flex-col">
                            <span>{p.name}</span>
                            {p.matchedStudentName && p.matchedStudentName !== p.name && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                Vinculado a: {p.matchedStudentName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {p.isGuest ? (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-[9px] font-bold">
                              👤 Convidado
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] font-bold">
                              ✓ Aluno
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          <span className="text-emerald-400 font-bold">{p.wins}V</span>
                          <span className="text-slate-500"> - </span>
                          <span className="text-rose-400">{p.losses}D</span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          <span className={p.pointsBalance >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {p.pointsBalance >= 0 ? `+${p.pointsBalance}` : p.pointsBalance}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({p.pointsFor}-{p.pointsAgainst})
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          {p.isGuest ? (
                            <span className="text-xs text-slate-500 font-medium">Sem Card (Lead)</span>
                          ) : (
                            <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                              +{p.cardPointsAwarded} pts
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
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
              Ao importar, as 4 miniligas oficiais serão salvas no histórico e os pontos computados nos Cards dos alunos vinculados.
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
