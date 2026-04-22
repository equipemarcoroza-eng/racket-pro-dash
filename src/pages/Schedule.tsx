import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CLASS_LIMIT, type ClassSlot } from "@/data/mockData";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import { startOfWeek, addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const horarios = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];
const quadras = ["Quadra 1", "Quadra 2", "Quadra 3"];

const emptySlotForm = { quadra: "Quadra 1", dia: "Seg", horario: "07:00", turmaId: "" };

const generateTurmaId = (dia: string, quadra: string, horario: string) => {
  const diaMap: Record<string, string> = { 
    "Seg": "seg", "Ter": "ter", "Qua": "qua", "Qui": "qui", "Sex": "sex", "Sáb": "sab", "Dom": "dom" 
  };
  const qNum = quadra.replace("Quadra ", "");
  const hora = horario.split(":")[0];
  return `BT${diaMap[dia]}Q${qNum}${hora}`;
};

const Schedule = () => {
  const { schedule, setSchedule, enrollments, students } = useAppContext();
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

  const getSlots = (dia: string, horario: string) => schedule.filter((s) => s.dia === dia && s.horario === horario);
  const getSlotCount = (slotId: string) => enrollments.filter((e) => e.turmaId === slotId).length;

  const openNewSlot = (dia?: string, horario?: string) => {
    const d = dia || "Seg";
    const h = horario || "07:00";
    const q = "Quadra 1";
    setEditingSlotId(null);
    setSlotForm({ quadra: q, dia: d, horario: h, turmaId: generateTurmaId(d, q, h) });
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
      setSchedule((prev) => [...prev, { id: crypto.randomUUID(), ...slotForm }]);
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

  const totalEnrolled = enrollments.length;

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
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-medium text-muted-foreground border-b">Horários</th>
                      {dias.map((d) => (
                        <th key={d} className="text-center p-2 border-b">
                          <p className="font-medium">{d}</p>
                          <p className="text-[10px] text-muted-foreground font-normal">{weekDates[d]}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((h) => (
                      <tr key={h} className="group">
                        <td className="p-2 font-medium border-r border-b group-last:border-b-0 whitespace-nowrap bg-muted/5">{h}</td>
                        {dias.map((d) => {
                          const slots = getSlots(d, h);
                          return (
                            <td key={d} className="p-1 border-b border-r last:border-r-0 group-last:border-b-0 align-top min-w-[120px]">
                              <div className="flex flex-col gap-2 min-h-[40px]">
                                {slots.map((slot) => {
                                  const count = getSlotCount(slot.id);
                                  const full = count >= CLASS_LIMIT;
                                  const enrolled = enrollments.filter((e) => e.turmaId === slot.id);
                                  
                                  return (
                                    <div key={slot.id} className={`border rounded p-2 text-[10px] bg-card shadow-sm ${full ? "border-destructive/30 bg-destructive/5" : "border-primary/20"}`}>
                                      <div className="flex items-center justify-between mb-1 gap-1">
                                        <p className="font-bold text-primary truncate">{slot.turmaId}</p>
                                        <Badge variant={full ? "destructive" : "secondary"} className="text-[9px] px-1 h-3.5">
                                          {count}/{CLASS_LIMIT}
                                        </Badge>
                                      </div>
                                      <p className="text-[9px] text-muted-foreground mb-1 font-medium">{slot.quadra}</p>
                                      
                                      {enrolled.length > 0 ? (
                                        <div className="space-y-0.5 border-t pt-1 mt-1 pb-1">
                                          {enrolled.map((e) => {
                                            const st = students.find((s) => s.id === e.alunoId);
                                            return <p key={e.id} className="truncate text-muted-foreground leading-tight" title={st?.nome}>{st?.nome || "?"}</p>;
                                          })}
                                        </div>
                                      ) : (
                                        <p className="text-[9px] text-muted-foreground italic border-t pt-1 mt-1 text-center">Vazia</p>
                                      )}

                                      <div className="flex gap-1 mt-1 pt-1 border-t">
                                        <Button variant="outline" size="sm" className="text-[9px] h-4 px-1" onClick={() => openEditSlot(slot)}>Editar</Button>
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {slots.length < quadras.length && (
                                  <div
                                    className={`border border-dashed rounded p-2 text-[10px] text-center text-muted-foreground cursor-pointer hover:bg-secondary transition-colors ${slots.length > 0 ? 'py-1 opacity-60 hover:opacity-100' : ''}`}
                                    onClick={() => openNewSlot(d, h)}
                                  >
                                    {slots.length === 0 ? "Cadastrar turma" : "+ Nova Quadra"}
                                  </div>
                                )}
                              </div>
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
              <Select value={slotForm.quadra} onValueChange={(v) => setSlotForm({ ...slotForm, quadra: v, turmaId: generateTurmaId(slotForm.dia, v, slotForm.horario) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{quadras.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Dia</Label>
              <Select value={slotForm.dia} onValueChange={(v) => setSlotForm({ ...slotForm, dia: v, turmaId: generateTurmaId(v, slotForm.quadra, slotForm.horario) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{dias.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Horário</Label>
              <Select value={slotForm.horario} onValueChange={(v) => setSlotForm({ ...slotForm, horario: v, turmaId: generateTurmaId(slotForm.dia, slotForm.quadra, v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{horarios.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>ID da Turma</Label><Input value={slotForm.turmaId} readOnly className="bg-muted" /></div>
            <div className="flex justify-end gap-2">
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
