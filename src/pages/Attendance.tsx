import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockAttendance, type AttendanceRecord } from "@/data/mockData";

const Attendance = () => {
  const { classId } = useParams();
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendance);

  const setPresence = (alunoId: string, presente: boolean) => {
    setRecords(records.map((r) => (r.alunoId === alunoId ? { ...r, presente } : r)));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-primary font-medium">Controle</p>
            <CardTitle className="text-2xl">Presença da Turma</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Turma {classId || "SE01"}</Button>
            <Button variant="outline" size="sm">Horário 08:00</Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-primary font-medium">Lista de Chamada</p>
              <p className="text-xl font-bold">Horário Matutino</p>
            </div>
            <Button>Registrar Presença</Button>
          </div>

          <div className="border rounded-md">
            <div className="grid grid-cols-3 p-4 bg-secondary text-sm font-medium">
              <div>
                <p className="text-muted-foreground text-xs">Aluno</p>
                <p>Nome Completo</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs">Presença</p>
                <p>Marcador</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">Status</p>
                <p>Atualizado</p>
              </div>
            </div>

            {records.map((record) => (
              <div key={record.alunoId} className="grid grid-cols-3 p-4 border-t items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Aluno</p>
                  <p className="font-semibold">{record.alunoNome}</p>
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    variant={record.presente === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPresence(record.alunoId, true)}
                  >
                    Presente
                  </Button>
                  <Button
                    variant={record.presente === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPresence(record.alunoId, false)}
                  >
                    Falta
                  </Button>
                </div>
                <p className="text-right text-sm text-muted-foreground">{record.horarioRegistro}</p>
              </div>
            ))}

            <div className="flex items-center justify-between p-4 border-t bg-secondary">
              <p className="text-sm font-medium text-muted-foreground">Resumo diário</p>
              <p className="text-sm font-medium">Total registrado: {records.length} alunos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
