import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { mockPlans, type Student } from "@/data/mockData";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";

const categorias = ["Infantil", "Juvenil", "Adulto"] as const;
const statuses = ["Ativo", "Inativo", "Em análise"] as const;

type FormState = {
  nome: string;
  responsavel: string;
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
  responsavel: "",
  dataNascimento: "",
  sexo: "M",
  dataEntrada: new Date().toISOString().split("T")[0],
  categoria: "Infantil",
  planoId: "",
  vencimento: "",
  status: "Ativo",
};

const getPlanoNome = (planoId: string) => {
  const plano = mockPlans.find((p) => p.id === planoId);
  return plano ? plano.nome : "—";
};

const statusVariant: Record<Student["status"], "default" | "secondary" | "destructive"> = {
  Ativo: "default",
  "Em análise": "secondary",
  Inativo: "destructive",
};

const Students = () => {
  const { students, setStudents, enrollments, setEnrollments, setRevenues } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = students.filter(
    (s) => (!catFilter || s.categoria === catFilter) && (!statusFilter || s.status === statusFilter)
  );

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s: Student) => {
    setEditingId(s.id);
    setForm({
      nome: s.nome,
      responsavel: s.responsavel,
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
        { ...form, id: String(Date.now()) },
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

  const handleDelete = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setEnrollments((prev) => prev.filter((e) => e.alunoId !== id));
    toast.success("Aluno excluído");
  };

  const handleExport = () => {
    const headers = ["Nome", "Responsável", "Data Nascimento", "Sexo", "Data Entrada", "Categoria", "Plano", "Vencimento", "Status"];
    const rows = filtered.map((s) => [
      s.nome, s.responsavel, s.dataNascimento, s.sexo, s.dataEntrada, s.categoria,
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
            <Button variant="outline" size="sm" onClick={() => { setCatFilter(null); setStatusFilter(null); }}>Limpar filtros</Button>
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
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-primary font-medium">Cadastro rápido</p>
            <p className="font-semibold text-lg mb-4">{editingId ? "Editar aluno" : "Novo aluno"}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Nome do aluno</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Avaliador/Responsável</Label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></div>
              <div><Label>Data de nascimento</Label><Input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} /></div>
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
                  <SelectContent>{mockPlans.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
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
                <TableHead>Sexo</TableHead>
                <TableHead>Data Entrada</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell>{s.sexo}</TableCell>
                  <TableCell>{new Date(s.dataEntrada).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                  <TableCell>{s.categoria}</TableCell>
                  <TableCell>{getPlanoNome(s.planoId)}</TableCell>
                  <TableCell>{s.vencimento}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setViewingStudent(s)}>Visualizar</Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(s.id)}>Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                <div><p className="text-sm text-muted-foreground">Responsável</p><p className="font-medium">{viewingStudent.responsavel}</p></div>
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
