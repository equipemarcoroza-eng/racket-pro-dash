import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockRevenue } from "@/data/mockData";

const Revenue = () => {
  const [filter, setFilter] = useState<string | null>(null);
  const filtered = filter ? mockRevenue.filter((r) => r.plano === filter) : mockRevenue;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-primary font-medium">Financeiro</p>
            <CardTitle className="text-2xl">Contas a Receber</CardTitle>
            <p className="text-sm text-muted-foreground">Gestão de cobranças, planos e vencimentos de mensalidades, trimestrais e anuais.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Filtrar</Button>
            <Button>Registrar Recebimento Mitigado</Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-primary font-medium">Lista de Receitas</p>
                  <p className="text-xl font-bold">Mensalidades e planos</p>
                </div>
                <div className="flex gap-2 text-sm">
                  {["Mensal", "Trimestral", "Anual"].map((f) => (
                    <button key={f} className={`font-medium ${filter === f ? "text-foreground" : "text-muted-foreground"}`} onClick={() => setFilter(filter === f ? null : f)}>{f}</button>
                  ))}
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead><TableHead>Plano</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.aluno}</TableCell>
                      <TableCell>{r.plano}</TableCell>
                      <TableCell>{r.vencimento}</TableCell>
                      <TableCell>R$ {r.valor.toFixed(2).replace(".", ",")}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">Detalhar</Button>
                          <Button variant="outline" size="sm">
                            {r.status === "Pago" ? "Baixar" : r.status === "Em atraso" ? "Enviar aviso" : "Programar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm text-primary font-medium">Taxa de Matrícula</p>
              <p className="text-2xl font-bold">R$ 32,90</p>
              <p className="text-sm text-muted-foreground">Aplicações automáticas para novos contratos.</p>
            </div>
            <Button variant="outline" className="w-full">Isentar taxa</Button>
            <Button variant="outline" className="w-full">Alterar valor</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Revenue;
