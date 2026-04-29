import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import type { Expense, ScheduledPayment } from "@/data/mockData";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import { useEffect } from "react";
import { Printer } from "lucide-react";
import logo from "@/assets/logo.png";

const periodos = ["Mês Atual", "Mês Anterior", "Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses", "Últimos 24 meses", "Últimos 36 meses", "Últimos 48 meses"];

const Expenses = () => {
  const {
    schedule,
    enrollments,
    students,
    scheduledPayments: payments,
    setScheduledPayments: setPayments,
    expenseCategories: categories,
    setExpenseCategories: setCategories,
  } = useAppContext();
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("Mês Atual");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<ScheduledPayment | null>(null);
  const [expenseForm, setExpenseForm] = useState<{ id: string; fornecedor: string; valor: string; categoria: string; vencimento: string; status: "Em Aberto" | "Pago" }>({ id: "", fornecedor: "", valor: "", categoria: "", vencimento: "", status: "Em Aberto" });
  const [categoryForm, setCategoryForm] = useState({ categoria: "", valor: "" });

  // Métricas do Período Selecionado
  const periodMetrics = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    let startDate = new Date(curYear, curMonth, 1);
    let endDate = new Date(curYear, curMonth + 1, 0);

    if (periodo === "Mês Anterior") {
      startDate = new Date(curYear, curMonth - 1, 1);
      endDate = new Date(curYear, curMonth, 0);
    } else if (periodo === "Últimos 3 meses") {
      startDate = new Date(curYear, curMonth - 2, 1);
    } else if (periodo === "Últimos 6 meses") {
      startDate = new Date(curYear, curMonth - 5, 1);
    } else if (periodo === "Últimos 12 meses") {
      startDate = new Date(curYear, curMonth - 11, 1);
    } else if (periodo === "Últimos 24 meses") {
      startDate = new Date(curYear, curMonth - 23, 1);
    } else if (periodo === "Últimos 36 meses") {
      startDate = new Date(curYear, curMonth - 35, 1);
    } else if (periodo === "Últimos 48 meses") {
      startDate = new Date(curYear, curMonth - 47, 1);
    }

    const filteredPayments = payments.filter(p => {
      if (!p.vencimento) return false;
      const [y, m, d] = p.vencimento.split("-").map(Number);
      const vDate = new Date(y, m - 1, d);
      return vDate >= startDate && vDate <= endDate;
    });

    const totalLancado = filteredPayments.reduce((acc, curr) => acc + curr.valor, 0);
    const totalPago = filteredPayments.filter(p => p.status === "Pago").reduce((acc, curr) => acc + curr.valor, 0);
    const totalPendente = filteredPayments.filter(p => p.status === "Em Aberto").reduce((acc, curr) => acc + curr.valor, 0);

    const chartData = [
      { name: "Total Lançado", valor: totalLancado, color: "#3b82f6" },
      { name: "Total Pago", valor: totalPago, color: "#22c55e" },
      { name: "Total Pendente", valor: totalPendente, color: "#ef4444" }
    ];

    const pieData = [
      { name: "Pago", value: totalPago, color: "#22c55e" },
      { name: "Pendente", value: totalPendente, color: "#ef4444" }
    ];

    return { totalLancado, totalPago, totalPendente, chartData, pieData, startDate, endDate };
  }, [payments, periodo]);

  const totalCategorias = categories.reduce((a, b) => a + b.valor, 0);
  const totalPagamentos = payments.reduce((a, b) => a + b.valor, 0);
  const totalPendentes = payments.filter(p => p.status === "Em Aberto").reduce((a, b) => a + b.valor, 0);
  const totalPagas = payments.filter(p => p.status === "Pago").reduce((a, b) => a + b.valor, 0);

  const calculateRent = () => {
    const activeStudentIds = new Set(students.filter(s => s.status === "Ativo").map(s => s.id));
    const turmasComAlunosAtivos = schedule.filter(slot => {
      const enrols = enrollments.filter(e => e.turmaId === slot.id);
      return enrols.some(e => activeStudentIds.has(e.alunoId));
    });

    const groupA = turmasComAlunosAtivos.filter(s => {
      const h = parseInt(s.horario.split(":")[0]);
      return h >= 0 && h < 18;
    });
    const groupB = turmasComAlunosAtivos.filter(s => s.horario === "18:00");
    const groupC = turmasComAlunosAtivos.filter(s => ["19:00", "20:00"].includes(s.horario));

    return {
      a: { count: groupA.length, total: groupA.length * 120 },
      b: { count: groupB.length, total: groupB.length * 240 },
      c: { count: groupC.length, total: groupC.length * 320 },
      sum: (groupA.length * 120) + (groupB.length * 240) + (groupC.length * 320)
    };
  };

  const rentCalc = calculateRent();

  useEffect(() => {
    if (expenseForm.categoria === "Aluguel" && !expenseForm.id) {
      setExpenseForm(prev => ({ ...prev, valor: String(rentCalc.sum) }));
    }
  }, [expenseForm.categoria]);

  const totalPrevisto = totalPendentes; // Agora reflete apenas o pendente no período

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
        id: crypto.randomUUID(), 
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
    setCategories((prev) => [...prev, { id: crypto.randomUUID(), categoria: categoryForm.categoria, valor: Number(categoryForm.valor) || 0 }]);
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

  const handlePrintPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      // Logo
      try {
        doc.addImage(logo, "PNG", 85, 10, 40, 40);
      } catch (e) {
        console.error("Erro ao carregar o logotipo", e);
      }

      doc.setFontSize(22);
      doc.setTextColor(20, 40, 100);
      doc.text("Relatório de Contas a Pagar", 105, 60, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Resumo do Período: ${periodo}`, 105, 70, { align: "center" });

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 75, 190, 75);

      // Totais
      doc.setFontSize(11);
      doc.text(`Total Lançado: R$ ${periodMetrics.totalLancado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, 85);
      doc.text(`Total Pago: R$ ${periodMetrics.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, 92);
      doc.text(`Total Pendente: R$ ${periodMetrics.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, 99);

      // Tabela de Contas
      const tableData = payments
        .filter(p => {
          if (!p.vencimento) return false;
          const [y, m, d] = p.vencimento.split("-").map(Number);
          const vDate = new Date(y, m - 1, d);
          return vDate >= periodMetrics.startDate && vDate <= periodMetrics.endDate;
        })
        .map(p => [
          p.fornecedor,
          p.categoria,
          p.vencimento.split("-").reverse().join("/"),
          `R$ ${p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          p.status
        ]);

      autoTable(doc, {
        startY: 110,
        head: [["Fornecedor", "Categoria", "Vencimento", "Valor", "Status"]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [20, 40, 100] }
      });

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 285, { align: "center" });

      doc.save(`relatorio-contas-a-pagar-${Date.now()}.pdf`);
      toast.success("Relatório PDF gerado com sucesso");
    } catch (err) {
      console.error("Falha ao gerar PDF", err);
      toast.error("Erro ao gerar o relatório em PDF");
    }
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

      {/* 2. Resumo (Visão Geral) */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-primary font-medium">Resumo</p>
              <p className="text-xl font-bold">Visão Geral do Período</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {periodos.map((p) => (
                <Button key={p} variant={periodo === p ? "default" : "outline"} size="sm" onClick={() => setPeriodo(p)}>
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {/* Subtotais em Destaque */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-primary/5 border-l-4 border-primary p-5 rounded-lg shadow-sm">
              <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Total Lançado</p>
              <p className="text-3xl font-black">R$ {periodMetrics.totalLancado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">Todas as contas com vencimento no período.</p>
            </div>
            <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-lg shadow-sm">
              <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">Total Pago</p>
              <p className="text-3xl font-black text-green-600">R$ {periodMetrics.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">Contas liquidadas no período.</p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg shadow-sm">
              <p className="text-xs text-red-700 font-bold uppercase tracking-wider mb-1">Total Pendente</p>
              <p className="text-3xl font-black text-red-600">R$ {periodMetrics.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">Contas em aberto com vencimento no período.</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4">
            <div className="h-[320px] border rounded-xl p-5 bg-card shadow-sm">
              <p className="text-sm font-bold text-muted-foreground mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Comparativo de Despesas (Período)
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodMetrics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(value) => `R$ ${value}`} />
                  <RechartTooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Valor"]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={50}>
                    {periodMetrics.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[320px] border rounded-xl p-5 bg-card shadow-sm">
              <p className="text-sm font-bold text-muted-foreground mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Composição do Contas a Pagar (Período)
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={periodMetrics.pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {periodMetrics.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartTooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Valor"]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
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
        <div className="lg:col-span-2 space-y-6">
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
                {payments.filter(p => p.status === "Em Aberto").length === 0 && (
                  <div className="text-center py-6 text-muted-foreground italic border border-dashed rounded-lg">
                    Nenhuma conta pendente para este filtro.
                  </div>
                )}
              </div>
              <div className="mt-4 bg-secondary rounded-md p-3">
                <p className="text-sm text-muted-foreground">Total previsto no período</p>
                <p className="text-xl font-bold">R$ {totalPrevisto.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Contas Pagas no Período */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xl font-bold">Contas Pagas no Período</p>
                  <p className="text-sm text-muted-foreground">Histórico de contas liquidadas no período selecionado.</p>
                </div>
              </div>
              <div className="space-y-3">
                {payments.filter(p => {
                  if (p.status !== "Pago") return false;
                  if (!p.vencimento) return false;
                  const [y, m, d] = p.vencimento.split("-").map(Number);
                  const vDate = new Date(y, m - 1, d);
                  return vDate >= periodMetrics.startDate && vDate <= periodMetrics.endDate;
                }).length > 0 ? (
                  payments.filter(p => {
                    if (p.status !== "Pago") return false;
                    if (!p.vencimento) return false;
                    const [y, m, d] = p.vencimento.split("-").map(Number);
                    const vDate = new Date(y, m - 1, d);
                    return vDate >= periodMetrics.startDate && vDate <= periodMetrics.endDate;
                  }).map((p) => (
                    <div key={p.id} className="flex items-center justify-between border rounded-md p-3 group bg-muted/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground line-through">{p.fornecedor}</span>
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">PAGO</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{p.categoria}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold mr-2 text-muted-foreground">R$ {p.valor.toLocaleString("pt-BR")}</span>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setViewingPayment(p)}>Visualizar</Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg italic">
                    Nenhuma conta paga encontrada para o período selecionado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-xl font-bold">Resumo Geral</p>
            <div className="border rounded-md p-3 flex justify-between">
              <span className="text-sm">Pagamentos Totais (Geral)</span>
              <span className="font-semibold">R$ {totalPagamentos.toLocaleString("pt-BR")}</span>
            </div>
            <div className="border rounded-md p-3 flex justify-between bg-orange-50/50">
              <span className="text-sm font-medium text-orange-700">Contas Pendentes</span>
              <span className="font-bold text-orange-700">R$ {totalPendentes.toLocaleString("pt-BR")}</span>
            </div>
            <div className="border rounded-md p-3 flex justify-between bg-green-50/50">
              <span className="text-sm font-medium text-green-700">Contas Pagas</span>
              <span className="font-bold text-green-700">R$ {totalPagas.toLocaleString("pt-BR")}</span>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={handlePrintPDF}>
              <Printer className="h-4 w-4" /> Imprimir (PDF)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nova Despesa */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Categoria</Label>
              <Select value={expenseForm.categoria} onValueChange={(v) => setExpenseForm({ ...expenseForm, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.categoria}>{c.categoria}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fornecedor</Label><Input value={expenseForm.fornecedor} onChange={(e) => setExpenseForm({ ...expenseForm, fornecedor: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor (R$)</Label><Input type="number" value={expenseForm.valor} onChange={(e) => setExpenseForm({ ...expenseForm, valor: e.target.value })} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={expenseForm.vencimento} onChange={(e) => setExpenseForm({ ...expenseForm, vencimento: e.target.value })} /></div>
            </div>

            {expenseForm.categoria === "Aluguel" && (
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Cálculo Auxiliar (Aluguel)</p>
                <div className="flex justify-between text-xs">
                  <span>Grupo A (07h-18h): {rentCalc.a.count} turmas x R$ 120</span>
                  <span className="font-semibold">R$ {rentCalc.a.total}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Grupo B (18h): {rentCalc.b.count} turmas x R$ 240</span>
                  <span className="font-semibold">R$ {rentCalc.b.total}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Grupo C (19h-20h): {rentCalc.c.count} turmas x R$ 320</span>
                  <span className="font-semibold">R$ {rentCalc.c.total}</span>
                </div>
                <div className="border-t pt-1 flex justify-between text-sm font-bold">
                  <span>Total Sugerido</span>
                  <span className="text-primary">R$ {rentCalc.sum}</span>
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-1">* Apenas turmas com alunos ativos são contabilizadas.</p>
              </div>
            )}
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
