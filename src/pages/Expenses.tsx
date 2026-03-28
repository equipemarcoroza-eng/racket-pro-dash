import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { mockExpenseCategories, mockScheduledPayments } from "@/data/mockData";

const Expenses = () => {
  const totalPrevisto = mockScheduledPayments.reduce((a, b) => a + b.valor, 0) + mockExpenseCategories.reduce((a, b) => a + b.valor, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Contas a Pagar</CardTitle>
            <p className="text-sm text-muted-foreground">Controle de custos operacionais e pagamentos a terceiros.</p>
          </div>
          <Button>Nova Despesa</Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {["Aluguel", "Materiais", "Professores freelancers"].map((c) => (
              <Button key={c} variant="outline" size="sm">{c}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Previsto", value: "R$ 45.000" },
          { label: "Pendências", value: "12 pagamentos" },
          { label: "Fornecedores Ativos", value: "8 contatos" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold mt-1">{item.value}</p>
              <Progress value={65} className="mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xl font-bold">Resumo das Categorias de Despesa</p>
              <p className="text-sm text-muted-foreground">Categorização por tipo de gasto.</p>
            </div>
            <Button variant="outline">Adicionar Categoria</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockExpenseCategories.map((cat) => (
              <div key={cat.id} className="border rounded-md p-4">
                <p className="text-sm text-muted-foreground">{cat.categoria}</p>
                <p className="text-xl font-bold">R$ {cat.valor.toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xl font-bold">Pagamentos Programados</p>
                  <p className="text-sm text-muted-foreground">Próximas saídas de caixa.</p>
                </div>
                <Button variant="outline" size="sm">Filtrar por data</Button>
              </div>
              <div className="space-y-3">
                {mockScheduledPayments.map((p) => (
                  <div key={p.fornecedor} className="flex items-center justify-between border rounded-md p-3">
                    <span className="font-medium">{p.fornecedor}</span>
                    <span className="font-semibold">R$ {p.valor.toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-secondary rounded-md p-3">
                <p className="text-sm text-muted-foreground">Total previsto no período</p>
                <p className="text-xl font-bold">R$ {totalPrevisto.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-xl font-bold">Resumo Geral</p>
            <div className="border rounded-md p-3 flex justify-between">
              <span className="text-sm">Em dia</span>
              <span className="font-semibold">R$ 22.000</span>
            </div>
            <div className="border rounded-md p-3 flex justify-between">
              <span className="text-sm">Atrasados</span>
              <span className="font-semibold">R$ 6.400</span>
            </div>
            <Button variant="outline" className="w-full">Gerar Relatório</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Expenses;
