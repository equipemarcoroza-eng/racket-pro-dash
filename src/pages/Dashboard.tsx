import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAppContext } from "@/contexts/AppContext";
import { CLASS_LIMIT } from "@/data/mockData";

const periodos = ["Mês Atual", "Mês Anterior", "Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses"];

const Dashboard = () => {
  const { students, enrollments, revenues, schedule: mockSchedule } = useAppContext();
  const [periodo, setPeriodo] = useState("Mês Atual");
  const [rankingModal, setRankingModal] = useState<{ open: boolean; type: "top" | "bottom" }>({ open: false, type: "top" });

  const parseDate = (dateStr: string) => {
    const [d, m, y] = dateStr.split("/").map(Number);
    return new Date(y, m - 1, d);
  };

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let startDate = new Date(currentYear, currentMonth, 1);
    let endDate = new Date(currentYear, currentMonth + 1, 0);

    if (periodo === "Mês Anterior") {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
    } else if (periodo === "Últimos 3 meses") {
      startDate = new Date(currentYear, currentMonth - 2, 1);
    } else if (periodo === "Últimos 6 meses") {
      startDate = new Date(currentYear, currentMonth - 5, 1);
    } else if (periodo === "Últimos 12 meses") {
      startDate = new Date(currentYear, currentMonth - 11, 1);
    }

    // Alunos Ativos (Contamos todos os alunos ativos que já haviam entrado até o fim do período selecionado)
    const alunosAtivos = students.filter(s => {
      // dataEntrada is usually YYYY-MM-DD
      const [y, m, d] = s.dataEntrada.split("-").map(Number);
      const entryDate = new Date(y, m - 1, d);
      return s.status === "Ativo" && entryDate <= endDate;
    }).length;

    // Faturamento no Período = (Total de Parcelas e Taxas Geradas) - (Isenções)
    const receitasValidas = revenues.filter(r => {
      const vDate = parseDate(r.vencimento);
      return vDate >= startDate && vDate <= endDate;
    });
    
    // Todas as taxas de matrículas, mensalidades e planos gerados no período
    const faturamentoBruto = receitasValidas.reduce((acc, curr) => acc + curr.valor, 0);

    // Valores correspondentes a isenções concedidas no mesmo período
    const isencoes = receitasValidas
      .filter(r => r.status === "Isento")
      .reduce((acc, curr) => acc + curr.valor, 0);

    // O total líquido efetivamente faturado na competência matemática exigida
    const faturamentoPeriodo = faturamentoBruto - isencoes;

    // Ocupação por Turma
    const occupancyData = mockSchedule.map(slot => {
      const count = enrollments.filter(e => e.turmaId === slot.id).length;
      return {
        nome: slot.turmaId,
        pct: Math.round((count / CLASS_LIMIT) * 100),
      };
    });

    const sortedOccupancy = [...occupancyData].sort((a, b) => b.pct - a.pct);
    const top3 = sortedOccupancy.slice(0, 3);
    const bottom3 = sortedOccupancy.slice(-3).reverse();

    // Dados do Gráfico (Evolução mensal)
    const chartMonths = periodo === "Mês Atual" || periodo === "Mês Anterior" ? 6 : 
                       periodo === "Últimos 3 meses" ? 3 :
                       periodo === "Últimos 6 meses" ? 6 : 12;

    const dynamicRevenueData = [];
    for (let i = chartMonths - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mLabel = d.toLocaleString("pt-BR", { month: "short" });
      const mIdx = d.getMonth();
      const yIdx = d.getFullYear();

      const ganhos = revenues
        .filter(r => {
          const vDate = parseDate(r.vencimento);
          return vDate.getMonth() === mIdx && vDate.getFullYear() === yIdx && (r.status === "Pago" || r.plano === "Taxa de Matrícula");
        })
        .reduce((acc, curr) => acc + curr.valor, 0);

      const gastos = 25000 + Math.random() * 5000; // Simulado para o exemplo, já que não temos histórico de gastos real no AppContext ainda

      dynamicRevenueData.push({ mes: mLabel, ganhos, gastos });
    }

    return {
      alunosAtivos,
      faturamentoPeriodo,
      top3,
      bottom3,
      sortedOccupancy,
      dynamicRevenueData
    };
  }, [periodo, students, enrollments, revenues, mockSchedule]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-primary font-medium">Painel</p>
            <CardTitle className="text-2xl">Dashboard Operacional</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Visualização rápida de indicadores de desempenho, ocupação e financeiro.</p>
          </div>
          <Button onClick={() => window.location.reload()}>Atualizar</Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary font-medium">Filtro de Período</p>
              <p className="font-semibold">Selecionar prazo</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {periodos.map((p) => (
                <Button key={p} variant={periodo === p ? "default" : "outline"} size="sm" onClick={() => setPeriodo(p)}>
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-primary font-medium">Métrica</p>
            <p className="text-xl font-bold mt-1">Alunos Ativos</p>
            <div className="mt-4 p-3 bg-secondary rounded-md text-center font-semibold">{metrics.alunosAtivos} alunos</div>
            <p className="text-xs text-muted-foreground mt-2">Atualizado conforme filtro</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-primary font-medium">Métrica</p>
            <p className="text-xl font-bold mt-1">Faturamento {periodo}</p>
            <p className="text-xs text-muted-foreground">(não computadas as isenções)</p>
            <div className="mt-4 p-3 bg-secondary rounded-md text-center font-semibold">
              R$ {metrics.faturamentoPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Baseado no período selecionado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-primary font-medium">Ocupação</p>
                <p className="text-xl font-bold">Top 3 Turmas</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setRankingModal({ open: true, type: "top" })}>Ranking</Button>
            </div>
            <div className="space-y-3">
              {metrics.top3.map((t) => (
                <div key={t.nome} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium truncate">{t.nome}</span>
                  <Progress value={t.pct} className="flex-1" />
                  <span className="text-sm font-medium w-10 text-right">{t.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-primary font-medium">Ocupação</p>
                <p className="text-xl font-bold">Menor ocupação</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setRankingModal({ open: true, type: "bottom" })}>Ranking</Button>
            </div>
            <div className="space-y-3">
              {metrics.bottom3.map((t) => (
                <div key={t.nome} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium truncate">{t.nome}</span>
                  <Progress value={t.pct} className="flex-1" />
                  <span className="text-sm font-medium w-10 text-right">{t.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-primary font-medium">Financeiro</p>
              <p className="text-xl font-bold">Evolução de Ganhos vs Gastos</p>
            </div>
            <Button variant="outline" size="sm">Mensal</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Ganhos (R$)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.dynamicRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`} />
                  <Bar dataKey="ganhos" fill="hsl(240, 49%, 34%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Gastos (R$)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.dynamicRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`} />
                  <Bar dataKey="gastos" fill="hsl(0, 0%, 73%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Ranking Completo Modal */}
      <Dialog open={rankingModal.open} onOpenChange={(open) => !open && setRankingModal({ ...rankingModal, open: false })}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              {rankingModal.type === "top" ? "Ranking: Melhor para Pior Ocupação" : "Ranking: Pior para Melhor Ocupação"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-4">
            {(rankingModal.type === "top" ? metrics.sortedOccupancy : [...metrics.sortedOccupancy].reverse()).map((t, index) => (
              <div key={t.nome} className="flex flex-col gap-1 pb-3 border-b last:border-0 border-dashed">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-secondary text-[10px] rounded-full">
                      {index + 1}
                    </span>
                    {t.nome}
                  </span>
                  <span className="text-xs font-black text-primary">{t.pct}%</span>
                </div>
                <Progress value={t.pct} className="h-2" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

