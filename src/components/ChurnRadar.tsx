import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/contexts/AppContext";
import { WhatsAppQuickDialog } from "@/components/WhatsAppQuickDialog";
import { type WhatsAppMessageOptions } from "@/lib/whatsapp";
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  MessageCircle,
  TrendingDown,
  Users,
  Search,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

export interface ChurnStudentAnalysis {
  studentId: string;
  studentName: string;
  phone: string;
  category: string;
  planName: string;
  planValue: number;
  lastAttendanceDate: string | null;
  daysSinceLastAttendance: number;
  recentAbsencesCount: number;
  attendanceRate: number; // 0 to 100
  riskScore: number; // 0 to 100
  riskLevel: "critico" | "atencao" | "baixo";
  mainReason: string;
}

export const ChurnRadar: React.FC = () => {
  const { students, attendanceLogs, plans } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<"todos" | "critico" | "atencao">("todos");
  const [whatsAppModal, setWhatsAppModal] = useState<{
    open: boolean;
    options: WhatsAppMessageOptions;
  }>({
    open: false,
    options: { phone: "", studentName: "", type: "churn_alert" },
  });

  const analysisList = useMemo<ChurnStudentAnalysis[]>(() => {
    const today = new Date();
    const activeStudents = students.filter((s) => s.status === "Ativo");

    return activeStudents
      .map((student) => {
        const studentLogs = attendanceLogs
          .filter((l) => l.alunoId === student.id)
          .sort((a, b) => (b.data || "").localeCompare(a.data || ""));

        // Última presença registrada
        const lastPresentLog = studentLogs.find(
          (l) => l.presente === "Presente" || l.presente === "Reposição"
        );
        const lastAttendanceDate = lastPresentLog?.data || null;

        let daysSinceLast = 999;
        if (lastAttendanceDate) {
          try {
            daysSinceLast = differenceInDays(today, parseISO(lastAttendanceDate));
          } catch {
            daysSinceLast = 999;
          }
        } else if (student.dataEntrada) {
          try {
            daysSinceLast = differenceInDays(today, parseISO(student.dataEntrada));
          } catch {
            daysSinceLast = 999;
          }
        }

        // Faltas recentes (últimos 5 registros)
        const recentLogs = studentLogs.slice(0, 5);
        const recentAbsences = recentLogs.filter((l) => l.presente === "Falta").length;

        // Taxa de presença
        const totalLogs = studentLogs.length;
        const presentLogsCount = studentLogs.filter(
          (l) => l.presente === "Presente" || l.presente === "Reposição"
        ).length;
        const attendanceRate = totalLogs > 0 ? (presentLogsCount / totalLogs) * 100 : 80;

        // Plano e valor
        const plan = plans.find((p) => p.id === student.planoId);
        const planName = plan ? plan.nome : "Padrão";
        const planValue = plan ? plan.valor : 0;

        // Cálculo de Score de Risco (0 - 100)
        let riskScore = 15;
        let reasons: string[] = [];

        if (daysSinceLast > 30) {
          riskScore += 50;
          reasons.push("Mais de 30 dias sem comparecer");
        } else if (daysSinceLast > 18) {
          riskScore += 35;
          reasons.push(`Sem comparecer há ${daysSinceLast} dias`);
        } else if (daysSinceLast > 10) {
          riskScore += 15;
        }

        if (recentAbsences >= 3) {
          riskScore += 30;
          reasons.push(`${recentAbsences} faltas recentes consecutivas`);
        } else if (recentAbsences === 2) {
          riskScore += 15;
          reasons.push("2 faltas recentes");
        }

        if (attendanceRate < 50 && totalLogs >= 3) {
          riskScore += 20;
          reasons.push(`Presença baixa (${attendanceRate.toFixed(0)}%)`);
        }

        riskScore = Math.min(100, Math.max(0, riskScore));

        let riskLevel: "critico" | "atencao" | "baixo" = "baixo";
        if (riskScore >= 60 || daysSinceLast >= 21) {
          riskLevel = "critico";
        } else if (riskScore >= 35 || daysSinceLast >= 14 || recentAbsences >= 2) {
          riskLevel = "atencao";
        }

        const phone = student.whatsappAluno || student.whatsappResponsavel || "";
        const mainReason = reasons.length > 0 ? reasons.join(" • ") : "Frequência estável";

        return {
          studentId: student.id,
          studentName: student.nome,
          phone,
          category: student.categoria,
          planName,
          planValue,
          lastAttendanceDate,
          daysSinceLastAttendance: daysSinceLast === 999 ? 0 : daysSinceLast,
          recentAbsencesCount: recentAbsences,
          attendanceRate,
          riskScore,
          riskLevel,
          mainReason,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [students, attendanceLogs, plans]);

  // Contagens e métricas agregadas
  const criticalCount = analysisList.filter((a) => a.riskLevel === "critico").length;
  const warningCount = analysisList.filter((a) => a.riskLevel === "atencao").length;
  const safeCount = analysisList.filter((a) => a.riskLevel === "baixo").length;

  const totalAtRiskMRR = analysisList
    .filter((a) => a.riskLevel === "critico")
    .reduce((sum, item) => sum + item.planValue, 0);

  const filteredList = analysisList.filter((item) => {
    const matchesSearch =
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.planName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterLevel === "critico") return item.riskLevel === "critico";
    if (filterLevel === "atencao") return item.riskLevel === "atencao";
    return true;
  });

  const handleRescueStudent = (student: ChurnStudentAnalysis) => {
    setWhatsAppModal({
      open: true,
      options: {
        phone: student.phone,
        studentName: student.studentName,
        type: "churn_alert",
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Inteligência */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/70 p-6 border border-red-500/30 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping" />
              <Badge className="bg-red-500/20 text-red-300 border-red-500/40 uppercase tracking-widest text-[10px]">
                Inteligência Preditiva
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-400" />
              Radar Anti-Churn & Retenção de Atletas
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Algoritmo de alerta precoce que cruza faltas consecutivas, dias sem comparecimento e assiduidade para identificar alunos antes que decidam cancelar o plano.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
            <TrendingDown className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Receita Mensal sob Risco Crítico</p>
              <p className="text-xl font-black text-red-400">
                {totalAtRiskMRR > 0
                  ? `R$ ${totalAtRiskMRR.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "R$ 0,00"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas de Alerta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          onClick={() => setFilterLevel("critico")}
          className={`cursor-pointer transition-all border-l-4 border-l-red-500 hover:shadow-md ${
            filterLevel === "critico" ? "ring-2 ring-red-500 bg-red-50/10" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-red-500">
              <span>Risco Crítico (Evasão Iminente)</span>
              <Flame className="h-4 w-4" />
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-red-600 dark:text-red-400">
              {criticalCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Alunos com 3+ faltas seguidas ou mais de 21 dias sem ir à aula.
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterLevel("atencao")}
          className={`cursor-pointer transition-all border-l-4 border-l-amber-500 hover:shadow-md ${
            filterLevel === "atencao" ? "ring-2 ring-amber-500 bg-amber-50/10" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-500">
              <span>Atenção (Queda de Frequência)</span>
              <AlertTriangle className="h-4 w-4" />
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {warningCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Alunos que começaram a faltar nas últimas 2 semanas.
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFilterLevel("todos")}
          className={`cursor-pointer transition-all border-l-4 border-l-emerald-500 hover:shadow-md ${
            filterLevel === "todos" ? "ring-2 ring-emerald-500 bg-emerald-50/10" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-500">
              <span>Engajados & Saudáveis</span>
              <CheckCircle className="h-4 w-4" />
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {safeCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Alunos com frequência regular e assiduidade alta.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alunos e Ações de Resgate */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Painel de Resgate de Atletas
              </CardTitle>
              <CardDescription>
                Aja proativamente com mensagens cordiais no WhatsApp para trazer o aluno de volta.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno ou plano..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="font-semibold text-foreground">Nenhum aluno em risco com esses filtros!</p>
              <p className="text-xs">Sua base de atletas está engajada e com ótima assiduidade.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Plano / Categoria</TableHead>
                    <TableHead>Nível de Risco</TableHead>
                    <TableHead>Diagnóstico Preditivo</TableHead>
                    <TableHead>Dias sem Aula</TableHead>
                    <TableHead className="text-right">Ação Imediata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((item) => (
                    <TableRow key={item.studentId} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        {item.studentName}
                        {item.phone && (
                          <div className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {item.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{item.planName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.category} • R$ {item.planValue.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.riskLevel === "critico" && (
                          <Badge variant="destructive" className="gap-1 animate-pulse">
                            <Flame className="h-3 w-3" /> Crítico ({item.riskScore}%)
                          </Badge>
                        )}
                        {item.riskLevel === "atencao" && (
                          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
                            <AlertTriangle className="h-3 w-3" /> Atenção ({item.riskScore}%)
                          </Badge>
                        )}
                        {item.riskLevel === "baixo" && (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 gap-1">
                            <CheckCircle className="h-3 w-3" /> Seguro ({item.riskScore}%)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs">
                        {item.mainReason}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-mono text-sm font-bold ${
                            item.daysSinceLastAttendance > 20
                              ? "text-red-500"
                              : item.daysSinceLastAttendance > 10
                              ? "text-amber-500"
                              : "text-emerald-600"
                          }`}
                        >
                          {item.daysSinceLastAttendance > 0
                            ? `${item.daysSinceLastAttendance} dias`
                            : "Ativo recente"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleRescueStudent(item)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm text-xs font-medium"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Resgatar Aluno
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Disparo de WhatsApp */}
      <WhatsAppQuickDialog
        open={whatsAppModal.open}
        onOpenChange={(open) => setWhatsAppModal((prev) => ({ ...prev, open }))}
        options={whatsAppModal.options}
      />
    </div>
  );
};
