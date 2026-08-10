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
import { useAppContext } from "@/contexts/AppContext";
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
    const parts = dStr.split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    const partsBr = dStr.split("/");
    if (partsBr.length === 3) {
      return new Date(Number(partsBr[2]), Number(partsBr[1]) - 1, Number(partsBr[0]));
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
    if (!entryDateStr) return 1;
    const entryDate = parseDate(entryDateStr);
    if (!entryDate) return 1;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.round(diffDays / 30.4));
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
      const studentLogs = attendanceLogs.filter((log) => log.alunoId === student.id);
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

    return {
      totalAlunos,
      avgLtv: sumLtv / totalAlunos,
      avgTenure: sumTenure / totalAlunos,
      avgAge: sumAge / totalAlunos,
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
          desc: `O grupo ${higherLtvGroup.toLowerCase()} tem um valor de tempo de vida (LTV) acumulado ${percent}% maior, sendo o segmento comercialmente mais duradouro.`,
          type: "info",
          metric: `R$ ${Math.abs(ltvDiff).toLocaleString("pt-BR")}`,
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
  const SVGAvatar = ({ type }: { type: "woman" | "teen" | "child" }) => {
    if (type === "woman") {
      return (
        <svg className="w-16 h-16 rounded-full ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/5" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" fill="#115e59" />
          <circle cx="50" cy="48" r="20" fill="#fdd1a9" />
          <path d="M 30,45 C 30,22 70,22 70,45 C 70,60 30,60 30,45 Z" fill="#451a03" />
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
        <svg className="w-16 h-16 rounded-full ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/5" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" fill="#1e3a8a" />
          <circle cx="50" cy="45" r="17" fill="#ffedd5" />
          <path d="M 33,35 Q 50,15 67,35 C 72,40 68,45 68,45 L 32,45 C 32,45 28,40 33,35 Z" fill="#0f172a" />
          <circle cx="44" cy="42" r="2.5" fill="#1e293b" />
          <circle cx="56" cy="42" r="2.5" fill="#1e293b" />
          <path d="M 45,49 Q 50,53 55,49" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 22,85 C 32,72 68,72 78,85" fill="#2563eb" />
        </svg>
      );
    }
    // child
    return (
      <svg className="w-16 h-16 rounded-full ring-2 ring-pink-500/20 shadow-lg shadow-pink-500/5" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" fill="#831843" />
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
    color = "#f59e0b",
    subtitle,
  }: {
    value: number;
    label: string;
    color?: string;
    subtitle?: string;
  }) => {
    // Map 0 - 100 to an arc of 180 degrees (pointing from -180deg on the left to 0deg on the right).
    const radius = 42;
    const cx = 60;
    const cy = 60;
    const strokeWidth = 8;
    const circumference = Math.PI * radius; // 131.95
    const cleanValue = Math.min(100, Math.max(0, value));
    const strokeDashoffset = circumference - (cleanValue / 100) * circumference;

    // Needle rotation angle (0% -> -180deg, 100% -> 0deg)
    const angle = (cleanValue / 100) * 180 - 180;

    // Threshold indicator line at 80% (0,80)
    const thresholdAngle = 0.8 * 180 - 180;
    const rad = (thresholdAngle * Math.PI) / 180;
    const tickStartX = cx + (radius - 2) * Math.cos(rad);
    const tickStartY = cy + (radius - 2) * Math.sin(rad);
    const tickEndX = cx + (radius + 6) * Math.cos(rad);
    const tickEndY = cy + (radius + 6) * Math.sin(rad);
    const labelX = cx + (radius + 14) * Math.cos(rad);
    const labelY = cy + (radius + 14) * Math.sin(rad) + 2;

    const displayValue = `${Math.round(cleanValue)}%`;

    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#0e1322]/90 backdrop-blur-md border border-[#1e293b] rounded-2xl shadow-xl hover:border-amber-500/30 hover:shadow-amber-500/5 transition-all duration-300 group">
        <div className="relative w-40 h-28 flex items-end justify-center overflow-hidden">
          <svg className="w-40 h-40 absolute -bottom-10" viewBox="0 0 120 120">
            <defs>
              <linearGradient id={`gauge-grad-${label.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Arc */}
            <path
              d="M 18,60 A 42,42 0 0,1 102,60"
              fill="none"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Scale Ticks */}
            {[0, 20, 40, 60, 80, 100].map((tick) => {
              const tickAng = (tick / 100) * 180 - 180;
              const tickRad = (tickAng * Math.PI) / 180;
              const x1 = cx + (radius + 2) * Math.cos(tickRad);
              const y1 = cy + (radius + 2) * Math.sin(tickRad);
              const x2 = cx + (radius + 5) * Math.cos(tickRad);
              const y2 = cy + (radius + 5) * Math.sin(tickRad);
              return (
                <line
                  key={tick}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#334155"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Active Filled Arc */}
            <path
              d="M 18,60 A 42,42 0 0,1 102,60"
              fill="none"
              stroke={color === "#3b82f6" ? "#06b6d4" : color === "#10b981" ? "#10b981" : "url(#gauge-grad-" + label.replace(/\s+/g, '-') + ")"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              filter="url(#glow)"
            />

            {/* 80% Dotted Reference */}
            <line
              x1={tickStartX}
              y1={tickStartY}
              x2={tickEndX}
              y2={tickEndY}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="2,2"
            />
            <text
              x={labelX}
              y={labelY}
              fill="#f59e0b"
              fontSize="6px"
              fontWeight="bold"
              textAnchor="middle"
              className="font-mono-precise"
            >
              0,80
            </text>

            {/* Pointer / Needle */}
            <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
              <polygon
                points="58.5,60 61.5,60 60,18"
                fill="#f59e0b"
                className="transition-transform duration-1000 ease-out"
              />
              <circle cx="60" cy="60" r="4" fill="#f59e0b" stroke="#070b13" strokeWidth="1.5" />
            </g>
          </svg>

          {/* Value Display */}
          <div className="z-10 flex flex-col items-center pb-1">
            <span className="text-3xl font-bold font-mono-precise tracking-tight text-[#f59e0b] group-hover:scale-110 transition-transform duration-300">
              {displayValue}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {label}
            </span>
          </div>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 text-center mt-3 font-medium min-h-[32px] line-clamp-2 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    );
  };

  // Cores do gráfico de rosca (Sexo)
  const COLORS = ["#ec4899", "#06b6d4"];

  return (
    <div className="font-sans-modern min-h-screen bg-[#070b13] text-[#e2e8f0] p-6 lg:p-8 -m-6 lg:-m-8 space-y-8 overflow-hidden relative">
      {/* Import de fontes do Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap');
        
        .font-serif-elegant {
          font-family: 'Playfair Display', serif;
        }
        .font-sans-modern {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .font-mono-precise {
          font-family: 'JetBrains Mono', monospace;
        }
        
        /* Custom tabs triggers */
        .bi-tabs-list {
          background-color: #0e1322 !important;
          border: 1px solid #1e293b !important;
          padding: 4px !important;
          border-radius: 9999px !important;
        }
        .bi-tab-trigger {
          border-radius: 9999px !important;
          color: #94a3b8 !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          padding: 6px 18px !important;
          transition: all 0.3s ease !important;
        }
        .bi-tab-trigger[data-state="active"] {
          background-color: #1e293b !important;
          color: #f59e0b !important;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.25) !important;
          border: 1px solid rgba(245, 158, 11, 0.4) !important;
        }
      `}</style>

      {/* Gradientes ambientais em segundo plano (Glow Effects) */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      {/* Título Principal */}
      <Card className="bg-gradient-to-r from-[#0e1322] to-[#161f36] border-[#1e293b] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs text-amber-500 font-bold tracking-widest uppercase">Business Intelligence Avançado</p>
              <h2 className="font-serif-elegant text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-400 to-amber-600 mt-1">
                Dashboard de Inteligência Comportamental
              </h2>
              <p className="text-sm text-slate-400 mt-2 font-medium">
                Análise aprofundada de comportamento, correlações de grupo, fidelidade e tendências de alunos ativos.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20 shrink-0 self-start md:self-auto">
              <Sparkles className="w-4 h-4 animate-pulse" />
              BI Ativo com Varredura Histórica
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards de BI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#0e1322]/80 border-[#1e293b] hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 rounded-2xl group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">LTV Médio (Histórico)</p>
                <h3 className="text-2xl font-bold font-mono-precise mt-3 text-amber-500 group-hover:scale-105 transition-transform duration-300">
                  R$ {generalMetrics.avgLtv.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </h3>
              </div>
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[11px] text-slate-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mr-1" />
              <span>Soma de faturas pagas desde a origem</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0e1322]/80 border-[#1e293b] hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 rounded-2xl group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Permanência (Tenure)</p>
                <h3 className="text-2xl font-bold font-mono-precise mt-3 text-slate-200 group-hover:scale-105 transition-transform duration-300">
                  {generalMetrics.avgTenure.toFixed(1)} <span className="text-sm font-semibold text-slate-400">meses</span>
                </h3>
              </div>
              <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[11px] text-slate-400 font-semibold">
              <span>Média de meses ativos no sistema</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0e1322]/80 border-[#1e293b] hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 rounded-2xl group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presença Média Geral</p>
                <h3 className="text-2xl font-bold font-mono-precise mt-3 text-emerald-500 group-hover:scale-105 transition-transform duration-300">
                  {generalMetrics.avgAttendance.toFixed(1)}%
                </h3>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[11px] text-slate-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mr-1" />
              <span>Aulas marcadas como presentes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0e1322]/80 border-[#1e293b] hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 rounded-2xl group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Idade Média</p>
                <h3 className="text-2xl font-bold font-mono-precise mt-3 text-slate-200 group-hover:scale-105 transition-transform duration-300">
                  {generalMetrics.avgAge.toFixed(1)} <span className="text-sm font-semibold text-slate-400">anos</span>
                </h3>
              </div>
              <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[11px] text-slate-400 font-semibold">
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
          color="#10b981"
          subtitle="Proporção de alunos ativos com mais de 80% de presença nas aulas."
        />
        <GaugeSpeedometer
          value={generalMetrics.avgAdimplencia}
          label="Adimplência Histórica"
          color="#3b82f6"
          subtitle="Taxa de pagamento de faturas geradas ao longo da história do aluno."
        />
        <GaugeSpeedometer
          value={Math.min(100, generalMetrics.avgAttendance * 1.1)}
          label="Saúde de Retenção"
          color="#f59e0b"
          subtitle="Estimativa de retenção de alunos para os próximos 3 meses com base no engajamento recente."
        />
      </div>

      {/* Abas e Análise de Segmentos */}
      <Tabs defaultValue="overview" className="w-full space-y-6" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between overflow-x-auto pb-2 custom-scroll">
          <TabsList className="bi-tabs-list">
            <TabsTrigger value="overview" className="bi-tab-trigger">Visão Geral & Vieses</TabsTrigger>
            <TabsTrigger value="gender" className="bi-tab-trigger">Gênero</TabsTrigger>
            <TabsTrigger value="age" className="bi-tab-trigger">Faixas Etárias</TabsTrigger>
            <TabsTrigger value="plans" className="bi-tab-trigger">Frequência Planos</TabsTrigger>
            <TabsTrigger value="tenure" className="bi-tab-trigger">Tempo de Casa</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Visão Geral e Painel de Vieses */}
        <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Box de Análise de Vieses e Tendências */}
            <Card className="lg:col-span-2 bg-[#0e1322]/80 border-[#1e293b] rounded-2xl shadow-xl">
              <CardHeader className="p-6 pb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <CardTitle className="font-serif-elegant text-xl font-bold text-slate-100">
                    Análise Estatística de Vieses e Tendências
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-400">
                  Correlações encontradas a partir do cruzamento de idade, gênero, plano e comportamento histórico de presença.
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {trendsAndBiases.map((bias, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[#1e293b]/70 bg-[#111827]/40 flex justify-between items-start gap-4 hover:bg-[#111827]/70 hover:border-amber-500/20 transition-all duration-300"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-200">{bias.title}</span>
                        {bias.type === "positive" && (
                          <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-full">
                            Força Alta
                          </span>
                        )}
                        {bias.type === "warning" && (
                          <span className="text-[9px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold rounded-full">
                            Atenção
                          </span>
                        )}
                        {bias.type === "info" && (
                          <span className="text-[9px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold rounded-full">
                            Correlação
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{bias.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold font-mono-precise text-amber-500">{bias.metric}</span>
                      <p className="text-[8px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Indicador</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Fatores de Decisão */}
            <Card className="bg-[#0e1322]/80 border-[#1e293b] rounded-2xl shadow-xl">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="font-serif-elegant text-xl font-bold text-slate-100">
                  Composição dos Alunos Ativos
                </CardTitle>
                <p className="text-xs text-slate-400">Distribuição demográfica por sexo.</p>
              </CardHeader>
              <CardContent className="p-6 flex justify-center items-center h-[260px]">
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
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0e1322", borderColor: "#1e293b", borderRadius: "12px" }}
                      itemStyle={{ color: "#e2e8f0" }}
                      labelStyle={{ color: "#f59e0b", fontWeight: "bold" }}
                      formatter={(value) => [`${value} Alunos`, "Quantidade"]}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Análise por Gênero */}
        <TabsContent value="gender" className="animate-in fade-in duration-300">
          <Card className="bg-[#0e1322]/80 border-[#1e293b] rounded-2xl shadow-xl">
            <CardHeader className="p-6">
              <CardTitle className="font-serif-elegant text-xl font-bold text-slate-100">
                Desempenho e Engajamento por Gênero
              </CardTitle>
              <p className="text-xs text-slate-400">
                Comparativo de tempo de casa (Tenure), faturamento médio (LTV) e presença entre gêneros.
              </p>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-[250px]">
                  <p className="text-xs font-bold text-slate-400 mb-4 text-center uppercase tracking-wider">Frequência Média de Presença (%)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genderData} barSize={40}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1322", borderColor: "#1e293b", borderRadius: "12px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                        labelStyle={{ color: "#f59e0b", fontWeight: "bold" }}
                        formatter={(val) => [`${val}%`, "Presença"]}
                      />
                      <Bar dataKey="attendance">
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[250px]">
                  <p className="text-xs font-bold text-slate-400 mb-4 text-center uppercase tracking-wider">LTV Médio Histórico (R$)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genderData} barSize={40}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1322", borderColor: "#1e293b", borderRadius: "12px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                        labelStyle={{ color: "#f59e0b", fontWeight: "bold" }}
                        formatter={(val) => [`R$ ${val}`, "LTV"]}
                      />
                      <Bar dataKey="ltv">
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
        <TabsContent value="age" className="animate-in fade-in duration-300">
          <Card className="bg-[#0e1322]/80 border-[#1e293b] rounded-2xl shadow-xl">
            <CardHeader className="p-6">
              <CardTitle className="font-serif-elegant text-xl font-bold text-slate-100">
                Indicadores por Faixa Etária
              </CardTitle>
              <p className="text-xs text-slate-400">
                Visão de volume de alunos, adimplência e presença por faixas etárias.
              </p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[280px]">
                  <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Comportamento Geral (Presença x Adimplência %)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageGroupData}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1322", borderColor: "#1e293b", borderRadius: "12px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                        labelStyle={{ color: "#f59e0b", fontWeight: "bold" }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
                      <Bar dataKey="attendance" name="Presença (%)" fill="#10b981" />
                      <Bar dataKey="adimplencia" name="Adimplência (%)" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[280px]">
                  <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">LTV Médio por Segmento Etário (R$)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageGroupData} barSize={45}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1322", borderColor: "#1e293b", borderRadius: "12px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                        labelStyle={{ color: "#f59e0b", fontWeight: "bold" }}
                        formatter={(val) => [`R$ ${val}`, "LTV"]}
                      />
                      <Bar dataKey="ltv" name="LTV Médio (R$)" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Análise por Frequência Contratada */}
        <TabsContent value="plans" className="animate-in fade-in duration-300">
          <Card className="bg-[#0e1322]/80 border-[#1e293b] rounded-2xl shadow-xl">
            <CardHeader className="p-6">
              <CardTitle className="font-serif-elegant text-xl font-bold text-slate-100">
                Comportamento de Acordo com Frequência de Aulas Contratadas
              </CardTitle>
              <p className="text-xs text-slate-400">
                Avaliação de adesão e gasto total médio baseado no plano semanal contratado.
              </p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[280px]">
                  <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Presença Real de Acordo com Plano Contratado (%)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planFrequencyData} barSize={45}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1322", borderColor: "#1e293b", borderRadius: "12px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                        labelStyle={{ color: "#f59e0b", fontWeight: "bold" }}
                        formatter={(val) => [`${val}%`, "Presença Real"]}
                      />
                      <Bar dataKey="attendance" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[280px]">
                  <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">LTV Médio por Plano Contratado (R$)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planFrequencyData} barSize={45}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1322", borderColor: "#1e293b", borderRadius: "12px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                        labelStyle={{ color: "#f59e0b", fontWeight: "bold" }}
                        formatter={(val) => [`R$ ${val}`, "LTV Médio"]}
                      />
                      <Bar dataKey="ltv" fill="#ec4899" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Análise por Tempo de Casa */}
        <TabsContent value="tenure" className="animate-in fade-in duration-300">
          <Card className="bg-[#0e1322]/80 border-[#1e293b] rounded-2xl shadow-xl">
            <CardHeader className="p-6">
              <CardTitle className="font-serif-elegant text-xl font-bold text-slate-100">
                Análise de Tempo de Permanência (Tenure)
              </CardTitle>
              <p className="text-xs text-slate-400">
                Comparação de alunos novos, em fase de adaptação, e alunos veteranos fidelizados.
              </p>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[280px]">
                  <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Evolução do Engajamento / Presença (%)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tenureBracketsData}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1322", borderColor: "#1e293b", borderRadius: "12px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                        labelStyle={{ color: "#f59e0b", fontWeight: "bold" }}
                        formatter={(val) => [`${val}%`, "Presença Média"]}
                      />
                      <Line type="monotone" dataKey="attendance" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[280px]">
                  <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Evolução da Adimplência Histórica por Estágio (%)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tenureBracketsData} barSize={45}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0e1322", borderColor: "#1e293b", borderRadius: "12px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                        labelStyle={{ color: "#f59e0b", fontWeight: "bold" }}
                        formatter={(val) => [`${val}%`, "Adimplência"]}
                      />
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
      <Card className="bg-[#0e1322]/80 border-[#1e293b] rounded-2xl shadow-xl relative overflow-hidden">
        <CardHeader className="p-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <CardTitle className="font-serif-elegant text-xl font-bold text-slate-100">
              Os 3 Perfis Comportamentais Mais Comuns de Alunos
            </CardTitle>
          </div>
          <p className="text-xs text-slate-400">
            Modelados empiricamente a partir dos padrões de frequência contratada, faixas etárias, sexo e constância financeira da base de dados.
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Persona 1: Clara (Mulher Adulta) */}
            <div className="p-6 rounded-2xl border border-[#1e293b]/70 bg-[#111827]/40 hover:bg-[#111827]/70 hover:border-amber-500/20 transition-all duration-300 flex flex-col items-center text-center space-y-4 shadow-md group">
              <SVGAvatar type="woman" />
              <div>
                <h4 className="font-bold text-base text-slate-200">Clara (Mulher Adulta)</h4>
                <p className="text-[9px] font-bold text-teal-400 uppercase tracking-widest mt-1 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  Perfil: Foco Social & Saúde
                </p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Praticante assídua, motivada pela socialização pós-jogo e condicionamento físico. Apresenta a maior adimplência histórica e menor taxa de cancelamentos por motivos climáticos.
              </p>
              <div className="w-full pt-4 border-t border-[#1e293b] flex justify-around text-center">
                <div>
                  <span className="text-xs font-bold font-mono-precise block text-slate-200">~85%</span>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">Presença</span>
                </div>
                <div>
                  <span className="text-xs font-bold font-mono-precise block text-slate-200">12+ meses</span>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">Retenção</span>
                </div>
                <div>
                  <span className="text-xs font-bold font-mono-precise block text-teal-400">Alto</span>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">LTV Histórico</span>
                </div>
              </div>
            </div>

            {/* Persona 2: Lucas (Adolescente Masculino) */}
            <div className="p-6 rounded-2xl border border-[#1e293b]/70 bg-[#111827]/40 hover:bg-[#111827]/70 hover:border-amber-500/20 transition-all duration-300 flex flex-col items-center text-center space-y-4 shadow-md group">
              <SVGAvatar type="teen" />
              <div>
                <h4 className="font-bold text-base text-slate-200">Lucas (Jovem Atleta)</h4>
                <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mt-1 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  Perfil: Foco Competitivo
                </p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Foco no ranking, adora participar de torneios e miniligas. Possui frequência excelente, com pequenas oscilações em períodos de exames escolares. Prefere treinar 2x a 3x por semana.
              </p>
              <div className="w-full pt-4 border-t border-[#1e293b] flex justify-around text-center">
                <div>
                  <span className="text-xs font-bold font-mono-precise block text-slate-200">~90%</span>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">Presença</span>
                </div>
                <div>
                  <span className="text-xs font-bold font-mono-precise block text-slate-200">6-12 m</span>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">Retenção</span>
                </div>
                <div>
                  <span className="text-xs font-bold font-mono-precise block text-cyan-400">Médio</span>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">LTV Histórico</span>
                </div>
              </div>
            </div>

            {/* Persona 3: Sofia (Criança Feminina) */}
            <div className="p-6 rounded-2xl border border-[#1e293b]/70 bg-[#111827]/40 hover:bg-[#111827]/70 hover:border-amber-500/20 transition-all duration-300 flex flex-col items-center text-center space-y-4 shadow-md group">
              <SVGAvatar type="child" />
              <div>
                <h4 className="font-bold text-base text-slate-200">Sofia (Aluna Infantil)</h4>
                <p className="text-[9px] font-bold text-pink-400 uppercase tracking-widest mt-1 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                  Perfil: Formação & Lazer
                </p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Iniciada no esporte por incentivo dos pais. A frequência é quase de 100%, garantida pelo compromisso dos responsáveis. Foco em brincadeiras cooperativas e avaliações do Beach Tennis.
              </p>
              <div className="w-full pt-4 border-t border-[#1e293b] flex justify-around text-center">
                <div>
                  <span className="text-xs font-bold font-mono-precise block text-slate-200">~95%</span>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">Presença</span>
                </div>
                <div>
                  <span className="text-xs font-bold font-mono-precise block text-slate-200">12+ meses</span>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">Retenção</span>
                </div>
                <div>
                  <span className="text-xs font-bold font-mono-precise block text-pink-400">Constante</span>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold">LTV Histórico</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
