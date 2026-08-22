import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext, toIsoDate } from "@/contexts/AppContext";
import type { AttendanceLog } from "@/data/mockData";
import { toast } from "sonner";
import { format } from "date-fns";

const diasMap: Record<string, number> = { "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6 };
const diasReverse: Record<number, string> = { 0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb" };

const AttendanceControl = () => {
  const { students: mockStudents, enrollments: mockEnrollments, attendanceLogs, setAttendanceLogs, schedule: mockSchedule } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [presencas, setPresencas] = useState<Record<string, Record<string, AttendanceLog["presente"] | null>>>({});
  const [motivos, setMotivos] = useState<Record<string, Record<string, string>>>({});
  const [realizacaoDates, setRealizacaoDates] = useState<Record<string, Record<string, string>>>({});

  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
  const diaLabel = diasReverse[dayOfWeek];

  const turmasDoDia = mockSchedule
    .filter((s) => s.dia === diaLabel)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const getEnrolledStudents = (slotId: string) => {
    const enrolledIds = mockEnrollments.filter((e) => e.turmaId === slotId).map((e) => e.alunoId);
    
    // Include students who have historical attendance logs for this slot on the selected date
    const loggedStudentIds = attendanceLogs
      .filter((l) => l.turmaId === slotId && l.data === selectedDate)
      .map((l) => l.alunoId);

    return mockStudents
      .filter((s) => {
        // Aluno não aparece se a data selecionada for anterior à data de entrada
        if (s.dataEntrada && toIsoDate(s.dataEntrada) > toIsoDate(selectedDate)) return false;

        const hasLog = loggedStudentIds.includes(s.id);
        if (hasLog) return true;

        const isEnrolledActive = enrolledIds.includes(s.id) && s.status === "Ativo";
        return isEnrolledActive;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  };

  const isLancado = (slotId: string) => {
    const enrolled = getEnrolledStudents(slotId);
    if (enrolled.length === 0) return false;
    return enrolled.every((s) => attendanceLogs.some((l) => l.turmaId === slotId && l.data === selectedDate && l.alunoId === s.id));
  };

  const togglePresenca = (slotId: string, alunoId: string, value: AttendanceLog["presente"]) => {
    setPresencas((prev) => {
      const slotPresencas = prev[slotId] || {};
      return {
        ...prev,
        [slotId]: {
          ...slotPresencas,
          [alunoId]: slotPresencas[alunoId] === value ? null : value,
        },
      };
    });
  };

  const handleMotivoChange = (slotId: string, alunoId: string, value: string) => {
    setMotivos(prev => {
      const slotMotivos = prev[slotId] || {};
      return {
        ...prev,
        [slotId]: {
          ...slotMotivos,
          [alunoId]: value
        }
      };
    });
  };

  const handleRealizacaoDateChange = (slotId: string, alunoId: string, value: string) => {
    setRealizacaoDates(prev => {
      const slotDates = prev[slotId] || {};
      return {
        ...prev,
        [slotId]: {
          ...slotDates,
          [alunoId]: value
        }
      };
    });
  };

  const getPresenca = (slotId: string, alunoId: string): AttendanceLog["presente"] | null => {
    return presencas[slotId]?.[alunoId] ?? null;
  };

  const salvarPresenca = (slotId: string) => {
    const enrolled = getEnrolledStudents(slotId);
    const slotPresencas = presencas[slotId] || {};

    const newLogs: AttendanceLog[] = enrolled.map((s) => {
      const localValue = slotPresencas[s.id];
      const logExisting = attendanceLogs.find((l) => l.turmaId === slotId && l.data === selectedDate && l.alunoId === s.id);
      
      let status: AttendanceLog["presente"];
      let motivo: string | undefined;
      let dataReal: string | undefined;

      if (localValue !== undefined && localValue !== null) {
        status = localValue;
        motivo = status === "Cancelado" ? (motivos[slotId]?.[s.id] || "") : undefined;
        dataReal = (status === "Miniliga" || status === "Reposição")
          ? (realizacaoDates[slotId]?.[s.id] || logExisting?.dataRealizacao || selectedDate)
          : undefined;
      } else if (logExisting) {
        status = logExisting.presente;
        motivo = logExisting.motivoCancelamento;
        dataReal = logExisting.dataRealizacao;
      } else {
        status = "Cancelado";
        motivo = "Justificar";
      }

      return {
        id: logExisting?.id || crypto.randomUUID(),
        alunoId: s.id,
        turmaId: slotId,
        data: selectedDate,
        presente: status,
        motivoCancelamento: motivo,
        dataRealizacao: dataReal
      };
    });

    // Remove existing logs for this slot/date, add new
    setAttendanceLogs((prev) => [
      ...prev.filter((l) => !(l.turmaId === slotId && l.data === selectedDate)),
      ...newLogs,
    ]);
    toast.success("Presença registrada com sucesso");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#0f1236] via-[#1c2394] to-[#de392a] text-white border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <CardHeader className="flex flex-row items-center justify-between relative z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Controle</p>
            <CardTitle className="text-2xl font-black text-white mt-1">Controle de Presença</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-white font-semibold">Data:</Label>
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => { setSelectedDate(e.target.value); setPresencas({}); }} 
              className="w-44 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/40 [color-scheme:dark]" 
            />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-xs text-white/70">
            {diaLabel ? `Mostrando turmas de ${diaLabel} (${format(new Date(selectedDate + "T12:00:00"), "dd/MM/yyyy")})` : "Selecione uma data"}
          </p>
        </CardContent>
      </Card>

      {turmasDoDia.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhuma turma neste dia da semana.
          </CardContent>
        </Card>
      ) : (
        turmasDoDia.map((slot) => {
          const alunos = getEnrolledStudents(slot.id);
          const lancado = isLancado(slot.id);
          return (
            <Card key={slot.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">{slot.horario} · {slot.quadra}</p>
                      <p className="text-xs text-muted-foreground">Turma {slot.turmaId}</p>
                    </div>
                    <Badge variant={lancado ? "default" : "outline"}>{lancado ? "Lançada" : "Pendente"}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50" onClick={() => {
                      const reason = window.prompt("Informe o motivo do cancelamento da turma:");
                      if (reason !== null) {
                        alunos.forEach(aluno => {
                          togglePresenca(slot.id, aluno.id, "Cancelado");
                          handleMotivoChange(slot.id, aluno.id, reason);
                        });
                      }
                    }} disabled={alunos.length === 0}>
                      Cancelar Turma
                    </Button>
                    <Button size="sm" onClick={() => salvarPresenca(slot.id)} disabled={alunos.length === 0}>
                      Salvar Presença
                    </Button>
                  </div>
                </div>

                {alunos.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum aluno matriculado</p>
                ) : (
                  <div className="space-y-2">
                    {alunos.map((aluno) => {
                      const value = getPresenca(slot.id, aluno.id);
                      const logExisting = attendanceLogs.find((l) => l.turmaId === slot.id && l.data === selectedDate && l.alunoId === aluno.id);
                      const displayValue = value ?? (logExisting ? logExisting.presente : null);
                      return (
                        <div key={aluno.id} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between border rounded-md p-3">
                              <p className="font-medium text-sm">{aluno.nome}</p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={displayValue === "Presente" ? "default" : "outline"}
                                  className={displayValue === "Presente" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                  onClick={() => togglePresenca(slot.id, aluno.id, "Presente")}
                                >
                                  Presente
                                </Button>
                                <Button
                                  size="sm"
                                  variant={displayValue === "Falta" ? "destructive" : "outline"}
                                  onClick={() => togglePresenca(slot.id, aluno.id, "Falta")}
                                >
                                  Ausente
                                </Button>
                                <Button
                                  size="sm"
                                  variant={displayValue === "Cancelado" ? "default" : "outline"}
                                  className={displayValue === "Cancelado" ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500" : ""}
                                  onClick={() => togglePresenca(slot.id, aluno.id, "Cancelado")}
                                >
                                  Cancelado
                                </Button>
                                <Button
                                  size="sm"
                                  variant={displayValue === "Miniliga" ? "default" : "outline"}
                                  className={displayValue === "Miniliga" ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : ""}
                                  onClick={() => togglePresenca(slot.id, aluno.id, "Miniliga")}
                                >
                                  Miniliga
                                </Button>
                                <Button
                                  size="sm"
                                  variant={displayValue === "Reposição" ? "default" : "outline"}
                                  className={displayValue === "Reposição" ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" : ""}
                                  onClick={() => togglePresenca(slot.id, aluno.id, "Reposição")}
                                >
                                  Reposição
                                </Button>
                              </div>
                            </div>
                            
                            {displayValue === "Cancelado" && (
                              <div className="px-3 pb-3 -mt-2">
                                <Input 
                                  placeholder="Motivo do cancelamento..." 
                                  value={motivos[slot.id]?.[aluno.id] ?? (logExisting?.motivoCancelamento ?? "")}
                                  onChange={(e) => handleMotivoChange(slot.id, aluno.id, e.target.value)}
                                  className="text-xs border-yellow-200 focus-visible:ring-yellow-500"
                                />
                              </div>
                            )}

                            {(displayValue === "Miniliga" || displayValue === "Reposição") && (
                              <div className="px-3 pb-3 -mt-2 flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Data de realização:</Label>
                                <Input 
                                  type="date"
                                  value={realizacaoDates[slot.id]?.[aluno.id] ?? (logExisting?.dataRealizacao ?? selectedDate)}
                                  onChange={(e) => handleRealizacaoDateChange(slot.id, aluno.id, e.target.value)}
                                  className="text-xs w-40"
                                />
                              </div>
                            )}
                          </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default AttendanceControl;
