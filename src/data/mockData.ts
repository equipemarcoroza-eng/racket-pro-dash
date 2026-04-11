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
  { id: "6", nome: "Pedro Santos", responsavel: "Lucia Santos", dataNascimento: "2013-07-12", categoria: "Juvenil", horario: "07h00", vencimento: "08/11", status: "Ativo" },
  { id: "7", nome: "Juliana Lima", responsavel: "Fernando Lima", dataNascimento: "2016-02-28", categoria: "Infantil", horario: "09h00", vencimento: "18/11", status: "Ativo" },
  { id: "8", nome: "Rafael Souza", responsavel: "Carla Souza", dataNascimento: "1998-09-05", categoria: "Adulto", horario: "07h00", vencimento: "25/11", status: "Ativo" },
  { id: "9", nome: "Beatriz Rocha", responsavel: "Thiago Rocha", dataNascimento: "2014-12-18", categoria: "Juvenil", horario: "11h00", vencimento: "03/11", status: "Inativo" },
  { id: "10", nome: "Gabriel Martins", responsavel: "Renata Martins", dataNascimento: "2017-04-22", categoria: "Infantil", horario: "13h00", vencimento: "22/11", status: "Ativo" },
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
  { id: "8", quadra: "Quadra 2", dia: "Seg", horario: "09:00", alunos: 6, turmaId: "SE08" },
  { id: "9", quadra: "Quadra 1", dia: "Ter", horario: "09:00", alunos: 4, turmaId: "SE09" },
  { id: "10", quadra: "Quadra 3", dia: "Qua", horario: "11:00", alunos: 5, turmaId: "SE10" },
  { id: "11", quadra: "Quadra 1", dia: "Qui", horario: "13:00", alunos: 3, turmaId: "SE11" },
  { id: "12", quadra: "Quadra 2", dia: "Sex", horario: "15:00", alunos: 9, turmaId: "SE12" },
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
