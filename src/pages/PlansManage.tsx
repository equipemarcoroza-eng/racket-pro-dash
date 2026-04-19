import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppContext } from "@/contexts/AppContext";
import type { Plan } from "@/data/mockData";

const PlansManage = () => {
  const { plans, setPlans, loading } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", valor: "", turno: "Matutino", frequencia: "1x por semana", periodicidade: "Trimestral" });

  const handleSave = () => {
    if (!form.nome || !form.valor) return;
    if (editingId) {
      setPlans((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...form, valor: Number(form.valor) } : p)));
      setEditingId(null);
    } else {
      setPlans((prev) => [...prev, { id: crypto.randomUUID(), ...form, valor: Number(form.valor) }]);
    }
    setForm({ nome: "", valor: "", turno: "Matutino", frequencia: "1x por semana", periodicidade: "Trimestral" });
  };

  const handleLoad = (plan: Plan) => {
    setEditingId(plan.id);
    setForm({ nome: plan.nome, valor: String(plan.valor), turno: plan.turno, frequencia: plan.frequencia, periodicidade: plan.periodicidade });
  };

  const handleDelete = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="text-sm text-primary font-medium">Gestão de Planos</p>
          <CardTitle className="text-2xl">Gestão de Planos</CardTitle>
          <p className="text-sm text-muted-foreground">Permitir a criação, consulta, edição e exclusão de planos e pacotes da escola de esportes.</p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="font-semibold text-lg">Formulário de Plano</p>
              <p className="text-sm text-muted-foreground">Preencha os dados para cadastrar ou editar um plano.</p>
            </div>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input placeholder="Nome do plano" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Valor</Label><Input placeholder="R$" type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div>
              <div><Label>Turno</Label>
                <Select value={form.turno} onValueChange={(v) => setForm({ ...form, turno: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Matutino">Matutino</SelectItem><SelectItem value="Vespertino">Vespertino</SelectItem><SelectItem value="Noturno">Noturno</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Frequência</Label>
                <Select value={form.frequencia} onValueChange={(v) => setForm({ ...form, frequencia: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1x por semana">1x por semana</SelectItem><SelectItem value="2x por semana">2x por semana</SelectItem><SelectItem value="3x por semana">3x por semana</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Periodicidade</Label>
                <Select value={form.periodicidade} onValueChange={(v) => setForm({ ...form, periodicidade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Mensal">Mensal</SelectItem><SelectItem value="Trimestral">Trimestral</SelectItem><SelectItem value="Anual">Anual</SelectItem></SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar Plano</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-primary font-medium">Tabela de Planos Cadastrados</p>
                <p className="font-semibold text-lg">Planos ativos</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead><TableHead>Valor</TableHead><TableHead>Turno</TableHead><TableHead>Frequência</TableHead><TableHead>Periodicidade</TableHead><TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">{loading ? "Carregando…" : "Nenhum plano cadastrado"}</TableCell></TableRow>
                ) : plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.nome}</TableCell>
                    <TableCell>R$ {plan.valor.toFixed(2).replace(".", ",")}</TableCell>
                    <TableCell>{plan.turno}</TableCell>
                    <TableCell>{plan.frequencia}</TableCell>
                    <TableCell>{plan.periodicidade}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleLoad(plan)}>Carregar dados</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(plan.id)}>Excluir Plano</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlansManage;
