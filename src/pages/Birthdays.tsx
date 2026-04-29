import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import { Cake, Printer } from "lucide-react";
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

const Birthdays = () => {
  const { students } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );

  const filteredStudents = students.filter((s) => {
    if (!s.dataNascimento) return false;
    const birthMonth = s.dataNascimento.split("-")[1];
    return birthMonth === selectedMonth;
  }).sort((a, b) => {
    const dayA = parseInt(a.dataNascimento.split("-")[2]);
    const dayB = parseInt(b.dataNascimento.split("-")[2]);
    return dayA - dayB;
  });

  const handlePrint = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      const monthLabel = months.find((m) => m.value === selectedMonth)?.label || "";

      // Logo
      try {
        doc.addImage(logo, "PNG", 85, 10, 40, 40);
      } catch (e) {
        console.error("Erro ao carregar o logotipo", e);
      }

      doc.setFontSize(22);
      doc.setTextColor(20, 40, 100);
      doc.text("Lista de Aniversariantes", 105, 60, { align: "center" });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Mês: ${monthLabel}`, 105, 70, { align: "center" });
      
      const tableData = filteredStudents.map(s => [
        s.dataNascimento.split("-")[2],
        s.nome,
        s.categoria,
        new Date(s.dataNascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
        s.observacoes || "—"
      ]);

      autoTable(doc, {
        startY: 85,
        head: [["Dia", "Nome do Aluno", "Categoria", "Nascimento", "Observações"]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [20, 40, 100] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 'auto' }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 200;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 285, { align: "center" });

      doc.save(`aniversariantes-${monthLabel.toLowerCase()}-${Date.now()}.pdf`);
      toast.success("Lista de aniversariantes gerada com sucesso");
    } catch (err) {
      console.error("Falha ao gerar PDF", err);
      toast.error("Erro ao gerar a lista em PDF");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-primary font-medium flex items-center gap-2">
              <Cake className="h-4 w-4" /> Relatórios
            </p>
            <CardTitle className="text-2xl">Aniversariantes do Mês</CardTitle>
            <p className="text-sm text-muted-foreground">Veja os alunos que fazem aniversário no mês selecionado.</p>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-64">
              <label className="text-sm font-medium mb-2 block">Selecionar Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Dia</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data de Nascimento</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">{s.dataNascimento.split("-")[2]}</TableCell>
                      <TableCell className="font-medium">{s.nome}</TableCell>
                      <TableCell>{s.categoria}</TableCell>
                      <TableCell>{new Date(s.dataNascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate" title={s.observacoes}>
                        {s.observacoes || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum aniversariante encontrado para este mês.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" /> Imprimir Lista (PDF)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Birthdays;
