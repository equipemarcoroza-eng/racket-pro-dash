import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockStudents, type Student } from "@/data/mockData";

const categorias = ["Infantil", "Juvenil", "Adulto"] as const;
const statuses = ["Ativo", "Inativo", "Em análise"] as const;

const Students = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [showForm, setShowForm] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", responsavel: "", dataNascimento: "", categoria: "Infantil" as Student["categoria"], horario: "", vencimento: "" });

  const filtered = students.filter((s) => (!catFilter || s.categoria === catFilter) && (!statusFilter || s.status === statusFilter));

  const handleSave = () => {
    if (!form.nome) return;
    setStudents([...students, { ...form, id: String(Date.now()), status: "Ativo" }]);
    setShowForm(false);
    setForm({ nome: "", responsavel: "", dataNascimento: "", categoria: "Infantil", horario: "", vencimento: "" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Gestão de Alunos</CardTitle>
          <Button onClick={() => setShowForm(!showForm)}>Novo Aluno</Button>
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
            <p className="font-semibold text-lg mb-4">Novo aluno</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Nome do aluno</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></div>
              <div><Label>Data de nascimento</Label><Input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} /></div>
              <div><Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as Student["categoria"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Horário</Label><Input value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} /></div>
              <div><Label>Vencimento</Label><Input value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar aluno</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-primary font-medium">Tabela de Alunos</p>
              <p className="font-semibold text-lg">Registros ativos</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Exportar</Button>
              <Button size="sm" onClick={() => setShowForm(true)}>Novo aluno</Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Responsável</TableHead><TableHead>Categoria</TableHead><TableHead>Horário</TableHead><TableHead>Vencimento</TableHead><TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell>{s.responsavel}</TableCell>
                  <TableCell>{s.categoria}</TableCell>
                  <TableCell>{s.horario}</TableCell>
                  <TableCell>{s.vencimento}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">Visualizar</Button>
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm" onClick={() => setStudents(students.filter((st) => st.id !== s.id))}>Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;
