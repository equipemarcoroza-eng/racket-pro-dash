import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppContext } from "@/contexts/AppContext";
import { TrendingUp, Users, DollarSign, Wallet, AlertCircle, BarChart as BarChartIcon, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

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
  const chartAlunosRef = useRef<HTMLDivElement>(null);
  const chartFinanceiroRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      // Logo
      try {
        doc.addImage(logo, "PNG", 15, 12, 25, 25);
      } catch (e) {
        console.error("Erro ao carregar o logotipo", e);
      }

      // Title & Header info
      doc.setFontSize(20);
      doc.setTextColor(20, 40, 100);
      doc.text("Equipe Marco Roza", 45, 20);
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("Relatório de Projeção Financeira", 45, 27);
      doc.setFontSize(10);
      doc.text(`Período: Próximos ${period} meses | Crescimento Mensal: ${growthRate}%`, 45, 33);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 45, 38);

      doc.setDrawColor(200, 200, 200);
      doc.line(15, 45, 195, 45);

      // Section 1: Resumo da Simulação
      doc.setFontSize(12);
      doc.setTextColor(20, 40, 100);
      doc.text("Resumo da Simulação (Valores Totais)", 15, 53);

      const summaryBody = [
        ["Alunos Ativos (Final)", `${totals.alunos} alunos`],
        ["Total de Mensalidades Contratadas", `R$ ${totals.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ["Total de Contas a Pagar (Despesas)", `R$ ${totals.gastos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ["Saldo Projetado (Acumulado)", `R$ ${(totals.faturamento - totals.gastos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
      ];

      autoTable(doc, {
        startY: 58,
        body: summaryBody,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 80 },
          1: { fontStyle: 'bold', textColor: [0, 0, 0] }
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let finalY = (doc as any).lastAutoTable.finalY + 10;

      // Capture Chart 1 & Chart 2
      const charts = [];
      const html2canvas = (await import("html2canvas")).default;

      if (chartAlunosRef.current) {
        try {
          const canvas = await html2canvas(chartAlunosRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false
          });
          charts.push({ title: "Crescimento de Alunos Ativos", data: canvas.toDataURL("image/png"), canvas });
        } catch (err) {
          console.error("Erro ao incluir gráfico de alunos no PDF", err);
        }
      }

      if (chartFinanceiroRef.current) {
        try {
          const canvas = await html2canvas(chartFinanceiroRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false
          });
          charts.push({ title: "Evolução Financeira Projetada", data: canvas.toDataURL("image/png"), canvas });
        } catch (err) {
          console.error("Erro ao incluir gráfico financeiro no PDF", err);
        }
      }

      if (charts.length > 0) {
        if (finalY + 70 > 280) {
          doc.addPage();
          finalY = 20;
        }

        if (charts.length === 1) {
          const c = charts[0];
          const imgWidth = 180;
          const imgHeight = (c.canvas.height * imgWidth) / c.canvas.width;
          doc.setFontSize(11);
          doc.setTextColor(20, 40, 100);
          doc.text(c.title, 15, finalY);
          doc.addImage(c.data, "PNG", 15, finalY + 4, imgWidth, imgHeight);
          finalY += imgHeight + 15;
        } else if (charts.length === 2) {
          const c1 = charts[0];
          const c2 = charts[1];
          const imgWidth = 85;
          const imgHeight1 = (c1.canvas.height * imgWidth) / c1.canvas.width;
          const imgHeight2 = (c2.canvas.height * imgWidth) / c2.canvas.width;
          
          doc.setFontSize(11);
          doc.setTextColor(20, 40, 100);
          
          doc.text(c1.title, 15, finalY);
          doc.addImage(c1.data, "PNG", 15, finalY + 4, imgWidth, imgHeight1);

          doc.text(c2.title, 110, finalY);
          doc.addImage(c2.data, "PNG", 110, finalY + 4, imgWidth, imgHeight2);

          finalY += Math.max(imgHeight1, imgHeight2) + 15;
        }
      }

      // Projection Table
      const headers = ["Mês", "Alunos Ativos", "Mensalidades Contratadas", "Contas a Pagar"];
      const tableData = projectionData.map(m => [
        m.label,
        m.alunos,
        `R$ ${m.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${m.gastos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      ]);

      // Add a totals row
      tableData.push([
        "TOTAIS",
        totals.alunos.toString(),
        `R$ ${totals.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${totals.gastos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      ]);

      if (finalY + 40 > 280) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(20, 40, 100);
      doc.text("Tabela de Projeção Mensal", 15, finalY);

      autoTable(doc, {
        startY: finalY + 4,
        head: [headers],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [20, 40, 100] },
        styles: { fontSize: 9 },
        didParseCell: (data) => {
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            if (data.column.index === 0) {
              data.cell.styles.textColor = [0, 0, 0];
            }
          }
        }
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Racket Pro - Sistema de Gestão Esportiva", 105, 290, { align: "center" });

      doc.save(`projecao-financeira-${Date.now()}.pdf`);
      toast.success("Projeção Financeira exportada com sucesso!");
    } catch (err) {
      console.error("Falha ao exportar PDF", err);
      toast.error("Erro ao gerar o relatório de projeção em PDF");
    }
  };

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
    let currentGastos = baseGastos;

    for (let i = 0; i < numMonths; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      const label = d.toLocaleString("pt-BR", { month: "long", year: "numeric" });

      if (i > 0) {
        currentAlunos = currentAlunos * (1 + rate);
        currentFaturamento = currentFaturamento * (1 + rate);
        currentGastos = currentGastos * (1 + rate);
      }

      months.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        alunos: Math.floor(currentAlunos),
        faturamento: currentFaturamento,
        gastos: currentGastos,
      });
    }

    return months;
  }, [students, revenues, scheduledPayments, period, growthRate]);

  const totals = useMemo(() => {
    return {
      alunos: projectionData[projectionData.length - 1]?.alunos || 0,
      faturamento: projectionData.reduce((acc, m) => acc + m.faturamento, 0),
      gastos: projectionData.reduce((acc, m) => acc + m.gastos, 0),
    };
  }, [projectionData]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#0f1236] via-[#1c2394] to-[#de392a] text-white border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Financeiro</p>
              <h1 className="text-2xl font-black text-white mt-1">Projeção Financeira</h1>
              <p className="text-xs text-white/70 mt-1">Simulação de crescimento baseada no mês atual.</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-48">
                <label className="text-[10px] font-bold uppercase text-white/80 ml-1 mb-1 block">Período</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/40 focus:border-white/40">
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
                <label className="text-[10px] font-bold uppercase text-white/80 ml-1 mb-1 block">Crescimento Mensal</label>
                <Select value={growthRate} onValueChange={setGrowthRate}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/40 focus:border-white/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {growthRates.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleExportPDF} 
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md font-semibold"
              >
                <FileText className="h-4 w-4" /> Exportar Relatório PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-700 uppercase">Contas a Pagar</p>
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
        <Card ref={chartAlunosRef} className="p-4 shadow-sm border-muted/40 bg-white">
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

        <Card ref={chartFinanceiroRef} className="p-4 shadow-sm border-muted/40 bg-white">
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
                <Area type="monotone" dataKey="faturamento" name="Mensalidades Contratadas" stroke="#1d4ed8" strokeWidth={3} fillOpacity={1} fill="url(#colorFaturamento)" />
                <Area type="monotone" dataKey="gastos" name="Contas a Pagar" stroke="#dc2626" strokeWidth={2} fill="none" strokeDasharray="5 5" />
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
                <TableHead className="text-right">Contas a Pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectionData.map((m, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-semibold">{m.label}</TableCell>
                  <TableCell className="text-center font-bold text-primary">{m.alunos}</TableCell>
                  <TableCell className="text-right">R$ {m.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right text-red-600 font-medium">R$ {m.gastos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-black border-t-2">
                <TableCell>TOTAIS</TableCell>
                <TableCell className="text-center text-primary">{totals.alunos}</TableCell>
                <TableCell className="text-right">R$ {totals.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
