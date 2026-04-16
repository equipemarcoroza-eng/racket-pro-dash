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
  whatsappAluno: string;
  responsavel: string;
  whatsappResponsavel: string;
  dataNascimento: string;
  sexo: "M" | "F";
  dataEntrada: string;
  categoria: "Infantil" | "Juvenil" | "Adulto";
  planoId: string;
  vencimento: string;
  status: "Ativo" | "Inativo" | "Em análise";
}

export const mockStudents: Student[] = [
  { id: "1", nome: "Marina Oliveira", whatsappAluno: "(11) 99999-0001", responsavel: "Paula Oliveira", whatsappResponsavel: "(11) 98888-7777", dataNascimento: "2012-05-10", sexo: "F", dataEntrada: "2024-01-15", categoria: "Juvenil", planoId: "2", vencimento: "05", status: "Ativo" },
  { id: "2", nome: "Diego Fernandes", whatsappAluno: "(11) 99999-0002", responsavel: "Carlos Fernandes", whatsappResponsavel: "(11) 97777-6666", dataNascimento: "2000-03-22", sexo: "M", dataEntrada: "2023-11-05", categoria: "Adulto", planoId: "3", vencimento: "10", status: "Ativo" },
  { id: "3", nome: "Lucas Pereira", whatsappAluno: "(11) 99999-0003", responsavel: "Ana Pereira", whatsappResponsavel: "(11) 96666-5555", dataNascimento: "2015-08-15", sexo: "M", dataEntrada: "2024-02-10", categoria: "Infantil", planoId: "1", vencimento: "10", status: "Ativo" },
  { id: "4", nome: "Sofia Almeida", whatsappAluno: "(11) 99999-0004", responsavel: "Marcos Almeida", whatsappResponsavel: "(11) 95555-4444", dataNascimento: "2010-01-20", sexo: "F", dataEntrada: "2024-03-01", categoria: "Juvenil", planoId: "2", vencimento: "15", status: "Em análise" },
  { id: "5", nome: "Mariana Costa", whatsappAluno: "(11) 99999-0005", responsavel: "Roberto Costa", whatsappResponsavel: "(11) 94444-3333", dataNascimento: "1995-11-30", sexo: "F", dataEntrada: "2023-08-20", categoria: "Adulto", planoId: "1", vencimento: "20", status: "Ativo" },
  { id: "6", nome: "Pedro Santos", whatsappAluno: "(11) 99999-0006", responsavel: "Lucia Santos", whatsappResponsavel: "(11) 93333-2222", dataNascimento: "2013-07-12", sexo: "M", dataEntrada: "2024-01-05", categoria: "Juvenil", planoId: "1", vencimento: "10", status: "Ativo" },
  { id: "7", nome: "Juliana Lima", whatsappAluno: "(11) 99999-0007", responsavel: "Fernando Lima", whatsappResponsavel: "(11) 92222-1111", dataNascimento: "2016-02-28", sexo: "F", dataEntrada: "2024-04-10", categoria: "Infantil", planoId: "2", vencimento: "20", status: "Ativo" },
  { id: "8", nome: "Rafael Souza", whatsappAluno: "(11) 99999-0008", responsavel: "Carla Souza", whatsappResponsavel: "(11) 91111-0000", dataNascimento: "1998-09-05", sexo: "M", dataEntrada: "2023-09-15", categoria: "Adulto", planoId: "1", vencimento: "25", status: "Ativo" },
  { id: "9", nome: "Beatriz Rocha", whatsappAluno: "(11) 99999-0009", responsavel: "Thiago Rocha", whatsappResponsavel: "(11) 90000-9999", dataNascimento: "2014-12-18", sexo: "F", dataEntrada: "2024-02-25", categoria: "Juvenil", planoId: "3", vencimento: "05", status: "Inativo" },
  { id: "10", nome: "Gabriel Martins", whatsappAluno: "(11) 99999-0010", responsavel: "Renata Martins", whatsappResponsavel: "(11) 99999-8888", dataNascimento: "2017-04-22", sexo: "M", dataEntrada: "2024-03-20", categoria: "Infantil", planoId: "2", vencimento: "20", status: "Ativo" },
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
  { id: "1", quadra: "Quadra 1", dia: "Seg", horario: "07:00", turmaId: "BTsegQ107" },
  { id: "2", quadra: "Quadra 2", dia: "Ter", horario: "07:00", turmaId: "BTterQ207" },
  { id: "3", quadra: "Quadra 1", dia: "Qua", horario: "07:00", turmaId: "BTquaQ107" },
  { id: "4", quadra: "Quadra 3", dia: "Qui", horario: "07:00", turmaId: "BTquiQ307" },
  { id: "5", quadra: "Quadra 2", dia: "Sex", horario: "07:00", turmaId: "BTsexQ207" },
  { id: "6", quadra: "Quadra 1", dia: "Sáb", horario: "07:00", turmaId: "BTsabQ107" },
  { id: "7", quadra: "Quadra 3", dia: "Dom", horario: "07:00", turmaId: "BTdomQ307" },
  { id: "8", quadra: "Quadra 2", dia: "Seg", horario: "09:00", turmaId: "BTsegQ209" },
  { id: "9", quadra: "Quadra 1", dia: "Ter", horario: "09:00", turmaId: "BTterQ109" },
  { id: "10", quadra: "Quadra 3", dia: "Qua", horario: "11:00", turmaId: "BTquaQ311" },
  { id: "11", quadra: "Quadra 1", dia: "Qui", horario: "13:00", turmaId: "BTquiQ113" },
  { id: "12", quadra: "Quadra 2", dia: "Sex", horario: "15:00", turmaId: "BTsexQ215" },
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
  // 2025 Records
  { id: "101", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/01/2025", valor: 220, status: "Pago" },
  { id: "102", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/01/2025", valor: 350, status: "Pago" },
  { id: "103", aluno: "Lucas Pereira", plano: "Plano Básico", vencimento: "10/01/2025", valor: 120, status: "Pago" },
  { id: "104", aluno: "Mariana Costa", plano: "Plano Básico", vencimento: "20/01/2025", valor: 120, status: "Pago" },
  { id: "105", aluno: "Pedro Santos", plano: "Plano Básico", vencimento: "10/01/2025", valor: 120, status: "Pago" },
  { id: "106", aluno: "Juliana Lima", plano: "Plano Avançado", vencimento: "20/01/2025", valor: 220, status: "Pago" },
  
  { id: "107", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/02/2025", valor: 220, status: "Pago" },
  { id: "108", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/02/2025", valor: 350, status: "Pago" },
  { id: "109", aluno: "Lucas Pereira", plano: "Plano Básico", vencimento: "10/02/2025", valor: 120, status: "Pago" },
  { id: "110", aluno: "Rafael Souza", plano: "Plano Básico", vencimento: "25/02/2025", valor: 120, status: "Pago" },
  
  { id: "111", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/03/2025", valor: 220, status: "Pago" },
  { id: "112", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/03/2025", valor: 350, status: "Pago" },
  { id: "113", aluno: "Gabriel Martins", plano: "Plano Avançado", vencimento: "20/03/2025", valor: 220, status: "Pago" },
  
  { id: "114", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/04/2025", valor: 220, status: "Pago" },
  { id: "115", aluno: "Pedro Santos", plano: "Plano Básico", vencimento: "10/04/2025", valor: 120, status: "Pago" },
  { id: "116", aluno: "Juliana Lima", plano: "Plano Avançado", vencimento: "20/04/2025", valor: 220, status: "Pago" },
  
  { id: "117", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/05/2025", valor: 220, status: "Pago" },
  { id: "118", aluno: "Mariana Costa", plano: "Plano Básico", vencimento: "20/05/2025", valor: 120, status: "Pago" },
  { id: "119", aluno: "Rafael Souza", plano: "Plano Básico", vencimento: "25/05/2025", valor: 120, status: "Pago" },

  { id: "120", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/06/2025", valor: 350, status: "Pago" },
  { id: "121", aluno: "Lucas Pereira", plano: "Plano Básico", vencimento: "10/06/2025", valor: 120, status: "Pago" },
  { id: "122", aluno: "Gabriel Martins", plano: "Plano Avançado", vencimento: "20/06/2025", valor: 220, status: "Pago" },

  { id: "123", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/07/2025", valor: 220, status: "Pago" },
  { id: "124", aluno: "Pedro Santos", plano: "Plano Básico", vencimento: "10/07/2025", valor: 120, status: "Pago" },
  { id: "125", aluno: "Juliana Lima", plano: "Plano Avançado", vencimento: "20/07/2025", valor: 220, status: "Pago" },

  { id: "126", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/08/2025", valor: 350, status: "Pago" },
  { id: "127", aluno: "Mariana Costa", plano: "Plano Básico", vencimento: "20/08/2025", valor: 120, status: "Pago" },
  { id: "128", aluno: "Rafael Souza", plano: "Plano Básico", vencimento: "25/08/2025", valor: 120, status: "Pago" },

  { id: "129", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/09/2025", valor: 220, status: "Pago" },
  { id: "130", aluno: "Lucas Pereira", plano: "Plano Básico", vencimento: "10/09/2025", valor: 120, status: "Pago" },
  { id: "131", aluno: "Gabriel Martins", plano: "Plano Avançado", vencimento: "20/09/2025", valor: 220, status: "Pago" },

  { id: "132", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/10/2025", valor: 220, status: "Pago" },
  { id: "133", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/10/2025", valor: 350, status: "Pago" },
  { id: "134", aluno: "Pedro Santos", plano: "Plano Básico", vencimento: "10/10/2025", valor: 120, status: "Pago" },

  { id: "135", aluno: "Juliana Lima", plano: "Plano Avançado", vencimento: "20/11/2025", valor: 220, status: "Pago" },
  { id: "136", aluno: "Mariana Costa", plano: "Plano Básico", vencimento: "20/11/2025", valor: 120, status: "Pago" },
  { id: "137", aluno: "Rafael Souza", plano: "Plano Básico", vencimento: "25/11/2025", valor: 120, status: "Pago" },

  { id: "138", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/12/2025", valor: 220, status: "Pago" },
  { id: "139", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/12/2025", valor: 350, status: "Pago" },
  { id: "140", aluno: "Lucas Pereira", plano: "Plano Básico", vencimento: "10/12/2025", valor: 120, status: "Pago" },

  // 2026 Records
  { id: "141", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/01/2026", valor: 220, status: "Pago" },
  { id: "142", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/01/2026", valor: 350, status: "Pago" },
  { id: "143", aluno: "Gabriel Martins", plano: "Plano Avançado", vencimento: "20/01/2026", valor: 220, status: "Pago" },

  { id: "144", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/02/2026", valor: 220, status: "Pago" },
  { id: "145", aluno: "Pedro Santos", plano: "Plano Básico", vencimento: "10/02/2026", valor: 120, status: "Pago" },
  { id: "146", aluno: "Juliana Lima", plano: "Plano Avançado", vencimento: "20/02/2026", valor: 220, status: "Pago" },

  { id: "147", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/03/2026", valor: 220, status: "Pago" },
  { id: "148", aluno: "Mariana Costa", plano: "Plano Básico", vencimento: "20/03/2026", valor: 120, status: "Pago" },
  { id: "149", aluno: "Rafael Souza", plano: "Plano Básico", vencimento: "25/03/2026", valor: 120, status: "Pago" },

  { id: "150", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/04/2026", valor: 220, status: "Pago" },
  { id: "151", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/04/2026", valor: 350, status: "Pago" },
  { id: "152", aluno: "Lucas Pereira", plano: "Plano Básico", vencimento: "10/04/2026", valor: 120, status: "Pago" },
  { id: "153", aluno: "Gabriel Martins", plano: "Plano Avançado", vencimento: "20/04/2026", valor: 220, status: "Em atraso" },
  { id: "154", aluno: "Pedro Santos", plano: "Plano Básico", vencimento: "10/04/2026", valor: 120, status: "Pago" },

  { id: "155", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/05/2026", valor: 220, status: "Gerada" },
  { id: "156", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/05/2026", valor: 350, status: "Gerada" },
  { id: "157", aluno: "Juliana Lima", plano: "Plano Avançado", vencimento: "20/05/2026", valor: 220, status: "Gerada" },
  { id: "158", aluno: "Mariana Costa", plano: "Plano Básico", vencimento: "20/05/2026", valor: 120, status: "Gerada" },
  { id: "159", aluno: "Rafael Souza", plano: "Plano Básico", vencimento: "25/05/2026", valor: 120, status: "Gerada" },

  { id: "160", aluno: "Marina Oliveira", plano: "Plano Avançado", vencimento: "05/06/2026", valor: 220, status: "Gerada" },
  { id: "161", aluno: "Diego Fernandes", plano: "Pacote Premium", vencimento: "10/06/2026", valor: 350, status: "Gerada" },
  { id: "162", aluno: "Lucas Pereira", plano: "Plano Básico", vencimento: "10/06/2026", valor: 120, status: "Gerada" },
  { id: "163", aluno: "Gabriel Martins", plano: "Plano Avançado", vencimento: "20/06/2026", valor: 220, status: "Gerada" },
  { id: "164", aluno: "Pedro Santos", plano: "Plano Básico", vencimento: "10/06/2026", valor: 120, status: "Gerada" },
  { id: "165", aluno: "Juliana Lima", plano: "Plano Avançado", vencimento: "20/06/2026", valor: 220, status: "Gerada" },
];

// Expenses
export interface ExpenseLog {
  id: string;
  categoria: string;
  valor: number;
  data: string; // "2026-04-07"
}

export const mockExpenseLogs: ExpenseLog[] = [
  // 2025 Expenses
  { id: "x101", categoria: "Aluguel", valor: 18000, data: "2025-01-05" },
  { id: "x102", categoria: "Materiais", valor: 8200, data: "2025-01-12" },
  { id: "x103", categoria: "Professores freelancers", valor: 9500, data: "2025-01-28" },
  
  { id: "x104", categoria: "Aluguel", valor: 18000, data: "2025-02-05" },
  { id: "x105", categoria: "Serviços terceirizados", valor: 4200, data: "2025-02-15" },
  { id: "x106", categoria: "Manutenção", valor: 2100, data: "2025-02-20" },

  { id: "x107", categoria: "Aluguel", valor: 18500, data: "2025-03-05" },
  { id: "x108", categoria: "Materiais", valor: 9100, data: "2025-03-10" },
  { id: "x109", categoria: "Professores freelancers", valor: 10400, data: "2025-03-25" },

  { id: "x110", categoria: "Aluguel", valor: 18500, data: "2025-04-05" },
  { id: "x111", categoria: "Manutenção", valor: 3200, data: "2025-04-18" },

  { id: "x112", categoria: "Aluguel", valor: 18500, data: "2025-05-05" },
  { id: "x113", categoria: "Materiais", valor: 7500, data: "2025-05-15" },

  { id: "x114", categoria: "Aluguel", valor: 18500, data: "2025-06-05" },
  { id: "x115", categoria: "Professores freelancers", valor: 11200, data: "2025-06-25" },

  { id: "x116", categoria: "Aluguel", valor: 18500, data: "2025-07-05" },
  { id: "x117", categoria: "Manutenção", valor: 1800, data: "2025-07-12" },

  { id: "x118", categoria: "Aluguel", valor: 18500, data: "2025-08-05" },
  { id: "x119", categoria: "Materiais", valor: 10500, data: "2025-08-20" },

  { id: "x120", categoria: "Aluguel", valor: 18500, data: "2025-09-05" },
  { id: "x121", categoria: "Serviços terceirizados", valor: 5100, data: "2025-09-15" },

  { id: "x122", categoria: "Aluguel", valor: 19000, data: "2025-10-05" },
  { id: "x123", categoria: "Professores freelancers", valor: 12100, data: "2025-10-25" },

  { id: "x124", categoria: "Aluguel", valor: 19000, data: "2025-11-05" },
  { id: "x125", categoria: "Manutenção", valor: 4500, data: "2025-11-18" },

  { id: "x126", categoria: "Aluguel", valor: 19000, data: "2025-12-05" },
  { id: "x127", categoria: "Materiais", valor: 12500, data: "2025-12-20" },

  // 2026 Expenses
  { id: "x128", categoria: "Aluguel", valor: 19000, data: "2026-01-05" },
  { id: "x129", categoria: "Professores freelancers", valor: 10800, data: "2026-01-25" },
  
  { id: "x130", categoria: "Aluguel", valor: 19000, data: "2026-02-05" },
  { id: "x131", categoria: "Serviços terceirizados", valor: 4800, data: "2026-02-15" },

  { id: "x132", categoria: "Aluguel", valor: 19000, data: "2026-03-05" },
  { id: "x133", categoria: "Materiais", valor: 11200, data: "2026-03-20" },

  { id: "x134", categoria: "Aluguel", valor: 20000, data: "2026-04-05" },
  { id: "x135", categoria: "Professores freelancers", valor: 11500, data: "2026-04-10" },
  { id: "x136", categoria: "Manutenção", valor: 2800, data: "2026-04-12" },

  { id: "x137", categoria: "Aluguel", valor: 20000, data: "2026-05-05" },
  { id: "x138", categoria: "Materiais", valor: 9800, data: "2026-05-15" },

  { id: "x139", categoria: "Aluguel", valor: 20000, data: "2026-06-05" },
  { id: "x140", categoria: "Serviços terceirizados", valor: 5500, data: "2026-06-20" },
];

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
  vencimento: string;
  status: "Em Aberto" | "Pago";
}

export const mockScheduledPayments: ScheduledPayment[] = [
  { id: "1", fornecedor: "Fornecedor A", valor: 5200, categoria: "Materiais", vencimento: "2026-04-10", status: "Em Aberto" },
  { id: "2", fornecedor: "Fornecedor B", valor: 3600, categoria: "Serviços terceirizados", vencimento: "2026-04-15", status: "Em Aberto" },
  { id: "3", fornecedor: "Fornecedor C", valor: 4100, categoria: "Manutenção", vencimento: "2026-04-20", status: "Em Aberto" },
  { id: "4", fornecedor: "Fornecedor D", valor: 2800, categoria: "Materiais", vencimento: "2026-04-25", status: "Em Aberto" },
  { id: "5", fornecedor: "Fornecedor E", valor: 1500, categoria: "Outros", vencimento: "2026-04-05", status: "Em Aberto" },
];
