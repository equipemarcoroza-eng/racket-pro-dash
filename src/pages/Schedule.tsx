import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockSchedule, mockStudents, mockPlans, type ClassSlot } from "@/data/mockData";
import { toast } from "sonner";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const horarios = ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00"];
const quadras = ["Quadra 1", "Quadra 2", "Quadra 3"];

const emptySlotForm = { quadra: "Quadra 1", dia: "Seg", horario: "07:00", turmaId: "" };

const Schedule = () => {
  const [schedule, setSchedule] = useState<ClassSlot[]>(mockSchedule);
  const [periodo, setPeriodo] = useState("Semana Atual");
  const [selectedSlot, setSelectedSlot] = useState<ClassSlot | null>(null);
  const [presencas, setPresencas] = useState<Record<string, boolean | null>>({});
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});

  // Slot form state
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotForm, setSlotForm] = useState(emptySlotForm);

  const getSlot = (dia: string, horario: string) => schedule.find((s) => s.dia === dia && s.horario === horario);

  const getAlunosDoSlot = (slot: ClassSlot) => {
    const slotTime = slot.horario;
    return mockStudents.filter((s) => {
      const plano = mockPlans.find((p) => p.id === s.planoId);
      if (!plano || s.status !== "Ativo") return false;
      const turnoSlot = getTurno(slotTime);
      return plano.turno === turnoSlot;
    });
  };

  const openPresenca = (slot: ClassSlot) => {
    setSelectedSlot(slot);
    const alunos = getAlunosDoSlot(slot);
    const initial: Record<string, boolean | null> = {};
    alunos.forEach((a) => { initial[a.id] = null; });
    setPresencas(initial);
    setTimestamps({});
  };

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

  const openNewSlot = (dia?: string, horario?: string) => {
    setEditingSlotId(null);
    setSlotForm({ ...emptySlotForm, dia: dia || "Seg", horario: horario || "07:00", turmaId: `SE${String(schedule.length + 1).padStart(2, "0")}` });
    setShowSlotForm(true);
  };

  const openEditSlot = (slot: ClassSlot) => {
    setEditingSlotId(slot.id);
    setSlotForm({ quadra: slot.quadra, dia: slot.dia, horario: slot.horario, turmaId: slot.turmaId });
    setShowSlotForm(true);
  };

  const handleSaveSlot = () => {
    if (!slotForm.turmaId) { toast.error("ID da turma é obrigatório"); return; }
    if (editingSlotId) {
      setSchedule((prev) => prev.map((s) => s.id === editingSlotId ? { ...s, ...slotForm } : s));
      toast.success("Turma atualizada");
    } else {
      const conflict = schedule.find((s) => s.dia === slotForm.dia && s.horario === slotForm.horario);
      if (conflict) { toast.error("Já existe uma turma neste horário/dia"); return; }
      setSchedule((prev) => [...prev, { id: String(Date.now()), ...slotForm, alunos: 0 }]);
      toast.success("Turma cadastrada");
    }
    setShowSlotForm(false);
    setEditingSlotId(null);
  };

  const handleDeleteSlot = () => {
    if (!editingSlotId) return;
    setSchedule((prev) => prev.filter((s) => s.id !== editingSlotId));
    toast.success("Turma removida");
    setShowSlotForm(false);
    setEditingSlotId(null);
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
            <Button onClick={() => openNewSlot()}>Nova Turma</Button>
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
                                    <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={() => openEditSlot(slot)}>Editar</Button>
                                    <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={() => openPresenca(slot)}>Presença</Button>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-xs h-6 px-0 mt-1">Ver detalhes</Button>
                                </div>
                              ) : (
                                <div
                                  className="border border-dashed rounded-md p-2 text-xs text-center text-muted-foreground cursor-pointer hover:bg-secondary transition-colors"
                                  onClick={() => openNewSlot(d, h)}
                                >
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
                <p className="font-bold">{dias.length * horarios.length - schedule.length} horários disponíveis</p>
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
                {[{ label: "Turmas ativas", value: String(schedule.length) }, { label: "Alunos confirmados", value: String(schedule.reduce((a, b) => a + b.alunos, 0)) }, { label: "Quadras disponíveis", value: "3" }].map((item) => (
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

      {/* Modal Nova/Editar Turma */}
      <Dialog open={showSlotForm} onOpenChange={(open) => { if (!open) { setShowSlotForm(false); setEditingSlotId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlotId ? "Editar Turma" : "Nova Turma"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Quadra</Label>
              <Select value={slotForm.quadra} onValueChange={(v) => setSlotForm({ ...slotForm, quadra: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{quadras.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Dia</Label>
              <Select value={slotForm.dia} onValueChange={(v) => setSlotForm({ ...slotForm, dia: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{dias.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Horário</Label>
              <Select value={slotForm.horario} onValueChange={(v) => setSlotForm({ ...slotForm, horario: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{horarios.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>ID da Turma</Label><Input value={slotForm.turmaId} onChange={(e) => setSlotForm({ ...slotForm, turmaId: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              {editingSlotId && <Button variant="destructive" onClick={handleDeleteSlot}>Excluir</Button>}
              <Button variant="outline" onClick={() => { setShowSlotForm(false); setEditingSlotId(null); }}>Cancelar</Button>
              <Button onClick={handleSaveSlot}>{editingSlotId ? "Atualizar" : "Cadastrar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Presença */}
      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-primary font-medium">Controle</p>
                <DialogTitle className="text-xl">Presença da Turma</DialogTitle>
              </div>
              {selectedSlot && (
                <div className="flex gap-2">
                  <Badge variant="secondary">Turma {selectedSlot.turmaId}</Badge>
                  <Badge variant="outline">{selectedSlot.horario}</Badge>
                </div>
              )}
            </div>
          </DialogHeader>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-primary font-medium">Lista de Chamada</p>
                  <p className="text-lg font-bold">Horário {selectedSlot ? getTurno(selectedSlot.horario) : ""}</p>
                </div>
                <Button onClick={registrarPresenca} disabled={alunos.length === 0}>Registrar Presença</Button>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-secondary rounded-md p-3 mb-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Aluno</p>
                  <p className="text-xs text-muted-foreground">Nome Completo</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-muted-foreground">Presença</p>
                  <p className="text-xs text-muted-foreground">Marcador</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">Status</p>
                  <p className="text-xs text-muted-foreground">Atualizado</p>
                </div>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {alunos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum aluno cadastrado neste horário</p>
                ) : (
                  alunos.map((aluno) => (
                    <div key={aluno.id} className="grid grid-cols-3 gap-4 items-center border rounded-md p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Aluno</p>
                        <p className="font-medium text-sm">{aluno.nome}</p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant={presencas[aluno.id] === true ? "default" : "outline"} className={presencas[aluno.id] === true ? "bg-green-600 hover:bg-green-700 text-white" : ""} onClick={() => togglePresenca(aluno.id, true)}>Presente</Button>
                        <Button size="sm" variant={presencas[aluno.id] === false ? "destructive" : "outline"} onClick={() => togglePresenca(aluno.id, false)}>Falta</Button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{timestamps[aluno.id] || "—"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between bg-secondary rounded-md p-3 mt-4">
                <p className="text-sm font-medium text-muted-foreground">Resumo diário</p>
                <p className="text-sm font-medium">Total registrado: {totalRegistrado} aluno(s)</p>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;
