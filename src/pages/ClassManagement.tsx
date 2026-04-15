import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockPlans, mockSchedule, getFrequenciaCount, CLASS_LIMIT, type Enrollment, type ClassSlot } from "@/data/mockData";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";

const ClassManagement = () => {
  const { students, enrollments, setEnrollments } = useAppContext();
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>("");
  const [slotSelections, setSlotSelections] = useState<string[]>([]);
  const [editingAlunoId, setEditingAlunoId] = useState<string | null>(null);

  const activeStudents = students.filter((s) => s.status === "Ativo");

  const getSlotCount = (slotId: string) => enrollments.filter((e) => e.turmaId === slotId).length;

  const getSlotLabel = (slot: ClassSlot) => {
    const count = getSlotCount(slot.id);
    return `${slot.dia} ${slot.horario} - ${slot.quadra} (${count}/${CLASS_LIMIT})`;
  };

  const getAlunoEnrollments = (alunoId: string) => enrollments.filter((e) => e.alunoId === alunoId);

  const getSlotById = (id: string) => mockSchedule.find((s) => s.id === id);

  const getPlano = (planoId: string) => mockPlans.find((p) => p.id === planoId);

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
    const newEnrollments = slotSelections.map((turmaId, i) => ({
      id: `e-${Date.now()}-${i}`,
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

      {/* Visão por turma */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-primary font-medium">Ocupação</p>
          <p className="font-semibold text-lg mb-4">Turmas e Vagas</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockSchedule.map((slot) => {
              const count = getSlotCount(slot.id);
              const full = count >= CLASS_LIMIT;
              const enrolled = enrollments.filter((e) => e.turmaId === slot.id);
              return (
                <div key={slot.id} className={`border rounded-md p-3 ${full ? "border-destructive/50 bg-destructive/5" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{slot.dia} · {slot.horario}</p>
                    <Badge variant={full ? "destructive" : "secondary"}>{count}/{CLASS_LIMIT}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{slot.quadra} · {slot.turmaId}</p>
                  {enrolled.length > 0 ? (
                    <div className="space-y-1">
                      {enrolled.map((e) => {
                        const st = students.find((s) => s.id === e.alunoId);
                        return <p key={e.id} className="text-xs">{st?.nome || "?"}</p>;
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sem alunos</p>
                  )}
                </div>
              );
            })}
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
                        {mockSchedule.map((slot) => {
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
