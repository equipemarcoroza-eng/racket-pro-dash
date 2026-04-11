import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockSchedule, mockEnrollments, mockStudents, CLASS_LIMIT, type ClassSlot } from "@/data/mockData";
import { toast } from "sonner";
import { startOfWeek, addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const horarios = ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00"];
const quadras = ["Quadra 1", "Quadra 2", "Quadra 3"];

const emptySlotForm = { quadra: "Quadra 1", dia: "Seg", horario: "07:00", turmaId: "" };

const Schedule = () => {
  const [schedule, setSchedule] = useState<ClassSlot[]>(mockSchedule);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotForm, setSlotForm] = useState(emptySlotForm);

  // Calculate current week dates
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekDates: Record<string, string> = {};
  dias.forEach((dia, i) => {
    const date = addDays(weekStart, i);
    weekDates[dia] = format(date, "dd/MM");
  });

  const getSlot = (dia: string, horario: string) => schedule.find((s) => s.dia === dia && s.horario === horario);
  const getSlotCount = (slotId: string) => mockEnrollments.filter((e) => e.turmaId === slotId).length;

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
      const conflict = schedule.find((s) => s.dia === slotForm.dia && s.horario === slotForm.horario && s.quadra === slotForm.quadra);
      if (conflict) { toast.error("Já existe uma turma neste horário/dia/quadra"); return; }
      setSchedule((prev) => [...prev, { id: String(Date.now()), ...slotForm }]);
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

  const totalEnrolled = mockEnrollments.length;

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
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-medium text-muted-foreground">Horários</th>
                      {dias.map((d) => (
                        <th key={d} className="text-center p-2">
                          <p className="font-medium">{d}</p>
                          <p className="text-xs text-muted-foreground">{weekDates[d]}</p>
                        </th>
                      ))}
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
                                  <Badge variant={getSlotCount(slot.id) >= CLASS_LIMIT ? "destructive" : "secondary"} className="text-xs mt-1">
                                    {getSlotCount(slot.id)}/{CLASS_LIMIT}
                                  </Badge>
                                  <div className="flex gap-1 mt-1">
                                    <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={() => openEditSlot(slot)}>Editar</Button>
                                  </div>
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
                <p className="text-sm text-muted-foreground">Turmas ativas</p>
                <p className="font-bold">{schedule.length}</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-sm text-muted-foreground">Matrículas totais</p>
                <p className="font-bold">{totalEnrolled}</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-sm text-muted-foreground">Slots livres</p>
                <p className="font-bold">{dias.length * horarios.length * quadras.length - schedule.length} horários disponíveis</p>
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
    </div>
  );
};

export default Schedule;
