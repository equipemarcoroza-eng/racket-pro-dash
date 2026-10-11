import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/AppContext";
import { CLASS_LIMIT, type Student, type AttendanceLog, type ClassSlot } from "@/data/mockData";
import { WhatsAppQuickDialog } from "@/components/WhatsAppQuickDialog";
import { type WhatsAppMessageOptions } from "@/lib/whatsapp";
import {
  Sparkles,
  Zap,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  MessageCircle,
  ArrowRight,
  Target,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SmartReplacementMatchmakerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStudentId?: string;
  targetLog?: AttendanceLog | null;
  onConfirmReplacement?: (slotId: string, date: string, studentId: string) => void;
}

export const SmartReplacementMatchmaker: React.FC<SmartReplacementMatchmakerProps> = ({
  open,
  onOpenChange,
  targetStudentId,
  targetLog,
  onConfirmReplacement,
}) => {
  const { students, schedule, enrollments } = useAppContext();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(targetStudentId || "");
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("todos");

  // Atualiza se mudar targetStudentId
  React.useEffect(() => {
    if (targetStudentId) {
      setSelectedStudentId(targetStudentId);
    }
  }, [targetStudentId]);

  const [whatsAppModal, setWhatsAppModal] = useState<{
    open: boolean;
    options: WhatsAppMessageOptions;
  }>({
    open: false,
    options: { phone: "", studentName: "", type: "replacement" },
  });

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === "Ativo").sort((a, b) => a.nome.localeCompare(b.nome)),
    [students]
  );

  const student = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );

  // Algoritmo de Matchmaking de Turmas com Vagas e Afinidade de Nível
  const matches = useMemo(() => {
    if (!student) return [];

    return schedule
      .map((slot) => {
        const slotEnrollments = enrollments.filter((e) => e.turmaId === slot.id);
        const enrolledCount = slotEnrollments.length;
        const availableSpots = Math.max(0, CLASS_LIMIT - enrolledCount);

        // Se a turma estiver lotada, descartar
        if (availableSpots <= 0) return null;

        // Análise de Nível da Turma
        const enrolledStudents = slotEnrollments
          .map((e) => students.find((s) => s.id === e.alunoId))
          .filter(Boolean) as Student[];

        // Compatibilidade de Categoria
        const sameCategoryCount = enrolledStudents.filter(
          (s) => s.categoria === student.categoria
        ).length;

        let compatibility = 70; // baseline para qualquer vaga disponível
        let matchReason = "Turma com vagas disponíveis";

        if (enrolledCount === 0) {
          compatibility = 85;
          matchReason = "Horário com quadra livre para encaixe";
        } else if (sameCategoryCount === enrolledCount) {
          compatibility = 98;
          matchReason = `100% compatível (${student.categoria}) • Turma nivelada`;
        } else if (sameCategoryCount > 0) {
          compatibility = 88;
          matchReason = `Afinidade de nível (${sameCategoryCount} de ${enrolledCount} atletas da mesma categoria)`;
        } else {
          compatibility = 65;
          matchReason = "Turma mista / categoria diferente";
        }

        return {
          slot,
          enrolledCount,
          availableSpots,
          compatibility,
          matchReason,
          enrolledStudents,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item) => selectedDayFilter === "todos" || item.slot.dia === selectedDayFilter)
      .sort((a, b) => b.compatibility - a.compatibility);
  }, [schedule, enrollments, students, student, selectedDayFilter]);

  const handleEnrollMatch = (slot: ClassSlot) => {
    if (!student) return;

    // Sugere a data do próximo dia correspondente
    const diasSemana: Record<string, number> = {
      Dom: 0,
      Seg: 1,
      Ter: 2,
      Qua: 3,
      Qui: 4,
      Sex: 5,
      Sáb: 6,
    };
    const targetDayNum = diasSemana[slot.dia] ?? 1;
    const now = new Date();
    const currentDayNum = now.getDay();
    let daysToAdd = targetDayNum - currentDayNum;
    if (daysToAdd <= 0) daysToAdd += 7;
    const nextDate = addDays(now, daysToAdd);
    const dateFormatted = format(nextDate, "dd/MM/yyyy");
    const dateIso = format(nextDate, "yyyy-MM-dd");

    if (onConfirmReplacement) {
      onConfirmReplacement(slot.id, dateIso, student.id);
    }

    toast.success(`Reposição confirmada para ${slot.dia} (${dateFormatted}) às ${slot.horario}!`);

    // Abre direto WhatsApp para confirmar com o aluno
    const phone = student.whatsappAluno || student.whatsappResponsavel || "";
    setWhatsAppModal({
      open: true,
      options: {
        phone,
        studentName: student.nome,
        type: "replacement",
        details: {
          replacementDate: dateFormatted,
          replacementTime: slot.horario,
          court: slot.quadra,
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 uppercase text-[10px]">
              Inteligência de Nivelamento
            </Badge>
          </div>
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-foreground mt-1">
            <Zap className="h-5 w-5 text-amber-500" />
            Matchmaker Inteligente de Reposições
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Encontra automaticamente turmas com vagas abertas e compatibilidade técnica exata para não desequilibrar a aula.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Seletor de Aluno e Filtro de Dia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Aluno que precisa de reposição:
              </label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o aluno..." />
                </SelectTrigger>
                <SelectContent>
                  {activeStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome} ({s.categoria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Filtrar por dia da semana:
              </label>
              <Select value={selectedDayFilter} onValueChange={setSelectedDayFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos os dias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os dias</SelectItem>
                  <SelectItem value="Seg">Segunda-feira</SelectItem>
                  <SelectItem value="Ter">Terça-feira</SelectItem>
                  <SelectItem value="Qua">Quarta-feira</SelectItem>
                  <SelectItem value="Qui">Quinta-feira</SelectItem>
                  <SelectItem value="Sex">Sexta-feira</SelectItem>
                  <SelectItem value="Sáb">Sábado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {student && (
            <div className="flex items-center justify-between text-xs bg-primary/5 p-2.5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span>
                  Perfil do Atleta: <strong>{student.nome}</strong> • Categoria:{" "}
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {student.categoria}
                  </Badge>
                </span>
              </div>
              <span className="text-muted-foreground">
                Limite por turma: <strong>{CLASS_LIMIT} atletas</strong>
              </span>
            </div>
          )}

          {/* Lista de Melhores Matches */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Melhores Horários Sugeridos pelo Algoritmo ({matches.length} opções com vagas)
            </h4>

            {matches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-xl bg-muted/20">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">Nenhuma vaga compatível encontrada.</p>
                <p className="text-xs">Tente selecionar outro dia ou ajustar os filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {matches.slice(0, 10).map(({ slot, enrolledCount, availableSpots, compatibility, matchReason }) => (
                  <Card
                    key={slot.id}
                    className="overflow-hidden border hover:border-primary/50 transition-all hover:shadow-sm"
                  >
                    <CardContent className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="font-mono text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                            {slot.dia} • {slot.horario}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {slot.quadra}
                          </Badge>
                          <Badge
                            className={`text-[10px] font-bold ${
                              compatibility >= 90
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                                : compatibility >= 75
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                                : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40"
                            }`}
                          >
                            {compatibility}% Match
                          </Badge>
                        </div>

                        <p className="text-xs font-medium text-foreground flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          {matchReason}
                        </p>

                        <p className="text-[11px] text-muted-foreground">
                          Ocupação atual:{" "}
                          <strong className="text-foreground">
                            {enrolledCount}/{CLASS_LIMIT} alunos
                          </strong>{" "}
                          • <span className="text-emerald-600 font-bold">{availableSpots} vaga(s) livre(s)</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleEnrollMatch(slot)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Encaixar & Avisar Zap
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Modal */}
        <WhatsAppQuickDialog
          open={whatsAppModal.open}
          onOpenChange={(open) => setWhatsAppModal((prev) => ({ ...prev, open }))}
          options={whatsAppModal.options}
        />
      </DialogContent>
    </Dialog>
  );
};
