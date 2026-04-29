import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import { startOfWeek, addDays, format, startOfDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { CLASS_LIMIT, type LessonType, type LessonPlan as LessonPlanType } from "@/data/mockData";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const horarios = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

const LessonPlan = () => {
  const { 
    schedule, 
    enrollments, 
    students, 
    lessonTypes, 
    setLessonTypes, 
    lessonPlans, 
    setLessonPlans 
  } = useAppContext();

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAulasModal, setShowAulasModal] = useState(false);
  const [showAulaForm, setShowAulaForm] = useState(false);
  const [editingAula, setEditingAula] = useState<LessonType | null>(null);
  const [aulaNome, setAulaNome] = useState("");

  const [editingPlan, setEditingPlan] = useState<{ slotId: string, date: string } | null>(null);
  const [selectedAulaId, setSelectedAulaId] = useState("");
  const [planObservacoes, setPlanObservacoes] = useState("");

  // Week calculation
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDates = useMemo(() => {
    const dates: Record<string, Date> = {};
    dias.forEach((dia, i) => {
      dates[dia] = addDays(weekStart, i);
    });
    return dates;
  }, [weekStart]);

  const weekDatesStr = useMemo(() => {
    const dates: Record<string, string> = {};
    Object.entries(weekDates).forEach(([dia, date]) => {
      dates[dia] = format(date, "yyyy-MM-dd");
    });
    return dates;
  }, [weekDates]);

  const handlePrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  // Aulas CRUD
  const handleSaveAula = () => {
    if (!aulaNome) return;
    if (editingAula) {
      setLessonTypes(prev => prev.map(a => a.id === editingAula.id ? { ...a, nome: aulaNome } : a));
      toast.success("Aula atualizada");
    } else {
      setLessonTypes(prev => [...prev, { id: crypto.randomUUID(), nome: aulaNome }]);
      toast.success("Aula cadastrada");
    }
    setAulaNome("");
    setEditingAula(null);
    setShowAulaForm(false);
  };

  const handleDeleteAula = (id: string) => {
    setLessonTypes(prev => prev.filter(a => a.id !== id));
    toast.success("Aula removida");
  };

  // Lesson Plan Logic
  const getSlotPlan = (slotId: string, date: string) => {
    return lessonPlans.find(p => p.turmaId === slotId && p.data === date);
  };

  const handleOpenPlanEdit = (slotId: string, date: string, quadra: string) => {
    const existing = getSlotPlan(slotId, date);
    setEditingPlan({ slotId, date });
    if (existing) {
      setSelectedAulaId(existing.lessonTypeId);
      setPlanObservacoes(existing.observacoes ?? "");
    } else {
      setSelectedAulaId("");
      setPlanObservacoes("");
    }
  };

  const handleSavePlan = (slotId: string, date: string, quadra: string) => {
    if (!selectedAulaId) {
      toast.error("Selecione uma aula");
      return;
    }

    const existing = getSlotPlan(slotId, date);
    if (existing) {
      setLessonPlans(prev => prev.map(p => p.id === existing.id ? { 
        ...p, 
        lessonTypeId: selectedAulaId, 
        observacoes: planObservacoes 
      } : p));
    } else {
      setLessonPlans(prev => [...prev, { 
        id: crypto.randomUUID(), 
        data: date, 
        turmaId: slotId, 
        quadra, 
        lessonTypeId: selectedAulaId, 
        observacoes: planObservacoes 
      }]);
    }
    toast.success("Plano de aula salvo");
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      {/* Seção 1: Seleção de Semana e Botão Cadastrar Aulas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-primary font-medium">Plano de Aulas</p>
            <CardTitle className="text-2xl">Gestão de Planos Semanais</CardTitle>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-md p-1">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                Semana de {format(weekStart, "dd/MM")} a {format(addDays(weekStart, 4), "dd/MM")}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <Button onClick={() => setShowAulasModal(true)} className="flex gap-2">
              <Plus className="h-4 w-4" /> Cadastrar Aulas
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Seção 2: Grade Semanal */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 font-medium text-muted-foreground border-b w-20">Horários</th>
                  {dias.map((d) => (
                    <th key={d} className="text-center p-2 border-b">
                      <p className="font-medium">{d}</p>
                      <p className="text-[10px] text-muted-foreground font-normal">{format(weekDates[d], "dd/MM")}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horarios.map((h) => (
                  <tr key={h} className="group">
                    <td className="p-2 font-medium border-r border-b group-last:border-b-0 whitespace-nowrap bg-muted/5">{h}</td>
                    {dias.map((d) => {
                      const dateStr = weekDatesStr[d];
                      const slots = schedule.filter(s => s.dia === d && s.horario === h);
                      
                      return (
                        <td key={d} className="p-1 border-b border-r last:border-r-0 group-last:border-b-0 align-top min-w-[180px]">
                          <div className="flex flex-col gap-2">
                            {slots.map((slot) => {
                              const enrolled = enrollments.filter(e => e.turmaId === slot.id);
                              const plan = getSlotPlan(slot.id, dateStr);
                              const aula = lessonTypes.find(a => a.id === plan?.lessonTypeId);

                              return (
                                <div key={slot.id} className="border rounded p-2 bg-card shadow-sm border-primary/20">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-bold text-primary text-[10px]">{slot.turmaId}</p>
                                    <Badge variant="outline" className="text-[9px] px-1 h-3.5">{slot.quadra}</Badge>
                                  </div>
                                  
                                  {/* Alunos em ordem alfabética */}
                                  <div className="space-y-0.5 border-t pt-1 mt-1">
                                    <p className="text-[9px] font-semibold text-muted-foreground uppercase">Alunos:</p>
                                    {enrolled.length > 0 ? (
                                      enrolled
                                        .map(e => students.find(s => s.id === e.alunoId))
                                        .filter((st): st is NonNullable<typeof st> => !!st)
                                        .sort((a, b) => a.nome.localeCompare(b.nome))
                                        .map((st, idx) => (
                                          <p key={idx} className="truncate text-muted-foreground text-[10px] leading-tight" title={st.nome}>
                                            {st.nome}
                                          </p>
                                        ))
                                    ) : (
                                      <p className="text-[9px] text-muted-foreground italic">Sem alunos</p>
                                    )}
                                  </div>

                                  {/* Plano de Aula */}
                                  <div className="border-t pt-1 mt-1">
                                    <p className="text-[9px] font-semibold text-muted-foreground uppercase">Plano da Aula:</p>
                                    {plan ? (
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-medium text-primary leading-tight">{aula?.nome}</p>
                                        {plan.observacoes && (
                                          <p className="text-[9px] text-muted-foreground line-clamp-2 italic">"{plan.observacoes}"</p>
                                        )}
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-5 px-1 text-[9px] text-primary w-full mt-1"
                                          onClick={() => handleOpenPlanEdit(slot.id, dateStr, slot.quadra)}
                                        >
                                          Editar Plano
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="mt-1">
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-6 w-full text-[9px]"
                                          onClick={() => handleOpenPlanEdit(slot.id, dateStr, slot.quadra)}
                                        >
                                          Selecionar Aula
                                        </Button>
                                      </div>
                                    )}
                                  </div>
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

      {/* Modal de CRUD de Aulas */}
      <Dialog open={showAulasModal} onOpenChange={setShowAulasModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lista de Aulas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Gerencie as aulas ministradas pela equipe.</p>
              <Button size="sm" onClick={() => { setEditingAula(null); setAulaNome(""); setShowAulaForm(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Nova Aula
              </Button>
            </div>

            {showAulaForm && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <Label>Nome da Aula</Label>
                    <Input value={aulaNome} onChange={(e) => setAulaNome(e.target.value)} placeholder="Ex: Fundamentos de Smash" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAulaForm(false)}>Cancelar</Button>
                    <Button size="sm" onClick={handleSaveAula}>{editingAula ? "Atualizar" : "Salvar"}</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {lessonTypes.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground text-sm">Nenhuma aula cadastrada.</p>
              ) : (
                lessonTypes.map((aula) => (
                  <div key={aula.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">{aula.nome}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAula(aula); setAulaNome(aula.nome); setShowAulaForm(true); }}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteAula(aula.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Seleção/Edição de Plano */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plano de Aula - {editingPlan && format(new Date(editingPlan.date + "T12:00:00"), "dd/MM/yyyy")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Aula</Label>
              <Select value={selectedAulaId} onValueChange={setSelectedAulaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma aula..." />
                </SelectTrigger>
                <SelectContent>
                  {lessonTypes.map(aula => (
                    <SelectItem key={aula.id} value={aula.id}>{aula.nome}</SelectItem>
                  ))}
                  {lessonTypes.length === 0 && (
                    <div className="p-2 text-center text-xs text-muted-foreground">Nenhuma aula cadastrada.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações / Detalhes (Opcional)</Label>
              <Textarea 
                value={planObservacoes} 
                onChange={(e) => setPlanObservacoes(e.target.value)} 
                placeholder="Detalhes específicos para esta aula neste dia..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
              <Button onClick={() => editingPlan && handleSavePlan(editingPlan.slotId, editingPlan.date, schedule.find(s => s.id === editingPlan.slotId)?.quadra || "")}>
                Salvar Plano
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonPlan;
