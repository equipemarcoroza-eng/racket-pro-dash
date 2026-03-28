import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const periodos = ["Mês Atual", "Mês Anterior", "Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses"];

const chartData = [
  { mes: "Jan", receitas: 110000, despesas: 88000 },
  { mes: "Fev", receitas: 115000, despesas: 90000 },
  { mes: "Mar", receitas: 120000, despesas: 95000 },
];

const CashFlow = () => {
  const [periodo, setPeriodo] = useState("Mês Atual");

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
          <div className="flex gap-2 mt-3">
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
                  <p className="text-xl font-bold">Resultado (Lucro/Prejuízo)</p>
                </div>
                <p className="text-sm text-muted-foreground">Comparativo receitas e despesas</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Receitas", value: "R$ 120.000" },
                  { label: "Despesas", value: "R$ 95.000" },
                  { label: "Saldo", value: "R$ 25.000" },
                ].map((item) => (
                  <div key={item.label} className="border rounded-md p-3">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-xl font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="receitas" fill="hsl(240, 49%, 34%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" fill="hsl(0, 0%, 73%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="border rounded-md p-3">
                  <p className="text-sm text-muted-foreground">Receitas previstas</p>
                  <p className="text-xl font-bold">R$ 130.000</p>
                </div>
                <div className="border rounded-md p-3">
                  <p className="text-sm text-muted-foreground">Despesas previstas</p>
                  <p className="text-xl font-bold">R$ 100.000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm text-primary font-medium">Detalhes</p>
              <p className="text-xl font-bold">Resumo Mensal</p>
            </div>
            {[
              { label: "Fluxo Operacional", value: "R$ 20.000" },
              { label: "Fluxo de Investimento", value: "R$ -5.000" },
              { label: "Fluxo de Financiamento", value: "R$ 10.000" },
            ].map((item) => (
              <div key={item.label} className="border rounded-md p-3">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashFlow;
