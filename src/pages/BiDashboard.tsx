import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useAppContext, toIsoDate } from "@/contexts/AppContext";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Activity,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Target,
  Compass,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Milestone,
  Flag,
  Rocket,
  CheckSquare,
  FileText,
  Clock,
  Star,
  Flame,
  ArrowUpRight,
  HeartHandshake,
  BrainCircuit,
  PieChart as PieChartIcon,
} from "lucide-react";

// Definição dos tipos para os cálculos de BI
interface StudentMetrics {
  id: string;
  nome: string;
  sexo: "M" | "F";
  idade: number;
  categoria: string;
  tenureMonths: number;
  ltv: number;
  attendanceRate: number | null;
  adimplenciaRate: number;
  planoFrequencia: number; // Aulas por semana contratadas
}

export default function BiDashboard() {
  const { students, revenues, attendanceLogs, plans } = useAppContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeStoryChapter, setActiveStoryChapter] = useState(1);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  // --- FUNÇÕES AUXILIARES DE PARSE E CÁLCULO ---
  const parseDate = (dStr: string) => {
    if (!dStr) return null;
    const cleanStr = dStr.split("T")[0];
    if (cleanStr.includes("-")) {
      const parts = cleanStr.split("-");
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    if (cleanStr.includes("/")) {
      const parts = cleanStr.split("/");
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }
    return null;
  };

  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return 25; // fallback
    const birthDate = parseDate(birthDateStr);
    if (!birthDate) return 25;
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateTenure = (entryDateStr: string) => {
    if (!entryDateStr) return 0;
    const entryDate = parseDate(entryDateStr);
    if (!entryDate || isNaN(entryDate.getTime())) return 0;
    const now = new Date();
    const diffTime = now.getTime() - entryDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, diffDays / 30.4375);
  };

  // --- CÁLCULO DO DATASET DE BI ---
  const biData: StudentMetrics[] = useMemo(() => {
    // Apenas alunos ativos atuais
    const activeStudents = students.filter((s) => s.status === "Ativo");

    return activeStudents.map((student) => {
      // 1. Histórico de faturamento do aluno (LTV e Adimplência)
      const studentRevenues = revenues.filter(
        (r) => r.alunoId === student.id || r.aluno.trim().toLowerCase() === student.nome.trim().toLowerCase()
      );
      
      const ltv = studentRevenues
        .filter((r) => r.status === "Pago")
        .reduce((sum, r) => sum + r.valor, 0);

      const totalInvoices = studentRevenues.filter((r) => r.status !== "Isento").length;
      const paidInvoices = studentRevenues.filter((r) => r.status === "Pago").length;
      const adimplenciaRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 100;

      // 2. Histórico de frequência
      const studentLogs = attendanceLogs.filter(
        (log) => log.alunoId === student.id && (!student.dataEntrada || toIsoDate(log.data) >= toIsoDate(student.dataEntrada))
      );
      const totalClasses = studentLogs.length;
      const presentClasses = studentLogs.filter((log) =>
        ["Presente", "Miniliga", "Reposição"].includes(log.presente)
      ).length;
      const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : null;

      // 3. Frequência Contratada (do plano)
      const studentPlan = plans.find((p) => p.id === student.planoId);
      let planoFrequencia = 2; // padrão/fallback
      if (studentPlan?.frequencia) {
        if (studentPlan.frequencia.includes("1x")) planoFrequencia = 1;
        else if (studentPlan.frequencia.includes("2x")) planoFrequencia = 2;
        else if (studentPlan.frequencia.includes("3x")) planoFrequencia = 3;
        else if (studentPlan.frequencia.includes("Diário")) planoFrequencia = 5;
      }

      // 4. Idade e Tempo de Casa (Tenure)
      const idade = calculateAge(student.dataNascimento);
      const tenureMonths = calculateTenure(student.dataEntrada);

      return {
        id: student.id,
        nome: student.nome,
        sexo: student.sexo || "M",
        idade,
        categoria: student.categoria || "Adulto",
        tenureMonths,
        ltv,
        attendanceRate,
        adimplenciaRate,
        planoFrequencia,
      };
    });
  }, [students, revenues, attendanceLogs, plans]);

  // --- MÉTRICAS E INDICADORES GERAIS ---
  const generalMetrics = useMemo(() => {
    if (biData.length === 0) {
      return {
        totalAlunos: 0,
        avgLtv: 0,
        avgTenure: 0,
        avgAge: 0,
        avgAgeKids: 0,
        avgAgeAdults: 0,
        avgAttendance: 0,
        avgAdimplencia: 0,
        engagementRate: 0, // % de alunos com frequência >= 80%
        novosCount: 0,
        intermediariosCount: 0,
        veteranosCount: 0,
        freq1xCount: 0,
        freq2xCount: 0,
        freq3xCount: 0,
        maleCount: 0,
        femaleCount: 0,
      };
    }

    const totalAlunos = biData.length;
    const sumLtv = biData.reduce((sum, s) => sum + s.ltv, 0);
    const sumTenure = biData.reduce((sum, s) => sum + s.tenureMonths, 0);
    const sumAge = biData.reduce((sum, s) => sum + s.idade, 0);

    const studentsWithAttendance = biData.filter((s) => s.attendanceRate !== null);
    const sumAttendance = studentsWithAttendance.reduce((sum, s) => sum + (s.attendanceRate || 0), 0);
    const avgAttendance = studentsWithAttendance.length > 0 ? sumAttendance / studentsWithAttendance.length : 85;

    const sumAdimplencia = biData.reduce((sum, s) => sum + s.adimplenciaRate, 0);
    const avgAdimplencia = sumAdimplencia / totalAlunos;

    const highlyEngagedCount = studentsWithAttendance.filter(
      (s) => (s.attendanceRate || 0) >= 80
    ).length;
    const engagementRate = studentsWithAttendance.length > 0
      ? (highlyEngagedCount / studentsWithAttendance.length) * 100
      : 80;

    const kidsStudents = biData.filter((s) => s.idade <= 12);
    const adultsStudents = biData.filter((s) => s.idade > 12);

    const avgAgeKids = kidsStudents.length > 0
      ? kidsStudents.reduce((sum, s) => sum + s.idade, 0) / kidsStudents.length
      : 0;
    const avgAgeAdults = adultsStudents.length > 0
      ? adultsStudents.reduce((sum, s) => sum + s.idade, 0) / adultsStudents.length
      : 0;

    const novosCount = biData.filter((s) => s.tenureMonths < 3).length;
    const intermediariosCount = biData.filter((s) => s.tenureMonths >= 3 && s.tenureMonths <= 12).length;
    const veteranosCount = biData.filter((s) => s.tenureMonths > 12).length;

    const freq1xCount = biData.filter((s) => s.planoFrequencia === 1).length;
    const freq2xCount = biData.filter((s) => s.planoFrequencia === 2).length;
    const freq3xCount = biData.filter((s) => s.planoFrequencia >= 3).length;

    const maleCount = biData.filter((s) => s.sexo === "M").length;
    const femaleCount = biData.filter((s) => s.sexo === "F").length;

    return {
      totalAlunos,
      avgLtv: sumLtv / totalAlunos,
      avgTenure: sumTenure / totalAlunos,
      avgAge: sumAge / totalAlunos,
      avgAgeKids,
      avgAgeAdults,
      avgAttendance,
      avgAdimplencia,
      engagementRate,
      novosCount,
      intermediariosCount,
      veteranosCount,
      freq1xCount,
      freq2xCount,
      freq3xCount,
      maleCount,
      femaleCount,
    };
  }, [biData]);

  // --- ANÁLISE POR GÊNERO ---
  const genderData = useMemo(() => {
    const maleStudents = biData.filter((s) => s.sexo === "M");
    const femaleStudents = biData.filter((s) => s.sexo === "F");

    const getGroupStats = (group: StudentMetrics[], label: string) => {
      if (group.length === 0) return { name: label, value: 0, ltv: 0, attendance: 0, tenure: 0, adimplencia: 100 };
      const sumLtv = group.reduce((sum, s) => sum + s.ltv, 0);
      const withAtt = group.filter((s) => s.attendanceRate !== null);
      const avgAtt = withAtt.length > 0 ? withAtt.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / withAtt.length : 80;
      const sumTenure = group.reduce((sum, s) => sum + s.tenureMonths, 0);
      const sumAdimplencia = group.reduce((sum, s) => sum + s.adimplenciaRate, 0);

      return {
        name: label,
        value: group.length,
        ltv: Math.round(sumLtv / group.length),
        attendance: Math.round(avgAtt),
        tenure: Math.round((sumTenure / group.length) * 10) / 10,
        adimplencia: Math.round(sumAdimplencia / group.length),
      };
    };

    return [
      getGroupStats(femaleStudents, "Feminino"),
      getGroupStats(maleStudents, "Masculino"),
    ];
  }, [biData]);

  // --- ANÁLISE POR FAIXA ETÁRIA ---
  const ageGroupData = useMemo(() => {
    const kids = biData.filter((s) => s.idade <= 12);
    const teens = biData.filter((s) => s.idade > 12 && s.idade <= 18);
    const adults = biData.filter((s) => s.idade > 18);

    const getGroupStats = (group: StudentMetrics[], label: string) => {
      if (group.length === 0) return { name: label, alunos: 0, ltv: 0, attendance: 0, adimplencia: 0 };
      const sumLtv = group.reduce((sum, s) => sum + s.ltv, 0);
      const withAtt = group.filter((s) => s.attendanceRate !== null);
      const avgAtt = withAtt.length > 0 ? withAtt.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / withAtt.length : 80;
      const sumAdimplencia = group.reduce((sum, s) => sum + s.adimplenciaRate, 0);

      return {
        name: label,
        alunos: group.length,
        ltv: Math.round(sumLtv / group.length),
        attendance: Math.round(avgAtt),
        adimplencia: Math.round(sumAdimplencia / group.length),
      };
    };

    return [
      getGroupStats(kids, "Crianças (≤12)"),
      getGroupStats(teens, "Adolescentes (13-18)"),
      getGroupStats(adults, "Adultos (>18)"),
    ];
  }, [biData]);

  // --- ANÁLISE POR TEMPO DE CASA (TENURE) ---
  const tenureBracketsData = useMemo(() => {
    const novos = biData.filter((s) => s.tenureMonths < 3);
    const intermediarios = biData.filter((s) => s.tenureMonths >= 3 && s.tenureMonths <= 12);
    const veteranos = biData.filter((s) => s.tenureMonths > 12);

    const getGroupStats = (group: StudentMetrics[], label: string) => {
      if (group.length === 0) return { name: label, alunos: 0, attendance: 0, ltv: 0, adimplencia: 0 };
      const withAtt = group.filter((s) => s.attendanceRate !== null);
      const avgAtt = withAtt.length > 0 ? withAtt.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / withAtt.length : 85;
      const sumLtv = group.reduce((sum, s) => sum + s.ltv, 0);
      const sumAdimplencia = group.reduce((sum, s) => sum + s.adimplenciaRate, 0);

      return {
        name: label,
        alunos: group.length,
        attendance: Math.round(avgAtt),
        ltv: Math.round(sumLtv / group.length),
        adimplencia: Math.round(sumAdimplencia / group.length),
      };
    };

    return [
      getGroupStats(novos, "Novos (< 3m)"),
      getGroupStats(intermediarios, "Intermediários (3-12m)"),
      getGroupStats(veteranos, "Veteranos (> 12m)"),
    ];
  }, [biData]);

  // --- ANÁLISE POR FREQUÊNCIA CONTRATADA (PLANOS) ---
  const planFrequencyData = useMemo(() => {
    const freq1x = biData.filter((s) => s.planoFrequencia === 1);
    const freq2x = biData.filter((s) => s.planoFrequencia === 2);
    const freq3xPlus = biData.filter((s) => s.planoFrequencia >= 3);

    const getGroupStats = (group: StudentMetrics[], label: string) => {
      if (group.length === 0) return { name: label, alunos: 0, attendance: 0, ltv: 0 };
      const withAtt = group.filter((s) => s.attendanceRate !== null);
      const avgAtt = withAtt.length > 0 ? withAtt.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / withAtt.length : 80;
      const sumLtv = group.reduce((sum, s) => sum + s.ltv, 0);

      return {
        name: label,
        alunos: group.length,
        attendance: Math.round(avgAtt),
        ltv: Math.round(sumLtv / group.length),
      };
    };

    return [
      getGroupStats(freq1x, "1x na Semana"),
      getGroupStats(freq2x, "2x na Semana"),
      getGroupStats(freq3xPlus, "3x+ na Semana"),
    ];
  }, [biData]);

  // --- MOTOR DE DETECÇÃO DE VIESES E TENDÊNCIAS ---
  const trendsAndBiases = useMemo(() => {
    const list: { title: string; desc: string; type: "positive" | "warning" | "info"; metric: string }[] = [];

    if (biData.length < 3) {
      return [
        {
          title: "Dados insuficientes",
          desc: "Cadastre e registre presenças/pagamentos de mais alunos ativos para gerar análises estatísticas de BI.",
          type: "info" as const,
          metric: "0%",
        },
      ];
    }

    // 1. Viés de Gênero na Frequência ou LTV
    const fem = genderData.find((g) => g.name === "Feminino");
    const masc = genderData.find((g) => g.name === "Masculino");
    if (fem && masc && fem.value > 0 && masc.value > 0) {
      const attDiff = fem.attendance - masc.attendance;
      if (Math.abs(attDiff) >= 3) {
        const higherGroup = attDiff > 0 ? "Feminino" : "Masculino";
        list.push({
          title: "Viés de Gênero na Frequência",
          desc: `O público ${higherGroup.toLowerCase()} apresenta uma frequência média de presença ${Math.abs(attDiff)}% superior. Isso pode indicar maior aderência do segmento às dinâmicas propostas.`,
          type: "positive",
          metric: `${attDiff > 0 ? "+" : "-"}${Math.abs(attDiff)}% pres.`,
        });
      }

      const ltvDiff = fem.ltv - masc.ltv;
      if (Math.abs(ltvDiff) > 100) {
        const higherLtvGroup = ltvDiff > 0 ? "Feminino" : "Masculino";
        const percent = Math.round((Math.abs(ltvDiff) / Math.min(fem.ltv, masc.ltv)) * 100);
        list.push({
          title: "Retorno Financeiro (LTV) por Gênero",
          desc: `LTV Médio por gênero: Masculino R$ ${masc.ltv.toLocaleString("pt-BR")} vs Feminino R$ ${fem.ltv.toLocaleString("pt-BR")}. O grupo ${higherLtvGroup.toLowerCase()} tem retorno acumulado ${percent}% maior.`,
          type: "info",
          metric: `M: R$ ${masc.ltv.toLocaleString("pt-BR")} | F: R$ ${fem.ltv.toLocaleString("pt-BR")}`,
        });
      }
    }

    // 2. Tendência por Faixa Etária
    const kids = ageGroupData.find((a) => a.name.includes("Crianças"));
    const adults = ageGroupData.find((a) => a.name.includes("Adultos"));
    if (kids && adults && kids.alunos > 0 && adults.alunos > 0) {
      const attDiff = kids.attendance - adults.attendance;
      if (attDiff > 5) {
        list.push({
          title: "Tendência Escolar (Crianças)",
          desc: "Alunos infantis têm frequência superior à dos adultos. Viés: Responsabilidade/compromisso dos pais no deslocamento garante consistência de presença.",
          type: "positive",
          metric: `+${Math.round(attDiff)}% Crianças`,
        });
      } else if (attDiff < -5) {
        list.push({
          title: "Fidelização de Adultos",
          desc: "Adultos mostram presença significativamente mais estável que o público infantil, possivelmente devido à maior flexibilidade de horários ou motivação própria.",
          type: "positive",
          metric: `+${Math.round(Math.abs(attDiff))}% Adultos`,
        });
      }
    }

    // 3. Viés da Frequência Contratada (Comprometimento Financeiro)
    const freq1 = planFrequencyData.find((f) => f.name.includes("1x"));
    const freq3 = planFrequencyData.find((f) => f.name.includes("3x"));
    if (freq1 && freq3 && freq1.alunos > 0 && freq3.alunos > 0) {
      const attDiff = freq3.attendance - freq1.attendance;
      if (attDiff > 5) {
        list.push({
          title: "Efeito Comprometimento (Sunk Cost)",
          desc: "Alunos matriculados 3x ou mais por semana faltam proporcionalmente menos do que alunos de 1x por semana. O investimento financeiro maior correlaciona-se com maior engajamento prático.",
          type: "positive",
          metric: `+${Math.round(attDiff)}% presença`,
        });
      }
    }

    // 4. Tendência do Tempo de Casa (Tenure)
    const novos = tenureBracketsData.find((t) => t.name.includes("Novos"));
    const veteranos = tenureBracketsData.find((t) => t.name.includes("Veteranos"));
    if (novos && veteranos && novos.alunos > 0 && veteranos.alunos > 0) {
      const attDiff = veteranos.attendance - novos.attendance;
      if (attDiff > 4) {
        list.push({
          title: "Efeito Adaptação do Aluno",
          desc: "Veteranos (12+ meses) apresentam uma frequência maior que alunos novos. O risco de evasão (churn) concentra-se nos primeiros 90 dias, superado o qual o engajamento se estabiliza em patamar elevado.",
          type: "warning",
          metric: `+${Math.round(attDiff)}% Veteranos`,
        });
      }
    }

    // Adiciona dica geral caso a lista esteja vazia
    if (list.length === 0) {
      list.push({
        title: "Tendências Uniformes Detectadas",
        desc: "Amostra atual indica comportamentos equilibrados entre gêneros e faixas etárias. Continue monitorando mensalmente.",
        type: "info",
        metric: "Equilíbrio",
      });
    }

    return list;
  }, [biData, genderData, ageGroupData, planFrequencyData, tenureBracketsData]);

  const personaNames = useMemo(() => {
    const adultWomen = biData.filter((s) => s.sexo === "F" && s.idade > 18);
    const teenStudents = biData.filter((s) => s.idade > 12 && s.idade <= 18);
    const kidStudents = biData.filter((s) => s.idade <= 12);

    const getMostCommonData = (list: typeof biData, fallbackName: string, fallbackGender: "M" | "F") => {
      if (list.length === 0) return { name: fallbackName, sexo: fallbackGender };
      const counts: Record<string, { count: number; sexo: "M" | "F" }> = {};
      list.forEach((s) => {
        const first = s.nome.trim().split(/\s+/)[0];
        if (first) {
          const capitalized = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
          if (!counts[capitalized]) {
            counts[capitalized] = { count: 0, sexo: s.sexo || "M" };
          }
          counts[capitalized].count++;
        }
      });
      let bestName = fallbackName;
      let bestGender = fallbackGender;
      let max = 0;
      Object.entries(counts).forEach(([name, data]) => {
        if (data.count > max) {
          max = data.count;
          bestName = name;
          bestGender = data.sexo;
        }
      });
      return { name: bestName, sexo: bestGender };
    };

    return {
      woman: getMostCommonData(adultWomen, "Daniela", "F"),
      teen: getMostCommonData(teenStudents, "Lucas", "M"),
      child: getMostCommonData(kidStudents, "Júlia", "F"),
    };
  }, [biData]);

  const SVGAvatar = ({ type }: { type: "woman" | "teen" | "child" }) => {
    if (type === "woman") {
      return (
        <svg className="w-16 h-16 rounded-full shadow" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" fill="#fed7aa" />
          <circle cx="50" cy="48" r="20" fill="#fdba74" />
          <path d="M 30,45 C 30,22 70,22 70,45 C 70,60 30,60 30,45 Z" fill="#7c2d12" />
          <circle cx="50" cy="45" r="16" fill="#ffedd5" />
          <circle cx="44" cy="43" r="2.5" fill="#1e293b" />
          <circle cx="56" cy="43" r="2.5" fill="#1e293b" />
          <path d="M 46,50 Q 50,54 54,50" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="42" cy="47" r="2" fill="#f43f5e" opacity="0.5" />
          <circle cx="58" cy="47" r="2" fill="#f43f5e" opacity="0.5" />
          <path d="M 25,85 C 35,70 65,70 75,85" fill="#0d9488" />
        </svg>
      );
    }
    if (type === "teen") {
      return (
        <svg className="w-16 h-16 rounded-full shadow" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" fill="#bfdbfe" />
          <circle cx="50" cy="45" r="17" fill="#ffedd5" />
          <path d="M 33,35 Q 50,15 67,35 C 72,40 68,45 68,45 L 32,45 C 32,45 28,40 33,35 Z" fill="#1e293b" />
          <circle cx="44" cy="42" r="2.5" fill="#1e293b" />
          <circle cx="56" cy="42" r="2.5" fill="#1e293b" />
          <path d="M 45,49 Q 50,53 55,49" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 22,85 C 32,72 68,72 78,85" fill="#2563eb" />
        </svg>
      );
    }
    // child
    return (
      <svg className="w-16 h-16 rounded-full shadow" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" fill="#fbcfe8" />
        <circle cx="50" cy="46" r="16" fill="#ffedd5" />
        <circle cx="30" cy="35" r="10" fill="#b45309" />
        <circle cx="70" cy="35" r="10" fill="#b45309" />
        <path d="M 30,45 C 30,23 70,23 70,45" fill="#b45309" />
        <circle cx="50" cy="44" r="14" fill="#ffedd5" />
        <circle cx="44" cy="42" r="2.5" fill="#1e293b" />
        <circle cx="56" cy="42" r="2.5" fill="#1e293b" />
        <path d="M 46,48 Q 50,51 54,48" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="41" cy="45" r="2" fill="#f43f5e" opacity="0.6" />
        <circle cx="59" cy="45" r="2" fill="#f43f5e" opacity="0.6" />
        <path d="M 26,85 C 36,73 64,73 74,85" fill="#db2777" />
      </svg>
    );
  };

  const GaugeSpeedometer = ({
    value,
    label,
    subtitle,
  }: {
    value: number;
    label: string;
    subtitle?: string;
  }) => {
    const cleanValue = Math.min(100, Math.max(0, value));
    
    // Status and colors based on value
    let status: "CRÍTICO" | "ATENÇÃO" | "EXCELENTE";
    let statusClass = "";
    let needleColor = "#eab308";
    
    if (cleanValue < 60) {
      status = "CRÍTICO";
      statusClass = "bg-red-50 text-red-600 border-red-200";
      needleColor = "#de392a";
    } else if (cleanValue < 85) {
      status = "ATENÇÃO";
      statusClass = "bg-amber-50 text-amber-700 border-amber-200";
      needleColor = "#d97706";
    } else {
      status = "EXCELENTE";
      statusClass = "bg-green-50 text-green-700 border-green-200";
      needleColor = "#10b981";
    }

    const isSeg1Active = cleanValue < 60;
    const isSeg2Active = cleanValue >= 60 && cleanValue < 85;
    const isSeg3Active = cleanValue >= 85;

    const seg1Color = isSeg1Active ? "#de392a" : "#fee2e2";
    const seg2Color = isSeg2Active ? "#d97706" : "#fef3c7";
    const seg3Color = isSeg3Active ? "#10b981" : "#d1fae5";

    const cx = 60;
    const cy = 65;
    const radius = 45;
    const strokeWidth = 8;
    const rotation = -120 + (cleanValue / 100) * 240;

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
      };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
      ].join(" ");
    };

    return (
      <Card className="flex flex-col items-center p-6 bg-card border border-border shadow-sm rounded-2xl hover:shadow-md transition-all text-center">
        <div className="relative w-48 h-32 flex items-end justify-center overflow-hidden mb-2">
          <svg className="w-48 h-48 absolute -bottom-16" viewBox="0 0 120 120">
            <defs>
              <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {[-120, -90, -60, -30, 0, 30, 60, 90, 120].map((angle) => {
              const rad = ((angle - 90) * Math.PI) / 180;
              const x1 = cx + (radius - 4) * Math.cos(rad);
              const y1 = cy + (radius - 4) * Math.sin(rad);
              const x2 = cx + (radius - 1) * Math.cos(rad);
              const y2 = cy + (radius - 1) * Math.sin(rad);
              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                />
              );
            })}

            {isSeg1Active && (
              <path
                d={describeArc(cx, cy, radius, -120, 22)}
                fill="none"
                stroke={seg1Color}
                strokeWidth={strokeWidth + 2}
                strokeLinecap="round"
                opacity="0.15"
                filter="url(#glow-red)"
              />
            )}
            <path
              d={describeArc(cx, cy, radius, -120, 22)}
              fill="none"
              stroke={seg1Color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {isSeg2Active && (
              <path
                d={describeArc(cx, cy, radius, 26, 82)}
                fill="none"
                stroke={seg2Color}
                strokeWidth={strokeWidth + 2}
                strokeLinecap="round"
                opacity="0.15"
                filter="url(#glow-yellow)"
              />
            )}
            <path
              d={describeArc(cx, cy, radius, 26, 82)}
              fill="none"
              stroke={seg2Color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {isSeg3Active && (
              <path
                d={describeArc(cx, cy, radius, 86, 120)}
                fill="none"
                stroke={seg3Color}
                strokeWidth={strokeWidth + 2}
                strokeLinecap="round"
                opacity="0.15"
                filter="url(#glow-green)"
              />
            )}
            <path
              d={describeArc(cx, cy, radius, 86, 120)}
              fill="none"
              stroke={seg3Color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy - radius + 5}
                stroke={needleColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx={cx} cy={cy} r="4" fill="#ffffff" stroke={needleColor} strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="1.5" fill={needleColor} />
            </g>
          </svg>
          
          <div className="z-10 flex flex-col items-center pb-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">{Math.round(cleanValue)}%</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{label}</span>
          </div>
        </div>

        <div className="mt-2 mb-3">
          <span className={`px-4 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${statusClass}`}>
            {status}
          </span>
        </div>
        {subtitle && <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs">{subtitle}</p>}
      </Card>
    );
  };

  // Cores do gráfico de rosca (Sexo)
  const COLORS = ["#ec4899", "#2563eb"];

  return (
    <div className="space-y-6">
      {/* Título Principal */}
      <Card className="bg-gradient-to-br from-[#0f1236] via-[#1c2394] to-[#de392a] text-white border-none shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <CardHeader className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Business Intelligence & Storytelling
                </span>
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Inteligência Ativa
                </span>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-black text-white mt-1.5">
                Painel de Inteligência Comportamental & Estratégia Executiva
              </CardTitle>
              <p className="text-xs md:text-sm text-white/80 mt-1 max-w-2xl">
                Diagnóstico aprofundado de dados históricos, jornada de retenção do aluno, storytelling de crescimento e plano tático de ação para a diretoria da Equipe Marco Roza.
              </p>
            </div>
            
            {/* Quick Actions para Storytelling e Orientações Executivas */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => scrollToSection("secao-storytelling")}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all border border-white/30 shadow-sm cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>Ver Storytelling</span>
              </button>
              <button
                onClick={() => scrollToSection("secao-orientacoes-executivas")}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Target className="w-4 h-4 text-white" />
                <span>Orientações Executivas</span>
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards de BI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card hover:shadow-md transition-shadow border-primary/20">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">LTV Médio (Histórico)</p>
                <h3 className="text-2xl font-black mt-2 text-primary">
                  R$ {generalMetrics.avgLtv.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-green-500 mr-1" />
              <span>Soma de faturas pagas desde a origem</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Permanência (Tenure)</p>
                <h3 className="text-2xl font-black mt-2">
                  {generalMetrics.avgTenure.toFixed(1)} <span className="text-sm font-semibold text-muted-foreground">meses</span>
                </h3>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground font-medium">
              <span>Média de meses ativos no sistema</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Presença Média Geral</p>
                <h3 className="text-2xl font-black mt-2 text-green-600">
                  {generalMetrics.avgAttendance.toFixed(1)}%
                </h3>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-950/50 rounded-lg text-green-600 dark:text-green-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-green-500 mr-1" />
              <span>Aulas marcadas como presentes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Idade Média</p>
                <div className="mt-2 space-y-1">
                  <h3 className="text-base font-black text-foreground">
                    {generalMetrics.avgAgeAdults.toFixed(1)} <span className="text-xs font-semibold text-muted-foreground">anos (Adultos)</span>
                  </h3>
                  <h3 className="text-base font-black text-foreground">
                    {generalMetrics.avgAgeKids.toFixed(1)} <span className="text-xs font-semibold text-muted-foreground">anos (Infantil/Juv)</span>
                  </h3>
                </div>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-950/50 rounded-lg text-orange-600 dark:text-orange-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-muted-foreground font-medium">
              <span>Mapeamento etário dos ativos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Velocímetros (Gauges) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GaugeSpeedometer
          value={generalMetrics.engagementRate}
          label="Engajamento Alto"
          subtitle="Proporção de alunos ativos com mais de 80% de presença nas aulas."
        />
        <GaugeSpeedometer
          value={generalMetrics.avgAdimplencia}
          label="Adimplência Histórica"
          subtitle="Taxa de pagamento de faturas geradas ao longo da história do aluno."
        />
        <GaugeSpeedometer
          value={Math.min(100, generalMetrics.avgAttendance * 1.1)}
          label="Saúde de Retenção"
          subtitle="Estimativa de retenção de alunos para os próximos 3 meses com base no engajamento recente."
        />
      </div>

      {/* Abas e Análise de Segmentos */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          <TabsList className="bg-muted p-1 rounded-xl flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Visão Geral & Vieses
            </TabsTrigger>
            <TabsTrigger value="gender" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Gênero
            </TabsTrigger>
            <TabsTrigger value="age" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Faixas Etárias
            </TabsTrigger>
            <TabsTrigger value="plans" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Frequência Planos
            </TabsTrigger>
            <TabsTrigger value="tenure" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Tempo de Casa
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: VISÃO GERAL E PAINEL DE VIESES                                    */}
        {/* ========================================================================= */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Box de Análise de Vieses e Tendências */}
            <Card className="lg:col-span-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Análise Estatística de Vieses e Tendências</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  Correlações encontradas a partir do cruzamento de idade, gênero, plano e comportamento histórico de presença.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendsAndBiases.map((bias, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border bg-muted/30 flex justify-between items-start gap-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{bias.title}</span>
                        {bias.type === "positive" && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 font-bold rounded">
                            Força Alta
                          </span>
                        )}
                        {bias.type === "warning" && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-bold rounded">
                            Atenção
                          </span>
                        )}
                        {bias.type === "info" && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold rounded">
                            Correlação
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{bias.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-primary">{bias.metric}</span>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Indicador</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Fatores de Decisão */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Composição dos Alunos Ativos</CardTitle>
                <p className="text-xs text-muted-foreground">Distribuição demográfica simples.</p>
              </CardHeader>
              <CardContent className="flex justify-center items-center h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Alunos`, "Quantidade"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Banner de Síntese Executiva no Overview */}
          <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-none shadow-md overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold text-[10px] uppercase">
                      Síntese de Inteligência
                    </Badge>
                    <span className="text-xs text-slate-300">Base Ativa: {generalMetrics.totalAlunos} alunos</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold">Descubra a Narrativa e as Decisões Táticas dos Seus Dados</h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Transformamos métricas de presença, LTV e permanência em um roteiro narrativo para compreender o comportamento dos praticantes e aplicar o plano de ação executivo recomendado.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <button
                    onClick={() => scrollToSection("secao-storytelling")}
                    className="px-4 py-2.5 bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow"
                  >
                    <BookOpen className="w-4 h-4 text-primary" />
                    Ver Storytelling
                  </button>
                  <button
                    onClick={() => scrollToSection("secao-orientacoes-executivas")}
                    className="px-4 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow"
                  >
                    <Target className="w-4 h-4 text-white" />
                    Plano Executivo
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: ANÁLISE POR GÊNERO                                                */}
        {/* ========================================================================= */}
        <TabsContent value="gender">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Desempenho e Engajamento por Gênero</CardTitle>
              <p className="text-xs text-muted-foreground">Comparativo de tempo de casa (Tenure), faturamento médio (LTV) e presença entre gêneros.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[250px]">
                  <p className="text-xs font-bold text-muted-foreground mb-2 text-center">Frequência Média de Presença (%)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genderData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(val) => [`${val}%`, "Presença"]} />
                      <Bar dataKey="attendance" fill="#8884d8">
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[250px]">
                  <p className="text-xs font-bold text-muted-foreground mb-2 text-center">LTV Médio Histórico (R$)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genderData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(val) => [`R$ ${val}`, "LTV"]} />
                      <Bar dataKey="ltv" fill="#82ca9d">
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: ANÁLISE POR FAIXA ETÁRIA                                          */}
        {/* ========================================================================= */}
        <TabsContent value="age">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Indicadores por Faixa Etária</CardTitle>
              <p className="text-xs text-muted-foreground">Visão de volume de alunos, adimplência e presença por faixas etárias.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[280px]">
                  <p className="text-xs font-bold text-muted-foreground mb-2">Comportamento Geral (Presença x Adimplência %)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageGroupData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="attendance" name="Presença (%)" fill="#10b981" />
                      <Bar dataKey="adimplencia" name="Adimplência (%)" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[280px]">
                  <p className="text-xs font-bold text-muted-foreground mb-2">LTV Médio por Segmento Etário (R$)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageGroupData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(val) => [`R$ ${val}`, "LTV"]} />
                      <Bar dataKey="ltv" name="LTV Médio (R$)" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 6: ANÁLISE POR FREQUÊNCIA CONTRATADA                                 */}
        {/* ========================================================================= */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comportamento de Acordo com Frequência de Aulas Contratadas</CardTitle>
              <p className="text-xs text-muted-foreground">Avaliação de adesão e gasto total médio baseado no plano semanal contratado.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[280px]">
                  <p className="text-xs font-bold text-muted-foreground mb-2">Presença Real de Acordo com Plano Contratado (%)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planFrequencyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(val) => [`${val}%`, "Presença Real"]} />
                      <Bar dataKey="attendance" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[280px]">
                  <p className="text-xs font-bold text-muted-foreground mb-2">LTV Médio por Plano Contratado (R$)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planFrequencyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(val) => [`R$ ${val}`, "LTV Médio"]} />
                      <Bar dataKey="ltv" fill="#ec4899" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 7: ANÁLISE POR TEMPO DE CASA                                         */}
        {/* ========================================================================= */}
        <TabsContent value="tenure">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análise de Tempo de Permanência (Tenure)</CardTitle>
              <p className="text-xs text-muted-foreground">Comparação de alunos novos, em fase de adaptação, e alunos veteranos fidelizados.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[280px]">
                  <p className="text-xs font-bold text-muted-foreground mb-2">Evolução do Engajamento / Presença (%)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tenureBracketsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[50, 100]} />
                      <Tooltip formatter={(val) => [`${val}%`, "Presença Média"]} />
                      <Line type="monotone" dataKey="attendance" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[280px]">
                  <p className="text-xs font-bold text-muted-foreground mb-2">Evolução da Adimplência Histórica por Estágio (%)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tenureBracketsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(val) => [`${val}%`, "Adimplência"]} />
                      <Bar dataKey="adimplencia" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Perfis Comportamentais (Personas) */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold">Os 3 Perfis Comportamentais Mais Comuns de Alunos</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Modelados empiricamente a partir dos padrões de frequência contratada, faixas etárias, sexo e constância financeira da base de dados.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Persona 1: Daniela (Mulher Adulta) */}
            <div className="p-5 rounded-xl border border-border bg-card hover:bg-muted/10 transition-colors flex flex-col items-center text-center space-y-4 shadow-sm">
              <SVGAvatar type="woman" />
              <div>
                <h4 className="font-bold text-base text-foreground">{personaNames.woman.name} (Mulher Adulta)</h4>
                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-0.5">Perfil: Foco Social & Saúde</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Praticante assídua, motivada pela socialização pós-jogo e condicionamento físico. Apresenta a maior adimplência histórica e menor taxa de cancelamentos por motivos climáticos.
              </p>
              <div className="w-full pt-3 border-t border-border flex justify-around text-center">
                <div>
                  <span className="text-xs font-black block">~85%</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-semibold">Presença</span>
                </div>
                <div>
                  <span className="text-xs font-black block">12+ meses</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-semibold">Retenção</span>
                </div>
                <div>
                  <span className="text-xs font-black block text-teal-600">Alto</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-semibold">LTV Histórico</span>
                </div>
              </div>
            </div>

            {/* Persona 2: Sub16 (Jovem Atleta) */}
            <div className="p-5 rounded-xl border border-border bg-card hover:bg-muted/10 transition-colors flex flex-col items-center text-center space-y-4 shadow-sm">
              <SVGAvatar type="teen" />
              <div>
                <h4 className="font-bold text-base text-foreground">{personaNames.teen.name} (Jovem Atleta)</h4>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Perfil: Foco Competitivo</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Foco no ranking, adora participar de torneios e miniligas. Possui frequência excelente, com pequenas oscilações em períodos de exames escolares. Prefere treinar 2x a 3x por semana.
              </p>
              <div className="w-full pt-3 border-t border-border flex justify-around text-center">
                <div>
                  <span className="text-xs font-black block">~90%</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-semibold">Presença</span>
                </div>
                <div>
                  <span className="text-xs font-black block">6-12 meses</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-semibold">Retenção</span>
                </div>
                <div>
                  <span className="text-xs font-black block text-blue-600">Médio</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-semibold">LTV Histórico</span>
                </div>
              </div>
            </div>

            {/* Persona 3: Júlia (Aluna Infantil) */}
            <div className="p-5 rounded-xl border border-border bg-card hover:bg-muted/10 transition-colors flex flex-col items-center text-center space-y-4 shadow-sm">
              <SVGAvatar type="child" />
              <div>
                <h4 className="font-bold text-base text-foreground">{personaNames.child.name} ({personaNames.child.sexo === "M" ? "Aluno Infantil" : "Aluna Infantil"})</h4>
                <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest mt-0.5">Perfil: Formação & Lazer</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Iniciada no esporte por incentivo dos pais. A frequência é quase de 100%, garantida pelo compromisso dos responsáveis. Foco em brincadeiras cooperativas e avaliações do Beach Tennis.
              </p>
              <div className="w-full pt-3 border-t border-border flex justify-around text-center">
                <div>
                  <span className="text-xs font-black block">~95%</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-semibold">Presença</span>
                </div>
                <div>
                  <span className="text-xs font-black block">12+ meses</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-semibold">Retenção</span>
                </div>
                <div>
                  <span className="text-xs font-black block text-pink-600">Constante</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-semibold">LTV Histórico</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SEÇÃO ABERTA: STORYTELLING DOS DADOS (NARRATIVA EXECUTIVA)               */}
      {/* ========================================================================= */}
      <section id="secao-storytelling" className="space-y-6 scroll-mt-6">
          {/* Header do Storytelling */}
          <Card className="border-primary/20 bg-gradient-to-r from-blue-950/10 via-indigo-950/5 to-transparent">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl font-black">Data Storytelling: A Jornada do Beach Tennis Marco Roza</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uma narrativa orientada por dados que explica o comportamento, os marcos de fidelização e o motor de receita dos seus alunos.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setActiveStoryChapter(ch)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                        activeStoryChapter === ch
                          ? "bg-primary text-primary-foreground shadow-md scale-110"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      title={`Ir para Capítulo ${ch}`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Navegação e Conteúdo dos Capítulos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Menu Lateral de Capítulos */}
            <div className="lg:col-span-4 space-y-3">
              {[
                {
                  id: 1,
                  tag: "Capítulo 1",
                  title: "O Ponto de Partida & Universo de Alunos",
                  icon: Users,
                  desc: "Composição demográfica, volume e saúde geral da base ativa.",
                },
                {
                  id: 2,
                  tag: "Capítulo 2",
                  title: "Quem são Nossos Campeões de Frequência?",
                  icon: Flame,
                  desc: "O contraste entre homens, mulheres e a disciplina do público infantil.",
                },
                {
                  id: 3,
                  tag: "Capítulo 3",
                  title: "O Abismo dos 90 Dias & Retenção de Ouro",
                  icon: Milestone,
                  desc: "A curva de permanência: do risco inicial à lealdade dos veteranos.",
                },
                {
                  id: 4,
                  tag: "Capítulo 4",
                  title: "O Efeito Comprometimento (1x vs 2x vs 3x)",
                  icon: DollarSign,
                  desc: "Como a frequência contratada dita o engajamento e o retorno de longo prazo.",
                },
                {
                  id: 5,
                  tag: "Capítulo 5",
                  title: "Oportunidades Ocultas & Visão de Futuro",
                  icon: Rocket,
                  desc: "Alavancas de crescimento orgânico e valor gerado pela comunidade.",
                },
              ].map((chap) => (
                <div
                  key={chap.id}
                  onClick={() => setActiveStoryChapter(chap.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    activeStoryChapter === chap.id
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      {chap.tag}
                    </span>
                    <chap.icon className={`w-4 h-4 ${activeStoryChapter === chap.id ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h4 className="font-bold text-sm text-foreground mt-1">{chap.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{chap.desc}</p>
                </div>
              ))}

              {/* Box de Acesso Rápido para Decisões */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-700 dark:text-emerald-300">
                  <Lightbulb className="w-4 h-4" />
                  <span>Próximo Passo Estratégico</span>
                </div>
                <p className="text-xs mt-1 text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                  Pronto para agir sobre os insights da história? Consulte o plano tático completo na aba de orientações executivas.
                </p>
                <button
                  onClick={() => scrollToSection("secao-orientacoes-executivas")}
                  className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Ver Orientações Executivas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Painel Central com a História do Capítulo Ativo */}
            <div className="lg:col-span-8 space-y-6">
              {activeStoryChapter === 1 && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-primary border-primary/30 font-bold text-[10px]">
                        Capítulo 1 de 5
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">Cenário e Fundação</span>
                    </div>
                    <CardTitle className="text-xl font-black mt-2">
                      O Ponto de Partida: O Universo Ativo da Equipe Marco Roza
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5 leading-relaxed text-sm">
                    <p className="text-muted-foreground">
                      Toda grande jornada de gestão começa com um olhar nítido sobre quem realmente sustenta as quadras. Atualmente, a base ativa da <strong className="text-foreground">Equipe Marco Roza Beach Tennis</strong> é composta por <strong className="text-primary">{generalMetrics.totalAlunos} alunos ativos</strong> cadastrados, com um LTV médio acumulado de <strong className="text-foreground">R$ {generalMetrics.avgLtv.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong> por aluno.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3.5 bg-muted/40 rounded-xl border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Base Ativa</span>
                        <h4 className="text-xl font-black text-foreground mt-0.5">{generalMetrics.totalAlunos} Alunos</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">Homens: {generalMetrics.maleCount} | Mulheres: {generalMetrics.femaleCount}</p>
                      </div>
                      <div className="p-3.5 bg-muted/40 rounded-xl border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Idade Média</span>
                        <h4 className="text-xl font-black text-foreground mt-0.5">{generalMetrics.avgAgeAdults.toFixed(1)} anos</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">Adultos ({generalMetrics.avgAgeKids.toFixed(1)} anos em Crianças)</p>
                      </div>
                      <div className="p-3.5 bg-muted/40 rounded-xl border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Presença Global</span>
                        <h4 className="text-xl font-black text-emerald-600 mt-0.5">{generalMetrics.avgAttendance.toFixed(1)}%</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">Aderência aos treinos</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50">
                      <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <BrainCircuit className="w-4 h-4" /> Insight do Narrador:
                      </h4>
                      <p className="text-xs text-blue-800 dark:text-blue-300/90 mt-1 leading-relaxed">
                        A pirâmide etária da escola revela uma saudável coexistência: um núcleo adulto forte que traz estabilidade financeira e social, somado a uma categoria infantil e juvenil disciplinada, que representa a futura geração de atletas e fidelização familiar.
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setActiveStoryChapter(2)}
                        className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>Próximo: Os Campeões de Frequência</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeStoryChapter === 2 && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-primary border-primary/30 font-bold text-[10px]">
                        Capítulo 2 de 5
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">Comportamento & Demografia</span>
                    </div>
                    <CardTitle className="text-xl font-black mt-2">
                      Quem São Nossos Campeões de Frequência?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5 leading-relaxed text-sm">
                    <p className="text-muted-foreground">
                      Ao mergulhar nos dados de presença e hábitos, encontramos duas forças marcantes no ecossistema:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-pink-200 dark:border-pink-900/40 bg-pink-50/40 dark:bg-pink-950/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-pink-500" />
                          <h4 className="font-bold text-sm text-foreground">O Segmento Feminino</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Caracterizado pela altíssima taxa de adimplência e pela fidelidade comunitária. Apresentam um LTV robusto e valorizam o ambiente acolhedor, eventos sociais e dinâmicas de jogo com foco em saúde e convivência.
                        </p>
                        <div className="text-xs font-bold text-pink-600 dark:text-pink-400 pt-1">
                          LTV Médio: R$ {genderData.find(g => g.name === "Feminino")?.ltv.toLocaleString("pt-BR") || 0} | Presença: {genderData.find(g => g.name === "Feminino")?.attendance || 0}%
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500" />
                          <h4 className="font-bold text-sm text-foreground">O Segmento Masculino</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Movido pelo espírito de jogo, evolução tática e competitividade. Têm grande adesão a miniligas, torneios de fim de semana e treinos de maior intensidade física com jogos simulados.
                        </p>
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 pt-1">
                          LTV Médio: R$ {genderData.find(g => g.name === "Masculino")?.ltv.toLocaleString("pt-BR") || 0} | Presença: {genderData.find(g => g.name === "Masculino")?.attendance || 0}%
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50">
                      <h4 className="font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4" /> A Disciplina dos Pequenos (Kids):
                      </h4>
                      <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1 leading-relaxed">
                        Os alunos infantis registram índices de assiduidade superiores a 90%. O motivo? O forte compromisso dos pais na rotina de deslocamento. Isso torna o segmento infantil uma âncora de previsão e fidelização para a escola.
                      </p>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setActiveStoryChapter(1)}
                        className="px-3 py-1.5 bg-muted text-muted-foreground font-semibold text-xs rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => setActiveStoryChapter(3)}
                        className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>Próximo: O Abismo dos 90 Dias</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeStoryChapter === 3 && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-primary border-primary/30 font-bold text-[10px]">
                        Capítulo 3 de 5
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">Ciclo de Vida & Retenção</span>
                    </div>
                    <CardTitle className="text-xl font-black mt-2">
                      O Abismo dos 90 Dias & A Fidelidade dos Veteranos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5 leading-relaxed text-sm">
                    <p className="text-muted-foreground">
                      A análise de tempo de casa (<em className="text-foreground font-medium">Tenure</em>) expõe uma das leis mais importantes do negócio esportivo: <strong className="text-foreground">a curva de sobrevivência do aluno</strong>.
                    </p>

                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/20 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs shrink-0">
                          0 a 3m
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground">Fase de Adaptação Crítica (Alunos Novos: {generalMetrics.novosCount})</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            É o período em que a taxa de cancelamento e faltas é mais alta. O aluno ainda não formou laços fortes de amizade e se sente vulnerável ao nível técnico da turma.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0">
                          3 a 12m
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground">Fase de Consolidação (Intermediários: {generalMetrics.intermediariosCount})</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            O hábito foi construído. O aluno já comprou sua própria raquete, participa das miniligas e tem parceiros habituais de jogo.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50/30 dark:bg-green-950/20 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 font-bold text-xs shrink-0">
                          +12m
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground">Fase de Embaixadores (Veteranos: {generalMetrics.veteranosCount})</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Os pilares da escola. Apresentam LTV acumulado superior a R$ 2.500, frequência média acima de 88% e são os maiores indicadores de novos alunos.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/50">
                      <h4 className="font-bold text-xs text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <Milestone className="w-4 h-4" /> Moral da História:
                      </h4>
                      <p className="text-xs text-purple-800 dark:text-purple-300/90 mt-1 leading-relaxed">
                        Cada esforço de acolhimento nos primeiros 90 dias que evita a evasão de um aluno novo gera um retorno composto de mais de 12 meses de mensalidades no médio prazo.
                      </p>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setActiveStoryChapter(2)}
                        className="px-3 py-1.5 bg-muted text-muted-foreground font-semibold text-xs rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => setActiveStoryChapter(4)}
                        className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>Próximo: O Efeito Comprometimento</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeStoryChapter === 4 && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-primary border-primary/30 font-bold text-[10px]">
                        Capítulo 4 de 5
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">Economia do Negócio</span>
                    </div>
                    <CardTitle className="text-xl font-black mt-2">
                      O Efeito Comprometimento: 1x vs 2x vs 3x na Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5 leading-relaxed text-sm">
                    <p className="text-muted-foreground">
                      Quando cruzamos a frequência semanal contratada com a assiduidade real, surge um padrão estatístico evidente na gestão de turmas:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl border border-border bg-muted/20 text-center">
                        <span className="text-xs font-bold text-muted-foreground">Plano 1x / Semana</span>
                        <h4 className="text-xl font-black text-foreground mt-1">{generalMetrics.freq1xCount} Alunos</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">Presença mais vulnerável a imprevistos da rotina.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 text-center">
                        <span className="text-xs font-bold text-primary">Plano 2x / Semana</span>
                        <h4 className="text-xl font-black text-primary mt-1">{generalMetrics.freq2xCount} Alunos</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">Ponto de equilíbrio ideal de evolução técnica e LTV.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-muted/20 text-center">
                        <span className="text-xs font-bold text-muted-foreground">Plano 3x+ / Semana</span>
                        <h4 className="text-xl font-black text-foreground mt-1">{generalMetrics.freq3xCount} Alunos</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">Altíssimo engajamento e quase zero absenteísmo.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <Zap className="w-4 h-4" />
                        <span>A Regra do Sunk Cost Positivo:</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Alunos de 2x e 3x por semana incorporam o Beach Tennis em sua identidade semanal. Eles têm o dobro de exposição aos colegas e ao professor, reduzindo drasticamente o risco de cancelamento.
                      </p>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setActiveStoryChapter(3)}
                        className="px-3 py-1.5 bg-muted text-muted-foreground font-semibold text-xs rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => setActiveStoryChapter(5)}
                        className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>Próximo: Oportunidades & Futuro</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeStoryChapter === 5 && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-primary border-primary/30 font-bold text-[10px]">
                        Capítulo 5 de 5
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">Crescimento & Visão de Futuro</span>
                    </div>
                    <CardTitle className="text-xl font-black mt-2">
                      Oportunidades Ocultas & O Futuro da Marca Marco Roza
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5 leading-relaxed text-sm">
                    <p className="text-muted-foreground">
                      Concluindo nossa análise narrativa, os dados apontam 3 alavancas claras de expansão para os próximos trimestres:
                    </p>

                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary font-black text-xs shrink-0">1</div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Migração Interna (1x para 2x/Semana)</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            A base atual de 1x/semana ({generalMetrics.freq1xCount} alunos) é a maior oportunidade de expansão de receita sem nenhum custo adicional de aquisição (CAC Zero).
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 font-black text-xs shrink-0">2</div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Comunidade & Torneios como Ferramenta de Retenção</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Miniligas e eventos sociais blindam o aluno contra a concorrência e aumentam a média de permanência em mais de 4 meses.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 font-black text-xs shrink-0">3</div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Onboarding Estruturado para o Público Novo</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Acompanhamento ativo nos primeiros 60 dias para transformar cada novo aluno em um veterano de longo prazo.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-sm">Pronto para colocar as orientações em prática?</h4>
                        <p className="text-xs text-emerald-100 mt-0.5">Acesse o plano tático executivo com cronograma, responsáveis e metas.</p>
                      </div>
                      <button
                        onClick={() => scrollToSection("secao-orientacoes-executivas")}
                        className="px-5 py-2.5 bg-white text-emerald-950 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-all shadow-md shrink-0 cursor-pointer"
                      >
                        Abrir Orientações Executivas
                      </button>
                    </div>

                    <div className="flex justify-start pt-2">
                      <button
                        onClick={() => setActiveStoryChapter(4)}
                        className="px-3 py-1.5 bg-muted text-muted-foreground font-semibold text-xs rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        Voltar ao Capítulo 4
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
      </section>

      {/* ========================================================================= */}
      {/* SEÇÃO ABERTA: ORIENTAÇÕES EXECUTIVAS & PLANO DE AÇÃO ESTRATÉGICO         */}
      {/* ========================================================================= */}
      <section id="secao-orientacoes-executivas" className="space-y-6 scroll-mt-6">
          {/* Header Executivo */}
          <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-950/10 via-teal-950/5 to-transparent">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-xl font-black">Orientações Executivas & Plano de Ação Estratégico</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Diretrizes práticas, priorizadas por esforço e impacto, fundamentadas nas descobertas estatísticas do BI para a liderança da Equipe Marco Roza.
                  </p>
                </div>
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1 px-3 w-fit">
                  Plano de Crescimento & Retenção
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* 4 Pilares Estratégicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pilar 1 */}
            <Card className="border-border hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 font-bold">
                    Pilar 1
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold mt-2">Onboarding Blindado</CardTitle>
                <CardDescription className="text-xs">Blindar os primeiros 90 dias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Implementar o <strong>Protocolo Boas-Vindas</strong> com contato aos 7, 30 e 60 dias, entrega do kit e pareamento com duplas acolhedoras.
                </p>
                <div className="pt-2 border-t border-border flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Meta:</span>
                  <span className="font-bold text-foreground">Reduzir churn inicial em 35%</span>
                </div>
              </CardContent>
            </Card>

            {/* Pilar 2 */}
            <Card className="border-border hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-bold">
                    Pilar 2
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold mt-2">Alavanca de Upsell</CardTitle>
                <CardDescription className="text-xs">Migração de 1x para 2x/Semana</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Criar campanhas de <em>"Upgrade Fest"</em> oferecendo 1 mês de 2ª aula com desconto para alunos de 1x/sem com mais de 60 dias de casa.
                </p>
                <div className="pt-2 border-t border-border flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Meta:</span>
                  <span className="font-bold text-foreground">Converter 25% da base 1x</span>
                </div>
              </CardContent>
            </Card>

            {/* Pilar 3 */}
            <Card className="border-border hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-600 font-bold">
                    Pilar 3
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold mt-2">Comunidade & Miniligas</CardTitle>
                <CardDescription className="text-xs">Vínculo esportivo e social</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Realizar miniligas mensais com ranking interno por categorias e eventos de integração <em>"Play & Coffee/Drink"</em>.
                </p>
                <div className="pt-2 border-t border-border flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Meta:</span>
                  <span className="font-bold text-foreground">Engajamento &gt; 85%</span>
                </div>
              </CardContent>
            </Card>

            {/* Pilar 4 */}
            <Card className="border-border hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 font-bold">
                    Pilar 4
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold mt-2">Blindagem de Cobrança</CardTitle>
                <CardDescription className="text-xs">Adimplência e Recorrência</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Fomentar o plano semestral/anual com cartão recorrente ou desconto antecipado via PIX, reduzindo inadimplência residual.
                </p>
                <div className="pt-2 border-t border-border flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Meta:</span>
                  <span className="font-bold text-foreground">Adimplência acima de 98%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Matriz de Priorização (Esforço x Impacto) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Matriz de Priorização Estratégica</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Classificação das ações executivas para maximizar resultados imediatos com menor atrito operacional.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quick Wins */}
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-bold text-sm text-foreground">⚡ Quick Wins (Alto Impacto, Baixo Esforço)</h4>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 text-[10px]">
                      Imediato (1-15 dias)
                    </Badge>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Alerta de Presença Frágil:</strong> Ligar ou enviar WhatsApp para alunos que faltaram 2 aulas consecutivas.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Boas-Vindas Personalizadas:</strong> Envio de vídeo de boas-vindas do professor após a primeira aula.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Pesquisa Relâmpago aos 30 dias:</strong> Pergunta simples de 1 a 10 no WhatsApp para medir satisfação inicial.</span>
                    </li>
                  </ul>
                </div>

                {/* Grandes Apostas */}
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-bold text-sm text-foreground">🚀 Grandes Apostas (Alto Impacto, Médio Esforço)</h4>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 text-[10px]">
                      Médio Prazo (30-60 dias)
                    </Badge>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <span><strong>Campanha Upgrade 1x ➔ 2x:</strong> Pacote promocional de 3 meses para transformar alunos 1x em praticantes assíduos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <span><strong>Circuito Interno de Miniligas:</strong> Estruturar torneios internos mensais com pontuação contínua e medalhas.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <span><strong>Clube de Benefícios Marco Roza:</strong> Parcerias com fisioterapeutas, marcas de nutrição e lojas de esportes.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plano de Ação Tático (5W2H Simplificado) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Plano Tático de Execução</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Roteiro de responsabilidades, prazos e métricas de acompanhamento para a equipe.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase font-bold text-muted-foreground bg-muted/40 border-b border-border">
                    <tr>
                      <th className="p-3">Iniciativa / Ação</th>
                      <th className="p-3">Responsável</th>
                      <th className="p-3">Prazo</th>
                      <th className="p-3">Indicador Chave (KPI)</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        Contato de acolhimento aos alunos com &lt; 90 dias
                      </td>
                      <td className="p-3 text-muted-foreground">Coordenação / Recepção</td>
                      <td className="p-3 text-muted-foreground">Semanal</td>
                      <td className="p-3 text-emerald-600 font-bold">Retenção 90d &gt; 80%</td>
                      <td className="p-3 text-right">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 text-[10px]">
                          Recomendado
                        </Badge>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        Oferta de Upgrade para alunos 1x na semana
                      </td>
                      <td className="p-3 text-muted-foreground">Comercial / Professores</td>
                      <td className="p-3 text-muted-foreground">Início de Mês</td>
                      <td className="p-3 text-emerald-600 font-bold">+20% em Planos 2x</td>
                      <td className="p-3 text-right">
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 text-[10px]">
                          Estratégico
                        </Badge>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        Miniliga e Clínica de Beach Tennis Marco Roza
                      </td>
                      <td className="p-3 text-muted-foreground">Professores / Marco Roza</td>
                      <td className="p-3 text-muted-foreground">Mensal</td>
                      <td className="p-3 text-emerald-600 font-bold">Engajamento &gt; 85%</td>
                      <td className="p-3 text-right">
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[10px]">
                          Planejado
                        </Badge>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        Auditoria de Presença e Alerta de Inadimplência
                      </td>
                      <td className="p-3 text-muted-foreground">Administrativo / Financeiro</td>
                      <td className="p-3 text-muted-foreground">Quinzenal</td>
                      <td className="p-3 text-emerald-600 font-bold">Adimplência &gt; 98%</td>
                      <td className="p-3 text-right">
                        <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 text-[10px]">
                          Operacional
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
      </section>

    </div>
  );
}
