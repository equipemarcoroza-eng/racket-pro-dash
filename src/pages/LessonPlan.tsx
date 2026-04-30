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
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import logo from "@/assets/logo.png";
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
  
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDate, setPrintDate] = useState(format(new Date(), "yyyy-MM-dd"));

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
  const getSlotPlans = (slotId: string, date: string) => {
    return lessonPlans.filter(p => p.turmaId === slotId && p.data === date);
  };

  const handleOpenPlanEdit = (slotId: string, date: string) => {
    const existing = getSlotPlans(slotId, date);
    setEditingPlan({ slotId, date });
    if (existing.length > 0) {
      setSelectedAulas(existing.map(p => p.lessonTypeId));
      setPlanObservacoes(existing[0].observacoes ?? "");
    } else {
      setSelectedAulas([]);
      setPlanObservacoes("");
    }
  };

  const [selectedAulas, setSelectedAulas] = useState<string[]>([]);

  const toggleAulaSelection = (id: string) => {
    setSelectedAulas(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSavePlan = (slotId: string, date: string, quadra: string) => {
    if (selectedAulas.length === 0) {
      toast.error("Selecione pelo menos uma aula");
      return;
    }

    const existing = getSlotPlans(slotId, date);
    
    // Identificar o que remover e o que adicionar
    const toRemove = existing.filter(p => !selectedAulas.includes(p.lessonTypeId));
    const currentTypeIds = existing.map(p => p.lessonTypeId);
    const toAdd = selectedAulas.filter(id => !currentTypeIds.includes(id));

    setLessonPlans(prev => {
      // Remover os desmarcados
      let next = prev.filter(p => !toRemove.some(r => r.id === p.id));
      
      // Atualizar observações nos que ficaram
      next = next.map(p => (p.turmaId === slotId && p.data === date) ? { ...p, observacoes: planObservacoes } : p);

      // Adicionar os novos
      const newPlans = toAdd.map(lessonTypeId => ({
        id: crypto.randomUUID(),
        data: date,
        turmaId: slotId,
        quadra,
        lessonTypeId,
        observacoes: planObservacoes
      }));

      return [...next, ...newPlans];
    });

    toast.success("Plano de aula atualizado");
    setEditingPlan(null);
  };

  const handlePrintPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      // Logo
      try {
        doc.addImage(logo, "PNG", 85, 10, 40, 40);
      } catch (e) {
        console.error("Erro ao carregar o logotipo", e);
      }

      const formattedDate = format(new Date(printDate + "T12:00:00"), "dd/MM/yyyy");

      doc.setFontSize(22);
      doc.setTextColor(20, 40, 100);
      doc.text("Plano de Aulas", 105, 60, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Data: ${formattedDate}`, 105, 70, { align: "center" });

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 75, 190, 75);

      // Filtrar horários que possuem turmas e planos para este dia
      const dayOfWeekMap: Record<number, string> = {
        1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb", 0: "Dom"
      };
      const dayOfWeek = dayOfWeekMap[new Date(printDate + "T12:00:00").getDay()];

      const daySlots = schedule.filter(s => s.dia === dayOfWeek);
      
      let currentY = 85;

      if (daySlots.length === 0) {
        doc.setFontSize(12);
        doc.text("Nenhuma turma cadastrada para este dia da semana.", 105, 95, { align: "center" });
      } else {
        // Ordenar slots por horário
        const sortedSlots = [...daySlots].sort((a, b) => a.horario.localeCompare(b.horario));

        sortedSlots.forEach((slot) => {
          const slotPlans = lessonPlans.filter(p => p.turmaId === slot.id && p.data === printDate);
          const enrolled = enrollments.filter(e => e.turmaId === slot.id);
          const classStudents = enrolled
            .map(e => students.find(s => s.id === e.alunoId))
            .filter((st): st is NonNullable<typeof st> => !!st)
            .sort((a, b) => a.nome.localeCompare(b.nome));

          // Verificar espaço na página
          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }

          // Header da Turma
          doc.setFillColor(245, 247, 250);
          doc.rect(20, currentY, 170, 8, 'F');
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(20, 40, 100);
          doc.text(`${slot.horario} - Turma: ${slot.turmaId} (${slot.quadra})`, 25, currentY + 5.5);
          
          currentY += 12;

          // Alunos
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 100, 100);
          doc.text("ALUNOS:", 25, currentY);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          const studentsText = classStudents.length > 0 
            ? classStudents.map(s => s.nome).join(", ") 
            : "Nenhum aluno matriculado.";
          
          const splitStudents = doc.splitTextToSize(studentsText, 160);
          doc.text(splitStudents, 25, currentY + 5);
          currentY += (splitStudents.length * 5) + 5;

          // Plano de Aula
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 100, 100);
          doc.text("CONTEÚDO DA AULA:", 25, currentY);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          
          if (slotPlans.length > 0) {
            let planText = slotPlans.map(p => {
              const aula = lessonTypes.find(a => a.id === p.lessonTypeId);
              return `• ${aula?.nome || "Aula não identificada"}`;
            }).join("\n");

            if (slotPlans[0].observacoes) {
              planText += `\n\nObs: ${slotPlans[0].observacoes}`;
            }

            const splitPlan = doc.splitTextToSize(planText, 160);
            doc.text(splitPlan, 25, currentY + 5);
            currentY += (splitPlan.length * 5) + 10;
          } else {
            doc.setFont("helvetica", "italic");
            doc.text("Nenhum plano de aula definido para este dia.", 25, currentY + 5);
            currentY += 15;
          }

          doc.setDrawColor(240, 240, 240);
          doc.line(20, currentY - 5, 190, currentY - 5);
          currentY += 5;
        });
      }

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 285, { align: "center" });

      doc.save(`plano-aulas-${printDate}.pdf`);
      toast.success("Plano de aulas gerado com sucesso");
      setShowPrintModal(false);
    } catch (err) {
      console.error("Falha ao gerar PDF", err);
      toast.error("Erro ao gerar o PDF");
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção 1: Seleção de Semana e Botão Cadastrar Aulas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-primary font-medium">Plano de Aulas</p>
              <CardTitle className="text-2xl font-bold tracking-tight">Gestão de Planos Semanais</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-secondary/50 rounded-md p-1 mr-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs font-bold min-w-[120px] text-center">
                  {format(weekStart, "dd/MM")} a {format(addDays(weekStart, 4), "dd/MM")}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <Button 
                variant="default" 
                onClick={() => setShowPrintModal(true)} 
                className="flex gap-2 shadow-sm font-semibold"
              >
                <Printer className="h-4 w-4" /> Imprimir Plano (PDF)
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAulasModal(true)} 
                className="flex gap-2"
              >
                <Plus className="h-4 w-4" /> Cadastrar Aulas
              </Button>
            </div>
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
                              const slotPlans = getSlotPlans(slot.id, dateStr);

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
                                    {slotPlans.length > 0 ? (
                                      <div className="space-y-1">
                                        <div className="flex flex-col gap-0.5">
                                          {slotPlans.map(p => {
                                            const aula = lessonTypes.find(a => a.id === p.lessonTypeId);
                                            return (
                                              <p key={p.id} className="text-[10px] font-medium text-primary leading-tight">• {aula?.nome}</p>
                                            );
                                          })}
                                        </div>
                                        {slotPlans[0].observacoes && (
                                          <p className="text-[9px] text-muted-foreground line-clamp-2 italic">"{slotPlans[0].observacoes}"</p>
                                        )}
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-5 px-1 text-[9px] text-primary w-full mt-1"
                                          onClick={() => handleOpenPlanEdit(slot.id, dateStr)}
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
                                          onClick={() => handleOpenPlanEdit(slot.id, dateStr)}
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
                [...lessonTypes]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((aula) => (
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
              <Label className="mb-2 block">Aulas Selecionadas</Label>
              <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                {[...lessonTypes]
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map(aula => (
                    <div 
                      key={aula.id} 
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedAulas.includes(aula.id) ? "bg-primary/10 border-primary/20 border" : "hover:bg-muted border border-transparent"
                      }`}
                      onClick={() => toggleAulaSelection(aula.id)}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedAulas.includes(aula.id) ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                        {selectedAulas.includes(aula.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className="text-sm">{aula.nome}</span>
                    </div>
                  ))}
                {lessonTypes.length === 0 && (
                  <div className="p-2 text-center text-xs text-muted-foreground">Nenhuma aula cadastrada.</div>
                )}
              </div>
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
      {/* Modal de Impressão */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Imprimir Plano de Aulas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Selecione a Data</Label>
              <Input 
                type="date" 
                value={printDate} 
                onChange={(e) => setPrintDate(e.target.value)} 
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-2">
                O PDF incluirá todas as turmas do dia selecionado com seus respectivos planos e listas de alunos.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPrintModal(false)}>Cancelar</Button>
              <Button onClick={handlePrintPDF}>Gerar PDF</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonPlan;
