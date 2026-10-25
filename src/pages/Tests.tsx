import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Plus, Trash2, Edit, Save, ClipboardCheck, BarChart3, Users, Award, Calendar, 
  ArrowRight, Search, Trophy, Sparkles, Eye, ChevronDown, ChevronUp, Printer, 
  FileText, CheckCircle2, ListChecks, Target
} from "lucide-react";
import type { Activity, Test, TestResult, Student } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { AthleteCardModal } from "@/components/AthleteCardModal";

const Tests = () => {
  const { 
    students, 
    attendanceLogs, 
    schedule, 
    activities, setActivities,
    tests, setTests,
    testResults, setTestResults 
  } = useAppContext();

  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showTestModal, setShowTestModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Função auxiliar para calcular o percentual de acerto de forma segura e realista.
  // Se em uma prova os acertos ultrapassarem os lançamentos base cadastrados (ex.: prova aplicada com 20 bolas para atividade com base de 10),
  // o total de lançamentos se ajusta proporcionalmente para múltiplos da base (rodadas) ou para o maior acerto registrado,
  // garantindo que o aproveitamento nunca ultrapasse 100%.
  const calculateSafePercentage = (
    acertos: number,
    baseLancamentos: number,
    maxAcertosInActivity?: number
  ): number => {
    if (!baseLancamentos || baseLancamentos <= 0) return 0;
    
    const highest = Math.max(acertos, maxAcertosInActivity || 0);
    let effectiveLancamentos = baseLancamentos;

    if (highest > baseLancamentos) {
      const rodadas = Math.ceil(highest / baseLancamentos);
      effectiveLancamentos = rodadas * baseLancamentos;
    }

    if (effectiveLancamentos <= 0) return 0;
    const pct = (acertos / effectiveLancamentos) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  // Calculando estatísticas do mini-dashboard
  const miniDashboardStats = useMemo(() => {
    const totalTests = tests.length;
    
    // Obter número de alunos únicos avaliados no total de todas as provas
    const uniqueStudents = new Set(testResults.map(tr => tr.alunoId)).size;
    
    // Média geral de acertos de todas as provas
    let totalPercentual = 0;
    let countResults = 0;

    // Mapeia o maior acerto registrado por teste e atividade
    const maxAcertosPerTestActivity = new Map<string, number>();
    testResults.forEach(tr => {
      const key = `${tr.testId}_${tr.atividadeId}`;
      const currentMax = maxAcertosPerTestActivity.get(key) || 0;
      if (tr.acertos > currentMax) {
        maxAcertosPerTestActivity.set(key, tr.acertos);
      }
    });

    testResults.forEach(tr => {
      const act = activities.find(a => a.id === tr.atividadeId);
      if (act && act.quantidadeLancamentos > 0) {
        const key = `${tr.testId}_${tr.atividadeId}`;
        const maxAcertos = maxAcertosPerTestActivity.get(key) || 0;
        const pct = calculateSafePercentage(tr.acertos, act.quantidadeLancamentos, maxAcertos);
        totalPercentual += pct;
        countResults++;
      }
    });
    const mediaGeral = countResults > 0 ? (totalPercentual / countResults) : 0;
    
    return {
      totalTests,
      uniqueStudents,
      mediaGeral,
    };
  }, [tests, testResults, activities]);

  // Lista detalhada das provas já aplicadas com informações de aproveitamento
  const appliedTestsList = useMemo(() => {
    return [...tests]
      .sort((a, b) => b.data.localeCompare(a.data)) // Ordena por data mais recente
      .map(test => {
        const slot = schedule.find(s => s.id === test.slotId);
        const testRes = testResults.filter(tr => tr.testId === test.id);
        const uniqueStudentsCount = new Set(testRes.map(tr => tr.alunoId)).size;
        
        let testTotalPercentual = 0;
        let testCountResults = 0;

        // Pré-calcula o maior acerto de cada atividade nesta prova específica
        const maxAcertosMap = new Map<string, number>();
        testRes.forEach(tr => {
          const currentMax = maxAcertosMap.get(tr.atividadeId) || 0;
          if (tr.acertos > currentMax) {
            maxAcertosMap.set(tr.atividadeId, tr.acertos);
          }
        });

        testRes.forEach(tr => {
          const act = activities.find(a => a.id === tr.atividadeId);
          if (act && act.quantidadeLancamentos > 0) {
            const maxAcertos = maxAcertosMap.get(tr.atividadeId) || 0;
            const pct = calculateSafePercentage(tr.acertos, act.quantidadeLancamentos, maxAcertos);
            testTotalPercentual += pct;
            testCountResults++;
          }
        });
        const mediaGeralProva = testCountResults > 0 ? (testTotalPercentual / testCountResults) : 0;
        
        return {
          ...test,
          slot,
          studentsCount: uniqueStudentsCount,
          mediaGeral: mediaGeralProva,
        };
      });
  }, [tests, schedule, testResults, activities]);

  // Estados para o Relatório Geral de Alunos & Provas
  const [activeTab, setActiveTab] = useState<string>("listagem");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [dateFilter, setDateFilter] = useState<string>("todas");
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);

  // Lista consolidada de alunos avaliados, suas provas, notas em tarefas e notas nos 6 fundamentos
  const evaluatedStudentsList = useMemo(() => {
    const evaluatedIds = Array.from(new Set(testResults.map(tr => tr.alunoId)));

    return evaluatedIds.map(studentId => {
      const student = students.find(s => s.id === studentId) || ({
        id: studentId,
        nome: "Aluno " + studentId.slice(0, 6),
        categoria: "Adulto",
        status: "Ativo",
      } as Student);

      const results = testResults.filter(tr => tr.alunoId === studentId);
      const datesSet = new Set<string>();
      const slotsSet = new Set<string>();

      const tasksEvaluated = results.map(r => {
        const test = tests.find(t => t.id === r.testId);
        const testDate = test ? test.data : "Data não inf.";
        if (test?.data) datesSet.add(test.data);

        const slot = test ? schedule.find(s => s.id === test.slotId) : null;
        const slotInfo = slot ? `${slot.horario} (${slot.quadra})` : "";
        if (slotInfo) slotsSet.add(slotInfo);

        const act = activities.find(a => a.id === r.atividadeId);
        const actName = act ? act.nome : "Atividade #" + r.atividadeId.slice(0, 5);
        const base = act?.quantidadeLancamentos || 10;
        const percentage = Math.round((r.acertos / Math.max(1, base)) * 100);

        return {
          id: r.id,
          testId: r.testId,
          testDate,
          slotInfo,
          activityName: actName,
          acertos: r.acertos,
          base,
          percentage: Math.min(100, Math.max(0, percentage)),
        };
      }).sort((a, b) => b.testDate.localeCompare(a.testDate));

      // Fundamentos idênticos à regra oficial do AthleteCardModal
      let baselineOvr = 75;
      if (student.categoria === "Juvenil") baselineOvr = 78;
      if (student.categoria === "Adulto") baselineOvr = 82;

      let forehand = baselineOvr - 2;
      let backhand = baselineOvr - 5;
      let lob = baselineOvr - 3;
      let curta = baselineOvr - 4;
      let saque = baselineOvr + 1;
      let smash = baselineOvr + 2;

      results.forEach((res) => {
        const act = activities.find((a) => a.id === res.atividadeId);
        const base = act?.quantidadeLancamentos || 10;
        const name = (act?.nome || "").toLowerCase();
        const scorePct = Math.min(99, Math.round((res.acertos / Math.max(1, base)) * 100));

        if (name.includes("forehand") || name.includes("direita")) {
          forehand = Math.max(60, scorePct);
        } else if (name.includes("backhand") || name.includes("esquerda")) {
          backhand = Math.max(60, scorePct);
        } else if (name.includes("lob")) {
          lob = Math.max(60, scorePct);
        } else if (name.includes("curta") || name.includes("curtinha") || name.includes("drop")) {
          curta = Math.max(60, scorePct);
        } else if (name.includes("saque") || name.includes("serviço")) {
          saque = Math.max(60, scorePct);
        } else if (name.includes("smash")) {
          smash = Math.max(60, scorePct);
        }
      });

      const ovr = Math.round((forehand + backhand + lob + curta + saque + smash) / 6);

      return {
        student,
        testDates: Array.from(datesSet).sort((a, b) => b.localeCompare(a)),
        slotsInfo: Array.from(slotsSet),
        tasksEvaluated,
        fundamentals: {
          forehand,
          backhand,
          lob,
          curta,
          saque,
          smash,
          ovr,
        },
      };
    }).sort((a, b) => a.student.nome.localeCompare(b.student.nome));
  }, [students, testResults, tests, schedule, activities]);

  // Lista com filtros aplicados
  const filteredEvaluatedStudents = useMemo(() => {
    return evaluatedStudentsList.filter(item => {
      const matchSearch = !searchQuery || 
        item.student.nome.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = categoryFilter === "todas" || 
        item.student.categoria === categoryFilter;

      const matchDate = dateFilter === "todas" || 
        item.testDates.includes(dateFilter);

      return matchSearch && matchCategory && matchDate;
    });
  }, [evaluatedStudentsList, searchQuery, categoryFilter, dateFilter]);

  // Datas disponíveis para o filtro
  const availableTestDates = useMemo(() => {
    const dates = new Set<string>();
    tests.forEach(t => { if (t.data) dates.add(t.data); });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [tests]);
  
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

  const handleSaveTest = async () => {
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
        const existingResult = testResults.find(tr => tr.testId === testId && tr.alunoId === aluno.id && tr.atividadeId === actId);
        newResults.push({
          id: existingResult ? existingResult.id : crypto.randomUUID(),
          testId,
          alunoId: aluno.id,
          atividadeId: actId,
          acertos,
        });
      });
    });

    // Pré-salva o teste no banco para evitar erro de Foreign Key (race condition) ao salvar os resultados em seguida.
    try {
      await supabase.from("tests").upsert({
        id: newTest.id,
        data: newTest.data,
        slot_id: newTest.slotId,
        atividades_ids: newTest.atividadesIds,
      });
    } catch (err) {
      console.error("Erro ao pré-salvar teste:", err);
    }

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
      <Card className="bg-gradient-to-br from-[#0f1236] via-[#1c2394] to-[#de392a] text-white border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <CardHeader className="flex flex-row items-center justify-between relative z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/90">Desempenho</p>
            <CardTitle className="text-2xl font-black text-white mt-1">Avaliação de Provas Técnicas</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold uppercase text-white tracking-wide">Data da Prova:</Label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="w-40 h-9 bg-white/20 border-white/40 text-white font-bold placeholder:text-white/70 focus:border-white [color-scheme:dark]"
              />
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowActivityModal(true)} 
              className="gap-2 bg-white text-[#1c2394] hover:bg-white/90 font-bold shadow-md border-none h-9 px-4 rounded-xl cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Gestão de Atividades
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl h-auto flex flex-wrap gap-1 border border-slate-200 dark:border-slate-700">
            <TabsTrigger 
              value="listagem" 
              className="gap-2 data-[state=active]:bg-[#1c2394] data-[state=active]:text-white font-bold rounded-lg px-4 py-2 cursor-pointer transition-all shadow-sm"
            >
              <ListChecks className="h-4 w-4" /> Listagem Geral de Alunos &amp; Provas
              <Badge variant="secondary" className="ml-1 bg-white/20 text-current text-xs px-2 py-0.5">
                {evaluatedStudentsList.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="aplicar" 
              className="gap-2 data-[state=active]:bg-[#1c2394] data-[state=active]:text-white font-bold rounded-lg px-4 py-2 cursor-pointer transition-all shadow-sm"
            >
              <ClipboardCheck className="h-4 w-4" /> Registro por Data ({format(new Date(selectedDate + "T00:00:00"), "dd/MM")})
            </TabsTrigger>
            <TabsTrigger 
              value="historico" 
              className="gap-2 data-[state=active]:bg-[#1c2394] data-[state=active]:text-white font-bold rounded-lg px-4 py-2 cursor-pointer transition-all shadow-sm"
            >
              <Calendar className="h-4 w-4" /> Histórico de Provas ({appliedTestsList.length})
            </TabsTrigger>
          </TabsList>

          {activeTab === "listagem" && evaluatedStudentsList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2 font-bold text-slate-700 dark:text-slate-200 shadow-sm print:hidden"
            >
              <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
            </Button>
          )}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: LISTAGEM GERAL DE ALUNOS COM PROVAS, DATAS E FUNDAMENTOS */}
        {/* ============================================================== */}
        <TabsContent value="listagem" className="space-y-6 mt-0">
          {/* Métricas Rápidas dos Alunos Avaliados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/95 dark:bg-slate-900/90 border border-blue-200/80 dark:border-blue-900/40 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-xl text-[#1c2394] dark:text-blue-400">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alunos com Prova</p>
                  <p className="text-2xl font-black text-[#1c2394] dark:text-blue-400">{evaluatedStudentsList.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 dark:bg-slate-900/90 border border-indigo-200/80 dark:border-indigo-900/40 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total de Provas</p>
                  <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{tests.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 dark:bg-slate-900/90 border border-emerald-200/80 dark:border-emerald-900/40 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Média Geral de Acertos</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {miniDashboardStats.mediaGeral.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 dark:bg-slate-900/90 border border-amber-200/80 dark:border-amber-900/40 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tarefas Avaliadas</p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{testResults.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barra de Busca e Filtros */}
          <Card className="border shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar aluno por nome..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 font-medium"
                  />
                </div>
                <div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10 font-medium">
                      <SelectValue placeholder="Filtrar por Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Categorias</SelectItem>
                      <SelectItem value="Adulto">Adulto</SelectItem>
                      <SelectItem value="Juvenil">Juvenil</SelectItem>
                      <SelectItem value="Infantil">Infantil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="h-10 font-medium">
                      <SelectValue placeholder="Filtrar por Data da Prova" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Datas de Prova</SelectItem>
                      {availableTestDates.map(d => (
                        <SelectItem key={d} value={d}>
                          Prova em {format(new Date(d + "T00:00:00"), "dd/MM/yyyy")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listagem Consolidada de Alunos */}
          {filteredEvaluatedStudents.length === 0 ? (
            <Card className="border border-dashed shadow-sm text-center py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {evaluatedStudentsList.length === 0 
                    ? "Nenhum aluno com prova registrada no momento" 
                    : "Nenhum aluno corresponde aos filtros aplicados"}
                </h3>
                <p className="text-sm text-slate-500 max-w-md">
                  {evaluatedStudentsList.length === 0
                    ? "Para registrar uma prova técnica, vá na aba 'Registro por Data', selecione a turma com presenças registradas e lance os acertos das atividades."
                    : "Tente limpar os filtros de busca ou selecionar outra categoria/data para encontrar os alunos."}
                </p>
                {searchQuery || categoryFilter !== "todas" || dateFilter !== "todas" ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setSearchQuery(""); setCategoryFilter("todas"); setDateFilter("todas"); }}
                    className="mt-2"
                  >
                    Limpar Filtros
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold uppercase tracking-wider">
                <span>Exibindo {filteredEvaluatedStudents.length} aluno(s) avaliado(s)</span>
                <span>Critério Oficial • 6 Fundamentos Técnicos</span>
              </div>

              {filteredEvaluatedStudents.map((item) => {
                const isExpanded = expandedStudentId === item.student.id;
                const { student, testDates, tasksEvaluated, fundamentals } = item;

                return (
                  <Card 
                    key={student.id} 
                    className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900"
                  >
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      {/* Identificação do Aluno */}
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#1c2394] to-[#de392a] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                          {student.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                              {student.nome}
                            </h4>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] font-bold uppercase py-0 px-2 ${
                                student.categoria === "Adulto" 
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300" 
                                  : student.categoria === "Juvenil"
                                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                              }`}
                            >
                              {student.categoria}
                            </Badge>
                          </div>
                          
                          {/* Datas das Provas */}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-xs text-slate-500 font-medium">Provas Realizadas:</span>
                            {testDates.map(d => (
                              <Badge key={d} variant="secondary" className="text-[11px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-0">
                                📅 {format(new Date(d + "T00:00:00"), "dd/MM/yyyy")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Resumo dos 6 Fundamentos e OVR */}
                      <div className="flex items-center gap-3 flex-wrap justify-between lg:justify-end">
                        <div className="grid grid-cols-6 gap-1 sm:gap-2 text-center bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                          <div className="px-1.5">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">FOR</span>
                            <span className={`text-xs font-black ${fundamentals.forehand >= 80 ? "text-emerald-600 dark:text-emerald-400" : fundamentals.forehand >= 65 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {fundamentals.forehand}
                            </span>
                          </div>
                          <div className="px-1.5 border-l border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">BCK</span>
                            <span className={`text-xs font-black ${fundamentals.backhand >= 80 ? "text-emerald-600 dark:text-emerald-400" : fundamentals.backhand >= 65 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {fundamentals.backhand}
                            </span>
                          </div>
                          <div className="px-1.5 border-l border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">LOB</span>
                            <span className={`text-xs font-black ${fundamentals.lob >= 80 ? "text-emerald-600 dark:text-emerald-400" : fundamentals.lob >= 65 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {fundamentals.lob}
                            </span>
                          </div>
                          <div className="px-1.5 border-l border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">CUR</span>
                            <span className={`text-xs font-black ${fundamentals.curta >= 80 ? "text-emerald-600 dark:text-emerald-400" : fundamentals.curta >= 65 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {fundamentals.curta}
                            </span>
                          </div>
                          <div className="px-1.5 border-l border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">SAQ</span>
                            <span className={`text-xs font-black ${fundamentals.saque >= 80 ? "text-emerald-600 dark:text-emerald-400" : fundamentals.saque >= 65 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {fundamentals.saque}
                            </span>
                          </div>
                          <div className="px-1.5 border-l border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">SMH</span>
                            <span className={`text-xs font-black ${fundamentals.smash >= 80 ? "text-emerald-600 dark:text-emerald-400" : fundamentals.smash >= 65 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {fundamentals.smash}
                            </span>
                          </div>
                        </div>

                        {/* OVR Geral */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-300/40 text-amber-700 dark:text-amber-300 shrink-0">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <div className="text-left">
                            <span className="text-[8px] font-black uppercase tracking-wider block">OVR Técnico</span>
                            <span className="text-base font-black leading-none">{fundamentals.ovr}</span>
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudentForCard(student)}
                            className="gap-1.5 h-8 text-xs font-bold bg-[#1c2394]/5 hover:bg-[#1c2394]/10 text-[#1c2394] dark:text-blue-400 border-[#1c2394]/20"
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Card Oficial
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                            className="gap-1 h-8 text-xs font-semibold text-slate-600 dark:text-slate-300"
                          >
                            {isExpanded ? (
                              <>Menos <ChevronUp className="h-3.5 w-3.5" /></>
                            ) : (
                              <>Tarefas ({tasksEvaluated.length}) <ChevronDown className="h-3.5 w-3.5" /></>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Detalhamento de Tarefas / Atividades Técnicas (Expansível) */}
                    {isExpanded && (
                      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                          <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-950/70">
                              <TableRow>
                                <TableHead className="font-bold text-xs">Data da Prova</TableHead>
                                <TableHead className="font-bold text-xs">Turma / Quadra</TableHead>
                                <TableHead className="font-bold text-xs">Tarefa / Atividade Avaliada</TableHead>
                                <TableHead className="text-center font-bold text-xs">Acertos / Base</TableHead>
                                <TableHead className="text-center font-bold text-xs">Aproveitamento</TableHead>
                                <TableHead className="font-bold text-xs">Fundamento Vinculado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tasksEvaluated.map((task) => {
                                const lowerName = task.activityName.toLowerCase();
                                let fundNome = "Geral";
                                if (lowerName.includes("forehand") || lowerName.includes("direita")) fundNome = "Forehand (FOR)";
                                else if (lowerName.includes("backhand") || lowerName.includes("esquerda")) fundNome = "Backhand (BCK)";
                                else if (lowerName.includes("lob")) fundNome = "Lob (LOB)";
                                else if (lowerName.includes("curta") || lowerName.includes("curtinha") || lowerName.includes("drop")) fundNome = "Curta (CUR)";
                                else if (lowerName.includes("saque") || lowerName.includes("serviço")) fundNome = "Saque (SAQ)";
                                else if (lowerName.includes("smash")) fundNome = "Smash (SMH)";

                                return (
                                  <TableRow key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                    <TableCell className="font-semibold text-xs">
                                      {task.testDate.includes("-") 
                                        ? format(new Date(task.testDate + "T00:00:00"), "dd/MM/yyyy") 
                                        : task.testDate}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                      {task.slotInfo || "—"}
                                    </TableCell>
                                    <TableCell className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                      {task.activityName}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold text-xs">
                                      <span className="text-slate-900 dark:text-white font-bold">{task.acertos}</span>
                                      <span className="text-slate-400"> / {task.base} bolas</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full ${
                                              task.percentage >= 80 
                                                ? "bg-emerald-500" 
                                                : task.percentage >= 65 
                                                ? "bg-blue-500" 
                                                : "bg-amber-500"
                                            }`}
                                            style={{ width: `${task.percentage}%` }}
                                          />
                                        </div>
                                        <span className={`text-xs font-black ${
                                          task.percentage >= 80 
                                            ? "text-emerald-600 dark:text-emerald-400" 
                                            : task.percentage >= 65 
                                            ? "text-blue-600 dark:text-blue-400" 
                                            : "text-amber-600 dark:text-amber-400"
                                        }`}>
                                          {task.percentage}%
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-[10px] py-0 px-2 font-semibold">
                                        {fundNome}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: REGISTRO DE PROVAS POR DATA E TURMAS COM PRESENÇA       */}
        {/* ============================================================== */}
        <TabsContent value="aplicar" className="space-y-6 mt-0">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500 tracking-wide">Data da Chamada &amp; Prova:</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Selecione a data com presenças registradas para aplicar a prova da turma
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="w-40 h-9 font-bold [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {slotsWithAttendance.length === 0 ? (
            <Card className="border border-amber-200/80 shadow-sm bg-white/90 dark:bg-slate-900/90">
              <CardContent className="pt-10 pb-10 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-amber-500/15 text-amber-600 rounded-full ring-1 ring-amber-500/25">
                    <ClipboardCheck className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">Nenhuma presença registrada para esta data.</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium max-w-sm">Você precisa primeiro realizar o <b className="text-slate-900 dark:text-white font-black">Controle de Presença</b> nas turmas antes de aplicar uma prova.</p>
                  <Button variant="default" className="mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md h-10 px-5 rounded-xl" onClick={() => navigate("/attendance")}>
                    Registrar as Presenças desta Data
                  </Button>
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
                            <div key={aluno.id} className="text-sm py-1 border-b border-muted last:border-0 font-medium">
                              {aluno.nome}
                            </div>
                          ))
                        )}
                      </div>
                      <Button 
                        className="w-full gap-2 font-bold cursor-pointer" 
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
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: HISTÓRICO DE PROVAS REGISTRADAS (DATAS E MÉDIAS GERAIS) */}
        {/* ============================================================== */}
        <TabsContent value="historico" className="space-y-6 mt-0">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Histórico de Provas Registradas</CardTitle>
              <Badge variant="outline" className="font-bold">Total: {appliedTestsList.length} prova(s)</Badge>
            </CardHeader>
            <CardContent>
              {appliedTestsList.length === 0 ? (
                <p className="text-sm italic text-muted-foreground text-center py-6">
                  Nenhuma prova foi aplicada no sistema até o momento.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Horário / Quadra</TableHead>
                        <TableHead>Atividades</TableHead>
                        <TableHead className="text-center">Alunos</TableHead>
                        <TableHead className="text-center">Média Geral</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appliedTestsList.map((prova) => {
                        const dateObj = new Date(prova.data + "T00:00:00");
                        const formattedDate = format(dateObj, "dd/MM/yyyy");
                        
                        return (
                          <TableRow key={prova.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-semibold">{formattedDate}</TableCell>
                            <TableCell>
                              {prova.slot ? (
                                <span>{prova.slot.horario} · <span className="text-muted-foreground">{prova.slot.quadra}</span></span>
                              ) : (
                                <span className="text-muted-foreground">Turma não encontrada</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {prova.atividadesIds.map(actId => {
                                  const act = activities.find(a => a.id === actId);
                                  return act ? (
                                    <Badge key={actId} variant="outline" className="text-xs py-0 px-2">
                                      {act.nome}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium">{prova.studentsCount}</TableCell>
                            <TableCell className="text-center">
                              <span className={`font-bold ${prova.mediaGeral >= 70 ? 'text-green-600' : prova.mediaGeral >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                {prova.mediaGeral.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-1 hover:text-primary font-bold"
                                onClick={() => {
                                  setSelectedDate(prova.data);
                                  setActiveTab("aplicar");
                                  toast.info(`Visualizando provas do dia ${formattedDate}`);
                                }}
                              >
                                Ver Provas do Dia <ArrowRight className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="p-3 text-center bg-muted/20 border-t">
                    <p className="text-xs text-muted-foreground">Exibindo todas as {appliedTestsList.length} prova(s) registrada(s).</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Gestão de Atividades */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                        const maxAcertos = Math.max(
                          ...Object.values(tempResults).map(res => res?.[actId] || 0),
                          0
                        );
                        const baseLanc = act?.quantidadeLancamentos || 10;
                        const effectiveLanc = maxAcertos > baseLanc
                          ? Math.ceil(maxAcertos / baseLanc) * baseLanc
                          : baseLanc;

                        return (
                          <TableHead key={actId} className="text-center min-w-[120px]">
                            {act?.nome}
                            <div className="text-[10px] opacity-60 font-normal">
                              Lanç.: {effectiveLanc} {effectiveLanc > baseLanc ? `(${effectiveLanc / baseLanc}x${baseLanc})` : ""}
                            </div>
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
                            const maxAcertos = Math.max(
                              ...Object.values(tempResults).map(res => res?.[actId] || 0),
                              0
                            );
                            const percentual = calculateSafePercentage(acertos, act.quantidadeLancamentos, maxAcertos);
                            totalPercentual += percentual;

                            const baseLanc = act?.quantidadeLancamentos || 10;
                            const effectiveLanc = maxAcertos > baseLanc
                              ? Math.ceil(maxAcertos / baseLanc) * baseLanc
                              : baseLanc;

                            return (
                              <TableCell key={actId}>
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      type="number" 
                                      className="w-16 h-8 text-center text-xs" 
                                      min={0}
                                      max={effectiveLanc}
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
                            {(totalPercentual / (selectedAtividadesIds.length || 1)).toFixed(1)}%
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

      {/* Modal do Card Oficial do Atleta */}
      <AthleteCardModal
        student={selectedStudentForCard}
        open={!!selectedStudentForCard}
        onOpenChange={(isOpen) => !isOpen && setSelectedStudentForCard(null)}
        onClose={() => setSelectedStudentForCard(null)}
      />
    </div>
  );
};

export default Tests;
