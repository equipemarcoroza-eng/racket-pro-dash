import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext, toIsoDate } from "@/contexts/AppContext";
import type { AttendanceLog } from "@/data/mockData";
import { toast } from "sonner";
import {
  RotateCcw,
  Printer,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Users,
  MessageCircle,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Phone,
  User
} from "lucide-react";
import logo from "@/assets/logo.png";

const formatDateBr = (dateStr: string) => {
  if (!dateStr) return "—";
  if (dateStr.includes("/")) return dateStr;
  const [y, m, d] = dateStr.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
};

const ClassReplacements = () => {
  const { students, attendanceLogs, setAttendanceLogs, schedule } = useAppContext();

  // Period setup - default to current month
  const now = new Date();
  const defaultStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDayDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const defaultEndStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDayDate.getDate()).padStart(2, "0")}`;

  const [startDate, setStartDate] = useState(defaultStartStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"todos" | "Falta" | "Cancelado">("todos");
  const [statusFilter, setStatusFilter] = useState<"pendentes" | "repostas" | "todos">("pendentes");
  const [viewMode, setViewMode] = useState<"alunos" | "aulas">("alunos");

  // Track expanded students (all open by default for convenience)
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});

  // Dialog state for registering replacement
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    log: AttendanceLog | null;
    alunoNome: string;
    turmaInfo: string;
    dataOrigem: string;
  }>({
    open: false,
    log: null,
    alunoNome: "",
    turmaInfo: "",
    dataOrigem: "",
  });
  const [replacementDate, setReplacementDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [replacementNotes, setReplacementNotes] = useState("");

  // Map of active students
  const activeStudentsMap = useMemo(() => {
    const map = new Map<string, typeof students[0]>();
    students.filter((s) => s.status === "Ativo").forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // Schedule slot map
  const scheduleMap = useMemo(() => {
    const map = new Map<string, typeof schedule[0]>();
    schedule.forEach((s) => map.set(s.id, s));
    return map;
  }, [schedule]);

  // Filter raw attendance logs in the period for active students
  const eligibleItems = useMemo(() => {
    return attendanceLogs
      .filter((log) => {
        // Only active students
        if (!activeStudentsMap.has(log.alunoId)) return false;

        // Date in period
        const dateIso = toIsoDate(log.data);
        if (dateIso < startDate || dateIso > endDate) return false;

        // Ignore regular presence and miniligas
        if (log.presente === "Presente" || log.presente === "Miniliga") return false;

        return true;
      })
      .map((log) => {
        const student = activeStudentsMap.get(log.alunoId)!;
        const slot = scheduleMap.get(log.turmaId);
        const isAusente = log.presente === "Falta" || (log.presente as string) === "Ausente";
        const isCancelado = log.presente === "Cancelado";
        const isReposta = log.presente === "Reposição";

        const tipoOriginal = isCancelado ? "Cancelado" : "Ausente";

        return {
          log,
          student,
          slot,
          date: toIsoDate(log.data),
          tipoOriginal,
          isAusente,
          isCancelado,
          isReposta,
          motivoCancelamento: log.motivoCancelamento || "",
          dataRealizacao: log.dataRealizacao ? toIsoDate(log.dataRealizacao) : "",
          turmaLabel: slot ? `Turma ${slot.turmaId} (${slot.dia} ${slot.horario} - ${slot.quadra})` : `Turma ${log.turmaId}`,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceLogs, activeStudentsMap, scheduleMap, startDate, endDate]);

  // Filtered items based on UI filters
  const filteredItems = useMemo(() => {
    return eligibleItems.filter((item) => {
      // Status filter
      if (statusFilter === "pendentes" && item.isReposta) return false;
      if (statusFilter === "repostas" && !item.isReposta) return false;

      // Type filter (Ausente vs Cancelado)
      if (typeFilter === "Falta" && !item.isAusente && !(item.isReposta && item.log.motivoCancelamento === undefined)) {
        return false;
      }
      if (typeFilter === "Cancelado" && !item.isCancelado && !(item.isReposta && !!item.log.motivoCancelamento)) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchNome = item.student.nome.toLowerCase().includes(term);
        const matchTurma = item.turmaLabel.toLowerCase().includes(term);
        const matchMotivo = item.motivoCancelamento.toLowerCase().includes(term);
        if (!matchNome && !matchTurma && !matchMotivo) return false;
      }

      return true;
    });
  }, [eligibleItems, statusFilter, typeFilter, searchTerm]);

  // Aggregate and group items by student
  const studentsGrouped = useMemo(() => {
    const map = new Map<
      string,
      {
        student: typeof students[0];
        pendentesAusente: number;
        pendentesCancelado: number;
        repostas: number;
        items: typeof eligibleItems;
      }
    >();

    filteredItems.forEach((item) => {
      const prev = map.get(item.student.id) || {
        student: item.student,
        pendentesAusente: 0,
        pendentesCancelado: 0,
        repostas: 0,
        items: [],
      };

      if (item.isReposta) {
        prev.repostas++;
      } else if (item.isAusente) {
        prev.pendentesAusente++;
      } else if (item.isCancelado) {
        prev.pendentesCancelado++;
      }
      prev.items.push(item);
      map.set(item.student.id, prev);
    });

    return Array.from(map.values()).sort((a, b) => {
      const totalA = a.pendentesAusente + a.pendentesCancelado;
      const totalB = b.pendentesAusente + b.pendentesCancelado;
      if (totalB !== totalA) {
        return totalB - totalA; // Mais aulas a repor primeiro
      }
      return a.student.nome.localeCompare(b.student.nome);
    });
  }, [filteredItems]);

  // Metrics summary
  const metrics = useMemo(() => {
    const totalPendentesAusente = eligibleItems.filter((i) => i.isAusente).length;
    const totalPendentesCancelado = eligibleItems.filter((i) => i.isCancelado).length;
    const totalRepostas = eligibleItems.filter((i) => i.isReposta).length;
    const totalPendentes = totalPendentesAusente + totalPendentesCancelado;

    const uniqueStudentsPending = new Set(
      eligibleItems.filter((i) => !i.isReposta).map((i) => i.student.id)
    ).size;

    return {
      totalPendentes,
      totalPendentesAusente,
      totalPendentesCancelado,
      totalRepostas,
      uniqueStudentsPending,
    };
  }, [eligibleItems]);

  // Date presets
  const handleQuickPeriod = (preset: "esteMes" | "mesAnterior" | "ultimos30") => {
    const d = new Date();
    if (preset === "esteMes") {
      setStartDate(defaultStartStr);
      setEndDate(defaultEndStr);
    } else if (preset === "mesAnterior") {
      const prevMonthLastDay = new Date(d.getFullYear(), d.getMonth(), 0);
      const prevMonthStart = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const sY = prevMonthStart.getFullYear();
      const sM = String(prevMonthStart.getMonth() + 1).padStart(2, "0");
      const eY = prevMonthLastDay.getFullYear();
      const eM = String(prevMonthLastDay.getMonth() + 1).padStart(2, "0");
      const eD = String(prevMonthLastDay.getDate()).padStart(2, "0");
      setStartDate(`${sY}-${sM}-01`);
      setEndDate(`${eY}-${eM}-${eD}`);
    } else if (preset === "ultimos30") {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setStartDate(past30.toISOString().split("T")[0]);
      setEndDate(new Date().toISOString().split("T")[0]);
    }
  };

  // Toggle student expansion
  const toggleStudentExpanded = (studentId: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === false ? true : false,
    }));
  };

  const isStudentExpanded = (studentId: string) => {
    return expandedStudents[studentId] !== false; // expanded by default
  };

  const toggleAllExpanded = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    studentsGrouped.forEach((g) => {
      next[g.student.id] = expand;
    });
    setExpandedStudents(next);
  };

  // Modal to register replacement
  const handleOpenRegisterReplacement = (item: typeof eligibleItems[0]) => {
    setDialogState({
      open: true,
      log: item.log,
      alunoNome: item.student.nome,
      turmaInfo: item.turmaLabel,
      dataOrigem: item.date,
    });
    setReplacementDate(new Date().toISOString().split("T")[0]);
    setReplacementNotes(item.motivoCancelamento || "");
  };

  // Save replacement
  const handleConfirmReplacement = () => {
    if (!dialogState.log) return;
    if (!replacementDate) {
      toast.error("Informe a data da reposição.");
      return;
    }

    const updatedLog: AttendanceLog = {
      ...dialogState.log,
      presente: "Reposição",
      dataRealizacao: replacementDate,
      motivoCancelamento: replacementNotes.trim() ? replacementNotes.trim() : dialogState.log.motivoCancelamento,
    };

    setAttendanceLogs((prev) => [
      ...prev.filter((l) => l.id !== dialogState.log!.id),
      updatedLog,
    ]);

    toast.success("Reposição registrada com sucesso!");
    setDialogState({ open: false, log: null, alunoNome: "", turmaInfo: "", dataOrigem: "" });
  };

  // Revert replacement
  const handleRevertReplacement = (item: typeof eligibleItems[0]) => {
    const isOriginallyCancelled = !!item.log.motivoCancelamento;
    const revertedStatus = isOriginallyCancelled ? "Cancelado" : "Falta";

    const updatedLog: AttendanceLog = {
      ...item.log,
      presente: revertedStatus,
      dataRealizacao: undefined,
    };

    setAttendanceLogs((prev) => [
      ...prev.filter((l) => l.id !== item.log.id),
      updatedLog,
    ]);

    toast.info("Status revertido para pendente de reposição.");
  };

  // WhatsApp link generator
  const getWhatsAppLink = (phone: string, studentName: string, date?: string, totalAulas?: number) => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    const cleanNumber = digits.startsWith("55") ? digits : `55${digits}`;
    let textMessage = `Olá, ${studentName}! Aqui é da Equipe Marco Roza.`;
    if (date) {
      textMessage += ` Estamos entrando em contato para combinarmos a reposição da sua aula do dia ${formatDateBr(date)}. Poderia nos confirmar sua disponibilidade?`;
    } else if (totalAulas && totalAulas > 0) {
      textMessage += ` Identificamos que você possui ${totalAulas} aula${totalAulas === 1 ? "" : "s"} para repor neste período. Gostaria de verificar os horários disponíveis para agendamento?`;
    } else {
      textMessage += ` Estamos entrando em contato para alinharmos sua reposição de aulas.`;
    }
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(textMessage)}`;
  };

  // Export PDF Report - Grouped by Student
  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Add logo
      try {
        doc.addImage(logo, "PNG", 15, 10, 26, 26);
      } catch (err) {
        console.error("Erro ao carregar logotipo no PDF", err);
      }

      // Header
      doc.setFontSize(20);
      doc.setTextColor(20, 40, 100);
      doc.text("Equipe Marco Roza", 46, 18);

      doc.setFontSize(14);
      doc.setTextColor(70, 70, 70);
      doc.text("Relatório de Reposição de Aulas por Aluno", 46, 25);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Período: ${formatDateBr(startDate)} a ${formatDateBr(endDate)} | Emitido em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        46,
        31
      );

      doc.setDrawColor(220, 220, 225);
      doc.line(15, 38, 195, 38);

      // Summary metrics block
      doc.setFontSize(11);
      doc.setTextColor(20, 40, 100);
      doc.text("Resumo Geral do Período (Alunos Ativos)", 15, 45);

      const summaryData = [
        [
          `Alunos com Reposição: ${metrics.uniqueStudentsPending}`,
          `Ausentes (Faltas): ${metrics.totalPendentesAusente}`,
          `Aulas Canceladas: ${metrics.totalPendentesCancelado}`,
          `Total a Repor: ${metrics.totalPendentes}`,
        ],
      ];

      autoTable(doc, {
        startY: 48,
        body: summaryData,
        theme: "plain",
        styles: { fontSize: 9, fontStyle: "bold", cellPadding: 2, textColor: [30, 30, 40] },
      });

      let currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 62;

      if (studentsGrouped.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Nenhuma aula pendente de reposição encontrada para os filtros selecionados.", 15, currentY);
      } else {
        studentsGrouped.forEach((group, index) => {
          const totalPendente = group.pendentesAusente + group.pendentesCancelado;
          const phone = group.student.whatsappAluno || group.student.whatsappResponsavel || "Não informado";

          // Check if space is needed for the student section, otherwise add page
          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }

          // Student Header Banner in PDF
          doc.setFillColor(240, 243, 250);
          doc.rect(15, currentY, 180, 8, "F");

          doc.setFontSize(10);
          doc.setTextColor(20, 40, 100);
          doc.setFont("helvetica", "bold");
          doc.text(
            `${index + 1}. ${group.student.nome} (${group.student.categoria})`,
            18,
            currentY + 5.5
          );

          doc.setFontSize(8.5);
          doc.setTextColor(80, 80, 80);
          doc.setFont("helvetica", "normal");
          doc.text(
            `WhatsApp: ${phone} | Total a Repor: ${totalPendente} aula(s)`,
            120,
            currentY + 5.5
          );

          currentY += 9;

          // Table of student's classes
          const studentTableData = group.items.map((item) => {
            let statusDisplay = item.isAusente ? "Ausente (Falta)" : item.isCancelado ? "Cancelado" : "Reposta";
            if (item.isReposta && item.dataRealizacao) {
              statusDisplay += ` (${formatDateBr(item.dataRealizacao)})`;
            }

            return [
              formatDateBr(item.date),
              item.turmaLabel,
              item.tipoOriginal,
              item.motivoCancelamento || "—",
              statusDisplay,
            ];
          });

          autoTable(doc, {
            startY: currentY,
            head: [["Data Falta", "Turma / Horário / Quadra", "Tipo", "Motivo", "Status Reposição"]],
            body: studentTableData,
            theme: "grid",
            headStyles: {
              fillColor: [35, 55, 120],
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: "bold",
            },
            styles: { fontSize: 7.5, cellPadding: 2 },
            columnStyles: {
              0: { cellWidth: 22 },
              1: { cellWidth: 55 },
              2: { cellWidth: 25 },
              3: { cellWidth: 45 },
              4: { cellWidth: 33 },
            },
          });

          currentY = (doc as any).lastAutoTable.finalY + 6;
        });
      }

      doc.save(`reposicao-aulas-por-aluno-${startDate}-a-${endDate}.pdf`);
      toast.success("Relatório em PDF gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="bg-gradient-to-br from-[#0f1236] via-[#1c2394] to-[#de392a] text-white border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-white/80" />
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Controle Pedagógico</p>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-black text-white mt-1">Reposição de Aulas</CardTitle>
            <p className="text-xs text-white/70 mt-1">
              Gerenciamento de reposição de aulas agrupadas por aluno para alunos ativos no período.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2 cursor-pointer shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Exportar PDF por Aluno
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filter and Period Selection */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Data Inicial:
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Data Final:
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground mr-1">Atalhos:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-9 cursor-pointer"
                onClick={() => handleQuickPeriod("esteMes")}
              >
                Este Mês
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-9 cursor-pointer"
                onClick={() => handleQuickPeriod("mesAnterior")}
              >
                Mês Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-9 cursor-pointer"
                onClick={() => handleQuickPeriod("ultimos30")}
              >
                Últimos 30 Dias
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t items-center">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do aluno, turma ou motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter by Type */}
            <div>
              <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Falta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="Falta">Ausente (Falta)</SelectItem>
                  <SelectItem value="Cancelado">Aula Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Status */}
            <div>
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status Reposição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendentes">Apenas Pendentes</SelectItem>
                  <SelectItem value="repostas">Apenas Repostas</SelectItem>
                  <SelectItem value="todos">Todas as Ocorrências</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Alunos com Pendência</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{metrics.uniqueStudentsPending}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Alunos ativos no período</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Aulas Ausentes</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">{metrics.totalPendentesAusente}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Faltas não repostas</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Aulas Canceladas</p>
                <h3 className="text-2xl font-bold text-yellow-600 mt-1">{metrics.totalPendentesCancelado}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Cancelamentos de turma</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center text-yellow-600">
                <CalendarCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Reposições Realizadas</p>
                <h3 className="text-2xl font-bold text-purple-600 mt-1">{metrics.totalRepostas}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Aulas já repostas</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Grouped by Student */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">
              {viewMode === "alunos" ? "Alunos com Aulas para Repor" : "Lista Detalhada de Aulas"}
            </span>
            <Badge variant="outline" className="ml-1 font-semibold">
              {viewMode === "alunos" ? `${studentsGrouped.length} alunos` : `${filteredItems.length} aulas`}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {viewMode === "alunos" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs cursor-pointer"
                  onClick={() => toggleAllExpanded(true)}
                >
                  Expandir Todos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs cursor-pointer"
                  onClick={() => toggleAllExpanded(false)}
                >
                  Recolher Todos
                </Button>
              </>
            )}

            <div className="flex items-center gap-1 bg-background p-1 rounded-md border">
              <Button
                size="sm"
                variant={viewMode === "alunos" ? "default" : "ghost"}
                className="h-7 text-xs cursor-pointer"
                onClick={() => setViewMode("alunos")}
              >
                Agrupado por Aluno
              </Button>
              <Button
                size="sm"
                variant={viewMode === "aulas" ? "default" : "ghost"}
                className="h-7 text-xs cursor-pointer"
                onClick={() => setViewMode("aulas")}
              >
                Lista Contínua
              </Button>
            </div>
          </div>
        </div>

        {viewMode === "alunos" ? (
          /* GROUPED BY STUDENT VIEW (ACCORDION CARDS) */
          studentsGrouped.length === 0 ? (
            <Card>
              <CardContent className="text-center py-14 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-semibold text-foreground">Nenhuma aula pendente de reposição encontrada</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Não foram encontradas faltas ou cancelamentos para alunos ativos com os filtros selecionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {studentsGrouped.map((group) => {
                const isExpanded = isStudentExpanded(group.student.id);
                const totalPendente = group.pendentesAusente + group.pendentesCancelado;
                const phone = group.student.whatsappAluno || group.student.whatsappResponsavel;
                const generalWaLink = phone
                  ? getWhatsAppLink(phone, group.student.nome, undefined, totalPendente)
                  : "";

                return (
                  <Card
                    key={group.student.id}
                    className="overflow-hidden border border-border shadow-sm hover:border-primary/40 transition-colors"
                  >
                    {/* Student Group Header */}
                    <div
                      className="p-4 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none border-b border-border/60 hover:bg-muted/40 transition-colors"
                      onClick={() => toggleStudentExpanded(group.student.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                          {group.student.nome.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base text-foreground leading-none">
                              {group.student.nome}
                            </h4>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                              {group.student.categoria}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {phone}
                              </span>
                            )}
                            {group.student.responsavel && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Resp: {group.student.responsavel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side info & actions */}
                      <div className="flex items-center gap-2 flex-wrap ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {group.pendentesAusente > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {group.pendentesAusente} Falta{group.pendentesAusente > 1 ? "s" : ""}
                            </Badge>
                          )}

                          {group.pendentesCancelado > 0 && (
                            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
                              {group.pendentesCancelado} Cancelada{group.pendentesCancelado > 1 ? "s" : ""}
                            </Badge>
                          )}

                          {group.repostas > 0 && (
                            <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                              {group.repostas} Reposta{group.repostas > 1 ? "s" : ""}
                            </Badge>
                          )}

                          <Badge
                            className={
                              totalPendente > 0
                                ? "bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2.5 py-0.5"
                                : "bg-green-600 text-white font-bold text-xs px-2.5 py-0.5"
                            }
                          >
                            Total a Repor: {totalPendente}
                          </Badge>
                        </div>

                        {generalWaLink && (
                          <a
                            href={generalWaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-700 border border-green-500/20 transition-colors"
                            title="Conversar no WhatsApp sobre as reposições pendentes"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        )}

                        <button
                          type="button"
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => toggleStudentExpanded(group.student.id)}
                          title={isExpanded ? "Recolher aulas" : "Expandir aulas"}
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Classes of this Student */}
                    {isExpanded && (
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/10 text-xs">
                                <TableHead className="w-28 font-bold">Data da Aula</TableHead>
                                <TableHead className="font-bold">Turma / Horário / Quadra</TableHead>
                                <TableHead className="font-bold">Tipo</TableHead>
                                <TableHead className="font-bold">Motivo Registrado</TableHead>
                                <TableHead className="font-bold">Status Reposição</TableHead>
                                <TableHead className="text-right font-bold pr-4">Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.items.map((item) => {
                                const singleWaLink = phone
                                  ? getWhatsAppLink(phone, group.student.nome, item.date)
                                  : "";

                                return (
                                  <TableRow key={item.log.id} className="hover:bg-muted/15 text-xs">
                                    <TableCell className="font-semibold whitespace-nowrap">
                                      {formatDateBr(item.date)}
                                    </TableCell>

                                    <TableCell>
                                      <p className="font-medium text-foreground">{item.turmaLabel}</p>
                                    </TableCell>

                                    <TableCell>
                                      {item.isAusente && (
                                        <Badge variant="destructive" className="font-medium text-[11px]">
                                          Ausente (Falta)
                                        </Badge>
                                      )}
                                      {item.isCancelado && (
                                        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium text-[11px]">
                                          Cancelado
                                        </Badge>
                                      )}
                                      {item.isReposta && (
                                        <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-[11px]">
                                          {item.tipoOriginal}
                                        </Badge>
                                      )}
                                    </TableCell>

                                    <TableCell className="text-muted-foreground">
                                      {item.motivoCancelamento || "—"}
                                    </TableCell>

                                    <TableCell>
                                      {item.isReposta ? (
                                        <div className="flex flex-col">
                                          <Badge
                                            variant="outline"
                                            className="border-purple-600 text-purple-700 bg-purple-50 w-fit text-[11px]"
                                          >
                                            Reposta
                                          </Badge>
                                          {item.dataRealizacao && (
                                            <span className="text-[10px] text-muted-foreground mt-0.5">
                                              Em {formatDateBr(item.dataRealizacao)}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="border-red-400 text-red-600 bg-red-50 w-fit text-[11px]"
                                        >
                                          Pendente
                                        </Badge>
                                      )}
                                    </TableCell>

                                    <TableCell className="text-right pr-4">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {singleWaLink && !item.isReposta && (
                                          <a
                                            href={singleWaLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"
                                            title="Combinar reposição desta aula no WhatsApp"
                                          >
                                            <MessageCircle className="h-4 w-4" />
                                          </a>
                                        )}

                                        {item.isReposta ? (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs h-7 text-muted-foreground hover:text-red-600 cursor-pointer"
                                            onClick={() => handleRevertReplacement(item)}
                                            title="Desfazer reposição"
                                          >
                                            Reverter
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 gap-1 cursor-pointer"
                                            onClick={() => handleOpenRegisterReplacement(item)}
                                          >
                                            <RotateCcw className="h-3 w-3" />
                                            Agendar
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          /* CONTINUOUS / DETAILED LIST VIEW */
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-28 font-bold">Data da Aula</TableHead>
                      <TableHead className="font-bold">Aluno</TableHead>
                      <TableHead className="font-bold">Contato WhatsApp</TableHead>
                      <TableHead className="font-bold">Turma / Horário</TableHead>
                      <TableHead className="font-bold">Tipo</TableHead>
                      <TableHead className="font-bold">Motivo / Detalhes</TableHead>
                      <TableHead className="font-bold">Status Reposição</TableHead>
                      <TableHead className="text-right font-bold pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                          Nenhuma ocorrência encontrada para os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => {
                        const phone = item.student.whatsappAluno || item.student.whatsappResponsavel;
                        const waLink = phone ? getWhatsAppLink(phone, item.student.nome, item.date) : "";

                        return (
                          <TableRow key={item.log.id} className="hover:bg-muted/20">
                            <TableCell className="font-medium whitespace-nowrap">
                              {formatDateBr(item.date)}
                            </TableCell>

                            <TableCell>
                              <div>
                                <p className="font-semibold text-foreground text-sm">{item.student.nome}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {item.student.categoria}
                                  </Badge>
                                  {item.student.responsavel && (
                                    <span className="text-[11px] text-muted-foreground">
                                      Resp: {item.student.responsavel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              {phone ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground">{phone}</span>
                                  {waLink && (
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center p-1 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                                      title="Enviar mensagem no WhatsApp para agendar reposição"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Não informado</span>
                              )}
                            </TableCell>

                            <TableCell className="text-xs">
                              <p className="font-medium text-foreground">{item.turmaLabel}</p>
                            </TableCell>

                            <TableCell>
                              {item.isAusente && (
                                <Badge variant="destructive" className="font-semibold">
                                  Ausente
                                </Badge>
                              )}
                              {item.isCancelado && (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
                                  Cancelado
                                </Badge>
                              )}
                              {item.isReposta && (
                                <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                                  {item.tipoOriginal}
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                              {item.motivoCancelamento || "—"}
                            </TableCell>

                            <TableCell>
                              {item.isReposta ? (
                                <div className="flex flex-col">
                                  <Badge
                                    variant="outline"
                                    className="border-purple-600 text-purple-700 bg-purple-50 w-fit"
                                  >
                                    Reposta
                                  </Badge>
                                  {item.dataRealizacao && (
                                    <span className="text-[11px] text-muted-foreground mt-0.5">
                                      Em {formatDateBr(item.dataRealizacao)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="border-red-400 text-red-600 bg-red-50 w-fit">
                                  Pendente
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="text-right pr-6">
                              {item.isReposta ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-muted-foreground hover:text-red-600 cursor-pointer"
                                  onClick={() => handleRevertReplacement(item)}
                                  title="Desfazer reposição"
                                >
                                  Reverter
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1 cursor-pointer"
                                  onClick={() => handleOpenRegisterReplacement(item)}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Agendar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog for Registering Replacement */}
      <Dialog
        open={dialogState.open}
        onOpenChange={(open) => !open && setDialogState((prev) => ({ ...prev, open: false }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-purple-600" />
              Agendar Reposição de Aula
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-muted/50 p-3 rounded-md space-y-1 text-xs">
              <p>
                <strong>Aluno:</strong> {dialogState.alunoNome}
              </p>
              <p>
                <strong>Data da Aula Original:</strong> {formatDateBr(dialogState.dataOrigem)}
              </p>
              <p>
                <strong>Turma:</strong> {dialogState.turmaInfo}
              </p>
            </div>

            <div>
              <Label className="text-xs font-semibold">Data da Reposição:</Label>
              <Input
                type="date"
                value={replacementDate}
                onChange={(e) => setReplacementDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Observações / Turma de Reposição (Opcional):</Label>
              <Input
                placeholder="Ex: Reposição realizada com Turma 3 na Quadra 2..."
                value={replacementNotes}
                onChange={(e) => setReplacementNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogState((prev) => ({ ...prev, open: false }))}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleConfirmReplacement}
            >
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassReplacements;
