import { createContext, useContext, useState, type ReactNode } from "react";
import { mockStudents, mockEnrollments, mockRevenue, mockAttendanceLogs, mockExpenseLogs, mockSchedule, type Student, type Enrollment, type Revenue, type AttendanceLog, type ExpenseLog, type ClassSlot } from "@/data/mockData";

interface AppContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  enrollments: Enrollment[];
  setEnrollments: React.Dispatch<React.SetStateAction<Enrollment[]>>;
  revenues: Revenue[];
  setRevenues: React.Dispatch<React.SetStateAction<Revenue[]>>;
  attendanceLogs: AttendanceLog[];
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceLog[]>>;
  expenseLogs: ExpenseLog[];
  setExpenseLogs: React.Dispatch<React.SetStateAction<ExpenseLog[]>>;
  schedule: ClassSlot[];
  setSchedule: React.Dispatch<React.SetStateAction<ClassSlot[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(mockEnrollments);
  const [revenues, setRevenues] = useState<Revenue[]>(mockRevenue);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(mockAttendanceLogs);
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>(mockExpenseLogs);
  const [schedule, setSchedule] = useState<ClassSlot[]>(mockSchedule);

  return (
    <AppContext.Provider value={{ 
      students, setStudents, 
      enrollments, setEnrollments, 
      revenues, setRevenues,
      attendanceLogs, setAttendanceLogs,
      expenseLogs, setExpenseLogs,
      schedule, setSchedule
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};

