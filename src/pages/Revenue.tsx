import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Revenue as RevenueType } from "@/data/mockData";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Revenue = () => {
  const { students, revenues: receitas, setRevenues: setReceitas, plans: mockPlans } = useAppContext();
  const [filter, setFilter] = useState<string | null>(null);
  const [viewingReceita, setViewingReceita] = useState<RevenueType | null>(null);
  const [showRecebimento, setShowRecebimento] = useState(false);
  const [showAvulso, setShowAvulso] = useState(false);
  const [recebimentoForm, setRecebimentoForm] = useState({ aluno: "", valor: "", plano: "Mensalidade" });
  const [avulsoForm, setAvulsoForm] = useState({ aluno: "", valor: "", plano: "Selecione um aluno", vencimento: new Date().toISOString().split("T")[0] });

  const filtered = (filter ? receitas.filter((r) => r.plano === filter) : [...receitas]).sort((a, b) => a.aluno.localeCompare(b.aluno));

  const parseDate = (dateStr: string) => {
    const [d, m, y] = dateStr.split("/").map(Number);
    return new Date(y, m - 1, d);
  };

  const gerarParcelas = () => {
    const now = new Date();
    const targetMonth = now.getMonth() + 1;
    const targetYear = now.getFullYear();
    const targetTotalMonths = targetYear * 12 + targetMonth;
    
    const alunosAtivos = students.filter((s) => s.status === "Ativo");
    let count = 0;
    const novas: RevenueType[] = [];

    for (const aluno of alunosAtivos) {
      const plano = mockPlans.find((p) => p.id === aluno.planoId);
      if (!plano) continue;

      // 1. Verificação de duplicidade para o mês atual (específica por plano)
      const mesFormatado = String(targetMonth).padStart(2, "0");
      const jaExisteEsteMes = receitas.some(
        (r) => r.aluno === aluno.nome && 
               r.plano === plano.nome && 
               r.vencimento.includes(`/${mesFormatado}/${targetYear}`)
      );
      if (jaExisteEsteMes) continue;

      // 2. Encontrar última parcela gerada para este aluno (específica para este plano)
      const parcelasAluno = receitas
        .filter((rec) => rec.aluno === aluno.nome && rec.plano === plano.nome)
        .map((rec) => ({ ...rec, date: parseDate(rec.vencimento) }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      const ultimaParcela = parcelasAluno[0];
      let deveGerar = false;

      if (!ultimaParcela) {
        deveGerar = true;
      } else {
        const lastMonth = ultimaParcela.date.getMonth() + 1;
        const lastYear = ultimaParcela.date.getFullYear();
        const lastTotalMonths = lastYear * 12 + lastMonth;
        const diffMonths = targetTotalMonths - lastTotalMonths;

        const periodicity = plano.periodicidade;
        if (periodicity === "Mensal" && diffMonths >= 1) deveGerar = true;
        else if (periodicity === "Trimestral" && diffMonths >= 3) deveGerar = true;
        else if (periodicity === "Semestral" && diffMonths >= 6) deveGerar = true;
        else if (periodicity === "Anual" && diffMonths >= 12) deveGerar = true;
      }

      if (deveGerar) {
        let dia = aluno.vencimento;
        if (targetMonth === 2 && (dia === "29" || dia === "30" || dia === "31")) {
          // Ajuste básico para Fevereiro
          dia = "28";
        }
        const vencimento = `${dia.padStart(2, "0")}/${mesFormatado}/${targetYear}`;
        
        novas.push({ 
          id: crypto.randomUUID(), 
          aluno: aluno.nome, 
          plano: plano.nome, 
          vencimento, 
          valor: plano.valor, 
          status: "Gerada" 
        });
        count++;
      }
    }

    if (count > 0) {
      setReceitas((prev) => [...prev, ...novas]);
      toast.success(`${count} parcela(s) gerada(s) para ${String(targetMonth).padStart(2, "0")}/${targetYear}`);
    } else {
      toast.info("Nenhuma nova parcela pendente para geração baseada na periodicidade.");
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
        doc.addImage(logo, "PNG", 85, 10, 40, 40);
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

  const handleAvulso = () => {
    if (!avulsoForm.aluno || !avulsoForm.valor || !avulsoForm.vencimento) { toast.error("Preencha todos os campos"); return; }
    
    // Converter YYYY-MM-DD para DD/MM/YYYY
    const [y, m, d] = avulsoForm.vencimento.split("-");
    const venc = `${d}/${m}/${y}`;
    
    setReceitas((prev) => [...prev, { id: crypto.randomUUID(), aluno: avulsoForm.aluno, plano: avulsoForm.plano, vencimento: venc, valor: Number(avulsoForm.valor), status: "Gerada" }]);
    toast.success("Recebível avulso gerado");
    setShowAvulso(false);
    setAvulsoForm({ aluno: "", valor: "", plano: "Selecione um aluno", vencimento: new Date().toISOString().split("T")[0] });
  };

  const totalPago = receitas.filter((r) => r.status === "Pago").reduce((a, b) => a + b.valor, 0);
  const totalAtrasado = receitas.filter((r) => r.status === "Em atraso").reduce((a, b) => a + b.valor, 0);
  const totalAReceber = receitas.filter((r) => r.status === "Gerada" || r.status === "Em atraso").reduce((a, b) => a + b.valor, 0);

  const aReceberPorData = receitas
    .filter((r) => r.status === "Gerada" || r.status === "Em atraso")
    .reduce((acc, curr) => {
      const data = curr.vencimento;
      acc[data] = (acc[data] || 0) + curr.valor;
      return acc;
    }, {} as Record<string, number>);

  const datasOrdenadas = Object.keys(aReceberPorData).sort((a, b) => {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
  });

  const parcelasGeradas = receitas.filter(r => r.status === "Gerada");
  const alunosComGerada = new Set(parcelasGeradas.map(r => r.aluno)).size;
  const valorGerado = parcelasGeradas.reduce((a, b) => a + b.valor, 0);

  const totalTaxaMatricula = receitas.filter(r => r.plano === "Taxa de Matrícula").reduce((a, b) => a + b.valor, 0);
  const totalPlanos = receitas.filter(r => r.plano !== "Taxa de Matrícula").reduce((a, b) => a + b.valor, 0);
  const totalIsentos = receitas.filter(r => r.status === "Isento").reduce((a, b) => a + b.valor, 0);

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
            <Button variant="secondary" onClick={gerarParcelas}>Gerar Parcelas do Mês</Button>
            <Button variant="outline" onClick={() => setShowAvulso(true)}>Gerar Recebível Avulso</Button>
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
                  {["Mensalidade", "Trimestral", "Semestral", "Anual"].map((f) => (
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
              <p className="text-sm text-muted-foreground">Taxa de Matrícula (Total)</p>
              <p className="text-xl font-bold">R$ {totalTaxaMatricula.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-muted-foreground">Mensalidades e Planos</p>
              <p className="text-xl font-bold">R$ {totalPlanos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-muted-foreground">Total Isenções</p>
              <p className="text-xl font-bold text-muted-foreground">R$ {totalIsentos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border border-b-0 border-x-0 border-t-2 my-2" />

            <div className="border flex flex-col gap-1 rounded-md p-3 bg-secondary/30">
              <p className="text-sm text-muted-foreground">Parcelas Geradas ({alunosComGerada} alunos)</p>
              <p className="text-xl font-bold text-orange-600">R$ {valorGerado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-muted-foreground">Total a receber</p>
              <p className="text-xl font-bold text-blue-600">R$ {totalAReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              
              {datasOrdenadas.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Por Vencimento:</p>
                  {datasOrdenadas.map(data => (
                    <div key={data} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{data}:</span>
                      <span className="font-semibold text-blue-600">R$ {aReceberPorData[data].toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
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
                <SelectContent>{[...students].sort((a, b) => a.nome.localeCompare(b.nome)).map((s) => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Plano</Label>
              <Select value={recebimentoForm.plano} onValueChange={(v) => setRecebimentoForm({ ...recebimentoForm, plano: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensalidade">Mensalidade</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
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

      {/* Dialog Recebível Avulso */}
      <Dialog open={showAvulso} onOpenChange={setShowAvulso}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gerar Recebível Avulso</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Esta ação criará uma cobrança com status "Gerada", que aparecerá no total a receber.</p>
            <div><Label>Aluno</Label>
              <Select value={avulsoForm.aluno} onValueChange={(v) => {
                const aluno = students.find(s => s.nome === v);
                const plano = mockPlans.find(p => p.id === aluno?.planoId);
                setAvulsoForm({ ...avulsoForm, aluno: v, plano: plano?.nome || "Sem plano" });
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent>{[...students].sort((a, b) => a.nome.localeCompare(b.nome)).map((s) => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Plano contratado</Label>
              <Input value={avulsoForm.plano} readOnly className="bg-muted" />
            </div>
            <div><Label>Data de Vencimento</Label>
              <Input type="date" value={avulsoForm.vencimento} onChange={(e) => setAvulsoForm({ ...avulsoForm, vencimento: e.target.value })} />
            </div>
            <div><Label>Valor (R$)</Label><Input type="number" value={avulsoForm.valor} onChange={(e) => setAvulsoForm({ ...avulsoForm, valor: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAvulso(false)}>Cancelar</Button>
              <Button onClick={handleAvulso}>Gerar Cobrança</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Revenue;
