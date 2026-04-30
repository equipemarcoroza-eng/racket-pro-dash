import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Save, ClipboardCheck } from "lucide-react";
import type { Activity, Test, TestResult } from "@/data/mockData";

const Tests = () => {
  const { 
    students, 
    attendanceLogs, 
    schedule, 
    activities, setActivities,
    tests, setTests,
    testResults, setTestResults 
  } = useAppContext();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showTestModal, setShowTestModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  
  // States for the Test Modal
  const [currentSlotId, setCurrentSlotId] = useState<string | null>(null);
  const [selectedAtividadesIds, setSelectedAtividadesIds] = useState<string[]>([]);
  const [tempResults, setTempResults] = useState<Record<string, Record<string, number>>>({});

  // Activity CRUD states
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityForm, setActivityForm] = useState({ nome: "", quantidadeLancamentos: 10 });

  // 1. Identify slots that have attendance logs for selectedDate
  const slotsWithAttendance = useMemo(() => {
    const slotsMap = new Map();
    attendanceLogs
      .filter(l => l.data === selectedDate)
      .forEach(l => {
        const slot = schedule.find(s => s.id === l.turmaId);
        if (slot) {
          slotsMap.set(slot.id, slot);
        }
      });
    return Array.from(slotsMap.values()).sort((a, b) => a.horario.localeCompare(b.horario));
  }, [attendanceLogs, selectedDate, schedule]);

  // 2. Get present students for a slot on selectedDate
  const getPresentStudents = (slotId: string) => {
    const presentIds = attendanceLogs
      .filter(l => l.data === selectedDate && l.turmaId === slotId && (l.presente === "Presente" || l.presente === "Miniliga" || l.presente === "Reposição"))
      .map(l => l.alunoId);
    
    return students
      .filter(s => presentIds.includes(s.id))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  };

  const handleOpenTestModal = (slotId: string) => {
    setCurrentSlotId(slotId);
    const existingTest = tests.find(t => t.data === selectedDate && t.slotId === slotId);
    
    if (existingTest) {
      setSelectedAtividadesIds(existingTest.atividadesIds);
      const results: Record<string, Record<string, number>> = {};
      testResults
        .filter(tr => tr.testId === existingTest.id)
        .forEach(tr => {
          if (!results[tr.alunoId]) results[tr.alunoId] = {};
          results[tr.alunoId][tr.atividadeId] = tr.acertos;
        });
      setTempResults(results);
    } else {
      setSelectedAtividadesIds([]);
      setTempResults({});
    }
    setShowTestModal(true);
  };

  const handleSaveTest = () => {
    if (!currentSlotId) return;
    if (selectedAtividadesIds.length === 0) {
      toast.error("Selecione ao menos uma atividade para a prova");
      return;
    }

    const testId = tests.find(t => t.data === selectedDate && t.slotId === currentSlotId)?.id || crypto.randomUUID();
    
    const newTest: Test = {
      id: testId,
      data: selectedDate,
      slotId: currentSlotId,
      atividadesIds: selectedAtividadesIds,
    };

    const newResults: TestResult[] = [];
    const presentStudents = getPresentStudents(currentSlotId);

    presentStudents.forEach(aluno => {
      selectedAtividadesIds.forEach(actId => {
        const acertos = tempResults[aluno.id]?.[actId] || 0;
        newResults.push({
          id: crypto.randomUUID(),
          testId,
          alunoId: aluno.id,
          atividadeId: actId,
          acertos,
        });
      });
    });

    setTests(prev => [...prev.filter(t => t.id !== testId), newTest]);
    setTestResults(prev => [...prev.filter(tr => tr.testId !== testId), ...newResults]);
    
    toast.success("Prova registrada com sucesso!");
    setShowTestModal(false);
  };

  const handleSaveActivity = () => {
    if (!activityForm.nome) { toast.error("Nome da atividade é obrigatório"); return; }
    
    const newActivity: Activity = {
      id: editingActivity?.id || crypto.randomUUID(),
      nome: activityForm.nome,
      quantidadeLancamentos: activityForm.quantidadeLancamentos,
    };

    setActivities(prev => [...prev.filter(a => a.id !== newActivity.id), newActivity]);
    setActivityForm({ nome: "", quantidadeLancamentos: 10 });
    setEditingActivity(null);
    toast.success(editingActivity ? "Atividade atualizada" : "Atividade criada");
  };

  const handleDeleteActivity = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta atividade? Isso pode afetar provas já registradas.")) {
      setActivities(prev => prev.filter(a => a.id !== id));
      toast.success("Atividade removida");
    }
  };

  const toggleActivitySelection = (id: string) => {
    setSelectedAtividadesIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleResultChange = (alunoId: string, activityId: string, value: string) => {
    const acertos = parseInt(value) || 0;
    setTempResults(prev => ({
      ...prev,
      [alunoId]: {
        ...(prev[alunoId] || {}),
        [activityId]: acertos
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-primary font-medium">Desempenho</p>
            <CardTitle className="text-2xl font-bold tracking-tight">Avaliação de Provas Técnicas</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Data da Prova:</Label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="w-40 h-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowActivityModal(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Gestão de Atividades
            </Button>
          </div>
        </CardHeader>
      </Card>

      {slotsWithAttendance.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-full">
                <ClipboardCheck className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">Nenhuma presença registrada para esta data.</p>
              <p className="text-sm text-muted-foreground max-w-sm">Você precisa primeiro realizar o <b>Controle de Presença</b> nas turmas antes de aplicar uma prova.</p>
              <Button variant="default" className="mt-2 bg-yellow-600 hover:bg-yellow-700">Registrar as Presenças desta Data</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slotsWithAttendance.map((slot) => {
            const presentStudents = getPresentStudents(slot.id);
            const hasTest = tests.some(t => t.data === selectedDate && t.slotId === slot.id);
            
            return (
              <Card key={slot.id} className="overflow-hidden border-t-4 border-t-primary">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{slot.horario} · {slot.quadra}</CardTitle>
                      <p className="text-xs text-muted-foreground font-medium uppercase mt-1">Turma {slot.turmaId}</p>
                    </div>
                    {hasTest && <Badge variant="default" className="bg-green-600">Prova Registrada</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Alunos Presentes ({presentStudents.length})</p>
                  <div className="space-y-1 mb-6">
                    {presentStudents.length === 0 ? (
                      <p className="text-sm italic text-muted-foreground">Nenhum aluno presente</p>
                    ) : (
                      presentStudents.map(aluno => (
                        <div key={aluno.id} className="text-sm py-1 border-b border-muted last:border-0">
                          {aluno.nome}
                        </div>
                      ))
                    )}
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    variant={hasTest ? "outline" : "default"}
                    onClick={() => handleOpenTestModal(slot.id)}
                    disabled={presentStudents.length === 0}
                  >
                    <Save className="h-4 w-4" /> {hasTest ? "Editar Prova" : "Registrar Prova"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Gestão de Atividades */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestão de Atividades Técnicas</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20">
              <div className="md:col-span-2">
                <Label>Nome da Atividade</Label>
                <Input 
                  value={activityForm.nome} 
                  onChange={(e) => setActivityForm({ ...activityForm, nome: e.target.value })} 
                  placeholder="Ex: Saque, Voleio, Smash..."
                />
              </div>
              <div>
                <Label>Qtd. Lançamentos</Label>
                <Input 
                  type="number" 
                  value={activityForm.quantidadeLancamentos} 
                  onChange={(e) => setActivityForm({ ...activityForm, quantidadeLancamentos: parseInt(e.target.value) || 0 })} 
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button onClick={handleSaveActivity} size="sm">
                  {editingActivity ? "Atualizar Atividade" : "Criar Atividade"}
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="text-center">Lançamentos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">Nenhuma atividade cadastrada</TableCell></TableRow>
                ) : (
                  activities.map((act) => (
                    <TableRow key={act.id}>
                      <TableCell className="font-medium">{act.nome}</TableCell>
                      <TableCell className="text-center">{act.quantidadeLancamentos}</TableCell>
                      <TableCell className="text-right flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingActivity(act); setActivityForm({ nome: act.nome, quantidadeLancamentos: act.quantidadeLancamentos }); }}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteActivity(act.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Registro de Prova */}
      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registro de Prova Técnica</DialogTitle>
            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
              <span>Data: <b>{selectedDate.split("-").reverse().join("/") }</b></span>
              <span>Turma: <b>{schedule.find(s => s.id === currentSlotId)?.horario} · {schedule.find(s => s.id === currentSlotId)?.quadra}</b></span>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="font-bold">Selecione as Atividades para esta Prova:</Label>
              <div className="flex flex-wrap gap-2">
                {activities.map(act => (
                  <Badge 
                    key={act.id} 
                    variant={selectedAtividadesIds.includes(act.id) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1 text-sm"
                    onClick={() => toggleActivitySelection(act.id)}
                  >
                    {act.nome} ({act.quantidadeLancamentos})
                  </Badge>
                ))}
                {activities.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhuma atividade disponível. Crie atividades na gestão.</p>}
              </div>
            </div>

            {selectedAtividadesIds.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-48 sticky left-0 bg-muted/50">Aluno</TableHead>
                      {selectedAtividadesIds.map(actId => {
                        const act = activities.find(a => a.id === actId);
                        return (
                          <TableHead key={actId} className="text-center min-w-[120px]">
                            {act?.nome}
                            <div className="text-[10px] opacity-60 font-normal">Lanç.: {act?.quantidadeLancamentos}</div>
                          </TableHead>
                        );
                      })}
                      <TableHead className="text-center font-bold bg-primary/5">Média Geral</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSlotId && getPresentStudents(currentSlotId).map(aluno => {
                      let totalPercentual = 0;
                      return (
                        <TableRow key={aluno.id}>
                          <TableCell className="font-medium sticky left-0 bg-background">{aluno.nome}</TableCell>
                          {selectedAtividadesIds.map(actId => {
                            const act = activities.find(a => a.id === actId)!;
                            const acertos = tempResults[aluno.id]?.[actId] || 0;
                            const percentual = act.quantidadeLancamentos > 0 ? (acertos / act.quantidadeLancamentos) * 100 : 0;
                            totalPercentual += percentual;
                            
                            return (
                              <TableCell key={actId}>
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      type="number" 
                                      className="w-16 h-8 text-center text-xs" 
                                      min={0}
                                      max={act.quantidadeLancamentos}
                                      value={acertos}
                                      onChange={(e) => handleResultChange(aluno.id, actId, e.target.value)}
                                    />
                                    <span className="text-[10px] font-bold text-muted-foreground">{percentual.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-black bg-primary/5">
                            {(totalPercentual / selectedAtividadesIds.length).toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter className="mt-8">
            <Button variant="outline" onClick={() => setShowTestModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveTest}>Salvar Resultados da Prova</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tests;
