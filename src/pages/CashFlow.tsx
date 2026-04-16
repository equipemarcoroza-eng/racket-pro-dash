import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAppContext } from "@/contexts/AppContext";

const periodos = ["Mês Atual", "Mês Anterior", "Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses", "Últimos 24 meses", "Últimos 36 meses", "Últimos 48 meses"];

const CashFlow = () => {
  const { revenues, expenseLogs } = useAppContext();
  const [periodo, setPeriodo] = useState("Mês Atual");

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
      despesasPrevistas: despesas * 1.05, // Estimativa simples
      dynamicChartData
    };
  }, [periodo, revenues, expenseLogs]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">/finance/cash-flow</p>
            <CardTitle className="text-2xl">Fluxo de Caixa</CardTitle>
            <p className="text-sm text-muted-foreground">Análise detalhada da saúde financeira mensal da escola.</p>
          </div>
          <Button>Exportar Relatório PDF</Button>
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
                      R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
              <div className="h-[300px] w-100%">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.dynamicChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`} />
                    <Bar dataKey="receitas" fill="hsl(240, 49%, 34%)" radius={[4, 4, 0, 0]} name="Receitas" />
                    <Bar dataKey="despesas" fill="hsl(0, 0%, 73%)" radius={[4, 4, 0, 0]} name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="border rounded-md p-3">
                  <p className="text-sm text-muted-foreground">Receitas previstas (total faturamento)</p>
                  <p className="text-xl font-bold">R$ {metrics.receitasPrevistas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="border rounded-md p-3">
                  <p className="text-sm text-muted-foreground">Despesas estimadas</p>
                  <p className="text-xl font-bold">R$ {metrics.despesasPrevistas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
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
                  R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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

