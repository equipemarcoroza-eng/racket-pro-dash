import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { Student } from "@/data/mockData";
import { useAppContext, calculateAge, getCategoryFromBirthDate } from "@/contexts/AppContext";
import { toast } from "sonner";
import { Printer, Trash2, Award, Clock, Sparkles, Cake, PartyPopper, ArrowRight, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const months = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

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
  camiseta: Student["camiseta"];
  kit: Student["kit"];
  indicacao: string;
  observacoes: string;
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
  camiseta: "M",
  kit: "Não",
  indicacao: "",
  observacoes: "",
};

// getPlanoNome agora usa o array `plans` do contexto (definido dentro do componente)

const statusVariant: Record<Student["status"], "default" | "secondary" | "destructive"> = {
  Ativo: "default",
  "Em análise": "secondary",
  Inativo: "destructive",
  Passado: "secondary",
  Extras: "secondary",
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
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [showEntryDateModal, setShowEntryDateModal] = useState(false);
  const [queryEntryDate, setQueryEntryDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const navigate = useNavigate();
  const today = new Date();
  const currentMonthValue = String(today.getMonth() + 1).padStart(2, "0");
  const currentDayStr = String(today.getDate()).padStart(2, "0");
  const [selectedBirthdayMonth, setSelectedBirthdayMonth] = useState<string>(currentMonthValue);

  const birthdayStudents = students
    .filter((s) => {
      if (!s.dataNascimento) return false;
      const parts = s.dataNascimento.split("-");
      return parts.length >= 2 && parts[1] === selectedBirthdayMonth;
    })
    .sort((a, b) => {
      const dayA = parseInt(a.dataNascimento.split("-")[2]) || 0;
      const dayB = parseInt(b.dataNascimento.split("-")[2]) || 0;
      return dayA - dayB;
    });

  const selectedMonthObj = months.find((m) => m.value === selectedBirthdayMonth) || months[today.getMonth()];

  const handleCongratulateWhatsApp = (s: Student) => {
    const phone = s.whatsappAluno || s.whatsappResponsavel || "";
    const cleanPhone = phone.replace(/\D/g, "");
    const firstName = s.nome.split(" ")[0];
    const msg = encodeURIComponent(
      `Olá ${firstName}! A Equipe Marco Roza te deseja um Feliz Aniversário! 🎂🎾 Desejamos muita saúde, felicidade e grandes vitórias nas quadras! 🚀🎉`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, "_blank");
    } else {
      toast.info(`Aluno(a) ${s.nome} não possui WhatsApp cadastrado.`);
    }
  };

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

  const parseDate = (dStr: string) => {
    if (!dStr) return null;
    const cleanStr = dStr.split("T")[0];
    if (cleanStr.includes("-")) {
      const parts = cleanStr.split("-");
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    if (cleanStr.includes("/")) {
      const parts = cleanStr.split("/");
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }
    return null;
  };

  const calculateActiveMonths = (dataEntradaStr: string) => {
    if (!dataEntradaStr) return 0;
    try {
      const entryDate = parseDate(dataEntradaStr);
      if (!entryDate || isNaN(entryDate.getTime())) return 0;
      const today = new Date();
      const diffTime = today.getTime() - entryDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return Math.max(0, diffDays / 30.4375);
    } catch (e) {
      console.error("Erro ao calcular meses ativos:", e);
      return 0;
    }
  };

  const activeStudents = students.filter(s => s.status === "Ativo");
  
  const studentsWithMonths = activeStudents.map(s => {
    const monthsDecimal = calculateActiveMonths(s.dataEntrada);
    const months = Math.floor(monthsDecimal);
    return { ...s, months, monthsDecimal };
  });

  const veteranosStudents = [...studentsWithMonths]
    .filter(s => s.monthsDecimal > 12)
    .sort((a, b) => b.monthsDecimal - a.monthsDecimal);

  const intermediariosStudents = [...studentsWithMonths]
    .filter(s => s.monthsDecimal >= 3 && s.monthsDecimal <= 12)
    .sort((a, b) => b.monthsDecimal - a.monthsDecimal);

  const iniciantesStudents = [...studentsWithMonths]
    .filter(s => s.monthsDecimal < 3)
    .sort((a, b) => b.monthsDecimal - a.monthsDecimal);

  const averageMonths = activeStudents.length > 0
    ? studentsWithMonths.reduce((acc, curr) => acc + curr.monthsDecimal, 0) / activeStudents.length
    : 0;

  const formatEntryDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const clean = dateStr.split("T")[0];
    if (clean.includes("-")) {
      const [y, m, d] = clean.split("-");
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  };



  const confirmDelete = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    toast.success("Aluno removido com sucesso");
    setStudentToDelete(null);
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
        if (reportStudent.dataEntrada && logDate < toIsoDate(reportStudent.dataEntrada)) return false;
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
      doc.text(`Mensalidades Recebidas: R$ ${totals.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 80, 82);
      doc.text(`Em Aberto: R$ ${totals.aReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 140, 82);
      
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
      camiseta: s.camiseta || "M",
      kit: s.kit || "Não",
      indicacao: s.indicacao || "",
      observacoes: s.observacoes || "",
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

      // Gerar Taxa de Matrícula automaticamente (apenas se status for Ativo)
      if (form.status === "Ativo") {
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
      } else {
        toast.success("Aluno cadastrado com sucesso");
      }
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };



  const handleExport = () => {
    const headers = ["Nome", "WhatsApp Aluno", "Responsável", "WhatsApp Responsável", "Data Nascimento", "Sexo", "Data Entrada", "Categoria", "Plano", "Vencimento", "Status", "Indicação"];
    const rows = filtered.map((s) => [
      s.nome, s.whatsappAluno, s.responsavel, s.whatsappResponsavel, s.dataNascimento, s.sexo, s.dataEntrada, s.categoria,
      getPlanoNome(s.planoId), s.vencimento, s.status, s.indicacao || "",
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
      <Card className="bg-gradient-to-br from-[#0f1236] via-[#1c2394] to-[#de392a] text-white border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <CardHeader className="flex flex-row items-center justify-between relative z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Alunos</p>
            <CardTitle className="text-2xl font-black text-white mt-1">Gestão de Alunos</CardTitle>
          </div>
          <Button 
            onClick={openNew}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md font-semibold"
          >
            Novo Aluno
          </Button>
        </CardHeader>
      </Card>

      {/* Sticker / Ticker de Aniversariantes do Mês */}
      <Card className="border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-primary/10 shadow-sm overflow-hidden relative">
        <div className="p-4 sm:p-5">
          {/* Barra Superior do Sticker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-900/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-1 ring-amber-500/30 shadow-inner shrink-0">
                <Cake className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-foreground text-base tracking-tight flex items-center gap-1.5">
                    Aniversariantes do Mês
                  </h3>
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-[11px] px-2.5 py-0.5 shadow-sm">
                    {selectedMonthObj.label} ({birthdayStudents.length})
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Acompanhe e parabenize os alunos que celebram mais um ano de vida neste mês.
                </p>
              </div>
            </div>

            {/* Ações / Seletor de Mês */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Select value={selectedBirthdayMonth} onValueChange={setSelectedBirthdayMonth}>
                <SelectTrigger className="h-8 text-xs w-[130px] bg-background/80 border-amber-200 dark:border-amber-900/50">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label} {m.value === currentMonthValue ? "• Atual" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/birthdays")}
                className="h-8 text-xs font-semibold gap-1.5 border-amber-300 dark:border-amber-800 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200"
              >
                <span>Ver Todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Lista de Stickers dos Alunos */}
          {birthdayStudents.length === 0 ? (
            <div className="py-5 px-4 text-center flex flex-col items-center justify-center">
              <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                <PartyPopper className="w-4 h-4 text-amber-500/70" />
                Nenhum aniversariante cadastrado para o mês de {selectedMonthObj.label}.
              </p>
              {selectedBirthdayMonth !== currentMonthValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBirthdayMonth(currentMonthValue)}
                  className="text-xs text-primary font-semibold mt-1 h-7"
                >
                  Voltar para o mês atual
                </Button>
              )}
            </div>
          ) : (
            <div className="pt-3.5 flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {birthdayStudents.map((s) => {
                const day = s.dataNascimento?.split("-")[2] || "--";
                const isToday = day === currentDayStr && selectedBirthdayMonth === currentMonthValue;
                const age = calculateAge(s.dataNascimento);
                const hasPhone = !!(s.whatsappAluno || s.whatsappResponsavel);

                return (
                  <div
                    key={s.id}
                    className={`shrink-0 flex items-center justify-between gap-3 p-2.5 px-3.5 rounded-xl border transition-all duration-200 min-w-[260px] max-w-[320px] ${
                      isToday
                        ? "bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/10 border-amber-400 shadow-md ring-2 ring-amber-400/50"
                        : "bg-background/90 hover:bg-background border-border/80 hover:border-amber-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg font-black text-xs shrink-0 ${
                          isToday
                            ? "bg-amber-500 text-amber-950 shadow-sm animate-pulse"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold leading-none">Dia</span>
                        <span className="text-sm font-black leading-tight">{day}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground truncate">{s.nome}</span>
                          {isToday && (
                            <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black px-1.5 py-0 leading-none h-4">
                              🎉 HOJE!
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                          <span className="font-medium">{age} anos</span>
                          <span>•</span>
                          <span className="font-medium truncate">{s.categoria}</span>
                          {s.status !== "Ativo" && (
                            <>
                              <span>•</span>
                              <span className="text-muted-foreground/80 font-normal">({s.status})</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {hasPhone && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Enviar felicitações no WhatsApp"
                        onClick={() => handleCongratulateWhatsApp(s)}
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg shrink-0"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
          <div className="flex flex-wrap gap-10">
            <div>
              <p className="text-sm font-medium mb-3">Categoria</p>
              <div className="flex gap-3">
                {categorias.map((c) => (
                  <div key={c} className="flex flex-col items-center gap-1">
                    <Button variant={catFilter === c ? "default" : "outline"} size="sm" onClick={() => setCatFilter(catFilter === c ? null : c)}>{c}</Button>
                    <span className="text-[10px] text-muted-foreground font-bold">{students.filter(s => s.categoria === c).length} alunos</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Status</p>
              <div className="flex gap-3">
                {statuses.map((s) => (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <Button variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(statusFilter === s ? null : s)}>{s}</Button>
                    <span className="text-[10px] text-muted-foreground font-bold">{students.filter(st => st.status === s).length} alunos</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Sexo</p>
              <div className="flex gap-3">
                {(["M", "F"] as const).map((s) => (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <Button variant={sexoFilter === s ? "default" : "outline"} size="sm" onClick={() => setSexoFilter(sexoFilter === s ? null : s)}>{s === "M" ? "Masculino" : "Feminino"}</Button>
                    <span className="text-[10px] text-muted-foreground font-bold">{students.filter(st => st.sexo === s).length} alunos</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
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
              <Select 
                value={form.categoria} 
                onValueChange={(v) => setForm({ ...form, categoria: v as Student["categoria"] })}
                disabled={!!form.dataNascimento}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              {form.dataNascimento && (
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Definida automaticamente pela idade ({calculateAge(form.dataNascimento)} anos)
                </span>
              )}
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
            <div><Label>Camiseta</Label>
              <Select value={form.camiseta} onValueChange={(v) => setForm({ ...form, camiseta: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["12", "14", "16", "PP", "P", "M", "G", "GG"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Kit</Label>
              <Select value={form.kit} onValueChange={(v) => setForm({ ...form, kit: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Indicação</Label>
              <Input 
                value={form.indicacao} 
                onChange={(e) => setForm({ ...form, indicacao: e.target.value })} 
                placeholder="Pessoa ou empresa que indicou" 
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Label>Observações</Label>
              <Textarea 
                value={form.observacoes} 
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })} 
                placeholder="Informações adicionais sobre o aluno..."
                className="h-20"
              />
            </div>
          </div>
          {form.status === "Inativo" && editingId && enrollments.some((e) => e.alunoId === editingId) && (
            <p className="text-sm text-destructive font-medium mb-4">
              ⚠️ Ao salvar como Inativo, todas as matrículas deste aluno serão removidas e as vagas serão liberadas.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Atualizar" : "Salvar aluno"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
              <div>
                <p className="text-sm text-primary font-medium">Ranking dos Ativos</p>
                <p className="font-semibold text-lg">Tempo de Permanência dos Alunos Ativos</p>
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-2.5 flex flex-col sm:items-end justify-center shrink-0">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Tempo Médio de Permanência</span>
                <span className="text-lg font-black text-primary mt-1">
                  {averageMonths.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {averageMonths === 1 ? 'mês' : 'meses'}
                </span>
              </div>
            </div>


            {activeStudents.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-xl bg-muted/10">
                <p className="text-muted-foreground italic">Nenhum aluno ativo cadastrado para exibir o ranking.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tabela 1: Veteranos (> 12 meses) */}
                <Card className="border border-green-200 dark:border-green-900/50 bg-green-50/20 dark:bg-green-950/10 shadow-sm flex flex-col">
                  <CardHeader className="p-4 pb-3 border-b border-green-200/60 dark:border-green-900/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                          <Award className="w-4 h-4" />
                        </span>
                        <div>
                          <CardTitle className="text-sm font-bold text-foreground">Veteranos</CardTitle>
                          <p className="text-[11px] text-muted-foreground">&gt; 12 meses de casa</p>
                        </div>
                      </div>
                      <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] px-2.5 py-0.5">
                        {veteranosStudents.length} {veteranosStudents.length === 1 ? 'aluno' : 'alunos'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-border/60">
                      {veteranosStudents.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground italic">
                          Nenhum veterano cadastrado.
                        </div>
                      ) : (
                        veteranosStudents.map((s, index) => {
                          const rankColors = [
                            "bg-amber-500 text-amber-950", // 1st
                            "bg-slate-300 text-slate-900",   // 2nd
                            "bg-amber-700 text-amber-50",    // 3rd
                          ];
                          return (
                            <div key={s.id} className="p-3 px-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <span className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] shrink-0 ${index < 3 ? rankColors[index] : 'bg-muted text-muted-foreground'}`}>
                                  {index + 1}º
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-xs text-foreground truncate">{s.nome}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    Entrada: {formatEntryDate(s.dataEntrada)}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline" className="font-bold text-[10px] text-green-700 dark:text-green-300 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 shrink-0">
                                {s.months} {s.months === 1 ? 'mês' : 'meses'}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tabela 2: Intermediários (3 a 12 meses) */}
                <Card className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10 shadow-sm flex flex-col">
                  <CardHeader className="p-4 pb-3 border-b border-blue-200/60 dark:border-blue-900/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          <Clock className="w-4 h-4" />
                        </span>
                        <div>
                          <CardTitle className="text-sm font-bold text-foreground">Intermediários</CardTitle>
                          <p className="text-[11px] text-muted-foreground">3 a 12 meses de casa</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-0.5">
                        {intermediariosStudents.length} {intermediariosStudents.length === 1 ? 'aluno' : 'alunos'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-border/60">
                      {intermediariosStudents.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground italic">
                          Nenhum intermediário cadastrado.
                        </div>
                      ) : (
                        intermediariosStudents.map((s, index) => {
                          const rankColors = [
                            "bg-amber-500 text-amber-950", // 1st
                            "bg-slate-300 text-slate-900",   // 2nd
                            "bg-amber-700 text-amber-50",    // 3rd
                          ];
                          return (
                            <div key={s.id} className="p-3 px-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <span className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] shrink-0 ${index < 3 ? rankColors[index] : 'bg-muted text-muted-foreground'}`}>
                                  {index + 1}º
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-xs text-foreground truncate">{s.nome}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    Entrada: {formatEntryDate(s.dataEntrada)}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline" className="font-bold text-[10px] text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 shrink-0">
                                {s.months} {s.months === 1 ? 'mês' : 'meses'}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tabela 3: Iniciantes (< 3 meses) */}
                <Card className="border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm flex flex-col">
                  <CardHeader className="p-4 pb-3 border-b border-amber-200/60 dark:border-amber-900/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                          <Sparkles className="w-4 h-4" />
                        </span>
                        <div>
                          <CardTitle className="text-sm font-bold text-foreground">Iniciantes</CardTitle>
                          <p className="text-[11px] text-muted-foreground">&lt; 3 meses (Adaptação)</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-2.5 py-0.5">
                        {iniciantesStudents.length} {iniciantesStudents.length === 1 ? 'aluno' : 'alunos'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-border/60">
                      {iniciantesStudents.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground italic">
                          Nenhum iniciante cadastrado.
                        </div>
                      ) : (
                        iniciantesStudents.map((s, index) => {
                          const rankColors = [
                            "bg-amber-500 text-amber-950", // 1st
                            "bg-slate-300 text-slate-900",   // 2nd
                            "bg-amber-700 text-amber-50",    // 3rd
                          ];
                          return (
                            <div key={s.id} className="p-3 px-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <span className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] shrink-0 ${index < 3 ? rankColors[index] : 'bg-muted text-muted-foreground'}`}>
                                  {index + 1}º
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-xs text-foreground truncate">{s.nome}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    Entrada: {formatEntryDate(s.dataEntrada)}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline" className="font-bold text-[10px] text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 shrink-0">
                                {s.months} {s.months === 1 ? 'mês' : 'meses'}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-primary font-medium">Tabela de Alunos</p>
              <p className="font-semibold text-lg">Registros</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEntryDateModal(true)}>Consultar por Entrada</Button>
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
                      <Button variant="outline" size="sm" className="text-destructive border-red-200 hover:bg-red-50" onClick={() => setStudentToDelete(s.id)}>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <p className="text-[10px] font-bold text-green-700 uppercase">Mensalidades Recebidas</p>
                    <p className="text-xl font-black">R$ {getStudentFinance().totals.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-orange-50/50">
                    <p className="text-[10px] font-bold text-orange-700 uppercase">Em Aberto</p>
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
                      <TableHead>Motivo</TableHead>
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
                          <TableCell className="text-xs text-muted-foreground italic max-w-[200px] truncate" title={l.motivoCancelamento}>
                            {l.presente === "Cancelado" ? (l.motivoCancelamento || "—") : "—"}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                <div><p className="text-sm text-muted-foreground">Data de Nascimento (Idade)</p><p className="font-medium">{new Date(viewingStudent.dataNascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} ({calculateAge(viewingStudent.dataNascimento)} anos)</p></div>
                <div><p className="text-sm text-muted-foreground">Sexo</p><p className="font-medium">{viewingStudent.sexo === "M" ? "Masculino" : "Feminino"}</p></div>
                <div><p className="text-sm text-muted-foreground">Data de Entrada</p><p className="font-medium">{new Date(viewingStudent.dataEntrada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p></div>
                <div><p className="text-sm text-muted-foreground">Categoria</p><p className="font-medium">{viewingStudent.categoria}</p></div>
                <div><p className="text-sm text-muted-foreground">Plano</p><p className="font-medium">{getPlanoNome(viewingStudent.planoId)}</p></div>
                <div><p className="text-sm text-muted-foreground">Vencimento</p><p className="font-medium">{viewingStudent.vencimento}</p></div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusVariant[viewingStudent.status]}>{viewingStudent.status}</Badge>
                </div>
                <div><p className="text-sm text-muted-foreground">Camiseta</p><p className="font-medium">{viewingStudent.camiseta || "—"}</p></div>
                <div><p className="text-sm text-muted-foreground">Kit</p><p className="font-medium">{viewingStudent.kit || "—"}</p></div>
                <div><p className="text-sm text-muted-foreground">Indicação</p><p className="font-medium">{viewingStudent.indicacao || "—"}</p></div>
                <div className="col-span-2"><p className="text-sm text-muted-foreground">Observações</p><p className="font-medium whitespace-pre-wrap">{viewingStudent.observacoes || "—"}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Consulta por Data de Entrada */}
      <Dialog open={showEntryDateModal} onOpenChange={setShowEntryDateModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consulta de Alunos por Data de Entrada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex-1 space-y-1.5">
                <Label>Entrada a partir de</Label>
                <Input 
                  type="date" 
                  value={queryEntryDate} 
                  onChange={(e) => setQueryEntryDate(e.target.value)} 
                />
              </div>
              <div className="flex-1 pt-6 text-right">
                <p className="text-sm text-muted-foreground">Total encontrado para o período:</p>
                <p className="text-2xl font-black text-primary">
                  {students.filter(s => s.dataEntrada >= queryEntryDate).length} alunos
                </p>
              </div>
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data de Entrada</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students
                    .filter(s => s.dataEntrada >= queryEntryDate)
                    .sort((a, b) => b.dataEntrada.localeCompare(a.dataEntrada))
                    .map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-sm">{s.nome}</TableCell>
                        <TableCell className="text-sm">{new Date(s.dataEntrada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                        <TableCell><Badge variant={statusVariant[s.status]} className="text-[10px]">{s.status}</Badge></TableCell>
                        <TableCell className="text-sm">{s.categoria}</TableCell>
                      </TableRow>
                    ))
                  }
                  {students.filter(s => s.dataEntrada >= queryEntryDate).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                        Nenhum aluno encontrado com entrada a partir desta data.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setShowEntryDateModal(false)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e removerá todos os dados vinculados a este aluno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => studentToDelete && confirmDelete(studentToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Students;
