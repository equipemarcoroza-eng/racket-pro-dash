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
  { id: "1", nome: "Plano Básico", valor: 120, turno: "Matutino", frequencia: "Semanal", periodicidade: "Mensal" },
  { id: "2", nome: "Plano Avançado", valor: 220, turno: "Vespertino", frequencia: "Diária", periodicidade: "Trimestral" },
  { id: "3", nome: "Pacote Premium", valor: 350, turno: "Noturno", frequencia: "Semanal", periodicidade: "Anual" },
];

// Students
export interface Student {
  id: string;
  nome: string;
  responsavel: string;
  dataNascimento: string;
  categoria: "Infantil" | "Juvenil" | "Adulto";
  horario: string;
  vencimento: string;
  status: "Ativo" | "Inativo" | "Em análise";
}

export const mockStudents: Student[] = [
  { id: "1", nome: "Marina Oliveira", responsavel: "Paula Oliveira", dataNascimento: "2012-05-10", categoria: "Juvenil", horario: "18h30", vencimento: "05/11", status: "Ativo" },
  { id: "2", nome: "Diego Fernandes", responsavel: "Carlos Fernandes", dataNascimento: "2000-03-22", categoria: "Adulto", horario: "20h00", vencimento: "12/11", status: "Ativo" },
  { id: "3", nome: "Lucas Pereira", responsavel: "Ana Pereira", dataNascimento: "2015-08-15", categoria: "Infantil", horario: "08h00", vencimento: "10/11", status: "Ativo" },
  { id: "4", nome: "Sofia Almeida", responsavel: "Marcos Almeida", dataNascimento: "2010-01-20", categoria: "Juvenil", horario: "09h00", vencimento: "15/11", status: "Em análise" },
  { id: "5", nome: "Mariana Costa", responsavel: "Roberto Costa", dataNascimento: "1995-11-30", categoria: "Adulto", horario: "08h00", vencimento: "20/11", status: "Ativo" },
];

// Schedule / Classes
export interface ClassSlot {
  id: string;
  quadra: string;
  dia: string;
  horario: string;
  alunos: number;
  turmaId: string;
}

export const mockSchedule: ClassSlot[] = [
  { id: "1", quadra: "Quadra 1", dia: "Seg", horario: "07:00", alunos: 5, turmaId: "SE01" },
  { id: "2", quadra: "Quadra 2", dia: "Ter", horario: "07:00", alunos: 8, turmaId: "SE02" },
  { id: "3", quadra: "Quadra 1", dia: "Qua", horario: "07:00", alunos: 6, turmaId: "SE03" },
  { id: "4", quadra: "Quadra 3", dia: "Qui", horario: "07:00", alunos: 4, turmaId: "SE04" },
  { id: "5", quadra: "Quadra 2", dia: "Sex", horario: "07:00", alunos: 7, turmaId: "SE05" },
  { id: "6", quadra: "Quadra 1", dia: "Sáb", horario: "07:00", alunos: 2, turmaId: "SE06" },
  { id: "7", quadra: "Quadra 3", dia: "Dom", horario: "07:00", alunos: 3, turmaId: "SE07" },
];

// Attendance
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
  status: "Pago" | "Em atraso" | "Gerada";
}

export const mockRevenue: Revenue[] = [
  { id: "1", aluno: "Mariana Silva", plano: "Mensalidade", vencimento: "05/10/2024", valor: 120, status: "Pago" },
  { id: "2", aluno: "Bruno Costa", plano: "Trimestral", vencimento: "12/10/2024", valor: 330, status: "Em atraso" },
  { id: "3", aluno: "Larissa Mendes", plano: "Anual", vencimento: "20/11/2024", valor: 1200, status: "Gerada" },
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
  fornecedor: string;
  valor: number;
}

export const mockScheduledPayments: ScheduledPayment[] = [
  { fornecedor: "Fornecedor A", valor: 5200 },
  { fornecedor: "Fornecedor B", valor: 3600 },
  { fornecedor: "Fornecedor C", valor: 4100 },
];
