// Tipos e constantes compartilhadas. Os dados reais vivem no Supabase
// e são gerenciados via AppContext. Os arrays "mock*" abaixo são vazios
// e mantidos apenas por compatibilidade com imports antigos.

export interface Plan {
  id: string;
  nome: string;
  valor: number;
  turno: string;
  frequencia: string;
  periodicidade: string;
}

export const mockPlans: Plan[] = [];

export const getFrequenciaCount = (frequencia: string): number => {
  if (frequencia.startsWith("1")) return 1;
  if (frequencia.startsWith("2")) return 2;
  if (frequencia.startsWith("3")) return 3;
  return 1;
};

export const CLASS_LIMIT = 6;

export interface Student {
  id: string;
  nome: string;
  whatsappAluno: string;
  responsavel: string;
  whatsappResponsavel: string;
  dataNascimento: string;
  sexo: "M" | "F";
  dataEntrada: string;
  categoria: "Infantil" | "Juvenil" | "Adulto";
  planoId: string;
  vencimento: string;
  status: "Ativo" | "Inativo" | "Em análise" | "Passado" | "Extras";
  camiseta?: "12" | "14" | "16" | "PP" | "P" | "M" | "G" | "GG";
  kit?: "Sim" | "Não";
}

export const mockStudents: Student[] = [];

export interface ClassSlot {
  id: string;
  quadra: string;
  dia: string;
  horario: string;
  turmaId: string;
}

export const mockSchedule: ClassSlot[] = [];

export interface Enrollment {
  id: string;
  alunoId: string;
  turmaId: string;
}

export const mockEnrollments: Enrollment[] = [];

export interface AttendanceLog {
  id: string;
  alunoId: string;
  turmaId: string;
  data: string;
  presente: "Presente" | "Falta" | "Cancelado" | "Miniliga" | "Reposição";
  dataRealizacao?: string;
}

export const mockAttendanceLogs: AttendanceLog[] = [];

// Legacy
export interface AttendanceRecord {
  alunoId: string;
  alunoNome: string;
  presente: boolean | null;
  horarioRegistro: string;
}

export const mockAttendance: AttendanceRecord[] = [];

export interface Revenue {
  id: string;
  alunoId?: string;
  aluno: string;
  plano: string;
  vencimento: string; // DD/MM/YYYY
  valor: number;
  status: "Pago" | "Em atraso" | "Gerada" | "Isento";
}

export const mockRevenue: Revenue[] = [];

export interface ExpenseLog {
  id: string;
  categoria: string;
  valor: number;
  data: string;
}

export const mockExpenseLogs: ExpenseLog[] = [];

export interface Expense {
  id: string;
  categoria: string;
  valor: number;
}

export const mockExpenseCategories: Expense[] = [];

export interface ScheduledPayment {
  id: string;
  fornecedor: string;
  valor: number;
  categoria: string;
  vencimento: string; // YYYY-MM-DD
  status: "Em Aberto" | "Pago";
}

export const mockScheduledPayments: ScheduledPayment[] = [];
