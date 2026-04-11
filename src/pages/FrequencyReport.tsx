import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockStudents, mockSchedule, mockEnrollments, mockAttendanceLogs } from "@/data/mockData";

const diasMap: Record<string, number> = { "Dom": 0, "Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6 };

const months = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }, { value: "03", label: "Março" },
  { value: "04", label: "Abril" }, { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" }, { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" }, { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const FrequencyReport = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedAlunoId, setSelectedAlunoId] = useState("");

  const activeStudents = mockStudents.filter((s) => s.status === "Ativo");

  // Get enrolled slots for student
  const enrolledSlotIds = mockEnrollments.filter((e) => e.alunoId === selectedAlunoId).map((e) => e.turmaId);
  const enrolledSlots = mockSchedule.filter((s) => enrolledSlotIds.includes(s.id));

  // Calculate all dates in the month for the enrolled day-of-week
  const getDatesForSlot = (slot: typeof mockSchedule[0]) => {
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
  const reportRows: { data: string; turmaId: string; horario: string; quadra: string; status: "Presente" | "Ausente" | "Não lançado" }[] = [];
  if (selectedAlunoId) {
    for (const slot of enrolledSlots) {
      const dates = getDatesForSlot(slot);
      for (const date of dates) {
        const log = mockAttendanceLogs.find((l) => l.alunoId === selectedAlunoId && l.turmaId === slot.id && l.data === date);
        reportRows.push({
          data: date,
          turmaId: slot.turmaId,
          horario: slot.horario,
          quadra: slot.quadra,
          status: log ? (log.presente ? "Presente" : "Ausente") : "Não lançado",
        });
      }
    }
    reportRows.sort((a, b) => a.data.localeCompare(b.data));
  }

  const totalAulas = reportRows.length;
  const presencas = reportRows.filter((r) => r.status === "Presente").length;
  const faltas = reportRows.filter((r) => r.status === "Ausente").length;
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
                        <TableCell>{row.turmaId}</TableCell>
                        <TableCell>{row.horario}</TableCell>
                        <TableCell>{row.quadra}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === "Presente" ? "default" : row.status === "Ausente" ? "destructive" : "outline"}>
                            {row.status}
                          </Badge>
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
    </div>
  );
};

export default FrequencyReport;
