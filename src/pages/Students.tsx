// Gestão de Alunos - Fix para visibilidade de dados históricos
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/data/mockData";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import { Printer, Trash2 } from "lucide-react";
import logo from "@/assets/logo.png";

const categorias = ["Infantil", "Juvenil", "Adulto"] as const;
const statuses = ["Ativo", "Inativo", "Em análise", "Passado", "Extras"] as const;

type FormState = {
  nome: string;
  whatsappAluno: string;
  responsavel: string;
  whatsappResponsavel: string;
  dataNascimento: string;
  sexo: Student["sexo"];
  dataEntrada: string;
  categoria: Student["categoria"];
  planoId: string;
  vencimento: string;
  status: Student["status"];
};

const emptyForm: FormState = {
  nome: "",
  whatsappAluno: "",
  responsavel: "",
  whatsappResponsavel: "",
  dataNascimento: "",
  sexo: "M",
  dataEntrada: new Date().toISOString().split("T")[0],
  categoria: "Infantil",
  planoId: "",
  vencimento: "",
  status: "Ativo",
};

// getPlanoNome agora usa o array `plans` do contexto (definido dentro do componente)

const statusVariant: Record<Student["status"], "default" | "secondary" | "destructive"> = {
  Ativo: "default",
  "Em análise": "secondary",
  Inativo: "destructive",
  Passado: "secondary",
  Extras: "secondary",
};

const getCategoryFromBirthDate = (birthDateStr: string): Student["categoria"] => {
  if (!birthDateStr) return "Infantil";
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age >= 7 && age <= 12) return "Infantil";
  if (age >= 13 && age <= 17) return "Juvenil";
  if (age > 17) return "Adulto";
  return "Infantil"; // Padrão se for menor que 7
};

const maskPhone = (value: string) => {
  if (!value) return "";
  const numeric = value.replace(/\D/g, "");
  if (numeric.length <= 10) {
    return numeric
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  } else {
    return numeric
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }
};

