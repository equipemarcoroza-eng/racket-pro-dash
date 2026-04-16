import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockExpenseCategories, mockScheduledPayments, type Expense, type ScheduledPayment } from "@/data/mockData";
import { toast } from "sonner";

const Expenses = () => {
  const [categories, setCategories] = useState<Expense[]>(mockExpenseCategories);
  const [payments, setPayments] = useState<ScheduledPayment[]>(mockScheduledPayments);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<ScheduledPayment | null>(null);
  const [expenseForm, setExpenseForm] = useState({ id: "", fornecedor: "", valor: "", categoria: "", vencimento: "", status: "Em Aberto" as const });
  const [categoryForm, setCategoryForm] = useState({ categoria: "", valor: "" });

  const totalCategorias = categories.reduce((a, b) => a + b.valor, 0);
  const totalPagamentos = payments.reduce((a, b) => a + b.valor, 0);
  const totalPrevisto = totalCategorias + totalPagamentos;

  const filteredCategories = catFilter ? categories.filter((c) => c.categoria === catFilter) : categories;

  const handleAddExpense = () => {
    if (!expenseForm.fornecedor || !expenseForm.valor || !expenseForm.vencimento) { toast.error("Preencha todos os campos obrigatórios"); return; }
    
    if (expenseForm.id) {
      setPayments((prev) => prev.map((p) => p.id === expenseForm.id ? { 
        ...p, 
        fornecedor: expenseForm.fornecedor, 
        valor: Number(expenseForm.valor), 
        categoria: expenseForm.categoria || "Outros",
        vencimento: expenseForm.vencimento
      } : p));
      toast.success("Pagamento atualizado");
    } else {
      setPayments((prev) => [...prev, { 
        id: String(Date.now()), 
        fornecedor: expenseForm.fornecedor, 
        valor: Number(expenseForm.valor), 
        categoria: expenseForm.categoria || "Outros",
        vencimento: expenseForm.vencimento,
        status: "Em Aberto"
      }]);
      toast.success("Despesa adicionada");
    }
    
    setShowExpenseForm(false);
    setExpenseForm({ id: "", fornecedor: "", valor: "", categoria: "", vencimento: "", status: "Em Aberto" });
  };

  const handlePay = (id: string) => {
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: "Pago" } : p));
    toast.success("Baixa realizada com sucesso");
  };

  const openEdit = (p: ScheduledPayment) => {
    setExpenseForm({
      id: p.id,
      fornecedor: p.fornecedor,
      valor: String(p.valor),
      categoria: p.categoria,
      vencimento: p.vencimento,
      status: p.status
    });
    setShowExpenseForm(true);
  };

  const handleAddCategory = () => {
    if (!categoryForm.categoria) { toast.error("Nome da categoria é obrigatório"); return; }
    setCategories((prev) => [...prev, { id: String(Date.now()), categoria: categoryForm.categoria, valor: Number(categoryForm.valor) || 0 }]);
    toast.success("Categoria adicionada");
    setShowCategoryForm(false);
    setCategoryForm({ categoria: "", valor: "" });
  };

  const handleDeletePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    toast.success("Pagamento removido");
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Categoria removida");
  };

  const handleReport = () => {
    const headers = ["Categoria", "Valor"];
    const rows = categories.map((c) => [c.categoria, String(c.valor)]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-despesas.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Contas a Pagar</CardTitle>
            <p className="text-sm text-muted-foreground">Controle de custos operacionais e pagamentos a terceiros.</p>
          </div>
          <Button onClick={() => setShowExpenseForm(true)}>Nova Despesa</Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <Button key={c.id} variant={catFilter === c.categoria ? "default" : "outline"} size="sm" onClick={() => setCatFilter(catFilter === c.categoria ? null : c.categoria)}>{c.categoria}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Previsto", value: `R$ ${totalPrevisto.toLocaleString("pt-BR")}` },
          { label: "Pendências", value: `${payments.length} pagamentos` },
          { label: "Fornecedores Ativos", value: `${new Set(payments.map((p) => p.fornecedor)).size} contatos` },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold mt-1">{item.value}</p>
              <Progress value={totalPrevisto > 0 ? (totalPagamentos / totalPrevisto) * 100 : 0} className="mt-3" />
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
            <Button variant="outline" onClick={() => setShowCategoryForm(true)}>Adicionar Categoria</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="border rounded-md p-4 group relative">
                <p className="text-sm text-muted-foreground">{cat.categoria}</p>
                <p className="text-xl font-bold">R$ {cat.valor.toLocaleString("pt-BR")}</p>
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs" onClick={() => handleDeleteCategory(cat.id)}>✕</Button>
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
                  <p className="text-xl font-bold">Contas a Pagar</p>
                  <p className="text-sm text-muted-foreground">Contas pendentes de pagamento.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setExpenseForm({ id: "", fornecedor: "", valor: "", categoria: "", vencimento: "", status: "Em Aberto" }); setShowExpenseForm(true); }}>Novo pagamento</Button>
              </div>
              <div className="space-y-3">
                {payments.filter(p => p.status === "Em Aberto").map((p) => (
                  <div key={p.id} className="flex items-center justify-between border rounded-md p-3 group">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.fornecedor}</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">Venc. {p.vencimento ? p.vencimento.split('-').reverse().join('/') : "—"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{p.categoria}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold mr-2">R$ {p.valor.toLocaleString("pt-BR")}</span>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setViewingPayment(p)}>Visualizar</Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => openEdit(p)}>Editar</Button>
                        <Button variant="default" size="sm" className="h-7 px-2 text-[10px] bg-green-600 hover:bg-green-700" onClick={() => handlePay(p.id)}>Baixa</Button>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-xs h-7 w-7 p-0" onClick={() => handleDeletePayment(p.id)}>✕</Button>
                    </div>
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
              <span className="text-sm">Categorias</span>
              <span className="font-semibold">R$ {totalCategorias.toLocaleString("pt-BR")}</span>
            </div>
            <div className="border rounded-md p-3 flex justify-between">
              <span className="text-sm">Pagamentos</span>
              <span className="font-semibold">R$ {totalPagamentos.toLocaleString("pt-BR")}</span>
            </div>
            <Button variant="outline" className="w-full" onClick={handleReport}>Gerar Relatório</Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nova Despesa */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Fornecedor</Label><Input value={expenseForm.fornecedor} onChange={(e) => setExpenseForm({ ...expenseForm, fornecedor: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor (R$)</Label><Input type="number" value={expenseForm.valor} onChange={(e) => setExpenseForm({ ...expenseForm, valor: e.target.value })} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={expenseForm.vencimento} onChange={(e) => setExpenseForm({ ...expenseForm, vencimento: e.target.value })} /></div>
            </div>
            <div><Label>Categoria</Label>
              <Select value={expenseForm.categoria} onValueChange={(v) => setExpenseForm({ ...expenseForm, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.categoria}>{c.categoria}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowExpenseForm(false); setExpenseForm({ id: "", fornecedor: "", valor: "", categoria: "", vencimento: "", status: "Em Aberto" }); }}>Cancelar</Button>
              <Button onClick={handleAddExpense}>{expenseForm.id ? "Atualizar" : "Salvar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar Pagamento */}
      <Dialog open={!!viewingPayment} onOpenChange={(open) => !open && setViewingPayment(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes da Conta</DialogTitle></DialogHeader>
          {viewingPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground uppercase font-bold">Fornecedor</p><p className="font-medium text-lg">{viewingPayment.fornecedor}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase font-bold">Categoria</p><p className="font-medium text-lg">{viewingPayment.categoria}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase font-bold">Valor</p><p className="font-bold text-xl text-primary">R$ {viewingPayment.valor.toLocaleString("pt-BR")}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase font-bold">Vencimento</p><p className="font-medium text-lg">{viewingPayment.vencimento ? viewingPayment.vencimento.split('-').reverse().join('/') : "—"}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase font-bold">Status</p><p className="font-medium text-lg uppercase text-orange-500">{viewingPayment.status}</p></div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setViewingPayment(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Nova Categoria */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome da categoria</Label><Input value={categoryForm.categoria} onChange={(e) => setCategoryForm({ ...categoryForm, categoria: e.target.value })} /></div>
            <div><Label>Valor inicial (R$)</Label><Input type="number" value={categoryForm.valor} onChange={(e) => setCategoryForm({ ...categoryForm, valor: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCategoryForm(false)}>Cancelar</Button>
              <Button onClick={handleAddCategory}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
