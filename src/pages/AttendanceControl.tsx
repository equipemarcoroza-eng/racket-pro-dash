import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockSchedule, mockStudents, mockEnrollments, mockAttendanceLogs, type AttendanceLog } from "@/data/mockData";
import { toast } from "sonner";
import { format } from "date-fns";

const diasMap: Record<string, number> = { "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6 };
const diasReverse: Record<number, string> = { 0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb" };

const AttendanceControl = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(mockAttendanceLogs);
  const [presencas, setPresencas] = useState<Record<string, Record<string, boolean | null>>>({});

  const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
  const diaLabel = diasReverse[dayOfWeek];

  const turmasDoDia = mockSchedule.filter((s) => s.dia === diaLabel);

  const getEnrolledStudents = (slotId: string) => {
    const enrolledIds = mockEnrollments.filter((e) => e.turmaId === slotId).map((e) => e.alunoId);
    return mockStudents.filter((s) => enrolledIds.includes(s.id) && s.status === "Ativo");
  };

  const isLancado = (slotId: string) => {
    const enrolled = getEnrolledStudents(slotId);
    if (enrolled.length === 0) return false;
    return enrolled.every((s) => attendanceLogs.some((l) => l.turmaId === slotId && l.data === selectedDate && l.alunoId === s.id));
  };

  const togglePresenca = (slotId: string, alunoId: string, value: boolean) => {
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

  const getPresenca = (slotId: string, alunoId: string): boolean | null => {
    return presencas[slotId]?.[alunoId] ?? null;
  };

  const salvarPresenca = (slotId: string) => {
    const enrolled = getEnrolledStudents(slotId);
    const slotPresencas = presencas[slotId] || {};
    const pending = enrolled.filter((s) => slotPresencas[s.id] === undefined || slotPresencas[s.id] === null);
    if (pending.length > 0) {
      toast.error(`Registre a presença de todos os ${pending.length} aluno(s) pendente(s)`);
      return;
    }

    const newLogs: AttendanceLog[] = enrolled.map((s) => ({
      id: `al-${Date.now()}-${s.id}`,
      alunoId: s.id,
      turmaId: slotId,
      data: selectedDate,
      presente: slotPresencas[s.id] as boolean,
    }));

    // Remove existing logs for this slot/date, add new
    setAttendanceLogs((prev) => [
      ...prev.filter((l) => !(l.turmaId === slotId && l.data === selectedDate)),
      ...newLogs,
    ]);
    toast.success("Presença registrada com sucesso");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-primary font-medium">Controle</p>
            <CardTitle className="text-2xl">Controle de Presença</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label>Data:</Label>
            <Input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setPresencas({}); }} className="w-44" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
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
                  <Button size="sm" onClick={() => salvarPresenca(slot.id)} disabled={alunos.length === 0}>
                    Salvar Presença
                  </Button>
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
                        <div key={aluno.id} className="flex items-center justify-between border rounded-md p-3">
                          <p className="font-medium text-sm">{aluno.nome}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={displayValue === true ? "default" : "outline"}
                              className={displayValue === true ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                              onClick={() => togglePresenca(slot.id, aluno.id, true)}
                            >
                              Presente
                            </Button>
                            <Button
                              size="sm"
                              variant={displayValue === false ? "destructive" : "outline"}
                              onClick={() => togglePresenca(slot.id, aluno.id, false)}
                            >
                              Falta
                            </Button>
                          </div>
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
