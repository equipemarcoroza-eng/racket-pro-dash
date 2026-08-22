import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppContext, toIsoDate } from "@/contexts/AppContext";
import type { AttendanceLog, ClassSlot } from "@/data/mockData";
import { toast } from "sonner";

const diasMap: Record<string, number> = { "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6 };

// Período de datas padrão inicializado no relatório de frequência

const FrequencyReport = () => {
  const { students, enrollments, attendanceLogs, setAttendanceLogs, schedule: mockSchedule } = useAppContext();
  const now = new Date();

  // Calcular datas padrão do mês atual (1º dia ao último dia do mês)
  const defaultStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDayDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const defaultEndStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDayDate.getDate()).padStart(2, "0")}`;

  const [startDate, setStartDate] = useState(defaultStartStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [selectedAlunoId, setSelectedAlunoId] = useState("");

  const activeStudents = students.filter((s) => s.status === "Ativo").sort((a, b) => a.nome.localeCompare(b.nome));

  // Get enrolled slots for student
  const enrolledSlotIds = enrollments.filter((e) => e.alunoId === selectedAlunoId).map((e) => e.turmaId);
  
  // Find all attendance logs for the student in the selected period
  const studentLogsInPeriod = attendanceLogs.filter(
    (l) => l.alunoId === selectedAlunoId && l.data >= startDate && l.data <= endDate
  );
  
  // Unique slot IDs from logs in this period
  const loggedSlotIds = Array.from(new Set(studentLogsInPeriod.map((l) => l.turmaId)));
  
  // Combined slots
  const allSlotIds = Array.from(new Set([...enrolledSlotIds, ...loggedSlotIds]));
  const relevantSlots = mockSchedule.filter((s) => allSlotIds.includes(s.id));
  
  // Historical slots: slots that have logs in this period but are NOT in active enrolledSlotIds
  const historicalSlotIds = loggedSlotIds.filter((id) => !enrolledSlotIds.includes(id));
  const historicalLogs = studentLogsInPeriod.filter((l) => historicalSlotIds.includes(l.turmaId));
  const latestHistoricalLogDate = historicalLogs.length > 0
    ? historicalLogs.reduce((max, l) => (l.data > max ? l.data : max), "")
    : "";

  const handleDirectRegister = (data: string, turmaId: string, status: AttendanceLog["presente"], extra?: string) => {
    const newLog: AttendanceLog = {
      id: crypto.randomUUID(),
      alunoId: selectedAlunoId,
      turmaId,
      data,
      presente: status,
      ...(status === "Miniliga" || status === "Reposição" ? { dataRealizacao: extra } : {}),
      ...(status === "Cancelado" ? { motivoCancelamento: extra } : {})
    };

    setAttendanceLogs((prev) => [
      ...prev.filter((l) => !(l.alunoId === selectedAlunoId && l.turmaId === turmaId && l.data === data)),
      newLog,
    ]);
    toast.success("Status atualizado");
  };

  const handleCancelWithPrompt = (data: string, turmaId: string) => {
    const reason = window.prompt("Informe o motivo do cancelamento:");
    if (reason !== null) {
      handleDirectRegister(data, turmaId, "Cancelado", reason);
    }
  };

  const [specialDialog, setSpecialDialog] = useState<{ open: boolean; dateToUpdate: string; turmaId: string; status: "Miniliga" | "Reposição" | null }>({ open: false, dateToUpdate: "", turmaId: "", status: null });
  const [dataConfirmada, setDataConfirmada] = useState(String(new Date().toISOString().split("T")[0]));

  const confirmSpecialAction = () => {
    if (!dataConfirmada) { toast.error("Informe a data"); return; }
    if (specialDialog.status && specialDialog.dateToUpdate) {
       handleDirectRegister(specialDialog.dateToUpdate, specialDialog.turmaId, specialDialog.status, dataConfirmada);
    }
    setSpecialDialog({ open: false, dateToUpdate: "", turmaId: "", status: null });
  };

  // Calculate all dates in the period for the enrolled day-of-week
  const getDatesForSlot = (slot: ClassSlot) => {
    const dayTarget = diasMap[slot.dia];
    const dates: string[] = [];
    
    // Parse start and end dates with T00:00:00 to avoid timezone issues
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    
    const d = new Date(start);
    while (d <= end) {
      if (d.getDay() === dayTarget) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dayStr = String(d.getDate()).padStart(2, "0");
        dates.push(`${y}-${m}-${dayStr}`);
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  // Build report rows
  const reportRows: { data: string; turmaId: string; turmaLabel: string; horario: string; quadra: string; status: AttendanceLog["presente"] | "Não lançado"; dataRealizacao?: string; motivoCancelamento?: string }[] = [];
  if (selectedAlunoId) {
    const student = students.find((s) => s.id === selectedAlunoId);
    const dataEntradaIso = student?.dataEntrada ? toIsoDate(student.dataEntrada) : "";

    for (const slot of relevantSlots) {
      const dates = getDatesForSlot(slot);
      for (const date of dates) {
        // Ignora datas anteriores à data de entrada do aluno
        if (dataEntradaIso && date < dataEntradaIso) {
          continue;
        }

        const log = studentLogsInPeriod.find((l) => l.turmaId === slot.id && l.data === date);
        const isEnrolled = enrolledSlotIds.includes(slot.id);
        
        if (log) {
          reportRows.push({
            data: date,
            turmaId: slot.id,
            turmaLabel: slot.turmaId,
            horario: slot.horario,
            quadra: slot.quadra,
            status: log.presente,
            dataRealizacao: log.dataRealizacao,
            motivoCancelamento: log.motivoCancelamento
          });
        } else if (isEnrolled) {
          // If the slot is active, only show "Não lançado" if it is after the latest historical log date in the month
          if (!latestHistoricalLogDate || date > latestHistoricalLogDate) {
            reportRows.push({
              data: date,
              turmaId: slot.id,
              turmaLabel: slot.turmaId,
              horario: slot.horario,
              quadra: slot.quadra,
              status: "Não lançado"
            });
          }
        }
      }
    }
    reportRows.sort((a, b) => a.data.localeCompare(b.data));
  }

  const filteredRows = reportRows.filter((r) => r.status !== "Cancelado");
  const totalAulas = filteredRows.length;
  const presencas = reportRows.filter((r) => r.status === "Presente" || r.status === "Miniliga" || r.status === "Reposição").length;
  const faltas = reportRows.filter((r) => r.status === "Falta").length;
  const percentual = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0;

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#0f1236] via-[#1c2394] to-[#de392a] text-white border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <CardHeader className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">Consulta</p>
          <CardTitle className="text-2xl font-black text-white mt-1">Frequência dos Alunos</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-white/80">Período Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-44 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/40 [color-scheme:dark]"
              />
            </div>
            <div>
              <Label className="text-white/80">Período Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-44 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/40 [color-scheme:dark]"
              />
            </div>
            <div>
              <Label className="text-white/80">Aluno</Label>
              <Select value={selectedAlunoId} onValueChange={setSelectedAlunoId}>
                <SelectTrigger className="w-56 bg-white/10 border-white/20 text-white focus:ring-white/40 focus:border-white/40">
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {activeStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAlunoId && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total de Aulas</p><p className="text-2xl font-bold">{totalAulas}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Presenças</p><p className="text-2xl font-bold text-green-600">{presencas}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Faltas</p><p className="text-2xl font-bold text-destructive">{faltas}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Frequência</p><p className="text-2xl font-bold">{percentual}%</p></CardContent></Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Quadra</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportRows.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma aula encontrada neste período</TableCell></TableRow>
                  ) : (
                    reportRows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatDate(row.data)}</TableCell>
                        <TableCell>{row.turmaLabel}</TableCell>
                        <TableCell>{row.horario}</TableCell>
                        <TableCell>{row.quadra}</TableCell>
                        <TableCell>
                          {row.status === "Não lançado" ? (
                            <div className="flex gap-1 flex-wrap">
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100" onClick={() => handleDirectRegister(row.data, row.turmaId, "Presente")}>Pres.</Button>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 bg-red-50 text-red-700 border-red-200 hover:bg-red-100" onClick={() => handleDirectRegister(row.data, row.turmaId, "Falta")}>Aus.</Button>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" onClick={() => handleCancelWithPrompt(row.data, row.turmaId)}>Canc.</Button>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" onClick={() => setSpecialDialog({ open: true, dateToUpdate: row.data, turmaId: row.turmaId, status: "Miniliga" })}>Miniliga</Button>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" onClick={() => setSpecialDialog({ open: true, dateToUpdate: row.data, turmaId: row.turmaId, status: "Reposição" })}>Repos.</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={row.status === "Presente" || row.status === "Miniliga" || row.status === "Reposição" ? "default" : row.status === "Falta" ? "destructive" : "outline"}
                                className={row.status === "Presente" ? "bg-green-600" : row.status === "Cancelado" ? "bg-yellow-500 text-white border-yellow-500" : row.status === "Miniliga" ? "bg-blue-600" : row.status === "Reposição" ? "bg-purple-600" : ""}
                              >
                                {row.status === "Falta" ? "Ausente" : row.status}
                                {row.dataRealizacao && ` (${formatDate(row.dataRealizacao)})`}
                              </Badge>

                              {(row.status === "Falta" || row.status === "Cancelado") && (
                                <div className="flex gap-1 ml-2">
                                  <Button size="icon" variant="ghost" title="Mudar para Miniliga" className="h-6 w-6 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full" onClick={() => setSpecialDialog({ open: true, dateToUpdate: row.data, turmaId: row.turmaId, status: "Miniliga" })}><span className="text-[10px] font-bold">M</span></Button>
                                  <Button size="icon" variant="ghost" title="Mudar para Reposição" className="h-6 w-6 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-full" onClick={() => setSpecialDialog({ open: true, dateToUpdate: row.data, turmaId: row.turmaId, status: "Reposição" })}><span className="text-[10px] font-bold">R</span></Button>
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground italic max-w-[200px] truncate" title={row.motivoCancelamento}>
                          {row.status === "Cancelado" ? (row.motivoCancelamento || "—") : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog Especial */}
      <Dialog open={specialDialog.open} onOpenChange={(open) => !open && setSpecialDialog({ ...specialDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar {specialDialog.status}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data da {specialDialog.status}</Label>
              <Input type="date" value={dataConfirmada} onChange={(e) => setDataConfirmada(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpecialDialog({ ...specialDialog, open: false })}>Cancelar</Button>
            <Button onClick={confirmSpecialAction}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FrequencyReport;
