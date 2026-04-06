import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockSchedule, mockStudents, ClassSlot } from "@/data/mockData";
import { toast } from "sonner";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const horarios = ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00"];

const Schedule = () => {
  const [periodo, setPeriodo] = useState("Semana Atual");
  const [selectedSlot, setSelectedSlot] = useState<ClassSlot | null>(null);
  const [presencas, setPresencas] = useState<Record<string, boolean | null>>({});

  const getSlot = (dia: string, horario: string) => mockSchedule.find((s) => s.dia === dia && s.horario === horario);

  const normalizeHorario = (h: string) => h.replace("h", ":").replace(/^(\d):/, "0$1:");

  const getAlunosDoSlot = (slot: ClassSlot) => {
    const slotTime = slot.horario;
    return mockStudents.filter((s) => {
      const studentTime = normalizeHorario(s.horario);
      return studentTime === slotTime && s.status === "Ativo";
    });
  };

  const openPresenca = (slot: ClassSlot) => {
    setSelectedSlot(slot);
    const alunos = getAlunosDoSlot(slot);
    const initial: Record<string, boolean | null> = {};
    alunos.forEach((a) => { initial[a.id] = null; });
    setPresencas(initial);
  };

  const [timestamps, setTimestamps] = useState<Record<string, string>>({});

  const togglePresenca = (alunoId: string, value: boolean) => {
    setPresencas((prev) => ({ ...prev, [alunoId]: prev[alunoId] === value ? null : value }));
    const now = new Date();
    setTimestamps((prev) => ({ ...prev, [alunoId]: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` }));
  };

  const registrarPresenca = () => {
    const total = Object.values(presencas).filter((v) => v !== null).length;
    toast.success(`Presença registrada para ${total} aluno(s)`);
    setSelectedSlot(null);
  };

  const getTurno = (horario: string) => {
    const hour = parseInt(horario.split(":")[0], 10);
    if (hour < 12) return "Matutino";
    if (hour < 18) return "Vespertino";
    return "Noturno";
  };

  const alunos = selectedSlot ? getAlunosDoSlot(selectedSlot) : [];
  const totalRegistrado = Object.values(presencas).filter((v) => v !== null).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-primary font-medium">Agenda</p>
            <CardTitle className="text-2xl">Gestão de Turmas e Agenda</CardTitle>
          </div>
          <div className="flex gap-2 items-center">
            <Input placeholder="Buscar quadra ou turma" className="w-48" />
            <Button>Nova Turma</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {["Semana Atual", "Abril", "Próxima Semana"].map((p) => (
              <Button key={p} variant={periodo === p ? "default" : "outline"} size="sm" onClick={() => setPeriodo(p)}>{p}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-primary font-medium">Grade Semanal</p>
                  <p className="text-xl font-bold">Ocupação das Quadras</p>
                </div>
                <Button variant="outline" size="sm">Atualizar</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-medium text-muted-foreground">Horários</th>
                      {dias.map((d) => <th key={d} className="text-center p-2 font-medium">{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((h) => (
                      <tr key={h}>
                        <td className="p-2 font-medium">{h}</td>
                        {dias.map((d) => {
                          const slot = getSlot(d, h);
                          return (
                            <td key={d} className="p-1">
                              {slot ? (
                                <div className="border rounded-md p-2 text-xs bg-card">
                                  <p className="font-semibold">{slot.quadra}</p>
                                  <p className="text-muted-foreground">{slot.alunos} alunos</p>
                                  <div className="flex gap-1 mt-1">
                                    <Button variant="outline" size="sm" className="text-xs h-6 px-2">Editar</Button>
                                    <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={() => openPresenca(slot)}>Presença</Button>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-xs h-6 px-0 mt-1">Ver detalhes</Button>
                                </div>
                              ) : (
                                <div className="border border-dashed rounded-md p-2 text-xs text-center text-muted-foreground cursor-pointer hover:bg-secondary transition-colors">
                                  Cadastrar turma
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-primary font-medium">Indicador de Ocupação</p>
                <p className="text-xl font-bold">Monitoramento</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-sm text-muted-foreground">Horário mais cheio</p>
                <p className="font-bold">Terça · 18:00 · 12 alunos</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-sm text-muted-foreground">Quadra com maior uso</p>
                <p className="font-bold">Quadra 2 · 65% ocupada</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-sm text-muted-foreground">Slots livres</p>
                <p className="font-bold">8 horários disponíveis</p>
              </div>
              <div className="bg-secondary rounded-md p-3 text-sm text-muted-foreground">
                A ocupação é calculada com base na capacidade de cada quadra e no número de alunos registrados.
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-primary font-medium">Histórico</p>
                  <p className="text-xl font-bold">Resumo da Semana</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm">Exportar agenda</Button>
                  <Button variant="outline" size="sm">Filtrar horários</Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: "Turmas ativas", value: "24" }, { label: "Alunos confirmados", value: "136" }, { label: "Quadras disponíveis", value: "3" }].map((item) => (
                  <div key={item.label} className="border rounded-md p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Presença */}
      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Presença da Turma</DialogTitle>
            {selectedSlot && (
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">Turma {selectedSlot.turmaId}</Badge>
                <Badge variant="outline">{selectedSlot.horario}</Badge>
                <Badge variant="outline">{selectedSlot.quadra}</Badge>
              </div>
            )}
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {alunos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum aluno cadastrado neste horário</p>
            ) : (
              alunos.map((aluno) => (
                <div key={aluno.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <p className="font-medium text-sm">{aluno.nome}</p>
                    <p className="text-xs text-muted-foreground">{aluno.categoria}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={presencas[aluno.id] === true ? "default" : "outline"}
                      className={presencas[aluno.id] === true ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                      onClick={() => togglePresenca(aluno.id, true)}
                    >
                      Presente
                    </Button>
                    <Button
                      size="sm"
                      variant={presencas[aluno.id] === false ? "destructive" : "outline"}
                      onClick={() => togglePresenca(aluno.id, false)}
                    >
                      Falta
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">Total registrado: {totalRegistrado} aluno(s)</p>
            <Button onClick={registrarPresenca} disabled={alunos.length === 0}>Registrar Presença</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;
