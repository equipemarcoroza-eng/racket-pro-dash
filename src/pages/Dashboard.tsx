import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAppContext } from "@/contexts/AppContext";
import { CLASS_LIMIT } from "@/data/mockData";

const periodos = ["Mês Atual", "Mês Anterior", "Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses", "Últimos 24 meses", "Últimos 36 meses", "Últimos 48 meses"];

const Dashboard = () => {
  const { students, enrollments, revenues, schedule: mockSchedule, scheduledPayments } = useAppContext();
  const [periodo, setPeriodo] = useState("Mês Atual");

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
    } else if (periodo === "Últimos 24 meses") {
      startDate = new Date(currentYear, currentMonth - 23, 1);
    } else if (periodo === "Últimos 36 meses") {
      startDate = new Date(currentYear, currentMonth - 35, 1);
    } else if (periodo === "Últimos 48 meses") {
      startDate = new Date(currentYear, currentMonth - 47, 1);
    }

    // Alunos Ativos (apenas status 'Ativo') que já haviam entrado até o fim do período selecionado
    const alunosAtivos = students.filter(s => {
      // dataEntrada is usually YYYY-MM-DD
      const [y, m, d] = s.dataEntrada.split("-").map(Number);
      const entryDate = new Date(y, m - 1, d);
      return s.status === "Ativo" && entryDate <= endDate;
    }).length;

    // Faturamento no Período = (Total de Parcelas e Taxas Geradas) - (Isenções) para alunos elegíveis
    const receitasValidas = revenues.filter(r => {
      const vDate = parseDate(r.vencimento);
      const student = students.find(s => s.id === r.alunoId || s.nome === r.aluno);
      const isEligible = student && ["Ativo", "Passado", "Extras", "Inativo"].includes(student.status);
      return vDate >= startDate && vDate <= endDate && isEligible;
    });
    
    // Todas as taxas de matrículas, mensalidades e planos gerados no período
    const faturamentoBruto = receitasValidas.reduce((acc, curr) => acc + curr.valor, 0);

    // Valores correspondentes a isenções concedidas no mesmo período
    const isencoes = receitasValidas
      .filter(r => r.status === "Isento")
      .reduce((acc, curr) => acc + curr.valor, 0);

    // O total líquido efetivamente faturado na competência matemática exigida
    const faturamentoPeriodo = faturamentoBruto - isencoes;

    // Total Pago no Período
    const totalPago = receitasValidas
      .filter(r => r.status === "Pago")
      .reduce((acc, curr) => acc + curr.valor, 0);

    // Total Pendente no Período (Gerada + Em atraso)
    const totalPendente = receitasValidas
      .filter(r => r.status === "Gerada" || r.status === "Em atraso")
      .reduce((acc, curr) => acc + curr.valor, 0);

    // Total de Gastos no Período
    const totalGastos = (scheduledPayments || [])
      .filter(p => {
        if (!p.vencimento) return false;
        const [y, m, day] = p.vencimento.split("-").map(Number);
        const vDate = new Date(y, m - 1, day);
        return vDate >= startDate && vDate <= endDate;
      })
      .reduce((acc, curr) => acc + curr.valor, 0);

    // Faturamento no Período = (Total de Parcelas e Taxas Geradas) - (Isenções)
    const chartMonths = periodo === "Mês Atual" || periodo === "Mês Anterior" ? 6 : 
                       periodo === "Últimos 3 meses" ? 3 :
                       periodo === "Últimos 6 meses" ? 6 : 
                       periodo === "Últimos 12 meses" ? 12 :
                       periodo === "Últimos 24 meses" ? 24 :
                       periodo === "Últimos 36 meses" ? 36 : 48;

    const dynamicRevenueData = [];
    for (let i = chartMonths - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mLabel = d.toLocaleString("pt-BR", { month: "short" });
      const mIdx = d.getMonth();
      const yIdx = d.getFullYear();

      const mesReceitas = revenues.filter(r => {
        const vDate = parseDate(r.vencimento);
        const student = students.find(s => s.id === r.alunoId || s.nome === r.aluno);
        const isEligible = student && ["Ativo", "Passado", "Extras", "Inativo"].includes(student.status);
        return vDate.getMonth() === mIdx && vDate.getFullYear() === yIdx && isEligible;
      });

      const ganhos = mesReceitas
        .filter(r => r.status !== "Isento")
        .reduce((acc, curr) => acc + curr.valor, 0);

      const pago = mesReceitas
        .filter(r => r.status === "Pago")
        .reduce((acc, curr) => acc + curr.valor, 0);

      const pendente = mesReceitas
        .filter(r => r.status === "Gerada" || r.status === "Em atraso")
        .reduce((acc, curr) => acc + curr.valor, 0);

      const gastos = (scheduledPayments || [])
        .filter(p => {
          if (!p.vencimento) return false;
          const [y, m, day] = p.vencimento.split("-").map(Number);
          return (m - 1) === mIdx && y === yIdx;
        })
        .reduce((acc, curr) => acc + curr.valor, 0);

      dynamicRevenueData.push({ mes: mLabel, ganhos, pago, pendente, gastos });
    }

    return {
      alunosAtivos,
      faturamentoPeriodo,
      totalPago,
      totalPendente,
      totalGastos,
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <p className="text-sm text-primary font-medium">Mensalidades</p>
            <p className="text-xl font-bold mt-1">Mensalidades Contratadas</p>
            <div className="mt-4 p-3 bg-secondary rounded-md text-center font-semibold text-blue-700">
              R$ {metrics.faturamentoPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Bruto - Isenções ({periodo})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-green-600 font-medium">Financeiro</p>
            <p className="text-xl font-bold mt-1">Mensalidades Recebidas</p>
            <div className="mt-4 p-3 bg-green-50 rounded-md text-center font-semibold text-green-700">
              R$ {metrics.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Recebido no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive font-medium">Financeiro</p>
            <p className="text-xl font-bold mt-1">Mensalidades em Aberto</p>
            <div className="mt-4 p-3 bg-red-50 rounded-md text-center font-semibold text-destructive">
              R$ {metrics.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">A receber no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 font-medium">Financeiro</p>
            <p className="text-xl font-bold mt-1">Contas a Pagar</p>
            <div className="mt-4 p-3 bg-gray-50 rounded-md text-center font-semibold text-gray-700">
              R$ {metrics.totalGastos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Total de despesas no período</p>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-primary font-medium">Financeiro</p>
              <p className="text-xl font-bold">Evolução das Mensalidades Recebidas, Mensalidades em Aberto e Contas a Pagar</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">Contratado</div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-100">Mensalidades Recebidas</div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded border border-red-100">Mensalidades em Aberto</div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded border border-gray-100">Contas a Pagar</div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.dynamicRevenueData}>
                <defs>
                  <linearGradient id="colorGanhos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPago" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f0f0f0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#666' }} 
                  tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} 
                />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area 
                  type="monotone" 
                  dataKey="ganhos" 
                  name="Mensalidades Contratadas" 
                  stroke="#1d4ed8" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorGanhos)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="pago" 
                  name="Mensalidades Recebidas" 
                  stroke="#15803d" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPago)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="pendente" 
                  name="Mensalidades em Aberto" 
                  stroke="#b91c1c" 
                  strokeWidth={2} 
                  fill="none" 
                  strokeDasharray="5 5" 
                />
                <Area 
                  type="monotone" 
                  dataKey="gastos" 
                  name="Contas a Pagar" 
                  stroke="#4b5563" 
                  strokeWidth={2} 
                  fill="none" 
                  strokeDasharray="5 5" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

