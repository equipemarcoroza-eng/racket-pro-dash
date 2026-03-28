import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const periodos = ["Mês Atual", "Mês Anterior", "Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses"];

const revenueData = [
  { mes: "Jan", ganhos: 38000, gastos: 29000 },
  { mes: "Fev", ganhos: 42000, gastos: 31000 },
  { mes: "Mar", ganhos: 45000, gastos: 33000 },
];

const Dashboard = () => {
  const [periodo, setPeriodo] = useState("Mês Atual");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-primary font-medium">Painel</p>
            <CardTitle className="text-2xl">Dashboard Operacional</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Visualização rápida de indicadores de desempenho, ocupação e financeiro.</p>
          </div>
          <Button>Atualizar</Button>
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
            <div className="mt-4 p-3 bg-secondary rounded-md text-center font-semibold">1.250 alunos</div>
            <p className="text-xs text-muted-foreground mt-2">Atualizado conforme filtro</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-primary font-medium">Métrica</p>
            <p className="text-xl font-bold mt-1">Faturamento Mensal</p>
            <div className="mt-4 p-3 bg-secondary rounded-md text-center font-semibold">R$ 420.000</div>
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
              <Button variant="outline" size="sm">Ranking</Button>
            </div>
            <div className="space-y-3">
              {[{ nome: "Turma A", pct: 92 }, { nome: "Turma B", pct: 88 }, { nome: "Turma C", pct: 81 }].map((t) => (
                <div key={t.nome} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-medium">{t.nome}</span>
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
                <p className="text-xl font-bold">Últimas 3 com menor ocupação</p>
              </div>
              <Button variant="outline" size="sm">Ranking</Button>
            </div>
            <div className="space-y-3">
              {[{ nome: "Turma X", pct: 48 }, { nome: "Turma Y", pct: 42 }, { nome: "Turma Z", pct: 35 }].map((t) => (
                <div key={t.nome} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-medium">{t.nome}</span>
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
              <p className="text-sm font-medium mb-2">Ganhos</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ganhos" fill="hsl(240, 49%, 34%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Gastos</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="gastos" fill="hsl(0, 0%, 73%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
