import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  if (br.includes("-")) return br; // já ISO
  const [d, m, y] = br.split("/");
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
  aluno_id: r.alunoId ?? null,
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
  table: any,
  oldArr: T[],
  newArr: T[],
  toDb: (item: any) => any
) {
  const oldIds = new Set(oldArr.map((x) => x.id));
  const newIds = new Set(newArr.map((x) => x.id));

  const toDelete = [...oldIds].filter((id) => !newIds.has(id));
  const toUpsert = newArr.filter((n) => {
    const old = oldArr.find((o) => o.id === n.id);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  if (toDelete.length > 0) {
    const { error } = await supabase.from(table).delete().in("id", toDelete);
    if (error) throw error;
  }
  if (toUpsert.length > 0) {
    const { error } = await supabase.from(table).upsert(toUpsert.map(toDb));
    if (error) throw error;
  }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [students, setStudentsState] = useState<Student[]>([]);
  const [enrollments, setEnrollmentsState] = useState<Enrollment[]>([]);
  const [revenues, setRevenuesState] = useState<Revenue[]>([]);
  const [lastSyncedRevenues, setLastSyncedRevenues] = useState<Revenue[]>([]);
  const [attendanceLogs, setAttendanceLogsState] = useState<AttendanceLog[]>([]);
  const [expenseLogs, setExpenseLogsState] = useState<ExpenseLog[]>([]);
  const [schedule, setScheduleState] = useState<ClassSlot[]>([]);
  const [plans, setPlansState] = useState<Plan[]>([]);
  const [scheduledPayments, setScheduledPaymentsState] = useState<ScheduledPayment[]>([]);
  const [expenseCategories, setExpenseCategoriesState] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync Engine: Monitora mudanças no estado e envia para o Supabase de forma segura
  useEffect(() => {
    if (loading || !user) return;
    
    // Evitar sync se for idêntico ao último sincronizado
    if (JSON.stringify(lastSyncedRevenues) === JSON.stringify(revenues)) return;

    const performSync = async () => {
      try {
        await syncTable("revenues", lastSyncedRevenues, revenues, revenueToDb);
        setLastSyncedRevenues([...revenues]);
      } catch (err) {
        console.error("Erro no Sync Engine (revenues):", err);
        // Não atualizamos o lastSynced para que ele tente novamente na próxima mudança ou refresh
      }
    };

    const timer = setTimeout(performSync, 500); // Pequeno debounce para agrupar múltiplas ações rápidas
    return () => clearTimeout(timer);
  }, [revenues, loading, user]);

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
        supabase.from("students").select("*"),
        supabase.from("plans").select("*"),
        supabase.from("schedule_slots").select("*"),
        supabase.from("enrollments").select("*"),
        supabase.from("revenues").select("*"),
        supabase.from("attendance_logs").select("*"),
        supabase.from("scheduled_payments").select("*"),
        supabase.from("expense_categories").select("*"),
      ]);
      if (cancelled) return;
      
      const loadedRevenues = (rRes.data ?? []).map(dbToRevenue);
      setStudentsState((sRes.data ?? []).map(dbToStudent));
      setEnrollmentsState((eRes.data ?? []).map(dbToEnrollment));
      setRevenuesState(loadedRevenues);
      setLastSyncedRevenues(loadedRevenues); // Sincroniza estado inicial
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

  // Wrapper genérico que aplica setState e sincroniza com o banco
  const makeSetter = <T extends { id: string }>(
    current: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    table: string,
    toDb: (x: any) => any
  ) => {
    return (u: Updater<T>) => {
      const next = typeof u === "function" ? (u as (p: T[]) => T[])(current) : u;
      setter(next);
      syncTable(table, current, next, toDb).catch((err) => {
        console.error(`Erro ao sincronizar ${table}:`, err);
      });
    };
  };

  const setStudents = makeSetter(students, setStudentsState, "students", studentToDb);
  const setEnrollments = makeSetter(enrollments, setEnrollmentsState, "enrollments", enrollmentToDb);
  const setAttendanceLogs = makeSetter(attendanceLogs, setAttendanceLogsState, "attendance_logs", attendanceToDb);
  const setSchedule = makeSetter(schedule, setScheduleState, "schedule_slots", slotToDb);
  const setPlans = makeSetter(plans, setPlansState, "plans", planToDb);
  const setExpenseCategories = makeSetter(expenseCategories, setExpenseCategoriesState, "expense_categories", expenseCategoryToDb);

  const setRevenues = (u: Updater<Revenue>) => {
    setRevenuesState((prev) => typeof u === "function" ? (u as (p: Revenue[]) => Revenue[])(prev) : u);
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
