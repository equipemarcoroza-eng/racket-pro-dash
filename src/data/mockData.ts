// Plans
export interface Plan {
  id: string;
  nome: string;
  valor: number;
  turno: string;
  frequencia: string;
  periodicidade: string;
}

export const mockPlans: Plan[] = [
  { id: "1", nome: "Plano Básico", valor: 120, turno: "Matutino", frequencia: "1x por semana", periodicidade: "Mensal" },
  { id: "2", nome: "Plano Avançado", valor: 220, turno: "Vespertino", frequencia: "2x por semana", periodicidade: "Trimestral" },
  { id: "3", nome: "Pacote Premium", valor: 350, turno: "Noturno", frequencia: "3x por semana", periodicidade: "Anual" },
];

export const getFrequenciaCount = (frequencia: string): number => {
  if (frequencia.startsWith("1")) return 1;
  if (frequencia.startsWith("2")) return 2;
  if (frequencia.startsWith("3")) return 3;
  return 1;
};

export const CLASS_LIMIT = 6;

// Students
export interface Student {
  id: string;
  nome: string;
  responsavel: string;
  dataNascimento: string;
  sexo: "M" | "F";
  dataEntrada: string;
  categoria: "Infantil" | "Juvenil" | "Adulto";
  planoId: string;
  vencimento: string;
  status: "Ativo" | "Inativo" | "Em análise";
}

export const mockStudents: Student[] = [
  { id: "1", nome: "Marina Oliveira", responsavel: "Paula Oliveira", dataNascimento: "2012-05-10", sexo: "F", dataEntrada: "2024-01-15", categoria: "Juvenil", planoId: "2", vencimento: "05", status: "Ativo" },
  { id: "2", nome: "Diego Fernandes", responsavel: "Carlos Fernandes", dataNascimento: "2000-03-22", sexo: "M", dataEntrada: "2023-11-05", categoria: "Adulto", planoId: "3", vencimento: "10", status: "Ativo" },
  { id: "3", nome: "Lucas Pereira", responsavel: "Ana Pereira", dataNascimento: "2015-08-15", sexo: "M", dataEntrada: "2024-02-10", categoria: "Infantil", planoId: "1", vencimento: "10", status: "Ativo" },
  { id: "4", nome: "Sofia Almeida", responsavel: "Marcos Almeida", dataNascimento: "2010-01-20", sexo: "F", dataEntrada: "2024-03-01", categoria: "Juvenil", planoId: "2", vencimento: "15", status: "Em análise" },
  { id: "5", nome: "Mariana Costa", responsavel: "Roberto Costa", dataNascimento: "1995-11-30", sexo: "F", dataEntrada: "2023-08-20", categoria: "Adulto", planoId: "1", vencimento: "20", status: "Ativo" },
  { id: "6", nome: "Pedro Santos", responsavel: "Lucia Santos", dataNascimento: "2013-07-12", sexo: "M", dataEntrada: "2024-01-05", categoria: "Juvenil", planoId: "1", vencimento: "10", status: "Ativo" },
  { id: "7", nome: "Juliana Lima", responsavel: "Fernando Lima", dataNascimento: "2016-02-28", sexo: "F", dataEntrada: "2024-04-10", categoria: "Infantil", planoId: "2", vencimento: "20", status: "Ativo" },
  { id: "8", nome: "Rafael Souza", responsavel: "Carla Souza", dataNascimento: "1998-09-05", sexo: "M", dataEntrada: "2023-09-15", categoria: "Adulto", planoId: "1", vencimento: "25", status: "Ativo" },
  { id: "9", nome: "Beatriz Rocha", responsavel: "Thiago Rocha", dataNascimento: "2014-12-18", sexo: "F", dataEntrada: "2024-02-25", categoria: "Juvenil", planoId: "3", vencimento: "05", status: "Inativo" },
  { id: "10", nome: "Gabriel Martins", responsavel: "Renata Martins", dataNascimento: "2017-04-22", sexo: "M", dataEntrada: "2024-03-20", categoria: "Infantil", planoId: "2", vencimento: "20", status: "Ativo" },
];

// Schedule / Classes
export interface ClassSlot {
  id: string;
  quadra: string;
  dia: string;
  horario: string;
  turmaId: string;
}

export const mockSchedule: ClassSlot[] = [
  { id: "1", quadra: "Quadra 1", dia: "Seg", horario: "07:00", turmaId: "SE01" },
  { id: "2", quadra: "Quadra 2", dia: "Ter", horario: "07:00", turmaId: "SE02" },
  { id: "3", quadra: "Quadra 1", dia: "Qua", horario: "07:00", turmaId: "SE03" },
  { id: "4", quadra: "Quadra 3", dia: "Qui", horario: "07:00", turmaId: "SE04" },
  { id: "5", quadra: "Quadra 2", dia: "Sex", horario: "07:00", turmaId: "SE05" },
  { id: "6", quadra: "Quadra 1", dia: "Sáb", horario: "07:00", turmaId: "SE06" },
  { id: "7", quadra: "Quadra 3", dia: "Dom", horario: "07:00", turmaId: "SE07" },
  { id: "8", quadra: "Quadra 2", dia: "Seg", horario: "09:00", turmaId: "SE08" },
  { id: "9", quadra: "Quadra 1", dia: "Ter", horario: "09:00", turmaId: "SE09" },
  { id: "10", quadra: "Quadra 3", dia: "Qua", horario: "11:00", turmaId: "SE10" },
  { id: "11", quadra: "Quadra 1", dia: "Qui", horario: "13:00", turmaId: "SE11" },
  { id: "12", quadra: "Quadra 2", dia: "Sex", horario: "15:00", turmaId: "SE12" },
];

