import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppContext } from "@/contexts/AppContext";
import { TrendingUp, Users, DollarSign, Wallet, AlertCircle, BarChart as BarChartIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const periods = [
  { label: "Próximos 3 meses", value: "3" },
  { label: "Próximos 6 meses", value: "6" },
  { label: "Próximos 9 meses", value: "9" },
  { label: "Próximos 12 meses", value: "12" },
];

const growthRates = Array.from({ length: 11 }, (_, i) => ({
  label: `${i * 5}%`,
  value: (i * 5).toString(),
}));

const FinancialProjection = () => {
  const { students, revenues, scheduledPayments } = useAppContext();
  const [period, setPeriod] = useState("6");
  const [growthRate, setGrowthRate] = useState("0");

  const parseDate = (dateStr: string) => {
    const [d, m, y] = dateStr.split("/").map(Number);
    return new Date(y, m - 1, d);
  };

  const projectionData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // 1. Calcular Base (Mês Atual)
    const baseAlunos = students.filter((s) => {
      const [y, m, d] = s.dataEntrada.split("-").map(Number);
      const entryDate = new Date(y, m - 1, d);
      return s.status === "Ativo" && entryDate <= endOfMonth;
    }).length;

    const baseRevenues = revenues.filter((r) => {
      const vDate = parseDate(r.vencimento);
      const student = students.find((s) => s.id === r.alunoId || s.nome === r.aluno);
      // Incluímos Ativo, Passado, Extras, Inativo para métricas financeiras como na Dashboard
      const isEligible = student && ["Ativo", "Passado", "Extras", "Inativo"].includes(student.status);
      return vDate >= startOfMonth && vDate <= endOfMonth && isEligible;
    });

    const baseFaturamento = baseRevenues
      .filter((r) => r.status !== "Isento")
      .reduce((acc, curr) => acc + curr.valor, 0);

    const basePago = baseRevenues
      .filter((r) => r.status === "Pago")
      .reduce((acc, curr) => acc + curr.valor, 0);

    const basePendente = baseRevenues
      .filter((r) => r.status === "Gerada" || r.status === "Em atraso")
      .reduce((acc, curr) => acc + curr.valor, 0);

    const baseGastos = (scheduledPayments || [])
      .filter((p) => {
        if (!p.vencimento) return false;
        const [y, m, day] = p.vencimento.split("-").map(Number);
        const vDate = new Date(y, m - 1, day);
        return vDate >= startOfMonth && vDate <= endOfMonth;
      })
      .reduce((acc, curr) => acc + curr.valor, 0);

    // 2. Projetar
    const numMonths = parseInt(period);
    const rate = parseInt(growthRate) / 100;
    const months = [];

    let currentAlunos = baseAlunos;
    let currentFaturamento = baseFaturamento;
    let currentPago = basePago;
    let currentPendente = basePendente;
    let currentGastos = baseGastos;

    for (let i = 0; i < numMonths; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      const label = d.toLocaleString("pt-BR", { month: "long", year: "numeric" });

      if (i > 0) {
        currentAlunos = currentAlunos * (1 + rate);
        currentFaturamento = currentFaturamento * (1 + rate);
        currentPago = currentPago * (1 + rate);
        currentPendente = currentPendente * (1 + rate);
        currentGastos = currentGastos * (1 + rate);
      }

      months.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        alunos: Math.floor(currentAlunos),
        faturamento: currentFaturamento,
        pago: currentPago,
        pendente: currentPendente,
        gastos: currentGastos,
      });
    }

    return months;
  }, [students, revenues, scheduledPayments, period, growthRate]);

  const totals = useMemo(() => {
    return {
      alunos: projectionData[projectionData.length - 1]?.alunos || 0,
      faturamento: projectionData.reduce((acc, m) => acc + m.faturamento, 0),
      pago: projectionData.reduce((acc, m) => acc + m.pago, 0),
      pendente: projectionData.reduce((acc, m) => acc + m.pendente, 0),
      gastos: projectionData.reduce((acc, m) => acc + m.gastos, 0),
    };
  }, [projectionData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-primary font-medium">Financeiro</p>
          <h1 className="text-2xl font-bold tracking-tight">Projeção Financeira</h1>
          <p className="text-xs text-muted-foreground mt-1">Simulação de crescimento baseada no mês atual.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Período</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Crescimento Mensal</label>
            <Select value={growthRate} onValueChange={setGrowthRate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {growthRates.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary uppercase">Alunos (Final)</p>
                <p className="text-2xl font-black">{totals.alunos}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-700 uppercase">Mensalidades Contratadas</p>
                <p className="text-2xl font-black text-green-600">
                  R$ {totals.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-700 uppercase">Mensalidades em Aberto</p>
                <p className="text-2xl font-black text-orange-600">
                  R$ {totals.pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-700 uppercase">Gastos Totais</p>
                <p className="text-2xl font-black text-red-600">
                  R$ {totals.gastos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 shadow-sm border-muted/40">
          <CardHeader className="p-2 mb-4">
            <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Crescimento de Alunos Ativos
            </CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="colorAlunos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickFormatter={(val) => val.split(' ')[0]} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="alunos" 
                  name="Alunos" 
                  stroke="#1d4ed8" 
                  strokeWidth={3} 
                  fillOpacity={1}
                  fill="url(#colorAlunos)"
                  dot={{ r: 4, fill: '#1d4ed8', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 shadow-sm border-muted/40">
          <CardHeader className="p-2 mb-4">
            <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Evolução Financeira Projetada
            </CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPago" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickFormatter={(val) => val.split(' ')[0]}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="faturamento" name="Mensalidades" stroke="#1d4ed8" strokeWidth={3} fillOpacity={1} fill="url(#colorFaturamento)" />
                <Area type="monotone" dataKey="pago" name="Recebido" stroke="#15803d" strokeWidth={3} fillOpacity={1} fill="url(#colorPago)" />
                <Area type="monotone" dataKey="pendente" name="Em Aberto" stroke="#ea580c" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="gastos" name="Contas Pagas" stroke="#dc2626" strokeWidth={2} fill="none" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tabela de Projeção Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Mês</TableHead>
                <TableHead className="text-center">Alunos Ativos</TableHead>
                <TableHead className="text-right">Mensalidades Contratadas</TableHead>
                <TableHead className="text-right">Total Recebido</TableHead>
                <TableHead className="text-right">Mensalidades em Aberto</TableHead>
                <TableHead className="text-right">Contas Pagas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectionData.map((m, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-semibold">{m.label}</TableCell>
                  <TableCell className="text-center font-bold text-primary">{m.alunos}</TableCell>
                  <TableCell className="text-right">R$ {m.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">R$ {m.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right text-orange-600 font-medium">R$ {m.pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right text-red-600 font-medium">R$ {m.gastos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-black border-t-2">
                <TableCell>TOTAIS</TableCell>
                <TableCell className="text-center text-primary">{totals.alunos}</TableCell>
                <TableCell className="text-right">R$ {totals.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right text-green-600">R$ {totals.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right text-orange-600">R$ {totals.pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right text-red-600">R$ {totals.gastos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialProjection;
