import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type {
  Student,
  Enrollment,
  Revenue,
  AttendanceLog,
  ExpenseLog,
  ClassSlot,
  Plan,
  ScheduledPayment,
  Expense,
} from "@/data/mockData";

type Updater<T> = T[] | ((prev: T[]) => T[]);

interface AppContextType {
  students: Student[];
  setStudents: (u: Updater<Student>) => void;
  enrollments: Enrollment[];
  setEnrollments: (u: Updater<Enrollment>) => void;
  revenues: Revenue[];
  setRevenues: (u: Updater<Revenue>) => void;
  attendanceLogs: AttendanceLog[];
  setAttendanceLogs: (u: Updater<AttendanceLog>) => void;
  expenseLogs: ExpenseLog[];
  setExpenseLogs: (u: Updater<ExpenseLog>) => void;
  schedule: ClassSlot[];
  setSchedule: (u: Updater<ClassSlot>) => void;
  plans: Plan[];
  setPlans: (u: Updater<Plan>) => void;
  scheduledPayments: ScheduledPayment[];
  setScheduledPayments: (u: Updater<ScheduledPayment>) => void;
  expenseCategories: Expense[];
  setExpenseCategories: (u: Updater<Expense>) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ========== Mappers DB <-> App ==========
const dbToStudent = (r: any): Student => ({
  id: r.id,
  nome: r.nome,
  whatsappAluno: r.whatsapp_aluno ?? "",
  responsavel: r.responsavel ?? "",
  whatsappResponsavel: r.whatsapp_responsavel ?? "",
  dataNascimento: r.data_nascimento ?? "",
  sexo: (r.sexo as "M" | "F") ?? "M",
  dataEntrada: r.data_entrada,
  categoria: r.categoria,
  planoId: r.plano_id ?? "",
  vencimento: r.vencimento,
  status: r.status,
});
const studentToDb = (s: Partial<Student>) => ({
  ...(s.id ? { id: s.id } : {}),
  nome: s.nome,
  whatsapp_aluno: s.whatsappAluno || null,
  responsavel: s.responsavel || null,
  whatsapp_responsavel: s.whatsappResponsavel || null,
  data_nascimento: s.dataNascimento || null,
  sexo: s.sexo || null,
  data_entrada: s.dataEntrada,
  categoria: s.categoria,
  plano_id: s.planoId || null,
  vencimento: s.vencimento,
  status: s.status,
});

const dbToSlot = (r: any): ClassSlot => ({
  id: r.id,
  quadra: r.quadra,
  dia: r.dia,
  horario: r.horario,
  turmaId: r.turma_codigo,
});
const slotToDb = (s: Partial<ClassSlot>) => ({
  ...(s.id ? { id: s.id } : {}),
  quadra: s.quadra,
  dia: s.dia,
  horario: s.horario,
  turma_codigo: s.turmaId,
});

const dbToEnrollment = (r: any): Enrollment => ({
  id: r.id,
  alunoId: r.aluno_id,
  turmaId: r.turma_id,
});
const enrollmentToDb = (e: Partial<Enrollment>) => ({
  ...(e.id ? { id: e.id } : {}),
  aluno_id: e.alunoId,
  turma_id: e.turmaId,
});

const dbToAttendance = (r: any): AttendanceLog => ({
  id: r.id,
  alunoId: r.aluno_id,
  turmaId: r.turma_id,
  data: r.data,
  presente: r.presente as AttendanceLog["presente"],
});
const attendanceToDb = (a: Partial<AttendanceLog>) => ({
  ...(a.id ? { id: a.id } : {}),
  aluno_id: a.alunoId,
  turma_id: a.turmaId,
  data: a.data,
  presente: a.presente,
});

const dbToPlan = (r: any): Plan => ({
  id: r.id,
  nome: r.nome,
  valor: Number(r.valor),
  turno: r.turno,
  frequencia: r.frequencia,
  periodicidade: r.periodicidade,
});
const planToDb = (p: Partial<Plan>) => ({
  ...(p.id ? { id: p.id } : {}),
  nome: p.nome,
  valor: p.valor,
  turno: p.turno,
  frequencia: p.frequencia,
  periodicidade: p.periodicidade,
});

// Revenue: DB usa data ISO (YYYY-MM-DD), app usa DD/MM/YYYY no campo `vencimento`
const isoToBr = (iso?: string | null) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const brToIso = (br?: string | null) => {
  if (!br) return null;
  if (br.includes("-") && br.split("-")[0].length === 4) return br; // já ISO YYYY-MM-DD
  const parts = br.split("/");
  if (parts.length !== 3) return br;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};
const dbToRevenue = (r: any): Revenue => ({
  id: r.id,
  alunoId: r.aluno_id,
  aluno: r.aluno_nome,
  plano: r.plano_nome,
  vencimento: isoToBr(r.vencimento),
  valor: Number(r.valor),
  status: r.status,
});
const revenueToDb = (r: Partial<Revenue> & { alunoId?: string | null }) => ({
  ...(r.id ? { id: r.id } : {}),
  aluno_id: r.alunoId || null,
  aluno_nome: r.aluno,
  plano_nome: r.plano,
  vencimento: brToIso(r.vencimento),
  valor: r.valor,
  status: r.status,
});

const dbToScheduled = (r: any): ScheduledPayment => ({
  id: r.id,
  fornecedor: r.fornecedor,
  valor: Number(r.valor),
  categoria: r.categoria,
  vencimento: r.vencimento,
  status: r.status as ScheduledPayment["status"],
});
const scheduledToDb = (p: Partial<ScheduledPayment>) => ({
  ...(p.id ? { id: p.id } : {}),
  fornecedor: p.fornecedor,
  valor: p.valor,
  categoria: p.categoria,
  vencimento: p.vencimento,
  status: p.status,
});

const dbToExpenseCategory = (r: any): Expense => ({
  id: r.id,
  categoria: r.categoria,
  valor: Number(r.valor),
});
const expenseCategoryToDb = (e: Partial<Expense>) => ({
  ...(e.id ? { id: e.id } : {}),
  categoria: e.categoria,
  valor: e.valor,
});

// Diff helper: aplica novo array contra antigo, fazendo upsert/delete
async function syncTable<T extends { id: string }>(
  table: string,
  oldArr: T[],
  newArr: T[],
  toDb: (item: any) => any
) {
  const oldIds = new Set(oldArr.map((x) => x.id));
  const newIds = new Set(newArr.map((x) => x.id));

  // 1. Identificar Deções
  const toDelete = [...oldIds].filter((id) => !newIds.has(id));
  if (toDelete.length > 0) {
    const { error } = await supabase.from(table as any).delete().in("id", toDelete);
    if (error) {
      console.error(`Erro ao deletar em ${table}:`, error);
      throw error;
    }
  }

  // 2. Identificar Inserções (novos itens)
  const toInsert = newArr.filter((n) => !oldIds.has(n.id));
  if (toInsert.length > 0) {
    const { error } = await supabase.from(table as any).insert(toInsert.map(toDb));
    if (error) {
      console.error(`Erro ao inserir em ${table}:`, error);
      throw error;
    }
  }

  // 3. Identificar Updates (itens existentes que mudaram)
  const toUpdate = newArr.filter((n) => {
    const old = oldArr.find((o) => o.id === n.id);
    return old && JSON.stringify(old) !== JSON.stringify(n);
  });
  
  if (toUpdate.length > 0) {
    // Para updates, o Supabase upsert com IDs existentes funciona como update
    const { error } = await supabase.from(table as any).upsert(toUpdate.map(toDb));
    if (error) {
      console.error(`Erro ao atualizar em ${table}:`, error);
      throw error;
    }
  }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [students, setStudentsState] = useState<Student[]>([]);
  const [enrollments, setEnrollmentsState] = useState<Enrollment[]>([]);
  const [revenues, setRevenuesState] = useState<Revenue[]>([]);
  const [attendanceLogs, setAttendanceLogsState] = useState<AttendanceLog[]>([]);
  const [expenseLogs, setExpenseLogsState] = useState<ExpenseLog[]>([]);
  const [schedule, setScheduleState] = useState<ClassSlot[]>([]);
  const [plans, setPlansState] = useState<Plan[]>([]);
  const [scheduledPayments, setScheduledPaymentsState] = useState<ScheduledPayment[]>([]);
  const [expenseCategories, setExpenseCategoriesState] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Refs para garantir sincronização com o estado mais atualizado absoluto
  const revenuesRef = useRef<Revenue[]>([]);
  useEffect(() => { revenuesRef.current = revenues; }, [revenues]);

  const studentsRef = useRef<Student[]>([]);
  useEffect(() => { studentsRef.current = students; }, [students]);

  const scheduledPaymentsRef = useRef<ScheduledPayment[]>([]);
  useEffect(() => { scheduledPaymentsRef.current = scheduledPayments; }, [scheduledPayments]);

  // Carrega tudo do banco quando o usuário autentica
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [
        sRes,
        pRes,
        slRes,
        eRes,
        rRes,
        aRes,
        spRes,
        ecRes,
      ] = await Promise.all([
        supabase.from("students").select("*").limit(10000),
        supabase.from("plans").select("*").limit(10000),
        supabase.from("schedule_slots").select("*").limit(10000),
        supabase.from("enrollments").select("*").limit(10000),
        // FIX: limite de 10000 registros para evitar corte silencioso do Supabase (padrão = 1000)
        supabase.from("revenues").select("*").limit(10000),
        supabase.from("attendance_logs").select("*").limit(10000),
        supabase.from("scheduled_payments").select("*").limit(10000),
        supabase.from("expense_categories").select("*").limit(10000),
      ]);
      if (cancelled) return;
      
      const loadedRevenues = (rRes.data ?? []).map(dbToRevenue);
      setStudentsState((sRes.data ?? []).map(dbToStudent));
      setEnrollmentsState((eRes.data ?? []).map(dbToEnrollment));
      setRevenuesState(loadedRevenues);
      setAttendanceLogsState((aRes.data ?? []).map(dbToAttendance));
      setPlansState((pRes.data ?? []).map(dbToPlan));
      setScheduleState((slRes.data ?? []).map(dbToSlot));
      const sp = (spRes.data ?? []).map(dbToScheduled);
      setScheduledPaymentsState(sp);
      // expenseLogs derivados de pagamentos pagos
      setExpenseLogsState(
        sp
          .filter((p) => p.status === "Pago")
          .map((p) => ({ id: p.id, categoria: p.categoria, valor: p.valor, data: p.vencimento }))
      );
      setExpenseCategoriesState((ecRes.data ?? []).map(dbToExpenseCategory));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setRevenues = (u: Updater<Revenue>) => {
    const prev = revenuesRef.current;
    const next = typeof u === "function" ? (u as (p: Revenue[]) => Revenue[])(prev) : u;
    setRevenuesState(next);
    syncTable("revenues", prev, next, revenueToDb)
      .then(() => toast.success("Registrado no banco de dados!"))
      .catch((err) => {
        console.error("Erro ao sincronizar revenues:", err);
        toast.error("Falha ao salvar no servidor. Verifique sua conexão.");
      });
  };

  const setStudents = (u: Updater<Student>) => {
    const prev = studentsRef.current;
    const next = typeof u === "function" ? (u as (p: Student[]) => Student[])(prev) : u;
    setStudentsState(next);
    syncTable("students", prev, next, studentToDb).catch(e => console.error(e));
  };

  const setEnrollments = (u: Updater<Enrollment>) => {
    setEnrollmentsState((prev) => {
      const next = typeof u === "function" ? (u as (p: Enrollment[]) => Enrollment[])(prev) : u;
      syncTable("enrollments", prev, next, enrollmentToDb).catch(e => console.error(e));
      return next;
    });
  };

  const setAttendanceLogs = (u: Updater<AttendanceLog>) => {
    setAttendanceLogsState((prev) => {
      const next = typeof u === "function" ? (u as (p: AttendanceLog[]) => AttendanceLog[])(prev) : u;
      syncTable("attendance_logs", prev, next, attendanceToDb).catch(e => console.error(e));
      return next;
    });
  };

  const setSchedule = (u: Updater<ClassSlot>) => {
    setScheduleState((prev) => {
      const next = typeof u === "function" ? (u as (p: ClassSlot[]) => ClassSlot[])(prev) : u;
      syncTable("schedule_slots", prev, next, slotToDb).catch(e => console.error(e));
      return next;
    });
  };

  const setPlans = (u: Updater<Plan>) => {
    setPlansState((prev) => {
      const next = typeof u === "function" ? (u as (p: Plan[]) => Plan[])(prev) : u;
      syncTable("plans", prev, next, planToDb).catch(e => console.error(e));
      return next;
    });
  };

  const setExpenseCategories = (u: Updater<Expense>) => {
    setExpenseCategoriesState((prev) => {
      const next = typeof u === "function" ? (u as (p: Expense[]) => Expense[])(prev) : u;
      syncTable("expense_categories", prev, next, expenseCategoryToDb).catch(e => console.error(e));
      return next;
    });
  };

  const setScheduledPayments = (u: Updater<ScheduledPayment>) => {
    const next = typeof u === "function" ? (u as (p: ScheduledPayment[]) => ScheduledPayment[])(scheduledPayments) : u;
    setScheduledPaymentsState(next);
    // refresh expense logs derivados
    setExpenseLogsState(
      next
        .filter((p) => p.status === "Pago")
        .map((p) => ({ id: p.id, categoria: p.categoria, valor: p.valor, data: p.vencimento }))
    );
    syncTable("scheduled_payments", scheduledPayments, next, scheduledToDb).catch((err) =>
      console.error("Erro ao sincronizar scheduled_payments:", err)
    );
  };

  // ExpenseLogs é derivado, mas mantemos o setter por compat (no-op, calcula via scheduledPayments)
  const setExpenseLogs = (_u: Updater<ExpenseLog>) => {
    // não persistido diretamente — derive via scheduled_payments
  };

  return (
    <AppContext.Provider
      value={{
        students,
        setStudents,
        enrollments,
        setEnrollments,
        revenues,
        setRevenues,
        attendanceLogs,
        setAttendanceLogs,
        expenseLogs,
        setExpenseLogs,
        schedule,
        setSchedule,
        plans,
        setPlans,
        scheduledPayments,
        setScheduledPayments,
        expenseCategories,
        setExpenseCategories,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};
