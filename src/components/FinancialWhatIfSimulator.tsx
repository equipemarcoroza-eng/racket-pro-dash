import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAppContext } from "@/contexts/AppContext";
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const FinancialWhatIfSimulator: React.FC = () => {
  const { students, plans, revenues } = useAppContext();

  // Baseline atual real
  const activeStudentsCount = useMemo(
    () => students.filter((s) => s.status === "Ativo").length,
    [students]
  );

  const currentAvgPlanValue = useMemo(() => {
    if (plans.length === 0) return 250;
    const total = plans.reduce((acc, p) => acc + p.valor, 0);
    return Math.round(total / plans.length);
  }, [plans]);

  const currentMRR = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "Ativo");
    return activeStudents.reduce((sum, s) => {
      const plan = plans.find((p) => p.id === s.planoId);
      return sum + (plan ? plan.valor : currentAvgPlanValue);
    }, 0);
  }, [students, plans, currentAvgPlanValue]);

  // Sliders de Cenário What-If
  const [priceDelta, setPriceDelta] = useState<number>(25); // +/- R$ na mensalidade
  const [studentDelta, setStudentDelta] = useState<number>(12); // +/- novos alunos
  const [churnReductionPct, setChurnReductionPct] = useState<number>(15); // % redução de evasão
  const [courtRentalRevenue, setCourtRentalRevenue] = useState<number>(1500); // R$ locação avulsa de quadras

  // Presets Rápidos
  const applyPreset = (preset: "conservador" | "moderado" | "expansao") => {
    if (preset === "conservador") {
      setPriceDelta(10);
      setStudentDelta(5);
      setChurnReductionPct(5);
      setCourtRentalRevenue(500);
    } else if (preset === "moderado") {
      setPriceDelta(25);
      setStudentDelta(15);
      setChurnReductionPct(15);
      setCourtRentalRevenue(1500);
    } else if (preset === "expansao") {
      setPriceDelta(45);
      setStudentDelta(30);
      setChurnReductionPct(30);
      setCourtRentalRevenue(3500);
    }
  };

  // Cálculos do Cenário Simulado
  const simulatedStats = useMemo(() => {
    const newStudentCount = Math.max(1, activeStudentsCount + studentDelta);
    const newAvgTicket = Math.max(50, currentAvgPlanValue + priceDelta);

    // Retenção extra (estimando 5% churn mensal padrão)
    const churnSavedValue = (activeStudentsCount * 0.05 * (churnReductionPct / 100)) * newAvgTicket;

    const simulatedMonthlyPlanRevenue = newStudentCount * newAvgTicket;
    const totalSimulatedMRR = simulatedMonthlyPlanRevenue + courtRentalRevenue + churnSavedValue;

    const monthlyDifference = totalSimulatedMRR - currentMRR;
    const annualDifference = monthlyDifference * 12;
    const growthPercent = currentMRR > 0 ? (monthlyDifference / currentMRR) * 100 : 0;

    // Gráfico comparativo de 6 meses
    const chartData = [
      { mes: "Mês 1", base: currentMRR, simulado: Math.round(totalSimulatedMRR * 0.95) },
      { mes: "Mês 2", base: currentMRR, simulado: Math.round(totalSimulatedMRR * 0.97) },
      { mes: "Mês 3", base: currentMRR, simulado: Math.round(totalSimulatedMRR * 1.0) },
      { mes: "Mês 4", base: currentMRR, simulado: Math.round(totalSimulatedMRR * 1.02) },
      { mes: "Mês 5", base: currentMRR, simulado: Math.round(totalSimulatedMRR * 1.05) },
      { mes: "Mês 6", base: currentMRR, simulado: Math.round(totalSimulatedMRR * 1.08) },
    ];

    return {
      newStudentCount,
      newAvgTicket,
      totalSimulatedMRR,
      monthlyDifference,
      annualDifference,
      growthPercent,
      chartData,
    };
  }, [
    activeStudentsCount,
    currentAvgPlanValue,
    currentMRR,
    priceDelta,
    studentDelta,
    churnReductionPct,
    courtRentalRevenue,
  ]);

  return (
    <div className="space-y-6">
      {/* Top Banner Explicativo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 border border-emerald-500/30 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 uppercase tracking-widest text-[10px]">
                Sandbox Financeiro
              </Badge>
            </div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-400" />
              Simulador Estratégico "What-If"
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Teste hipóteses em tempo real: aumente mensalidades, projete expansão de turmas e reduza cancelamentos para ver o impacto exato no faturamento anual.
            </p>
          </div>

          {/* Presets Rápidos */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10">
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset("conservador")}
              className="text-xs h-8 border-white/20 text-white hover:bg-white/10"
            >
              🛡️ Conservador
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset("moderado")}
              className="text-xs h-8 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/20"
            >
              🚀 Moderado
            </Button>
            <Button
              size="sm"
              onClick={() => applyPreset("expansao")}
              className="text-xs h-8 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
            >
              👑 Super Arena
            </Button>
          </div>
        </div>
      </div>

      {/* Grid de Controles Interativos (Sliders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Slider 1: Reajuste de Mensalidade */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Reajuste de Preço</span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {priceDelta >= 0 ? `+ R$ ${priceDelta}` : `- R$ ${Math.abs(priceDelta)}`}
              <span className="text-xs font-normal text-muted-foreground"> /aluno</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              min={-30}
              max={150}
              step={5}
              value={[priceDelta]}
              onValueChange={([val]) => setPriceDelta(val)}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>-R$ 30</span>
              <span className="font-semibold text-foreground">Novo ticket: R$ {simulatedStats.newAvgTicket}</span>
              <span>+R$ 150</span>
            </div>
          </CardContent>
        </Card>

        {/* Slider 2: Variação de Alunos Ativos */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Novos Alunos Ativos</span>
              <Users className="h-4 w-4 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {studentDelta >= 0 ? `+ ${studentDelta}` : `${studentDelta}`}
              <span className="text-xs font-normal text-muted-foreground"> alunos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              min={-20}
              max={60}
              step={2}
              value={[studentDelta]}
              onValueChange={([val]) => setStudentDelta(val)}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>-20 alunos</span>
              <span className="font-semibold text-foreground">Total: {simulatedStats.newStudentCount} alunos</span>
              <span>+60 alunos</span>
            </div>
          </CardContent>
        </Card>

        {/* Slider 3: Redução de Churn */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Redução de Cancelamento</span>
              <ShieldCheck className="h-4 w-4 text-purple-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              -{churnReductionPct}%
              <span className="text-xs font-normal text-muted-foreground"> evasão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              min={0}
              max={50}
              step={5}
              value={[churnReductionPct]}
              onValueChange={([val]) => setChurnReductionPct(val)}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>0%</span>
              <span className="font-semibold text-foreground">Alunos retidos</span>
              <span>-50% churn</span>
            </div>
          </CardContent>
        </Card>

        {/* Slider 4: Locação Avulsa de Quadras */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Locação Avulsa (Horários Vagos)</span>
              <Calendar className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              R$ {courtRentalRevenue.toLocaleString("pt-BR")}
              <span className="text-xs font-normal text-muted-foreground"> /mês</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              min={0}
              max={6000}
              step={250}
              value={[courtRentalRevenue]}
              onValueChange={([val]) => setCourtRentalRevenue(val)}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>R$ 0</span>
              <span className="font-semibold text-foreground">Horários livres</span>
              <span>R$ 6.000</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados do Impacto Financeiro Calculados Instantaneamente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card MRR Simulado */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-slate-900 border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">
                  Nova Receita Mensal (MRR)
                </p>
                <p className="text-3xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
                  R$ {simulatedStats.totalSimulatedMRR.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Base atual: R$ {currentMRR.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <ArrowUpRight className="h-10 w-10 text-emerald-600 opacity-40" />
            </div>
          </CardContent>
        </Card>

        {/* Card Ganho Mensal Líquido */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-slate-900 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400">
                  Impacto Mensal Adicional
                </p>
                <p className="text-3xl font-black text-blue-800 dark:text-blue-300 mt-1">
                  {simulatedStats.monthlyDifference >= 0 ? "+" : ""}
                  R$ {simulatedStats.monthlyDifference.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <Badge className="mt-1 bg-blue-600/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  {simulatedStats.growthPercent >= 0 ? "+" : ""}
                  {simulatedStats.growthPercent.toFixed(1)}% de crescimento
                </Badge>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600 opacity-40" />
            </div>
          </CardContent>
        </Card>

        {/* Card Impacto Anualizado (12 Meses) */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-slate-900 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
                  Potencial Anual Acumulado (12m)
                </p>
                <p className="text-3xl font-black text-amber-800 dark:text-amber-300 mt-1">
                  {simulatedStats.annualDifference >= 0 ? "+" : ""}
                  R$ {simulatedStats.annualDifference.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Injeção direta no caixa da academia no ano
                </p>
              </div>
              <Sparkles className="h-10 w-10 text-amber-500 opacity-40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo: Cenário Atual vs Cenário Simulado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Evolução Comparativa Projetada (Próximos 6 Meses)
          </CardTitle>
          <CardDescription>
            Visualização da curva de faturamento do cenário base atual comparada à curva simulada com os novos parâmetros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simulatedStats.chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(val: number) => [
                    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                  ]}
                />
                <Legend />
                <Bar dataKey="base" name="Cenário Atual (Sem Alterações)" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="simulado" name="Cenário Simulado (What-If)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