const Students = () => {
  const { 
    students, setStudents, 
    enrollments, setEnrollments, 
    setRevenues, revenues, 
    plans, attendanceLogs, 
    schedule: mockSchedule 
  } = useAppContext();
  
  const getPlanoNome = (planoId: string) => plans.find((p) => p.id === planoId)?.nome ?? "—";
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sexoFilter, setSexoFilter] = useState<Student["sexo"] | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // Estados para os novos relatórios financeiros e de frequência
  const [reportStudent, setReportStudent] = useState<Student | null>(null);
  const [reportType, setReportType] = useState<"finance" | "frequency" | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    
    return {
      start: formatDate(start),
      end: formatDate(now)
    };
  });

  const filtered = students.filter(
    (s) => 
      (!catFilter || s.categoria === catFilter) && 
      (!statusFilter || s.status === statusFilter) &&
      (!sexoFilter || s.sexo === sexoFilter)
  ).sort((a, b) => a.nome.localeCompare(b.nome));

  const toIsoDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/");
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return dateStr.split("T")[0];
  };

  const parseDateStr = (dateStr: string) => {
    const iso = toIsoDate(dateStr);
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita e removerá todos os dados vinculados.")) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success("Aluno removido com sucesso");
    }
  };

  const getStudentFinance = () => {
    if (!reportStudent) return { list: [], totals: { faturado: 0, pago: 0, aReceber: 0 } };
    
    const list = revenues.filter((r) => {
      // Filtrar por ID se disponível, senão por nome (legado/avulso)
      const matchesId = r.alunoId === reportStudent.id;
      const matchesName = r.aluno === reportStudent.nome;
      if (!matchesId && !matchesName) return false;

      // Comparação de datas robusta (YYYY-MM-DD strings)
      const vencimentoIso = toIsoDate(r.vencimento);
      return vencimentoIso >= dateRange.start && vencimentoIso <= dateRange.end;
    }).sort((a, b) => {
      const da = toIsoDate(a.vencimento);
      const db = toIsoDate(b.vencimento);
      return da.localeCompare(db);
    });

    const totals = list.reduce((acc, r) => {
      if (r.status !== "Isento") acc.faturado += r.valor;
      if (r.status === "Pago") acc.pago += r.valor;
      if (r.status === "Gerada" || r.status === "Em atraso") acc.aReceber += r.valor;
      return acc;
    }, { faturado: 0, pago: 0, aReceber: 0 });

    return { list, totals };
  };

  const getStudentFrequency = () => {
    if (!reportStudent) return [];
    
    return attendanceLogs
      .filter((l) => {
        if (l.alunoId !== reportStudent.id) return false;
        const logDate = toIsoDate(l.data);
        return logDate >= dateRange.start && logDate <= dateRange.end;
      })
      .map(l => {
        const slot = mockSchedule.find(s => s.id === l.turmaId);
        return { ...l, slotInfo: slot ? `${slot.horario} - ${slot.quadra}` : "Turma removida" };
      })
      .sort((a, b) => toIsoDate(a.data).localeCompare(toIsoDate(b.data)));
  };

  const handlePrintFinancePDF = async () => {
    if (!reportStudent) return;
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      
      doc.addImage(logo, "PNG", 85, 10, 40, 40);
      doc.setFontSize(18);
      doc.setTextColor(20, 40, 100);
      doc.text("Relatório Financeiro Individual", 105, 55, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Aluno: ${reportStudent.nome}`, 20, 65);
      doc.text(`Período: ${new Date(dateRange.start).toLocaleDateString('pt-BR')} até ${new Date(dateRange.end).toLocaleDateString('pt-BR')}`, 20, 72);
      
      const { list, totals } = getStudentFinance();
      
      doc.setFontSize(10);
      doc.text(`Total Faturado: R$ ${totals.faturado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 20, 82);
      doc.text(`Total Pago: R$ ${totals.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 80, 82);
      doc.text(`A Receber: R$ ${totals.aReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 140, 82);
      
      const tableData = list.map(r => [
        r.vencimento,
        r.plano,
        `R$ ${r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        r.status
      ]);
      
      autoTable(doc, {
        startY: 90,
        head: [["Vencimento", "Plano", "Valor", "Status"]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [20, 40, 100] }
      });
      
      doc.save(`financeiro-${reportStudent.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("PDF gerado com sucesso");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
    }
  };

  const handlePrintFrequencyPDF = async () => {
    if (!reportStudent) return;
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      
      doc.addImage(logo, "PNG", 85, 10, 40, 40);
      doc.setFontSize(18);
      doc.setTextColor(20, 40, 100);
      doc.text("Relatório de Frequência Individual", 105, 55, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Aluno: ${reportStudent.nome}`, 20, 65);
      doc.text(`Período: ${new Date(dateRange.start).toLocaleDateString('pt-BR')} até ${new Date(dateRange.end).toLocaleDateString('pt-BR')}`, 20, 72);
      
      const list = getStudentFrequency();
      const tableData = list.map(l => [
        new Date(l.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
        l.slotInfo,
        l.presente + (l.dataRealizacao ? ` (${new Date(l.dataRealizacao).toLocaleDateString('pt-BR', {timeZone: 'UTC'})})` : "")
      ]);
      
      autoTable(doc, {
        startY: 80,
        head: [["Data", "Turma / Horário", "Status"]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [20, 40, 100] }
      });
      
      doc.save(`frequencia-${reportStudent.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success("PDF gerado com sucesso");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s: Student) => {
    setEditingId(s.id);
    setForm({
      nome: s.nome,
      whatsappAluno: s.whatsappAluno,
      responsavel: s.responsavel,
      whatsappResponsavel: s.whatsappResponsavel,
      dataNascimento: s.dataNascimento,
      sexo: s.sexo,
      dataEntrada: s.dataEntrada,
      categoria: s.categoria,
      planoId: s.planoId,
      vencimento: s.vencimento,
      status: s.status,
    });
    setShowForm(true);
  };

  const vencimentoOptions = ["05", "10", "15", "20", "25", "30"];

  const handleSave = () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    if (!form.vencimento) { toast.error("Vencimento é obrigatório"); return; }

    if (editingId) {
      // Check if status is changing to Inativo
      const previous = students.find((s) => s.id === editingId);
      const becomingInactive = form.status === "Inativo" && previous?.status !== "Inativo";

      if (becomingInactive) {
        const alunoEnrollments = enrollments.filter((e) => e.alunoId === editingId);
        if (alunoEnrollments.length > 0) {
          setEnrollments((prev) => prev.filter((e) => e.alunoId !== editingId));
          toast.info(`Aluno inativado — ${alunoEnrollments.length} vaga(s) liberada(s) nas turmas.`);
        }
      }

      setStudents((prev) => prev.map((s) => s.id === editingId ? { ...s, ...form } : s));
      toast.success("Aluno atualizado com sucesso");
    } else {
      setStudents((prev) => [
        ...prev,
        { ...form, id: crypto.randomUUID() },
      ]);

      // Gerar Taxa de Matrícula automaticamente
      const now = new Date();
      const vencimento = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
      
      setRevenues((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          aluno: form.nome,
          plano: "Taxa de Matrícula",
          vencimento,
          valor: 32.90,
          status: "Gerada"
        }
      ]);

      toast.success("Aluno cadastrado com sucesso e Taxa de Matrícula gerada");
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };



  const handleExport = () => {
    const headers = ["Nome", "WhatsApp Aluno", "Responsável", "WhatsApp Responsável", "Data Nascimento", "Sexo", "Data Entrada", "Categoria", "Plano", "Vencimento", "Status"];
    const rows = filtered.map((s) => [
      s.nome, s.whatsappAluno, s.responsavel, s.whatsappResponsavel, s.dataNascimento, s.sexo, s.dataEntrada, s.categoria,
      getPlanoNome(s.planoId), s.vencimento, s.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alunos.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo CSV exportado");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Gestão de Alunos</CardTitle>
          <Button onClick={openNew}>Novo Aluno</Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-primary font-medium">Filtros de Lista</p>
              <p className="font-semibold">Refinar resultados</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setCatFilter(null); setStatusFilter(null); setSexoFilter(null); }}>Limpar filtros</Button>
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Categoria</p>
              <div className="flex gap-2">
                {categorias.map((c) => (
                  <Button key={c} variant={catFilter === c ? "default" : "outline"} size="sm" onClick={() => setCatFilter(catFilter === c ? null : c)}>{c}</Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Status</p>
              <div className="flex gap-2">
                {statuses.map((s) => (
                  <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(statusFilter === s ? null : s)}>{s}</Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Sexo</p>
              <div className="flex gap-2">
                {(["M", "F"] as const).map((s) => (
                  <Button key={s} variant={sexoFilter === s ? "default" : "outline"} size="sm" onClick={() => setSexoFilter(sexoFilter === s ? null : s)}>{s === "M" ? "M" : "F"}</Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-primary font-medium">Cadastro rápido</p>
            <p className="font-semibold text-lg mb-4">{editingId ? "Editar aluno" : "Novo aluno"}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><Label>Nome do aluno</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>WhatsApp Aluno</Label><Input value={form.whatsappAluno} onChange={(e) => setForm({ ...form, whatsappAluno: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" /></div>
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></div>
              <div><Label>WhatsApp Responsável</Label><Input value={form.whatsappResponsavel} onChange={(e) => setForm({ ...form, whatsappResponsavel: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" /></div>
              <div><Label>Data de nascimento</Label>
                <Input type="date" value={form.dataNascimento} onChange={(e) => {
                  const date = e.target.value;
                  setForm({ ...form, dataNascimento: date, categoria: getCategoryFromBirthDate(date) });
                }} />
              </div>
              <div><Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v as Student["sexo"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Data de Entrada</Label><Input type="date" value={form.dataEntrada} onChange={(e) => setForm({ ...form, dataEntrada: e.target.value })} /></div>
              <div><Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as Student["categoria"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Plano</Label>
                <Select value={form.planoId} onValueChange={(v) => setForm({ ...form, planoId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                  <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} - R$ {p.valor.toFixed(2).replace(".", ",")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Dia de Vencimento</Label>
                <Select value={form.vencimento} onValueChange={(v) => setForm({ ...form, vencimento: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                  <SelectContent>{vencimentoOptions.map((d) => <SelectItem key={d} value={d}>Dia {d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Student["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.status === "Inativo" && editingId && enrollments.some((e) => e.alunoId === editingId) && (
              <p className="mt-3 text-sm text-destructive font-medium">
                ⚠️ Ao salvar como Inativo, todas as matrículas deste aluno serão removidas e as vagas serão liberadas.
              </p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              <Button onClick={handleSave}>{editingId ? "Atualizar" : "Salvar aluno"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-primary font-medium">Tabela de Alunos</p>
              <p className="font-semibold text-lg">Registros</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>Exportar</Button>
              <Button size="sm" onClick={openNew}>Novo aluno</Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>WhatsApp Aluno</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>WhatsApp Responsável</TableHead>
                <TableHead>Data Entrada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell>{s.whatsappAluno || "—"}</TableCell>
                  <TableCell>{s.responsavel || "—"}</TableCell>
                  <TableCell>{s.whatsappResponsavel || "—"}</TableCell>
                  <TableCell>{new Date(s.dataEntrada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setViewingStudent(s)}>Visualizar</Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { setReportStudent(s); setReportType("finance"); }}>Financeiro</Button>
                      <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => { setReportStudent(s); setReportType("frequency"); }}>Frequência</Button>
                      <Button variant="outline" size="sm" className="text-destructive border-red-200 hover:bg-red-50" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!reportType} onOpenChange={(open) => !open && setReportType(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <DialogTitle>
              {reportType === "finance" ? "Histórico Financeiro" : "Histórico de Frequência"} - {reportStudent?.nome}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={reportType === "finance" ? handlePrintFinancePDF : handlePrintFrequencyPDF} className="gap-2 border-primary/20 hover:bg-primary/5">
              <Printer className="h-4 w-4" /> Imprimir PDF
            </Button>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-end gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex-1 space-y-1.5">
                <Label>Data Inicial</Label>
                <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>Data Final</Label>
                <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
              </div>
            </div>

            {reportType === "finance" && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg bg-blue-50/50">
                    <p className="text-[10px] font-bold text-blue-700 uppercase">Total Faturado</p>
                    <p className="text-xl font-black">R$ {getStudentFinance().totals.faturado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-green-50/50">
                    <p className="text-[10px] font-bold text-green-700 uppercase">Total Pago</p>
                    <p className="text-xl font-black">R$ {getStudentFinance().totals.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-orange-50/50">
                    <p className="text-[10px] font-bold text-orange-700 uppercase">A Receber</p>
                    <p className="text-xl font-black">R$ {getStudentFinance().totals.aReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getStudentFinance().list.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">Nenhum registro no período</TableCell></TableRow>
                      ) : (
                        getStudentFinance().list.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.vencimento}</TableCell>
                            <TableCell>{r.plano}</TableCell>
                            <TableCell>R$ {r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell><Badge variant={r.status === "Pago" ? "default" : r.status === "Isento" ? "secondary" : "outline"}>{r.status}</Badge></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {reportType === "frequency" && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Turma / Horário</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getStudentFrequency().length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">Nenhuma aula registrada no período</TableCell></TableRow>
                    ) : (
                      getStudentFrequency().map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{new Date(l.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                          <TableCell>{l.slotInfo}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={l.presente === "Presente" || l.presente === "Miniliga" || l.presente === "Reposição" ? "default" : l.presente === "Falta" ? "destructive" : "secondary"}
                              className={l.presente === "Presente" ? "bg-green-600" : l.presente === "Miniliga" ? "bg-blue-600" : l.presente === "Reposição" ? "bg-purple-600" : ""}
                            >
                              {l.presente === "Falta" ? "Ausente" : l.presente}
                              {l.dataRealizacao && ` (${new Date(l.dataRealizacao).toLocaleDateString('pt-BR', {timeZone: 'UTC'})})`}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar */}
      <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Aluno</DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Nome</p><p className="font-medium">{viewingStudent.nome}</p></div>
                <div><p className="text-sm text-muted-foreground">WhatsApp Aluno</p><p className="font-medium">{viewingStudent.whatsappAluno || "—"}</p></div>
                <div><p className="text-sm text-muted-foreground">Responsável</p><p className="font-medium">{viewingStudent.responsavel}</p></div>
                <div><p className="text-sm text-muted-foreground">WhatsApp Responsável</p><p className="font-medium">{viewingStudent.whatsappResponsavel || "—"}</p></div>
                <div><p className="text-sm text-muted-foreground">Data de Nascimento</p><p className="font-medium">{new Date(viewingStudent.dataNascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p></div>
                <div><p className="text-sm text-muted-foreground">Sexo</p><p className="font-medium">{viewingStudent.sexo === "M" ? "Masculino" : "Feminino"}</p></div>
                <div><p className="text-sm text-muted-foreground">Data de Entrada</p><p className="font-medium">{new Date(viewingStudent.dataEntrada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p></div>
                <div><p className="text-sm text-muted-foreground">Categoria</p><p className="font-medium">{viewingStudent.categoria}</p></div>
                <div><p className="text-sm text-muted-foreground">Plano</p><p className="font-medium">{getPlanoNome(viewingStudent.planoId)}</p></div>
                <div><p className="text-sm text-muted-foreground">Vencimento</p><p className="font-medium">{viewingStudent.vencimento}</p></div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusVariant[viewingStudent.status]}>{viewingStudent.status}</Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;
