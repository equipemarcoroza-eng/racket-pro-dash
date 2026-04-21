import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/contexts/AppContext";
import type { AttendanceLog, ClassSlot } from "@/data/mockData";
import { toast } from "sonner";

const diasMap: Record<string, number> = { "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6 };

const months = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }, { value: "03", label: "Março" },
  { value: "04", label: "Abril" }, { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" }, { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" }, { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const FrequencyReport = () => {
  const { students, enrollments, attendanceLogs, setAttendanceLogs, schedule: mockSchedule } = useAppContext();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedAlunoId, setSelectedAlunoId] = useState("");

  const activeStudents = students.filter((s) => s.status === "Ativo");

  // Get enrolled slots for student
  const enrolledSlotIds = enrollments.filter((e) => e.alunoId === selectedAlunoId).map((e) => e.turmaId);
  const enrolledSlots = mockSchedule.filter((s) => enrolledSlotIds.includes(s.id));

  const handleDirectRegister = (data: string, turmaId: string, status: AttendanceLog["presente"], dataRealizacao?: string) => {
    const newLog: AttendanceLog = {
      id: crypto.randomUUID(),
      alunoId: selectedAlunoId,
      turmaId,
      data,
      presente: status,
      ...(dataRealizacao ? { dataRealizacao } : {})
    };

    setAttendanceLogs((prev) => [
      ...prev.filter((l) => !(l.alunoId === selectedAlunoId && l.turmaId === turmaId && l.data === data)),
      newLog,
    ]);
    toast.success("Status atualizado");
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

  // Calculate all dates in the month for the enrolled day-of-week
  const getDatesForSlot = (slot: ClassSlot) => {
    const dayTarget = diasMap[slot.dia];
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth) - 1;
    const dates: string[] = [];
    const d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      if (d.getDay() === dayTarget) {
        dates.push(`${year}-${selectedMonth}-${String(d.getDate()).padStart(2, "0")}`);
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  // Build report rows
  const reportRows: { data: string; turmaId: string; turmaLabel: string; horario: string; quadra: string; status: AttendanceLog["presente"] | "Não lançado"; dataRealizacao?: string }[] = [];
  if (selectedAlunoId) {
    for (const slot of enrolledSlots) {
      const dates = getDatesForSlot(slot);
      for (const date of dates) {
        const log = attendanceLogs.find((l) => l.alunoId === selectedAlunoId && l.turmaId === slot.id && l.data === date);
        reportRows.push({
          data: date,
          turmaId: slot.id,
          turmaLabel: slot.turmaId,
          horario: slot.horario,
          quadra: slot.quadra,
          status: log ? log.presente : "Não lançado",
          dataRealizacao: log?.dataRealizacao
        });
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
      <Card>
        <CardHeader>
          <p className="text-sm text-primary font-medium">Consulta</p>
          <CardTitle className="text-2xl">Frequência dos Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ano</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["2025", "2026", "2027"].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aluno</Label>
              <Select value={selectedAlunoId} onValueChange={setSelectedAlunoId}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Selecione um aluno" /></SelectTrigger>
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
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" onClick={() => handleDirectRegister(row.data, row.turmaId, "Cancelado")}>Canc.</Button>
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