// Enrollments
export interface Enrollment {
  id: string;
  alunoId: string;
  turmaId: string; // ClassSlot.id
}

export const mockEnrollments: Enrollment[] = [
  // Marina (plano 2 = 2x/sem) → slots 2, 5
  { id: "e1", alunoId: "1", turmaId: "2" },
  { id: "e2", alunoId: "1", turmaId: "5" },
  // Diego (plano 3 = 3x/sem) → slots 1, 3, 4
  { id: "e3", alunoId: "2", turmaId: "1" },
  { id: "e4", alunoId: "2", turmaId: "3" },
  { id: "e5", alunoId: "2", turmaId: "4" },
  // Lucas (plano 1 = 1x/sem) → slot 1
  { id: "e6", alunoId: "3", turmaId: "1" },
  // Mariana Costa (plano 1 = 1x/sem) → slot 6
  { id: "e7", alunoId: "5", turmaId: "6" },
  // Pedro (plano 1 = 1x/sem) → slot 8
  { id: "e8", alunoId: "6", turmaId: "8" },
  // Juliana (plano 2 = 2x/sem) → slots 9, 10
  { id: "e9", alunoId: "7", turmaId: "9" },
  { id: "e10", alunoId: "7", turmaId: "10" },
  // Rafael (plano 1 = 1x/sem) → slot 11
  { id: "e11", alunoId: "8", turmaId: "11" },
  // Gabriel (plano 2 = 2x/sem) → slots 3, 12
  { id: "e12", alunoId: "10", turmaId: "3" },
  { id: "e13", alunoId: "10", turmaId: "12" },
];

// Attendance Log
export interface AttendanceLog {
  id: string;
  alunoId: string;
  turmaId: string; // ClassSlot.id
  data: string; // "2026-04-07"
  presente: "Presente" | "Falta" | "Cancelado";
}

export const mockAttendanceLogs: AttendanceLog[] = [
  { id: "a1", alunoId: "2", turmaId: "1", data: "2026-04-06", presente: "Presente" },
  { id: "a2", alunoId: "3", turmaId: "1", data: "2026-04-06", presente: "Presente" },
  { id: "a3", alunoId: "2", turmaId: "3", data: "2026-04-08", presente: "Falta" },
  { id: "a4", alunoId: "1", turmaId: "2", data: "2026-04-07", presente: "Presente" },
  { id: "a5", alunoId: "1", turmaId: "5", data: "2026-04-10", presente: "Presente" },
  { id: "a6", alunoId: "5", turmaId: "6", data: "2026-04-11", presente: "Presente" },
  { id: "a7", alunoId: "7", turmaId: "9", data: "2026-04-07", presente: "Falta" },
  { id: "a8", alunoId: "10", turmaId: "3", data: "2026-04-08", presente: "Presente" },
];

// Legacy - keeping for backward compat
export interface AttendanceRecord {
  alunoId: string;
  alunoNome: string;
  presente: boolean | null;
  horarioRegistro: string;
}

export const mockAttendance: AttendanceRecord[] = [
  { alunoId: "5", alunoNome: "Mariana Costa", presente: true, horarioRegistro: "08:05" },
  { alunoId: "3", alunoNome: "Lucas Pereira", presente: null, horarioRegistro: "08:02" },
  { alunoId: "4", alunoNome: "Sofia Almeida", presente: null, horarioRegistro: "08:10" },
];

// Revenue
export interface Revenue {
  id: string;
  aluno: string;
  plano: string;
  vencimento: string;
  valor: number;
  status: "Pago" | "Em atraso" | "Gerada" | "Isento";
}

export const mockRevenue: Revenue[] = [
  { id: "1", aluno: "Mariana Silva", plano: "Mensalidade", vencimento: "05/10/2024", valor: 120, status: "Pago" },
  { id: "2", aluno: "Bruno Costa", plano: "Trimestral", vencimento: "12/10/2024", valor: 330, status: "Em atraso" },
  { id: "3", aluno: "Larissa Mendes", plano: "Anual", vencimento: "20/11/2024", valor: 1200, status: "Gerada" },
  { id: "4", aluno: "Pedro Santos", plano: "Mensalidade", vencimento: "08/10/2024", valor: 120, status: "Pago" },
  { id: "5", aluno: "Juliana Lima", plano: "Mensalidade", vencimento: "18/10/2024", valor: 120, status: "Gerada" },
  { id: "6", aluno: "Rafael Souza", plano: "Trimestral", vencimento: "25/10/2024", valor: 330, status: "Em atraso" },
];

// Expenses
export interface Expense {
  id: string;
  categoria: string;
  valor: number;
}

export const mockExpenseCategories: Expense[] = [
  { id: "1", categoria: "Aluguel", valor: 18000 },
  { id: "2", categoria: "Materiais", valor: 9500 },
  { id: "3", categoria: "Professores freelancers", valor: 10200 },
  { id: "4", categoria: "Serviços terceirizados", valor: 4700 },
  { id: "5", categoria: "Manutenção", valor: 2600 },
  { id: "6", categoria: "Outros", valor: 0 },
];

export interface ScheduledPayment {
  id: string;
  fornecedor: string;
  valor: number;
  categoria: string;
}

export const mockScheduledPayments: ScheduledPayment[] = [
  { id: "1", fornecedor: "Fornecedor A", valor: 5200, categoria: "Materiais" },
  { id: "2", fornecedor: "Fornecedor B", valor: 3600, categoria: "Serviços terceirizados" },
  { id: "3", fornecedor: "Fornecedor C", valor: 4100, categoria: "Manutenção" },
  { id: "4", fornecedor: "Fornecedor D", valor: 2800, categoria: "Materiais" },
  { id: "5", fornecedor: "Fornecedor E", valor: 1500, categoria: "Outros" },
];
