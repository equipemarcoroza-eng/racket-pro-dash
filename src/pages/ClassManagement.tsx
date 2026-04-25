import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getFrequenciaCount, CLASS_LIMIT, type ClassSlot } from "@/data/mockData";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import { startOfWeek, addDays, format } from "date-fns";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const horarios = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

const ClassManagement = () => {
  const { students, enrollments, setEnrollments, schedule, plans } = useAppContext();
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>("");
  const [slotSelections, setSlotSelections] = useState<string[]>([]);
  const [editingAlunoId, setEditingAlunoId] = useState<string | null>(null);

  const activeStudents = students.filter((s) => s.status === "Ativo");

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

  const getSlotLabel = (slot: ClassSlot) => {
    const count = getSlotCount(slot.id);
    return `${slot.dia} ${slot.horario} - ${slot.quadra} (${count}/${CLASS_LIMIT})`;
  };

  const getAlunoEnrollments = (alunoId: string) => enrollments.filter((e) => e.alunoId === alunoId);

  const getSlotById = (id: string) => schedule.find((s) => s.id === id);

  const getPlano = (planoId: string) => plans.find((p) => p.id === planoId);

  const openEnroll = (alunoId?: string) => {
    setEditingAlunoId(alunoId || null);
    if (alunoId) {
      setSelectedAlunoId(alunoId);
      const existing = getAlunoEnrollments(alunoId).map((e) => e.turmaId);
      const plano = getPlano(students.find((s) => s.id === alunoId)?.planoId || "");
      const count = plano ? getFrequenciaCount(plano.frequencia) : 1;
      const selections = [...existing];
      while (selections.length < count) selections.push("");
      setSlotSelections(selections);
    } else {
      setSelectedAlunoId("");
      setSlotSelections([]);
    }
    setShowEnrollDialog(true);
  };

  const handleAlunoChange = (alunoId: string) => {
    setSelectedAlunoId(alunoId);
    const student = students.find((s) => s.id === alunoId);
    if (!student) return;
    const plano = getPlano(student.planoId);
    if (!plano) return;
    const count = getFrequenciaCount(plano.frequencia);
    const existing = editingAlunoId ? getAlunoEnrollments(alunoId).map((e) => e.turmaId) : [];
    const selections = [...existing];
    while (selections.length < count) selections.push("");
    setSlotSelections(selections.slice(0, count));
  };

  const handleSlotChange = (index: number, value: string) => {
    setSlotSelections((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const isSlotAvailable = (slotId: string, currentIndex: number) => {
    if (!slotId) return true;
    const count = getSlotCount(slotId);
    const isCurrentlyEnrolled = editingAlunoId ? enrollments.some((e) => e.alunoId === selectedAlunoId && e.turmaId === slotId) : false;
    const selectedElsewhere = slotSelections.some((s, i) => i !== currentIndex && s === slotId);
    const effectiveCount = count - (isCurrentlyEnrolled ? 1 : 0) + (selectedElsewhere ? 1 : 0);
    return effectiveCount < CLASS_LIMIT;
  };

  const handleSaveEnrollment = () => {
    if (!selectedAlunoId) { toast.error("Selecione um aluno"); return; }
    if (slotSelections.some((s) => !s)) { toast.error("Selecione todos os horários"); return; }
    const duplicates = new Set(slotSelections).size !== slotSelections.length;
    if (duplicates) { toast.error("Não é possível selecionar o mesmo horário duas vezes"); return; }

    // Validate all slots have capacity
    for (const slotId of slotSelections) {
      const count = getSlotCount(slotId);
      const isCurrentlyEnrolled = editingAlunoId ? enrollments.some((e) => e.alunoId === selectedAlunoId && e.turmaId === slotId) : false;
      if (!isCurrentlyEnrolled && count >= CLASS_LIMIT) {
        const slot = getSlotById(slotId);
        toast.error(`Turma ${slot?.dia} ${slot?.horario} está lotada`);
        return;
      }
    }

    // Remove old enrollments for this student
    const filtered = enrollments.filter((e) => e.alunoId !== selectedAlunoId);
    // Add new
    const newEnrollments = slotSelections.map((turmaId) => ({
      id: crypto.randomUUID(),
      alunoId: selectedAlunoId,
      turmaId,
    }));
    setEnrollments([...filtered, ...newEnrollments]);
    toast.success(editingAlunoId ? "Horários atualizados" : "Aluno matriculado nas turmas");
    setShowEnrollDialog(false);
    setEditingAlunoId(null);
  };

  const handleRemoveEnrollments = (alunoId: string) => {
    setEnrollments((prev) => prev.filter((e) => e.alunoId !== alunoId));
    toast.success("Matrículas removidas");
  };

  // Students not yet enrolled
  const unenrolledStudents = activeStudents.filter((s) => !getAlunoEnrollments(s.id).length);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-primary font-medium">Gestão</p>
            <CardTitle className="text-2xl">Controle de Turmas</CardTitle>
          </div>
          <Button onClick={() => openEnroll()}>Matricular Aluno</Button>
        </CardHeader>
      </Card>

      {/* Alunos matriculados */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-primary font-medium">Alunos Matriculados</p>
          <p className="font-semibold text-lg mb-4">Distribuição por turma</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Turmas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeStudents.filter((s) => getAlunoEnrollments(s.id).length > 0).map((student) => {
                const plano = getPlano(student.planoId);
                const enrs = getAlunoEnrollments(student.id);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.nome}</TableCell>
                    <TableCell>{plano?.nome || "—"}</TableCell>
                    <TableCell>{plano?.frequencia || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {enrs.map((e) => {
                          const slot = getSlotById(e.turmaId);
                          return slot ? (
                            <Badge key={e.id} variant="secondary" className="text-xs">
                              {slot.dia} {slot.horario} · {slot.turmaId}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEnroll(student.id)}>Alterar</Button>
                        <Button variant="outline" size="sm" onClick={() => handleRemoveEnrollments(student.id)}>Remover</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alunos sem matrícula */}
      {unenrolledStudents.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-primary font-medium">Pendente</p>
            <p className="font-semibold text-lg mb-4">Alunos sem turma ({unenrolledStudents.length})</p>
            <div className="flex flex-wrap gap-2">
              {unenrolledStudents.map((s) => (
                <Button key={s.id} variant="outline" size="sm" onClick={() => openEnroll(s.id)}>
                  {s.nome}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visão por turma - Grade Semanal */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-primary font-medium">Ocupação</p>
              <p className="font-semibold text-lg">Turmas e Vagas (Grade Semanal)</p>
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
                                    <div className="space-y-0.5 border-t pt-1 mt-1">
                                      {enrolled
                                        .map((e) => students.find((s) => s.id === e.alunoId))
                                        .filter((st): st is NonNullable<typeof st> => !!st)
                                        .sort((a, b) => a.nome.localeCompare(b.nome))
                                        .map((st, idx) => (
                                          <p key={idx} className="truncate text-muted-foreground leading-tight" title={st.nome}>{st.nome}</p>
                                        ))
                                      }
                                    </div>
                                  ) : (
                                    <p className="text-[9px] text-muted-foreground italic border-t pt-1 mt-1 text-center">Vazia</p>
                                  )}
                                </div>
                              );
                            })}
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

      {/* Dialog Matricular/Alterar */}
      <Dialog open={showEnrollDialog} onOpenChange={(open) => { if (!open) { setShowEnrollDialog(false); setEditingAlunoId(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAlunoId ? "Alterar Horários" : "Matricular Aluno"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Aluno</Label>
              <Select value={selectedAlunoId} onValueChange={handleAlunoChange} disabled={!!editingAlunoId}>
                <SelectTrigger><SelectValue placeholder="Selecione um aluno" /></SelectTrigger>
                <SelectContent>
                  {activeStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAlunoId && (
              <>
                {(() => {
                  const student = students.find((s) => s.id === selectedAlunoId);
                  const plano = student ? getPlano(student.planoId) : null;
                  return plano ? (
                    <div className="bg-secondary rounded-md p-3 text-sm">
                      <p><span className="font-medium">Plano:</span> {plano.nome}</p>
                      <p><span className="font-medium">Frequência:</span> {plano.frequencia}</p>
                    </div>
                  ) : null;
                })()}

                {slotSelections.map((selected, index) => (
                  <div key={index}>
                    <Label>Aula {index + 1}</Label>
                    <Select value={selected} onValueChange={(v) => handleSlotChange(index, v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione dia/horário" /></SelectTrigger>
                      <SelectContent>
                        {schedule.map((slot) => {
                          const available = isSlotAvailable(slot.id, index);
                          return (
                            <SelectItem key={slot.id} value={slot.id} disabled={!available && slot.id !== selected}>
                              {getSlotLabel(slot)} {!available && slot.id !== selected ? "· Lotada" : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowEnrollDialog(false); setEditingAlunoId(null); }}>Cancelar</Button>
              <Button onClick={handleSaveEnrollment}>{editingAlunoId ? "Atualizar" : "Matricular"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassManagement;
