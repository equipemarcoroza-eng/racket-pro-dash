import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Revenue as RevenueType } from "@/data/mockData";
import { useAppContext } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const Revenue = () => {
  const { students, revenues: receitas, setRevenues: setReceitas, plans: mockPlans } = useAppContext();
  const [filter, setFilter] = useState<string | null>(null);
  const [viewingReceita, setViewingReceita] = useState<RevenueType | null>(null);
  const [editingReceita, setEditingReceita] = useState<RevenueType | null>(null);
  const [showRecebimento, setShowRecebimento] = useState(false);
  const [showAvulso, setShowAvulso] = useState(false);
  const [recebimentoForm, setRecebimentoForm] = useState({ aluno: "", valor: "", plano: "Mensalidade" });
  const [avulsoForm, setAvulsoForm] = useState({ aluno: "", alunoId: "", valor: "", plano: "Selecione um aluno", vencimento: new Date().toISOString().split("T")[0] });

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = sessionStorage.getItem("revenue_month");
    if (saved) { sessionStorage.removeItem("revenue_month"); return saved; }
    return String(now.getMonth() + 1).padStart(2, "0");
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = sessionStorage.getItem("revenue_year");
    if (saved) { sessionStorage.removeItem("revenue_year"); return saved; }
    return String(now.getFullYear());
  });

  const parseDate = (dateStr: string) => {
    const [d, m, y] = dateStr.split("/").map(Number);
    return new Date(y, m - 1, d);
  };

  // Extrair todos os meses/anos disponíveis que possuem registros
  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    receitas.forEach(r => {
      const parts = r.vencimento.split("/");
      if (parts.length === 3) {
        periods.add(`${parts[1]}/${parts[2]}`);
      }
    });

    // Adicionar mês atual se não existir
    periods.add(`${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`);

    return Array.from(periods).sort((a, b) => {
      const [ma, ya] = a.split("/").map(Number);
      const [mb, yb] = b.split("/").map(Number);
      return ya !== yb ? yb - ya : mb - ma; // Decrescente
    });
  }, [receitas]);

  const filtered = receitas
    .filter((r) => {
      const [dia, mes, ano] = r.vencimento.split("/");
      const matchesPeriod = mes === selectedMonth && ano === selectedYear;
      const matchesPlan = !filter || r.plano === filter;
      
      const student = students.find(s => s.id === r.alunoId || s.nome === r.aluno);
      const isEligible = student && ["Ativo", "Passado", "Extras"].includes(student.status);
      
      return matchesPeriod && matchesPlan && isEligible;
    })
    .sort((a, b) => a.aluno.localeCompare(b.aluno));

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
          alunoId: aluno.id,
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

  const handleEdit = (r: RevenueType) => {
    setEditingReceita({ ...r });
  };

  const handleSaveEdit = () => {
    if (!editingReceita) return;
    setReceitas((prev) => prev.map((rec) => rec.id === editingReceita.id ? editingReceita : rec));
    toast.success("Receita atualizada com sucesso");
    setEditingReceita(null);
  };

  const handleDelete = (r: RevenueType) => {
    if (window.confirm(`Deseja realmente excluir o registro de ${r.aluno}?`)) {
      setReceitas((prev) => prev.filter((rec) => rec.id !== r.id));
      toast.success("Registro excluído");
    }
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
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear());
    const venc = `${day}/${month}/${year}`;
    const aluno = students.find(s => s.nome === recebimentoForm.aluno);
    setReceitas((prev) => [...prev, { id: crypto.randomUUID(), alunoId: aluno?.id, aluno: recebimentoForm.aluno, plano: recebimentoForm.plano, vencimento: venc, valor: Number(recebimentoForm.valor), status: "Pago" }]);

    // Atualizar filtro para o mês do lançamento
    setSelectedMonth(month);
    setSelectedYear(year);
    toast.success("Recebimento registrado");
    setShowRecebimento(false);
    setRecebimentoForm({ aluno: "", valor: "", plano: "Mensalidade" });
  };

  const handleAvulso = async () => {
    if (!avulsoForm.aluno || !avulsoForm.valor || !avulsoForm.vencimento) { toast.error("Preencha todos os campos"); return; }

    // Converter YYYY-MM-DD para DD/MM/YYYY com padding garantido
    const [y, m, d] = avulsoForm.vencimento.split("-");
    const day = d.padStart(2, "0");
    const month = m.padStart(2, "0");
    const year = y;
    const vencIso = `${year}-${month}-${day}`;

    const dbRecord = {
      id: crypto.randomUUID(),
      aluno_id: avulsoForm.alunoId || null,
      aluno_nome: avulsoForm.aluno,
      plano_nome: avulsoForm.plano,
      vencimento: vencIso,
      valor: Number(avulsoForm.valor),
      status: "Gerada",
    };

    // INSERT direto no Supabase
    const { data: insertData, error } = await supabase.from("revenues").insert(dbRecord).select();

    if (error) {
      toast.error(`ERRO DO BANCO: ${error.message} (código: ${error.code})`, { duration: 10000 });
      console.error("Supabase insert error completo:", JSON.stringify(error));
      return;
    }

    // VERIFICAÇÃO: ler o registro de volta para confirmar que foi salvo
    const { data: verify } = await supabase.from("revenues").select("*").eq("id", dbRecord.id);

    if (!verify || verify.length === 0) {
      toast.error("⚠️ O banco de dados REJEITOU SILENCIOSAMENTE o registro (RLS). O insert retornou sucesso mas o dado NÃO foi salvo. Verifique as políticas de segurança (RLS) no Supabase.", { duration: 15000 });
      console.error("RLS Silent Rejection! Insert returned:", insertData, "but verify returned:", verify);
      return;
    }

    toast.success(`✅ CONFIRMADO no banco! Registro ${dbRecord.id.substring(0, 8)} verificado.`, { duration: 5000 });

    // Salvar período selecionado para restaurar após reload
    sessionStorage.setItem("revenue_month", month);
    sessionStorage.setItem("revenue_year", year);

    // Recarregar a página para garantir exibição correta
    setTimeout(() => window.location.reload(), 1000);
  };

  // Métricas do Período Selecionado
  const monthTag = `/${selectedMonth}/${selectedYear}`;

  const receitasMes = receitas.filter(r => {
    const [dia, mes, ano] = r.vencimento.split("/");
    const matchesPeriod = mes === selectedMonth && ano === selectedYear;
    if (!matchesPeriod) return false;

    const student = students.find(s => s.id === r.alunoId || s.nome === r.aluno);
    return student && ["Ativo", "Passado", "Extras"].includes(student.status);
  });

  const totalFaturadoMes = receitasMes
    .filter(r => r.status !== "Isento")
    .reduce((acc, r) => acc + r.valor, 0);

  const totalPagoMes = receitasMes
    .filter(r => r.status === "Pago")
    .reduce((acc, r) => acc + r.valor, 0);

  const totalAReceberMes = receitasMes
    .filter(r => r.status === "Gerada" || r.status === "Em atraso")
    .reduce((acc, r) => acc + r.valor, 0);

  const chartData = [
    { name: "Faturado", valor: totalFaturadoMes, color: "#3b82f6" },
    { name: "Pago", valor: totalPagoMes, color: "#22c55e" },
    { name: "A Receber", valor: totalAReceberMes, color: "#f59e0b" }
  ];

  // Processamento de subtotais detalhados por dia do mês corrente
  const subtotaisPorDia = receitasMes.reduce((acc, curr) => {
    const data = curr.vencimento;
    if (!acc[data]) acc[data] = { faturado: 0, pago: 0, aReceber: 0 };

    if (curr.status !== "Isento") acc[data].faturado += curr.valor;
    if (curr.status === "Pago") acc[data].pago += curr.valor;
    if (curr.status === "Gerada" || curr.status === "Em atraso") acc[data].aReceber += curr.valor;

    return acc;
  }, {} as Record<string, { faturado: number, pago: number, aReceber: number }>);

  const datasMesOrdenadas = Object.keys(subtotaisPorDia).sort((a, b) => {
    const [da] = a.split("/").map(Number);
    const [db] = b.split("/").map(Number);
    return da - db;
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

      {/* 2. Resumo (Visão Geral) */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-primary font-medium">Resumo</p>
              <p className="text-xl font-bold">Visão Geral do Período</p>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">Filtrar Período:</Label>
              <Select
                value={`${selectedMonth}/${selectedYear}`}
                onValueChange={(v) => {
                  const [m, y] = v.split("/");
                  setSelectedMonth(m);
                  setSelectedYear(y);
                }}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map(p => {
                    const [m, y] = p.split("/");
                    const date = new Date(Number(y), Number(m) - 1, 1);
                    const label = date.toLocaleString("pt-BR", { month: "long", year: "numeric" });
                    return (
                      <SelectItem key={p} value={p}>
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subtotais em Destaque */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-primary/5 border-l-4 border-primary p-5 rounded-lg shadow-sm">
              <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Total Faturado</p>
              <p className="text-3xl font-black">R$ {totalFaturadoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">Total gerado (exceto isenções) no mês.</p>
            </div>
            <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-lg shadow-sm">
              <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">Total Pago</p>
              <p className="text-3xl font-black text-green-600">R$ {totalPagoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">Total baixado e confirmado no mês.</p>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded-lg shadow-sm">
              <p className="text-xs text-orange-700 font-bold uppercase tracking-wider mb-1">Total a Receber</p>
              <p className="text-3xl font-black text-orange-600">R$ {totalAReceberMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium">Pendentes ou em atraso no mês.</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="h-[320px] border rounded-xl p-5 bg-card shadow-sm">
              <p className="text-sm font-bold text-muted-foreground mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Comparativo Financeiro ({selectedMonth}/{selectedYear})
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(value) => `R$ ${value}`} />
                  <RechartTooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Valor"]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[320px] border rounded-xl p-5 bg-card shadow-sm">
              <p className="text-sm font-bold text-muted-foreground mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Composição de Receita ({selectedMonth}/{selectedYear})
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="valor"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
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

          {datasMesOrdenadas.length > 0 && (
            <div className="mt-8 pt-8 border-t border-dashed">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subtotais por Vencimento ({selectedMonth}/{selectedYear})</p>
                <Badge variant="outline" className="text-[10px] font-medium text-blue-600 bg-blue-50 border-blue-100">Visão Detalhada Diária</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {datasMesOrdenadas.map(data => {
                  const sub = subtotaisPorDia[data];
                  return (
                    <div key={data} className="flex flex-col gap-2 border rounded-xl px-4 py-3 bg-card shadow-sm hover:border-primary/30 transition-all group">
                      <div className="flex justify-between items-center border-b pb-1 mb-1">
                        <span className="text-[11px] font-black text-primary">{data}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground">Faturado:</span>
                          <span className="font-bold text-foreground">R$ {sub.faturado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground">Pago:</span>
                          <span className="font-bold text-green-600">R$ {sub.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground font-semibold">A Receber:</span>
                          <span className="font-bold text-blue-600">R$ {sub.aReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Lista de Receitas */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-primary font-medium">Lista de Receitas</p>
              <p className="text-xl font-bold">Mensalidades e planos ({selectedMonth}/{selectedYear})</p>
              <p className="text-xs text-muted-foreground mt-1">Registros em ordem alfabética de Alunos.</p>
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
                      <Button variant="outline" size="sm" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" onClick={() => handleEdit(r)}>Editar</Button>
                      <Button variant="outline" size="sm" onClick={() => handleBaixar(r)} disabled={r.status === "Pago" || r.status === "Isento"}>Baixar</Button>
                      <Button variant="outline" size="sm" onClick={() => handleIsentar(r)} disabled={r.status === "Pago" || r.status === "Isento"}>Isentar</Button>
                      <Button variant="outline" size="sm" onClick={() => handleRecibo(r)}>Recibo</Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r)}>Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

      {/* Dialog Editar */}
      <Dialog open={!!editingReceita} onOpenChange={(open) => !open && setEditingReceita(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Receita</DialogTitle></DialogHeader>
          {editingReceita && (
            <div className="space-y-4">
              <div>
                <Label>Aluno</Label>
                <Input value={editingReceita.aluno} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Plano</Label>
                <Input value={editingReceita.plano} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Vencimento (DD/MM/YYYY)</Label>
                <Input
                  value={editingReceita.vencimento}
                  onChange={(e) => setEditingReceita({ ...editingReceita, vencimento: e.target.value })}
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  value={editingReceita.valor}
                  onChange={(e) => setEditingReceita({ ...editingReceita, valor: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editingReceita.status}
                  onValueChange={(v) => setEditingReceita({ ...editingReceita, status: v as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gerada">Gerada</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Isento">Isento</SelectItem>
                    <SelectItem value="Em atraso">Em atraso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingReceita(null)}>Cancelar</Button>
                <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
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
                setAvulsoForm({ ...avulsoForm, aluno: v, alunoId: aluno?.id || "", plano: plano?.nome || "Sem plano" });
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
