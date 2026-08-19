import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAppContext } from "@/contexts/AppContext";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

const periodos = ["Mês Atual", "Mês Anterior", "Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses", "Últimos 24 meses", "Últimos 36 meses", "Últimos 48 meses"];

const CashFlow = () => {
  const { revenues, expenseLogs, students } = useAppContext();
  const [periodo, setPeriodo] = useState("Mês Atual");
  const chartRef = useRef<HTMLDivElement>(null);

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
      doc.text("Relatório de Fluxo de Caixa", 45, 27);
      doc.setFontSize(10);
      doc.text(`Período: ${periodo} | Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 45, 33);

      doc.setDrawColor(200, 200, 200);
      doc.line(15, 42, 195, 42);

      // Section 1: Resumo Financeiro
      doc.setFontSize(12);
      doc.setTextColor(20, 40, 100);
      doc.text("Resumo Financeiro do Período", 15, 50);

      // Summary table
      const summaryBody = [
        ["Receitas Reais (Pagas)", `R$ ${metrics.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Receitas Previstas (Faturamento)", `R$ ${metrics.receitasPrevistas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ["Despesas Reais (Pagas)", `R$ ${metrics.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Despesas Estimadas", `R$ ${metrics.despesasPrevistas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ["Saldo Real do Período", `R$ ${metrics.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Mensalidades (Ativos/Inativos)", `R$ ${metrics.totalMensalidadesAtivos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ["Total Pendente (Ativos)", `R$ ${metrics.totalPendentesAtivosInativos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "", ""]
      ];

      autoTable(doc, {
        startY: 55,
        body: summaryBody,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [100, 100, 100] },
          1: { fontStyle: 'bold', textColor: [0, 0, 0] },
          2: { fontStyle: 'bold', textColor: [100, 100, 100] },
          3: { fontStyle: 'bold', textColor: [0, 0, 0] }
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      
      if (chartRef.current) {
        try {
          const html2canvas = (await import("html2canvas")).default;
          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false
          });
          const imgData = canvas.toDataURL("image/png");
          
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (finalY + imgHeight > 280) {
            doc.addPage();
            finalY = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(20, 40, 100);
          doc.text("Evolução Mensal (Gráfico)", 15, finalY);
          doc.addImage(imgData, "PNG", 15, finalY + 5, imgWidth, imgHeight);
          finalY += imgHeight + 15;
        } catch (err) {
          console.error("Erro ao incluir gráfico no PDF", err);
        }
      }

      // Monthly Table
      const monthlyHeaders = ["Mês", "Receitas", "Despesas", "Saldo"];
      const monthlyBody = metrics.dynamicChartData.map(m => [
        m.mes,
        `R$ ${m.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${m.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${(m.receitas - m.despesas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      ]);

      if (finalY + 30 > 280) {
        doc.addPage();
        finalY = 20;
      } else {
        finalY += 5;
      }

      doc.setFontSize(12);
      doc.setTextColor(20, 40, 100);
      doc.text("Detalhamento Mensal", 15, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        head: [monthlyHeaders],
        body: monthlyBody,
        theme: 'striped',
        headStyles: { fillColor: [20, 40, 100] },
        styles: { fontSize: 9 }
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Racket Pro - Sistema de Gestão Esportiva", 105, 290, { align: "center" });

      doc.save(`relatorio-fluxo-caixa-${Date.now()}.pdf`);
      toast.success("Relatório de Fluxo de Caixa exportado com sucesso!");
    } catch (err) {
      console.error("Falha ao exportar PDF", err);
      toast.error("Erro ao gerar o relatório em PDF");
    }
  };

  const parseDate = (dateStr: string) => {
    // Para vencimento DD/MM/YYYY
    if (dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/").map(Number);
      return new Date(y, m - 1, d);
    }
    // Para data YYYY-MM-DD
    return new Date(dateStr);
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

    // Receitas (Apenas Pagas)
    const receitas = revenues
      .filter(r => {
        const vDate = parseDate(r.vencimento);
        return vDate >= startDate && vDate <= endDate && r.status === "Pago";
      })
      .reduce((acc, curr) => acc + curr.valor, 0);

    // Despesas
    const despesas = expenseLogs
      .filter(e => {
        const eDate = parseDate(e.data);
        return eDate >= startDate && eDate <= endDate;
      })
      .reduce((acc, curr) => acc + curr.valor, 0);

    // Receitas Previstas (Inclui Geradas e Em Atraso)
    const receitasPrevistas = revenues
      .filter(r => {
        const vDate = parseDate(r.vencimento);
        return vDate >= startDate && vDate <= endDate && (r.status === "Gerada" || r.status === "Em atraso" || r.status === "Pago");
      })
      .reduce((acc, curr) => acc + curr.valor, 0);

    const totalMensalidadesAtivos = revenues
      .filter(r => {
        const vDate = parseDate(r.vencimento);
        if (!(vDate >= startDate && vDate <= endDate)) return false;
        if (r.status !== "Pago") return false;
        
        const student = students.find(s => s.id === r.alunoId || s.nome === r.aluno);
        return student && (student.status === "Ativo" || student.status === "Inativo");
      })
      .reduce((acc, curr) => acc + curr.valor, 0);

    const totalPendentesAtivosInativos = revenues
      .filter(r => {
        const vDate = parseDate(r.vencimento);
        if (!(vDate >= startDate && vDate <= endDate)) return false;
        if (r.status !== "Gerada" && r.status !== "Em atraso") return false;
        
        const student = students.find(s => s.id === r.alunoId || s.nome === r.aluno);
        return student && (student.status === "Ativo" || student.status === "Inativo");
      })
      .reduce((acc, curr) => acc + curr.valor, 0);

    // Dados do Gráfico
    const chartMonths = periodo === "Mês Atual" || periodo === "Mês Anterior" ? 3 : 
                       periodo === "Últimos 3 meses" ? 3 :
                       periodo === "Últimos 6 meses" ? 6 :
                       periodo === "Últimos 12 meses" ? 12 :
                       periodo === "Últimos 24 meses" ? 24 :
                       periodo === "Últimos 36 meses" ? 36 : 48;

    const dynamicChartData = [];
    for (let i = chartMonths - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mLabel = d.toLocaleString("pt-BR", { month: "short" });
      const mIdx = d.getMonth();
      const yIdx = d.getFullYear();

      const mReceitas = revenues
        .filter(r => {
          const vDate = parseDate(r.vencimento);
          return vDate.getMonth() === mIdx && vDate.getFullYear() === yIdx && r.status === "Pago";
        })
        .reduce((acc, curr) => acc + curr.valor, 0);

      const mDespesas = expenseLogs
        .filter(e => {
          const eDate = parseDate(e.data);
          return eDate.getMonth() === mIdx && eDate.getFullYear() === yIdx;
        })
        .reduce((acc, curr) => acc + curr.valor, 0);

      dynamicChartData.push({ mes: mLabel, receitas: mReceitas, despesas: mDespesas });
    }

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
      receitasPrevistas,
      totalMensalidadesAtivos,
      totalPendentesAtivosInativos,
      despesasPrevistas: despesas * 1.05, // Estimativa simples
      dynamicChartData
    };
  }, [periodo, revenues, expenseLogs, students]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">/finance/cash-flow</p>
            <CardTitle className="text-2xl">Fluxo de Caixa</CardTitle>
            <p className="text-sm text-muted-foreground">Análise detalhada da saúde financeira mensal da escola.</p>
          </div>
          <Button onClick={handleExportPDF}>Exportar Relatório PDF</Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary font-medium">Filtros</p>
              <p className="font-semibold text-lg">Filtros de Período</p>
            </div>
            <p className="text-sm text-primary">Selecione o intervalo desejado</p>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {periodos.map((p) => (
              <Button key={p} variant={periodo === p ? "default" : "outline"} size="sm" onClick={() => setPeriodo(p)}>{p}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-primary font-medium">Demonstrativo</p>
                  <p className="text-xl font-bold">Resultado ({periodo})</p>
                </div>
                <p className="text-sm text-muted-foreground">Comparativo receitas e despesas reais</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Receitas", value: metrics.receitas, color: "text-green-600" },
                  { label: "Despesas", value: metrics.despesas, color: "text-destructive" },
                  { label: "Saldo", value: metrics.saldo, color: metrics.saldo >= 0 ? "text-blue-600" : "text-destructive" },
                ].map((item) => (
                  <div key={item.label} className="border rounded-md p-3">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className={`text-xl font-bold ${item.color}`}>
                      R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
              <div ref={chartRef} className="h-[300px] w-full bg-white p-2 rounded-md">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.dynamicChartData}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
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
                      formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="receitas" 
                      name="Receitas" 
                      stroke="#1d4ed8" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorReceitas)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="despesas" 
                      name="Despesas" 
                      stroke="#dc2626" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorDespesas)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="border rounded-md p-3">
                  <p className="text-sm text-muted-foreground">Receitas previstas (total faturamento)</p>
                  <p className="text-xl font-bold">R$ {metrics.receitasPrevistas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="border rounded-md p-3 bg-blue-50/30 border-blue-100">
                  <p className="text-sm text-blue-700 font-medium">Total de Mensalidades (Ativos/Inativos e Pagos)</p>
                  <p className="text-xl font-black text-blue-800">R$ {metrics.totalMensalidadesAtivos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="border rounded-md p-3 bg-amber-50/30 border-amber-100">
                  <p className="text-sm text-amber-700 font-medium">Total Pendente (Ativos/Inativos)</p>
                  <p className="text-xl font-black text-amber-800">R$ {metrics.totalPendentesAtivosInativos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="border rounded-md p-3">
                  <p className="text-sm text-muted-foreground">Despesas estimadas</p>
                  <p className="text-xl font-bold">R$ {metrics.despesasPrevistas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm text-primary font-medium">Detalhes</p>
              <p className="text-xl font-bold">Resumo por Fluxo</p>
            </div>
            {[
              { label: "Fluxo Operacional", value: metrics.saldo * 0.8 },
              { label: "Fluxo de Investimento", value: metrics.despesas * -0.2 },
              { label: "Fluxo de Financiamento", value: metrics.receitas * 0.1 },
            ].map((item) => (
              <div key={item.label} className="border rounded-md p-3">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className={`text-xl font-bold ${item.value >= 0 ? "text-foreground" : "text-destructive"}`}>
                  R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
            <div className="pt-4 mt-4 border-t">
              <p className="text-xs text-muted-foreground italic">* Os fluxos detalhados são estimativas baseadas nos lançamentos totais do período selecionado.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashFlow;

