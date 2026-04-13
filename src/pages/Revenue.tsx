import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockRevenue, mockStudents, mockPlans, type Revenue as RevenueType } from "@/data/mockData";
import { toast } from "sonner";

const Revenue = () => {
  const [filter, setFilter] = useState<string | null>(null);
  const [receitas, setReceitas] = useState<RevenueType[]>(mockRevenue);
  const [viewingReceita, setViewingReceita] = useState<RevenueType | null>(null);
  const [showRecebimento, setShowRecebimento] = useState(false);
  const [recebimentoForm, setRecebimentoForm] = useState({ aluno: "", valor: "", plano: "Mensalidade" });

  const filtered = filter ? receitas.filter((r) => r.plano === filter) : receitas;

  const gerarParcelas = () => {
    const now = new Date();
    const mes = String(now.getMonth() + 1).padStart(2, "0");
    const ano = now.getFullYear();
    const valorPadrao = mockPlans[0]?.valor ?? 120;
    const alunosAtivos = mockStudents.filter((s) => s.status === "Ativo");
    let count = 0;
    const novas: RevenueType[] = [];

    for (const aluno of alunosAtivos) {
      let dia = aluno.vencimento.split("/")[0];
      
      if (mes === "02" && (dia === "30" || dia === "31")) {
        dia = "28";
      }

      const vencimento = `${dia}/${mes}/${ano}`;
      const jaExiste = receitas.some((r) => r.aluno === aluno.nome && r.vencimento.includes(`/${mes}/${ano}`));
      if (!jaExiste) {
        novas.push({ id: crypto.randomUUID(), aluno: aluno.nome, plano: "Mensalidade", vencimento, valor: valorPadrao, status: "Gerada" });
        count++;
      }
    }

    if (count > 0) {
      setReceitas((prev) => [...prev, ...novas]);
      toast.success(`${count} parcela(s) gerada(s) para ${mes}/${ano}`);
    } else {
      toast.info("Todas as parcelas do mês já foram geradas.");
    }
  };

  const handleAction = (r: RevenueType) => {
    if (r.status === "Pago") {
      const headers = ["Aluno", "Plano", "Vencimento", "Valor", "Status"];
      const row = [r.aluno, r.plano, r.vencimento, String(r.valor), r.status];
      const csv = [headers.join(","), row.join(",")].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibo-${r.aluno.replace(/\s/g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Recibo baixado");
    } else if (r.status === "Em atraso") {
      toast.success(`Aviso de cobrança enviado para ${r.aluno}`);
    } else {
      setReceitas((prev) => prev.map((rec) => rec.id === r.id ? { ...rec, status: "Em atraso" } : rec));
      toast.success(`Cobrança programada para ${r.aluno}`);
    }
  };

  const handleRecebimento = () => {
    if (!recebimentoForm.aluno || !recebimentoForm.valor) { toast.error("Preencha todos os campos"); return; }
    const now = new Date();
    const venc = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    setReceitas((prev) => [...prev, { id: crypto.randomUUID(), aluno: recebimentoForm.aluno, plano: recebimentoForm.plano, vencimento: venc, valor: Number(recebimentoForm.valor), status: "Pago" }]);
    toast.success("Recebimento registrado");
    setShowRecebimento(false);
    setRecebimentoForm({ aluno: "", valor: "", plano: "Mensalidade" });
  };

  const totalPago = receitas.filter((r) => r.status === "Pago").reduce((a, b) => a + b.valor, 0);
  const totalAtrasado = receitas.filter((r) => r.status === "Em atraso").reduce((a, b) => a + b.valor, 0);
  const totalAReceber = receitas.filter((r) => r.status === "Gerada" || r.status === "Em atraso").reduce((a, b) => a + b.valor, 0);

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
            <Button variant="secondary" onClick={gerarParcelas}>Gerar Parcelas do Mês</Button>
            <Button onClick={() => setShowRecebimento(true)}>Registrar Recebimento Mitigado</Button>
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
                  {["Mensalidade", "Trimestral", "Anual"].map((f) => (
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
                          <Button variant="outline" size="sm" onClick={() => setViewingReceita(r)}>Detalhar</Button>
                          <Button variant="outline" size="sm" onClick={() => handleAction(r)}>
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
              <p className="text-sm text-primary font-medium">Resumo</p>
              <p className="text-lg font-bold">Visão Geral</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-muted-foreground">Total a receber</p>
              <p className="text-xl font-bold text-blue-600">R$ {totalAReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-muted-foreground">Total recebido</p>
              <p className="text-xl font-bold">R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-muted-foreground">Em atraso</p>
              <p className="text-xl font-bold text-destructive">R$ {totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
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

      {/* Dialog Detalhar */}
      <Dialog open={!!viewingReceita} onOpenChange={(open) => !open && setViewingReceita(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes da Receita</DialogTitle></DialogHeader>
          {viewingReceita && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Aluno</p><p className="font-medium">{viewingReceita.aluno}</p></div>
                <div><p className="text-sm text-muted-foreground">Plano</p><p className="font-medium">{viewingReceita.plano}</p></div>
                <div><p className="text-sm text-muted-foreground">Vencimento</p><p className="font-medium">{viewingReceita.vencimento}</p></div>
                <div><p className="text-sm text-muted-foreground">Valor</p><p className="font-medium">R$ {viewingReceita.valor.toFixed(2).replace(".", ",")}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p><p className="font-medium">{viewingReceita.status}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Recebimento Mitigado */}
      <Dialog open={showRecebimento} onOpenChange={setShowRecebimento}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Recebimento Mitigado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Aluno</Label>
              <Select value={recebimentoForm.aluno} onValueChange={(v) => setRecebimentoForm({ ...recebimentoForm, aluno: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent>{mockStudents.map((s) => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Plano</Label>
              <Select value={recebimentoForm.plano} onValueChange={(v) => setRecebimentoForm({ ...recebimentoForm, plano: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensalidade">Mensalidade</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor (R$)</Label><Input type="number" value={recebimentoForm.valor} onChange={(e) => setRecebimentoForm({ ...recebimentoForm, valor: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRecebimento(false)}>Cancelar</Button>
              <Button onClick={handleRecebimento}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Revenue;
