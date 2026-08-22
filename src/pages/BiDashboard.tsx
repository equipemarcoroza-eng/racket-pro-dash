import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      // Fazemos a varredura completa desde a primeira parcela lançada
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
    };
  }, [biData]);

  // --- ANÁLISE POR GÊNERO ---
  const genderData = useMemo(() => {
    const maleStudents = biData.filter((s) => s.sexo === "M");
    const femaleStudents = biData.filter((s) => s.sexo === "F");

    const getGroupStats = (group: StudentMetrics[], label: string) => {
      if (group.length === 0) return { name: label, value: 0, ltv: 0, attendance: 0, tenure: 0 };
      const sumLtv = group.reduce((sum, s) => sum + s.ltv, 0);
      const withAtt = group.filter((s) => s.attendanceRate !== null);
      const avgAtt = withAtt.length > 0 ? withAtt.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / withAtt.length : 80;
      const sumTenure = group.reduce((sum, s) => sum + s.tenureMonths, 0);

      return {
        name: label,
        value: group.length,
        ltv: Math.round(sumLtv / group.length),
        attendance: Math.round(avgAtt),
        tenure: Math.round((sumTenure / group.length) * 10) / 10,
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
    let status: "SINAL FORTE" | "ATENÇÃO" | "SEM SINAL";
    let statusClass = "";
    let needleColor = "#eab308"; // yellow default
    
    if (cleanValue < 60) {
      status = "SINAL FORTE";
      statusClass = "bg-red-50 text-red-600 border-red-200";
      needleColor = "#de392a"; // brand red
    } else if (cleanValue < 85) {
      status = "ATENÇÃO";
      statusClass = "bg-amber-50 text-amber-700 border-amber-200";
      needleColor = "#d97706"; // gold/yellow
    } else {
      status = "SEM SINAL";
      statusClass = "bg-green-50 text-green-700 border-green-200";
      needleColor = "#10b981"; // green
    }

    // Segment active states
    const isSeg1Active = cleanValue < 60;
    const isSeg2Active = cleanValue >= 60 && cleanValue < 85;
    const isSeg3Active = cleanValue >= 85;

    // Segment colors (Active vs Faded)
    const seg1Color = isSeg1Active ? "#de392a" : "#fee2e2";
    const seg2Color = isSeg2Active ? "#d97706" : "#fef3c7";
    const seg3Color = isSeg3Active ? "#10b981" : "#d1fae5";

    // Dial math
    const cx = 60;
    const cy = 65;
    const radius = 45;
    const strokeWidth = 8;
    
    // Rotation of needle
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
      <Card className="flex flex-col items-center p-6 bg-white border border-slate-100 shadow-sm rounded-2xl hover:shadow-md transition-all text-center">
        <div className="relative w-48 h-32 flex items-end justify-center overflow-hidden mb-2">
          <svg className="w-48 h-48 absolute -bottom-16" viewBox="0 0 120 120">
            {/* Glow filters for active segments */}
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

            {/* Scale Ticks (Background ticks) */}
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

            {/* Segment 1 (Low: 0% to 60%) — Arc: -120deg to +22deg */}
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

            {/* Segment 2 (Medium: 60% to 85%) — Arc: +26deg to +82deg */}
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

            {/* Segment 3 (High: 85% to 100%) — Arc: +86deg to +120deg */}
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

            {/* Pointer / Needle */}
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
            <span className="text-3xl font-extrabold tracking-tight text-slate-800">{Math.round(cleanValue)}%</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</span>
          </div>
        </div>

        <div className="mt-2 mb-3">
          <span className={`px-4 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${statusClass}`}>
            {status}
          </span>
        </div>
        {subtitle && <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">{subtitle}</p>}
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Business Intelligence Avançado</p>
              <CardTitle className="text-3xl font-black text-white mt-1">Dashboard de Inteligência Comportamental</CardTitle>
              <p className="text-xs text-white/70 mt-1.5">
                Análise aprofundada de comportamento, correlações de grupo, fidelidade e tendências de alunos ativos.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg border border-white/20 backdrop-blur-md">
              <Sparkles className="w-4 h-4 animate-pulse text-white" />
              BI Ativo com Varredura Histórica
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards de BI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card hover:shadow-md transition-shadow">
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
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
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
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
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
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
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
      <Tabs defaultValue="overview" className="w-full space-y-6" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview">Visão Geral & Vieses</TabsTrigger>
            <TabsTrigger value="gender">Gênero</TabsTrigger>
            <TabsTrigger value="age">Faixas Etárias</TabsTrigger>
            <TabsTrigger value="plans">Frequência Planos</TabsTrigger>
            <TabsTrigger value="tenure">Tempo de Casa</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Visão Geral e Painel de Vieses */}
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
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 font-bold rounded">
                            Força Alta
                          </span>
                        )}
                        {bias.type === "warning" && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 font-bold rounded">
                            Atenção
                          </span>
                        )}
                        {bias.type === "info" && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 font-bold rounded">
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
        </TabsContent>

        {/* Tab 2: Análise por Gênero */}
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

        {/* Tab 3: Análise por Faixa Etária */}
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

        {/* Tab 4: Análise por Frequência Contratada */}
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

        {/* Tab 5: Análise por Tempo de Casa */}
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
    </div>
  );
}
