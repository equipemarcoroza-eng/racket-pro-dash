import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockPlans, type Revenue as RevenueType } from "@/data/mockData";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";

const Revenue = () => {
  const { students, revenues: receitas, setRevenues: setReceitas } = useAppContext();
  const [filter, setFilter] = useState<string | null>(null);
  const [viewingReceita, setViewingReceita] = useState<RevenueType | null>(null);
  const [showRecebimento, setShowRecebimento] = useState(false);
  const [recebimentoForm, setRecebimentoForm] = useState({ aluno: "", valor: "", plano: "Mensalidade" });

  const filtered = filter ? receitas.filter((r) => r.plano === filter) : receitas;

  const gerarParcelas = () => {
    const now = new Date();
    const mes = String(now.getMonth() + 1).padStart(2, "0");
    const ano = now.getFullYear();
    const valorPadrao = mockPlans[0]?.valor ?? 120;
    const alunosAtivos = students.filter((s) => s.status === "Ativo");
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

  const handleBaixar = (r: RevenueType) => {
    setReceitas((prev) => prev.map((rec) => rec.id === r.id ? { ...rec, status: "Pago" } : rec));
    toast.success(`Pagamento de ${r.aluno} registrado`);
  };

  const handleIsentar = (r: RevenueType) => {
    setReceitas((prev) => prev.map((rec) => rec.id === r.id ? { ...rec, status: "Isento" } : rec));
    toast.success(`Isenção de ${r.aluno} registrada`);
  };

  const handleRecibo = async (r: RevenueType) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      // Logo
      try {
        doc.addImage("/src/assets/logo.png", "PNG", 85, 10, 40, 40);
      } catch (e) {
        console.error("Erro ao carregar o logotipo no PDF", e);
      }

      doc.setFontSize(22);
      doc.setTextColor(20, 40, 100);
      doc.text("Recibo de Pagamento", 105, 60, { align: "center" });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Equipe Marco Roza", 105, 70, { align: "center" });
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 80, 190, 80);
      
      doc.setFontSize(12);
      let y = 95;
      doc.text(`Aluno: ${r.aluno}`, 25, y); y += 10;
      doc.text(`Plano/Serviço: ${r.plano}`, 25, y); y += 10;
      doc.text(`Data de Vencimento: ${r.vencimento}`, 25, y); y += 10;
      doc.text(`Valor: R$ ${r.valor.toFixed(2).replace(".", ",")}`, 25, y); y += 10;
      doc.text(`Status: ${r.status}`, 25, y); y += 15;
      
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Este documento é um comprovante oficial de transação financeira.`, 105, y, { align: "center" }); y += 10;
      doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 105, y, { align: "center" });
      
      doc.setDrawColor(0, 0, 0);
      doc.line(65, 160, 145, 160);
      doc.text("Assinatura do Responsável", 105, 165, { align: "center" });
      
      doc.save(`recibo-${r.aluno.replace(/\s/g, "_")}-${Date.now()}.pdf`);
      toast.success("Recibo gerado com sucesso");
    } catch (err) {
      console.error("Falha ao gerar PDF", err);
      toast.error("Erro ao gerar o recibo em PDF");
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
                          <Button variant="outline" size="sm" onClick={() => handleBaixar(r)} disabled={r.status === "Pago" || r.status === "Isento"}>Baixar</Button>
                          <Button variant="outline" size="sm" onClick={() => handleIsentar(r)} disabled={r.status === "Pago" || r.status === "Isento"}>Isentar</Button>
                          <Button variant="outline" size="sm" onClick={() => handleRecibo(r)}>Recibo</Button>
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
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}</SelectContent>
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
