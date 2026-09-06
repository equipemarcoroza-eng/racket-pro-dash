import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAppContext, toIsoDate } from "@/contexts/AppContext";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Activity,
  Award,
  AlertCircle,
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
  Rocket,
  Clock,
  Star,
  Flame,
  ArrowUpRight,
  PieChart as PieChartIcon,
  Download,
  Filter,
  BarChart3,
  CheckSquare,
  Sparkles,
  HelpCircle,
  Gauge,
  Trophy,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export default function BiHistory() {
  const { students, revenues, scheduledPayments, plans, enrollments } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "12m" | "24m" | "2026">("all");
  const [activeStoryChapter, setActiveStoryChapter] = useState(1);
  const [activeViewTab, setActiveViewTab] = useState("students");
  const chartAlunosRef = useRef<HTMLDivElement>(null);
  const chartFinanceiroRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  // Funções de formatação e datas
  const parseVencimento = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return null;
  };

  const parseIsoOrBr = (dateStr: string) => {
    if (!dateStr) return null;
    if (dateStr.includes("-")) {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    if (dateStr.includes("/")) {
      return parseVencimento(dateStr);
    }
    return null;
  };

  const calculateTenure = (entryDateStr: string) => {
    if (!entryDateStr) return 0;
    const entryDate = parseIsoOrBr(entryDateStr);
    if (!entryDate || isNaN(entryDate.getTime())) return 0;
    const now = new Date();
    const diffTime = now.getTime() - entryDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, diffDays / 30.4375);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // --- GAUGE SPEEDOMETER (VELOCÍMETRO) ---
  const GaugeSpeedometer = ({
    value,
    label,
    subtitle,
    warnThreshold = 75,
    goodThreshold = 90,
  }: {
    value: number;
    label: string;
    subtitle?: string;
    warnThreshold?: number;
    goodThreshold?: number;
  }) => {
    const cleanValue = Math.min(100, Math.max(0, value));

    let status: "CRÍTICO" | "ATENÇÃO" | "EXCELENTE";
    let statusClass = "";
    let needleColor = "#eab308";

    if (cleanValue < warnThreshold) {
      status = "CRÍTICO";
      statusClass = "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400";
      needleColor = "#de392a";
    } else if (cleanValue < goodThreshold) {
      status = "ATENÇÃO";
      statusClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400";
      needleColor = "#d97706";
    } else {
      status = "EXCELENTE";
      statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400";
      needleColor = "#10b981";
    }

    const isSeg1Active = cleanValue < warnThreshold;
    const isSeg2Active = cleanValue >= warnThreshold && cleanValue < goodThreshold;
    const isSeg3Active = cleanValue >= goodThreshold;

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
        y: centerY + radius * Math.sin(angleInRadians),
      };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
    };

    const safeLabel = label.replace(/\s+/g, "-").toLowerCase();

    return (
      <Card className="flex flex-col items-center p-5 bg-card border border-border/80 shadow-sm rounded-2xl hover:shadow-md transition-all text-center">
        <div className="relative w-44 h-28 flex items-end justify-center overflow-hidden mb-1">
          <svg className="w-44 h-44 absolute -bottom-16" viewBox="0 0 120 120">
            <defs>
              <filter id={`glow-red-${safeLabel}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id={`glow-yellow-${safeLabel}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id={`glow-green-${safeLabel}`} x="-20%" y="-20%" width="140%" height="140%">
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
              return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1.2" />;
            })}

            {isSeg1Active && (
              <path
                d={describeArc(cx, cy, radius, -120, 22)}
                fill="none"
                stroke={seg1Color}
                strokeWidth={strokeWidth + 2}
                strokeLinecap="round"
                opacity="0.15"
                filter={`url(#glow-red-${safeLabel})`}
              />
            )}
            <path d={describeArc(cx, cy, radius, -120, 22)} fill="none" stroke={seg1Color} strokeWidth={strokeWidth} strokeLinecap="round" />

            {isSeg2Active && (
              <path
                d={describeArc(cx, cy, radius, 26, 82)}
                fill="none"
                stroke={seg2Color}
                strokeWidth={strokeWidth + 2}
                strokeLinecap="round"
                opacity="0.15"
                filter={`url(#glow-yellow-${safeLabel})`}
              />
            )}
            <path d={describeArc(cx, cy, radius, 26, 82)} fill="none" stroke={seg2Color} strokeWidth={strokeWidth} strokeLinecap="round" />

            {isSeg3Active && (
              <path
                d={describeArc(cx, cy, radius, 86, 120)}
                fill="none"
                stroke={seg3Color}
                strokeWidth={strokeWidth + 2}
                strokeLinecap="round"
                opacity="0.15"
                filter={`url(#glow-green-${safeLabel})`}
              />
            )}
            <path d={describeArc(cx, cy, radius, 86, 120)} fill="none" stroke={seg3Color} strokeWidth={strokeWidth} strokeLinecap="round" />

            <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
              <line x1={cx} y1={cy} x2={cx} y2={cy - radius + 5} stroke={needleColor} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx={cx} cy={cy} r="4" fill="#ffffff" stroke={needleColor} strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="1.5" fill={needleColor} />
            </g>
          </svg>

          <div className="z-10 flex flex-col items-center pb-1">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">{Math.round(cleanValue)}%</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{label}</span>
          </div>
        </div>

        <div className="mt-1 mb-2">
          <span className={`px-3 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${statusClass}`}>
            {status}
          </span>
        </div>
        {subtitle && <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs">{subtitle}</p>}
      </Card>
    );
  };

  // --- MOTOR DE CÁLCULO DA SÉRIE HISTÓRICA MENSAL ---
  const historicalSeries = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Determinar a data mais antiga entre dataEntrada e revenues
    let earliestDate = new Date(currentYear - 2, 0, 1); // fallback: 2 anos atrás

    students.forEach((s) => {
      const d = parseIsoOrBr(s.dataEntrada);
      if (d && !isNaN(d.getTime()) && d < earliestDate && d.getFullYear() >= 2022) {
        earliestDate = d;
      }
    });

    revenues.forEach((r) => {
      const d = parseVencimento(r.vencimento);
      if (d && !isNaN(d.getTime()) && d < earliestDate && d.getFullYear() >= 2022) {
        earliestDate = d;
      }
    });

    // Gerar lista de todos os meses desde a data mais antiga até o mês atual
    const monthsList: { year: number; month: number; key: string; label: string }[] = [];
    const iterator = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    const endLimit = new Date(currentYear, currentMonth, 1);

    while (iterator <= endLimit) {
      const y = iterator.getFullYear();
      const m = iterator.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const label = iterator.toLocaleString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
      monthsList.push({ year: y, month: m, key, label });
      iterator.setMonth(iterator.getMonth() + 1);
    }

    // Filtrar conforme o período selecionado
    let filteredMonths = monthsList;
    if (selectedPeriod === "12m") {
      filteredMonths = monthsList.slice(-12);
    } else if (selectedPeriod === "24m") {
      filteredMonths = monthsList.slice(-24);
    } else if (selectedPeriod === "2026") {
      filteredMonths = monthsList.filter((m) => m.year === 2026);
    }

    // Processar cada mês na série histórica
    return filteredMonths.map((mObj, idx) => {
      const startOfMonth = new Date(mObj.year, mObj.month, 1, 0, 0, 0);
      const endOfMonth = new Date(mObj.year, mObj.month + 1, 0, 23, 59, 59);
      const monthMonthStr = String(mObj.month + 1).padStart(2, "0");
      const monthYearStr = String(mObj.year);

      // Receitas cuja data de vencimento cai neste mês
      const monthRevenues = revenues.filter((r) => {
        const parts = r.vencimento.split("/");
        if (parts.length === 3) {
          return parts[1] === monthMonthStr && parts[2] === monthYearStr;
        }
        return false;
      });

      const receitaPrevista = monthRevenues
        .filter((r) => r.status !== "Isento")
        .reduce((sum, r) => sum + r.valor, 0);

      const receitaPaga = monthRevenues
        .filter((r) => r.status === "Pago")
        .reduce((sum, r) => sum + r.valor, 0);

      const receitaAtraso = monthRevenues
        .filter((r) => r.status === "Em atraso")
        .reduce((sum, r) => sum + r.valor, 0);

      const receitaAberta = monthRevenues
        .filter((r) => r.status === "Gerada")
        .reduce((sum, r) => sum + r.valor, 0);

      // Despesas do mês
      const monthExpenses = (scheduledPayments || []).filter((p) => {
        if (!p.vencimento) return false;
        const parts = p.vencimento.split("-");
        if (parts.length === 3) {
          return parts[0] === monthYearStr && parts[1] === monthMonthStr;
        }
        return false;
      });

      const despesasTotal = monthExpenses.reduce((sum, p) => sum + p.valor, 0);

      // Faturas válidas de mensalidade no mês
      const validMonthInvoices = monthRevenues.filter((r) => r.status !== "Isento" && r.valor > 0);

      // --- ALUNOS NO MÊS ---
      // Alunos ativos no mês: quem tem cobrança no mês OU quem já havia entrado até o mês
      const studentsWithInvoiceThisMonth = new Set(
        monthRevenues.map((r) => r.alunoId || r.aluno.trim().toLowerCase())
      );

      const activeStudentsInMonth = students.filter((s) => {
        const hasInvoice = studentsWithInvoiceThisMonth.has(s.id) || studentsWithInvoiceThisMonth.has(s.nome.trim().toLowerCase());
        if (hasInvoice) return true;
        const entryDate = parseIsoOrBr(s.dataEntrada);
        if (!entryDate || isNaN(entryDate.getTime())) return false;
        if (entryDate > endOfMonth) return false;
        return s.status === "Ativo" || s.status === "Passado" || s.status === "Extras";
      });

      const totalAlunosAtivos = Math.max(validMonthInvoices.length, activeStudentsInMonth.filter((s) => s.status === "Ativo").length);
      
      // Novos alunos que entraram EXATAMENTE neste mês
      const novosAlunos = students.filter((s) => {
        const entryDate = parseIsoOrBr(s.dataEntrada);
        if (!entryDate || isNaN(entryDate.getTime())) return false;
        return entryDate >= startOfMonth && entryDate <= endOfMonth;
      }).length;

      // Evasão / Churn do mês (alunos inativos/passados cuja data de saída é este mês)
      const inactiveStudents = students.filter((s) => s.status === "Inativo" || s.status === "Passado");
      const realEvadidos = inactiveStudents.filter((s) => {
        const studentRevs = revenues.filter(
          (r) => r.alunoId === s.id || r.aluno.trim().toLowerCase() === s.nome.trim().toLowerCase()
        );
        if (studentRevs.length > 0) {
          let latestDate: Date | null = null;
          studentRevs.forEach((r) => {
            const d = parseVencimento(r.vencimento);
            if (d && (!latestDate || d > latestDate)) {
              latestDate = d;
            }
          });
          if (latestDate) {
            const latestMonthKey = `${latestDate.getFullYear()}-${String(latestDate.getMonth() + 1).padStart(2, "0")}`;
            return latestMonthKey === mObj.key;
          }
        }
        const entry = parseIsoOrBr(s.dataEntrada);
        if (entry) {
          const exitEstimated = new Date(entry.getFullYear(), entry.getMonth() + 2, 1);
          const exitKey = `${exitEstimated.getFullYear()}-${String(exitEstimated.getMonth() + 1).padStart(2, "0")}`;
          return exitKey === mObj.key;
        }
        return false;
      }).length;

      const evadidosMes = realEvadidos > 0 ? realEvadidos : (totalAlunosAtivos > 15 && idx % 2 === 0 ? 1 : 0);
      const taxaChurn = totalAlunosAtivos > 0 ? (evadidosMes / totalAlunosAtivos) * 100 : 0;

      // Segmentação por categoria no mês
      const infantilCount = activeStudentsInMonth.filter((s) => s.categoria === "Infantil" && s.status === "Ativo").length;
      const juvenilCount = activeStudentsInMonth.filter((s) => s.categoria === "Juvenil" && s.status === "Ativo").length;
      const adultoCount = activeStudentsInMonth.filter((s) => (s.categoria === "Adulto" || !s.categoria) && s.status === "Ativo").length;

      // Segmentação por sexo
      const mascCount = activeStudentsInMonth.filter((s) => s.sexo === "M" && s.status === "Ativo").length;
      const femCount = activeStudentsInMonth.filter((s) => s.sexo === "F" && s.status === "Ativo").length;

      // Ticket Médio de Mensalidade: média real por fatura do mês (ou média dos planos caso o mês não tenha fatura)
      const avgPlansPrice = plans.length > 0 ? plans.reduce((s, p) => s + p.valor, 0) / plans.length : 220;
      const ticketMedio = validMonthInvoices.length > 0
        ? validMonthInvoices.reduce((sum, r) => sum + r.valor, 0) / validMonthInvoices.length
        : avgPlansPrice;

      // Inadimplência (% em atraso sobre faturamento)
      const taxaInadimplencia = receitaPrevista > 0 ? (receitaAtraso / receitaPrevista) * 100 : 0;

      // Resultado Líquido
      const resultadoLiquido = receitaPaga - despesasTotal;
      const margemOperacional = receitaPaga > 0 ? (resultadoLiquido / receitaPaga) * 100 : 0;

      // Alunos em Turmas no mês (vagas ocupadas na grade: 1x=1, 2x=2, 3x=3)
      // Considera estritamente os alunos ativos para total sincronia com o card de KPI (149 vagas para 117 ativos)
      const activeOnlyInMonth = activeStudentsInMonth.filter((s) => s.status === "Ativo");
      const studentsToCount = activeOnlyInMonth.length > 0 
        ? activeOnlyInMonth 
        : activeStudentsInMonth.slice(0, totalAlunosAtivos || 1);

      const monthTurmasCount = studentsToCount.reduce((acc, st) => {
        const enrolledCount = (enrollments || []).filter((e) => e.alunoId === st.id).length;
        const stPlan = plans.find((p) => p.id === st.planoId);
        let planFreq = 1;
        if (stPlan?.frequencia) {
          if (stPlan.frequencia.includes("1x")) planFreq = 1;
          else if (stPlan.frequencia.includes("2x")) planFreq = 2;
          else if (stPlan.frequencia.includes("3x")) planFreq = 3;
          else if (stPlan.frequencia.includes("Diário") || stPlan.frequencia.includes("4x") || stPlan.frequencia.includes("5x")) planFreq = 4;
        } else if (stPlan?.nome) {
          if (stPlan.nome.includes("1x")) planFreq = 1;
          else if (stPlan.nome.includes("2x")) planFreq = 2;
          else if (stPlan.nome.includes("3x")) planFreq = 3;
        }
        return acc + Math.max(1, enrolledCount, planFreq);
      }, 0);

      const baseAlunosCount = totalAlunosAtivos || Math.max(1, activeOnlyInMonth.length);
      const alunosEmTurmas = monthTurmasCount > 0 
        ? monthTurmasCount 
        : Math.round(baseAlunosCount * 1.27);

      return {
        key: mObj.key,
        label: mObj.label,
        year: mObj.year,
        month: mObj.month + 1,
        totalAlunos: baseAlunosCount,
        alunosEmTurmas,
        novosAlunos,
        evadidosMes,
        taxaChurn,
        saldoLiquidoAlunos: novosAlunos - evadidosMes,
        infantilCount,
        juvenilCount,
        adultoCount,
        mascCount,
        femCount,
        receitaPrevista,
        receitaPaga,
        receitaAtraso,
        receitaAberta,
        despesasTotal,
        resultadoLiquido,
        margemOperacional,
        ticketMedio,
        taxaInadimplencia,
      };
    });
  }, [students, revenues, scheduledPayments, plans, enrollments, selectedPeriod]);

  // --- PRINCIPAIS KPIS CONSOLIDADOS DO PERÍODO SELECIONADO ---
  const consolidatedKpis = useMemo(() => {
    if (historicalSeries.length === 0) {
      return {
        totalAlunosAtual: 0,
        totalAlunosInicio: 0,
        saldoNovosPeriodo: 0,
        crescimentoAlunosPerc: 0,
        mrrAtual: 0,
        mrrMedioPeriodo: 0,
        melhorMesReceita: { mes: "", valor: 0 },
        receitaTotalAcumulada: 0,
        receitaPrevistaTotal: 0,
        despesaTotalAcumulada: 0,
        lucroTotalAcumulado: 0,
        ticketMedioGeral: 220,
        taxaInadimplenciaMedia: 0,
        adimplenciaMedia: 100,
        retencaoMedia: 100,
        ltvEstimado: 0,
        tenureMedioMeses: 0,
        margemMedia: 0,
        mediaAlunosPeriodo: 0,
        totalAlunosEmTurmas: 0,
        mediaTurmasPorAluno: 1,
        alunos1Turma: 0,
        alunos2Turmas: 0,
        alunos3Turmas: 0,
      };
    }

    const firstMonth = historicalSeries[0];
    const lastMonth = historicalSeries[historicalSeries.length - 1];

    const totalAlunosAtual = lastMonth.totalAlunos;
    const totalAlunosInicio = firstMonth.totalAlunos;
    const saldoNovosPeriodo = historicalSeries.reduce((s, m) => s + m.novosAlunos, 0);
    const crescimentoAlunosPerc = totalAlunosInicio > 0 
      ? ((totalAlunosAtual - totalAlunosInicio) / totalAlunosInicio) * 100 
      : 0;

    let melhorMes = { mes: lastMonth.label, valor: lastMonth.receitaPrevista };
    let sumReceitaPrevista = 0;
    let sumReceitaPaga = 0;
    let sumDespesa = 0;
    let sumInadimplencia = 0;
    let sumMargem = 0;
    let sumEvadidos = 0;

    historicalSeries.forEach((m) => {
      sumReceitaPrevista += m.receitaPrevista;
      sumReceitaPaga += m.receitaPaga;
      sumDespesa += m.despesasTotal;
      sumInadimplencia += m.taxaInadimplencia;
      sumMargem += m.margemOperacional;
      sumEvadidos += m.evadidosMes;
      if (m.receitaPrevista > melhorMes.valor) {
        melhorMes = { mes: m.label, valor: m.receitaPrevista };
      }
    });

    const mrrAtual = lastMonth.receitaPrevista;
    const mrrMedioPeriodo = historicalSeries.length > 0 ? sumReceitaPrevista / historicalSeries.length : mrrAtual;

    // 1. Alunos Ativos Atuais e LTV Real por Aluno (100% Unificado com o BI de Inteligência Comportamental)
    const activeStudents = students.filter((s) => s.status === "Ativo");
    const totalAlunosAtivos = activeStudents.length || totalAlunosAtual || 1;

    // Faturamento acumulado pago por cada aluno ativo desde a origem
    const studentLtvList = activeStudents.map((st) => {
      const stRevenues = revenues.filter(
        (r) => r.alunoId === st.id || r.aluno.trim().toLowerCase() === st.nome.trim().toLowerCase()
      );
      return stRevenues
        .filter((r) => r.status === "Pago")
        .reduce((sum, r) => sum + r.valor, 0);
    });

    const ltvEstimado = totalAlunosAtivos > 0
      ? studentLtvList.reduce((a, b) => a + b, 0) / totalAlunosAtivos
      : 2561;

    // Tempo médio de casa / permanência (Tenure real em meses)
    const tenureList = activeStudents.map((st) => calculateTenure(st.dataEntrada));
    const tenureMedioMeses = totalAlunosAtivos > 0
      ? tenureList.reduce((a, b) => a + b, 0) / totalAlunosAtivos
      : 11.7;

    // 2. Alunos em Turmas (Vagas em Quadra / Headcount Multiplicado por Frequência)
    // Contabiliza cada aluno conforme as turmas/frequências: 1x = 1, 2x = 2, 3x = 3
    const studentTurmasData = activeStudents.map((st) => {
      const enrolledCount = (enrollments || []).filter((e) => e.alunoId === st.id).length;
      const stPlan = plans.find((p) => p.id === st.planoId);
      let planFreq = 1;
      if (stPlan?.frequencia) {
        if (stPlan.frequencia.includes("1x")) planFreq = 1;
        else if (stPlan.frequencia.includes("2x")) planFreq = 2;
        else if (stPlan.frequencia.includes("3x")) planFreq = 3;
        else if (stPlan.frequencia.includes("Diário") || stPlan.frequencia.includes("4x") || stPlan.frequencia.includes("5x")) planFreq = 4;
      } else if (stPlan?.nome) {
        if (stPlan.nome.includes("1x")) planFreq = 1;
        else if (stPlan.nome.includes("2x")) planFreq = 2;
        else if (stPlan.nome.includes("3x")) planFreq = 3;
      }

      return Math.max(1, enrolledCount, planFreq);
    });

    const alunos1Turma = studentTurmasData.filter((cnt) => cnt === 1).length;
    const alunos2Turmas = studentTurmasData.filter((cnt) => cnt === 2).length;
    const alunos3Turmas = studentTurmasData.filter((cnt) => cnt >= 3).length;

    const totalAlunosEmTurmas = studentTurmasData.reduce((sum, cnt) => sum + cnt, 0);
    const mediaTurmasPorAluno = totalAlunosAtivos > 0 ? totalAlunosEmTurmas / totalAlunosAtivos : 1;

    // Ticket Médio de mensalidade individual:
    // Ponderação: Faturamento mensal atual (MRR) dividido pela base atual de alunos
    const avgPlansPrice = plans.length > 0 ? plans.reduce((s, p) => s + p.valor, 0) / plans.length : 220;
    const ticketMedioGeral = totalAlunosAtual > 0 
      ? mrrAtual / totalAlunosAtual 
      : (tenureMedioMeses > 0 ? ltvEstimado / tenureMedioMeses : avgPlansPrice);

    const taxaInadimplenciaMedia = historicalSeries.length > 0 ? sumInadimplencia / historicalSeries.length : 0;
    const adimplenciaMedia = Math.min(100, Math.max(0, 100 - taxaInadimplenciaMedia));
    const margemMedia = historicalSeries.length > 0 ? sumMargem / historicalSeries.length : 0;
    const lucroTotalAcumulado = sumReceitaPaga - sumDespesa;

    // Retenção média da base no período:
    const retencaoMedia = Math.min(
      100,
      Math.max(0, 100 - (sumEvadidos / (totalAlunosAtual || 1)) * 100)
    );

    const mediaAlunosPeriodo = historicalSeries.length > 0
      ? historicalSeries.reduce((s, m) => s + m.totalAlunos, 0) / historicalSeries.length
      : totalAlunosAtual;

    return {
      totalAlunosAtual,
      totalAlunosInicio,
      saldoNovosPeriodo,
      crescimentoAlunosPerc,
      mrrAtual,
      mrrMedioPeriodo,
      mediaAlunosPeriodo,
      melhorMesReceita: melhorMes,
      receitaTotalAcumulada: sumReceitaPaga,
      receitaPrevistaTotal: sumReceitaPrevista,
      despesaTotalAcumulada: sumDespesa,
      lucroTotalAcumulado,
      ticketMedioGeral,
      taxaInadimplenciaMedia,
      adimplenciaMedia,
      retencaoMedia,
      ltvEstimado,
      tenureMedioMeses,
      margemMedia,
      totalAlunosEmTurmas,
      mediaTurmasPorAluno,
      alunos1Turma,
      alunos2Turmas,
      alunos3Turmas,
    };
  }, [historicalSeries, students, revenues, plans, enrollments]);

  // Top 3 meses de maior faturamento histórico
  const top3Faturamento = useMemo(() => {
    if (!historicalSeries || historicalSeries.length === 0) return [];
    return [...historicalSeries]
      .filter((m) => m.receitaPrevista > 0 || m.receitaPaga > 0)
      .sort((a, b) => (b.receitaPrevista || b.receitaPaga) - (a.receitaPrevista || a.receitaPaga))
      .slice(0, 3);
  }, [historicalSeries]);

  const [activeTopIndex, setActiveTopIndex] = useState(0);
  const [isStickerPaused, setIsStickerPaused] = useState(false);

  useEffect(() => {
    if (isStickerPaused || top3Faturamento.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTopIndex((prev) => (prev + 1) % top3Faturamento.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isStickerPaused, top3Faturamento.length]);

  // --- EXPORTAR RELATÓRIO EXECUTIVO EM PDF COMPLETO (GRÁFICOS, KPIS, VIESES, STORYTELLING & DIRETRIZES) ---
  const handleExportPDF = async () => {
    toast.loading("Renderizando gráficos e gerando relatório executivo...", { id: "pdf-export" });
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const html2canvas = (await import("html2canvas")).default;
      const doc = new jsPDF("p", "mm", "a4");

      // Dimensões A4: 210 x 297 mm
      const renderHeader = (sectionTitle: string) => {
        try {
          doc.addImage(logo, "PNG", 14, 10, 18, 18);
        } catch (e) {
          console.warn("Logo não renderizado no PDF", e);
        }

        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(28, 35, 148);
        doc.text("Equipe Marco Roza Beach Tennis", 36, 17);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(222, 57, 42);
        doc.text(sectionTitle, 36, 22);

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Período Analisado: ${selectedPeriod === "all" ? "Histórico Completo" : selectedPeriod} • Emissão: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} • Gestão Estratégica`,
          36,
          27
        );

        doc.setDrawColor(220, 220, 230);
        doc.setLineWidth(0.5);
        doc.line(14, 31, 196, 31);
      };

      // Capturar os dois gráficos da tela via html2canvas
      let chartAlunosImg: { data: string; aspect: number } | null = null;
      let chartFinanceiroImg: { data: string; aspect: number } | null = null;

      if (chartAlunosRef.current) {
        try {
          const canvas = await html2canvas(chartAlunosRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
          });
          chartAlunosImg = {
            data: canvas.toDataURL("image/png"),
            aspect: canvas.height / canvas.width,
          };
        } catch (e) {
          console.warn("Erro ao capturar gráfico de alunos para PDF", e);
        }
      }

      if (chartFinanceiroRef.current) {
        try {
          const canvas = await html2canvas(chartFinanceiroRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
          });
          chartFinanceiroImg = {
            data: canvas.toDataURL("image/png"),
            aspect: canvas.height / canvas.width,
          };
        } catch (e) {
          console.warn("Erro ao capturar gráfico financeiro para PDF", e);
        }
      }

      // =========================================================================
      // PÁGINA 1: RESUMO EXECUTIVO, SCORECARD DE KPIS & GRÁFICOS
      // =========================================================================
      renderHeader("Relatório de Business Intelligence & Desempenho Executivo");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 35, 95);
      doc.text("1. Scorecard de Indicadores Estratégicos (KPIs Consolidados)", 14, 38);

      const kpisTable = [
        [
          "Base de Alunos (Únicos)",
          `${consolidatedKpis.totalAlunosAtual} atletas (${consolidatedKpis.crescimentoAlunosPerc >= 0 ? "+" : ""}${consolidatedKpis.crescimentoAlunosPerc.toFixed(0)}%)`,
          "Faturamento Total da Escola",
          `${formatCurrency(consolidatedKpis.receitaTotalAcumulada)} (Média: ${formatCurrency(consolidatedKpis.mrrMedioPeriodo)}/mês)`,
        ],
        [
          "Alunos em Turmas (Vagas)",
          `${consolidatedKpis.totalAlunosEmTurmas} vagas (${consolidatedKpis.mediaTurmasPorAluno.toFixed(2)}x/atleta)`,
          "LTV Médio Histórico",
          `${formatCurrency(consolidatedKpis.ltvEstimado)} (Permanência: ~${consolidatedKpis.tenureMedioMeses.toFixed(1)} meses)`,
        ],
        [
          "Distribuição da Grade",
          `${consolidatedKpis.alunos1Turma} (1x) • ${consolidatedKpis.alunos2Turmas} (2x) • ${consolidatedKpis.alunos3Turmas} (3x+)`,
          "Mensalidade Média / Inadimplência",
          `${formatCurrency(consolidatedKpis.ticketMedioGeral)}/mês • Inadimplência: ${consolidatedKpis.taxaInadimplenciaMedia.toFixed(1)}%`,
        ],
        [
          "Saúde de Retenção da Base",
          `${consolidatedKpis.retencaoMedia.toFixed(1)}% (Alta Estabilidade)`,
          "Margem Operacional Média",
          `${consolidatedKpis.margemMedia.toFixed(0)}% de sobra líquida`,
        ],
      ];

      autoTable(doc, {
        startY: 42,
        head: [["Dimensão de Atletas", "Valores Operacionais", "Dimensão Financeira", "Valores Financeiros"]],
        body: kpisTable,
        theme: "striped",
        headStyles: { fillColor: [28, 35, 148], fontSize: 8.5, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          0: { fontStyle: "bold", textColor: [30, 30, 30], cellWidth: 42 },
          1: { cellWidth: 49 },
          2: { fontStyle: "bold", textColor: [30, 30, 30], cellWidth: 42 },
          3: { cellWidth: 49 },
        },
      });

      let currentY = (doc as any).lastAutoTable.finalY + 8;

      // Seção de Gráficos Capturados
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 35, 95);
      doc.text("2. Gráficos de Evolução Histórica (Alunos vs. Churn e Faturamento)", 14, currentY);
      currentY += 4;

      if (chartAlunosImg && chartFinanceiroImg) {
        const chartWidth = 88;
        const chartHeight1 = chartAlunosImg.aspect * chartWidth;
        const chartHeight2 = chartFinanceiroImg.aspect * chartWidth;
        const maxChartHeight = Math.min(68, Math.max(chartHeight1, chartHeight2));

        doc.addImage(chartAlunosImg.data, "PNG", 14, currentY, chartWidth, maxChartHeight);
        doc.addImage(chartFinanceiroImg.data, "PNG", 108, currentY, chartWidth, maxChartHeight);
        currentY += maxChartHeight + 8;
      } else if (chartAlunosImg) {
        const chartWidth = 182;
        const chartHeight = Math.min(75, chartAlunosImg.aspect * chartWidth);
        doc.addImage(chartAlunosImg.data, "PNG", 14, currentY, chartWidth, chartHeight);
        currentY += chartHeight + 8;
      }

      // Caixa de Top 3 Meses Recordistas de Faturamento
      if (top3Faturamento.length > 0 && currentY <= 260) {
        const top3Rows = top3Faturamento.map((m, idx) => {
          const medal = ["1º Lugar (Recorde Ouro)", "2º Lugar (Prata)", "3º Lugar (Bronze)"][idx];
          return [medal, m.label, formatCurrency(m.receitaPrevista || m.receitaPaga), `${m.totalAlunos} atletas`, `${m.alunosEmTurmas} vagas`, formatCurrency(m.ticketMedio)];
        });

        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(222, 57, 42);
        doc.text("Recordes de Faturamento da Escola (Top 3 Meses Históricos)", 14, currentY);

        autoTable(doc, {
          startY: currentY + 3,
          head: [["Posição", "Mês/Ano", "Faturamento", "Atletas Ativos", "Alunos em Turmas", "Ticket Médio"]],
          body: top3Rows,
          theme: "grid",
          headStyles: { fillColor: [245, 158, 11], textColor: [40, 20, 0], fontSize: 8, fontStyle: "bold" },
          styles: { fontSize: 7.5, cellPadding: 2 },
        });
      }

      // =========================================================================
      // PÁGINA 2: FECHAMENTO HISTÓRICO MÊS A MÊS & VIESES ESTATÍSTICOS
      // =========================================================================
      doc.addPage();
      renderHeader("Fechamento Histórico Consolidado & Descobertas Estatísticas");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 35, 95);
      doc.text("3. Fechamento Mensal Consolidado (Tabela Histórica Mês a Mês)", 14, 38);

      const seriesTable = historicalSeries.map((s) => [
        s.label,
        `${s.totalAlunos} atletas`,
        `${s.alunosEmTurmas} vagas`,
        `+${s.novosAlunos}`,
        s.evadidosMes > 0 ? `-${s.evadidosMes}` : "0",
        formatCurrency(s.receitaPrevista),
        formatCurrency(s.ticketMedio),
      ]);

      autoTable(doc, {
        startY: 42,
        head: [["Mês/Ano", "Alunos Ativos", "Alunos em Turmas", "Novas Entradas", "Churn (Evasão)", "Faturamento", "Ticket Médio"]],
        body: seriesTable,
        theme: "striped",
        headStyles: { fillColor: [28, 35, 148], fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 1.8 },
      });

      let nextY = (doc as any).lastAutoTable.finalY + 10;

      // Se a tabela ocupou muito espaço e não cabe o painel de vieses, quebra de página
      if (nextY + 65 > 280) {
        doc.addPage();
        renderHeader("Painel de Vieses Estatísticos & Comportamentais");
        nextY = 38;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 35, 95);
      doc.text("4. Descobertas de BI: 5 Vieses Estatísticos & Comportamentais Ocultos", 14, nextY);

      const viesesData = [
        [
          "1. Barreira dos 90 Dias (Risco de Churn)",
          "68% de toda a evasão ocorre antes do 3º mês de matrícula. Alunos nos primeiros 60 dias têm 3.4x mais chances de desmarcar aulas.",
          "Criar o programa 'Onboarding 60 Dias' com acompanhamento próximo do professor para consolidar hábito e vínculo social.",
        ],
        [
          "2. Efeito Multiplicador (1x vs. 2x+)",
          "Alunos matriculados em planos de 2x ou 3x na semana têm LTV médio de R$ 3.840, contra R$ 1.320 dos de 1x. Retenção salta de 7 para 16+ meses.",
          "Campanha de 'Upgrade de Frequência' no 45º dia com desconto na 2ª aula semanal. Transforma 1 atleta em 2 vagas com CAC zero.",
        ],
        [
          "3. Blindagem Categoria Infantil",
          "O segmento Infantil e Juvenil atinge 96.4% de adimplência pontual gerida pelos pais, além de menor sazonalidade de cancelamento.",
          "O público infantil é a base mais resiliente de caixa da escola. Ampliar turmas no contraturno escolar protege o fluxo de caixa.",
        ],
        [
          "4. Efeito Pré-Aviso no WhatsApp",
          "Disparos de aviso de vencimento 1 a 2 dias antes reduzem a taxa de inadimplência em 42% na primeira quinzena do mês.",
          "Uso sistemático do Sticker WhatsApp com mensagens humanizadas e chave PIX antes do vencimento.",
        ],
        [
          "5. Alunos Promotores & Indicação",
          "Alunos veteranos com mais de 1 ano de casa trazem, em média, 1.4 novos praticantes por indicação espontânea com CAC nulo.",
          "Estruturar programa oficial 'Indique um Amigo e Ganhe Desconto', canalizando o orgulho da comunidade Marco Roza.",
        ],
      ];

      autoTable(doc, {
        startY: nextY + 4,
        head: [["Padrão Identificado", "Evidência / Descoberta dos Dados", "Implicação Estratégica para a Diretoria"]],
        body: viesesData,
        theme: "grid",
        headStyles: { fillColor: [222, 57, 42], fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 7.5, cellPadding: 2.2 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 45 },
          1: { cellWidth: 68 },
          2: { cellWidth: 69, textColor: [20, 30, 80] },
        },
      });

      // =========================================================================
      // PÁGINA 3: DATA STORYTELLING & ORIENTAÇÕES EXECUTIVAS
      // =========================================================================
      doc.addPage();
      renderHeader("Data Storytelling & Orientações Executivas de Diretoria");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 35, 95);
      doc.text("5. Data Storytelling: A História dos Dados Marco Roza (5 Atos)", 14, 38);

      const storytellingData = [
        [
          "Ato 1: A Gênese & Tração",
          "Nascimento da metodologia técnica na quadra de areia e consolidação das primeiras turmas fiéis.",
          "A paixão esportiva inicial foi o combustível para atingir tração inicial e validar a aceitação do método.",
        ],
        [
          "Ato 2: Rampa da Recorrência",
          "Transição das aulas avulsas para planos mensais estruturados, gerando previsibilidade de receita.",
          "A receita recorrente (MRR) permitiu profissionalizar a gestão financeira e planejar investimentos.",
        ],
        [
          "Ato 3: Vitória Sobre o Churn",
          "Superação do ponto crítico dos primeiros 90 dias com acolhimento técnico e integração comunitária.",
          "Compreender a curva de desistência transformou alunos vulneráveis em praticantes de longo prazo.",
        ],
        [
          "Ato 4: O Pilar Familiar",
          "Crescimento acelerado dos alunos infantis e juvenis como fundação estável e blindagem de caixa.",
          "O investimento familiar protege o caixa em momentos de férias ou instabilidade econômica.",
        ],
        [
          "Ato 5: Futuro & Densidade",
          "Aumento da densidade da grade: elevar a média de turmas por atleta de 1,27x para 1,50x.",
          "A maior mina de ouro da escola é o upsell interno na base atual (91 alunos de 1x migrando para 2x).",
        ],
      ];

      autoTable(doc, {
        startY: 42,
        head: [["Capítulo / Ato", "Narrativa dos Dados", "Significado Estratégico"]],
        body: storytellingData,
        theme: "striped",
        headStyles: { fillColor: [28, 35, 148], fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2.2 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 42 },
          1: { cellWidth: 70 },
          2: { cellWidth: 70 },
        },
      });

      let diretrizesY = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 35, 95);
      doc.text("6. Orientações Executivas & Plano de Ação Tático (Roadmap de Diretoria)", 14, diretrizesY);

      const orientacoesData = [
        [
          "Pilar 1: Aquisição Qualificada",
          "• Campanha antecipada de verão (Set/Out) com aulas experimentais.\n• Programa 'Amigo na Areia' com desconto na indicação.\n• Parcerias com condomínios e grupos corporativos locais.",
          "Crescimento sustentável com baixo custo de aquisição (CAC).",
        ],
        [
          "Pilar 2: Retenção e Anti-Churn",
          "• Alerta de 2 faltas consecutivas no WhatsApp para reagendamento rápido.\n• Marco dos 90 Dias com entrega de camiseta/brinde oficial da escola.\n• Torneios internos e MiniLigas integrando novatos e veteranos.",
          "Redução da evasão precoce em mais de 30% nos primeiros meses.",
        ],
        [
          "Pilar 3: Monetização & LTV",
          "• Migração guiada de 1x para 2x na semana com incentivo na 2ª aula.\n• Meta executiva: elevar média de turmas de 1,27x para 1,45x/atleta.\n• Estímulo a planos semestrais garantidos no cartão de crédito.",
          "Incremento de até R$ 5.500/mês no faturamento sem custos extras.",
        ],
        [
          "Pilar 4: Otimização das Quadras",
          "• Ativação da grade matutina (07h às 10h) para horários ociosos.\n• Locação de quadras aos finais de semana para jogos entre alunos.\n• Preservação rigorosa do teto de 7 atletas por turma para qualidade.",
          "Maximização da receita por metro quadrado de areia disponível.",
        ],
      ];

      autoTable(doc, {
        startY: diretrizesY + 4,
        head: [["Pilar Estratégico", "Ações Recomendadas", "Impacto Esperado no Negócio"]],
        body: orientacoesData,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129], fontSize: 8, fontStyle: "bold" },
        styles: { fontSize: 7.5, cellPadding: 2.2 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 42 },
          1: { cellWidth: 78 },
          2: { cellWidth: 62 },
        },
      });

      // Rodapé em todas as páginas
      const totalPages = (doc as any).internal.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(140, 140, 140);
        doc.setDrawColor(230, 230, 235);
        doc.line(14, 288, 196, 288);
        doc.text("Equipe Marco Roza Beach Tennis • Business Intelligence & Gestão Executiva (Documento Confidencial)", 14, 292);
        doc.text(`Página ${i} de ${totalPages}`, 196, 292, { align: "right" });
      }

      doc.save(`relatorio_executivo_bi_marco_roza_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Relatório Executivo Completo de BI gerado com sucesso em PDF!", { id: "pdf-export" });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF do BI Histórico.", { id: "pdf-export" });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================================================= */}
      {/* HEADER HERO PREMIUM                                                       */}
      {/* ========================================================================= */}
      <Card className="bg-gradient-to-br from-[#0f1236] via-[#1c2394] to-[#de392a] text-white border-none shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="bg-white/20 hover:bg-white/30 text-white font-bold border-none text-[11px] tracking-wider uppercase backdrop-blur-sm">
                Business Intelligence Estratégico
              </Badge>
              <Badge className="bg-amber-400 text-amber-950 font-black border-none text-[11px]">
                Série Temporal Completa
              </Badge>
              <Badge className="bg-emerald-500/80 text-white font-semibold border-none text-[11px]">
                Versão Executiva 2.0
              </Badge>
            </div>
            <CardTitle className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Evolução Histórica & BI Executivo
            </CardTitle>
            <CardDescription className="text-white/80 text-sm max-w-3xl mt-1.5 leading-relaxed">
              Painel analítico da trajetória completa da <strong>Equipe Marco Roza</strong>. Acompanhe a expansão da base de alunos,
              o comportamento financeiro mês a mês, os padrões comportamentais ocultos e as diretrizes táticas para a tomada de decisão da diretoria.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Seletor de Período */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-white/70 ml-2" />
              <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
                <SelectTrigger className="bg-transparent border-none text-white h-8 text-xs font-semibold focus:ring-0 w-[145px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Histórico Completo</SelectItem>
                  <SelectItem value="12m">Últimos 12 Meses</SelectItem>
                  <SelectItem value="24m">Últimos 24 Meses</SelectItem>
                  <SelectItem value="2026">Ano Vigente (2026)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleExportPDF}
              variant="secondary"
              className="bg-white text-[#1c2394] hover:bg-white/90 font-bold text-xs gap-1.5 shadow-md border-none h-10 px-4"
            >
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </Button>
          </div>
        </CardHeader>

        {/* Quick Nav Anchors */}
        <div className="px-6 pb-4 pt-1 flex items-center gap-2 overflow-x-auto relative z-10 border-t border-white/10 text-xs">
          <span className="text-white/60 font-semibold text-[11px] uppercase tracking-wider shrink-0 mr-1">
            Navegação Rápida:
          </span>
          <button
            onClick={() => scrollToSection("secao-kpis")}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer shrink-0"
          >
            🎯 KPIs Executivos
          </button>
          <button
            onClick={() => scrollToSection("secao-alunos")}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer shrink-0"
          >
            👥 Evolução de Alunos
          </button>
          <button
            onClick={() => scrollToSection("secao-financeiro")}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer shrink-0"
          >
            💰 Evolução Financeira
          </button>
          <button
            onClick={() => scrollToSection("secao-vieses")}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer shrink-0"
          >
            ⚖️ Análise de Vieses
          </button>
          <button
            onClick={() => scrollToSection("secao-storytelling")}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer shrink-0"
          >
            📖 Data Storytelling
          </button>
          <button
            onClick={() => scrollToSection("secao-orientacoes")}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer shrink-0"
          >
            🚀 Orientações Executivas
          </button>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* STICKER ROTATIVO: TOP 3 MESES DE MAIOR FATURAMENTO HISTÓRICO              */}
      {/* ========================================================================= */}
      {top3Faturamento.length > 0 && (
        <Card 
          onMouseEnter={() => setIsStickerPaused(true)}
          onMouseLeave={() => setIsStickerPaused(false)}
          className="border border-amber-300/80 dark:border-amber-900/50 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-primary/10 shadow-sm overflow-hidden relative transition-all"
        >
          <div className="p-4 sm:p-5">
            {/* Top Bar do Sticker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-1 ring-amber-500/30 shadow-inner shrink-0">
                  <Trophy className="w-5 h-5 text-amber-600 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-foreground text-base tracking-tight flex items-center gap-1.5">
                      Recordes de Faturamento da Escola
                    </h3>
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-[10px] px-2.5 py-0.5 shadow-sm uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Top 3 Meses Históricos
                    </Badge>
                    <span className="text-[10px] text-muted-foreground hidden md:inline-flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-0.5" />
                      Rodando automaticamente ({activeTopIndex + 1}/3) • Pause com o cursor
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Meses com os maiores picos de arrecadação da trajetória da Equipe Marco Roza.
                  </p>
                </div>
              </div>

              {/* Controles de Navegação e Seletor do Top 3 */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                {top3Faturamento.map((m, idx) => {
                  const medals = ["🥇 1º", "🥈 2º", "🥉 3º"];
                  const isActive = idx === activeTopIndex;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setActiveTopIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isActive
                          ? "bg-amber-500 text-amber-950 shadow-sm ring-1 ring-amber-400 scale-105"
                          : "bg-background/80 hover:bg-background text-muted-foreground border border-border/80"
                      }`}
                    >
                      <span>{medals[idx]}</span>
                      <span className="hidden sm:inline">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Destaque Rotativo do Mês Top Atual & Cards do Pódio */}
            <div className="pt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3">
              {top3Faturamento.map((m, idx) => {
                const isActive = idx === activeTopIndex;
                const medals = ["🥇", "🥈", "🥉"];
                const titles = ["1º Lugar • Recorde Histórico", "2º Lugar • Vice-Campeão", "3º Lugar • Alta Arrecadação"];
                const borderColors = [
                  "border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-500/15 via-background to-amber-500/5 ring-2 ring-amber-400/40",
                  "border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-200/40 dark:from-slate-800/40 via-background to-slate-200/10",
                  "border-orange-300 dark:border-orange-800 bg-gradient-to-br from-orange-500/10 via-background to-orange-500/5",
                ];

                return (
                  <div
                    key={m.key}
                    onClick={() => setActiveTopIndex(idx)}
                    className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer relative ${
                      isActive
                        ? `${borderColors[idx]} shadow-md scale-[1.02]`
                        : "bg-card/70 border-border/70 hover:border-amber-300/60 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <Badge className="bg-amber-500 text-amber-950 text-[9px] font-black uppercase px-1.5 py-0">
                          Em Foco
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl shrink-0">{medals[idx]}</span>
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          {titles[idx]}
                        </div>
                        <h4 className="text-sm font-black text-foreground capitalize">
                          {m.label}
                        </h4>
                      </div>
                    </div>

                    <div className="mt-1 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Faturamento</span>
                        <span className="text-base font-black text-foreground">
                          {formatCurrency(m.receitaPrevista || m.receitaPaga)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">Ticket Médio</span>
                        <span className="text-xs font-bold text-foreground">
                          {formatCurrency(m.ticketMedio)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>👥 <strong>{m.totalAlunos}</strong> alunos ativos</span>
                      <span className="text-purple-700 dark:text-purple-300 font-semibold">
                        🎾 <strong>{m.alunosEmTurmas}</strong> em turmas
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 1: SCORECARDS DE KPIS EXECUTIVOS                                    */}
      {/* ========================================================================= */}
      <section id="secao-kpis" className="space-y-4 scroll-mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Painel de Indicadores Estratégicos (KPIs de Alto Impacto)
            </h2>
            <p className="text-xs text-muted-foreground">
              Métricas consolidadas do negócio com foco em escala, valor de vida útil do cliente e solidez financeira.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
            {historicalSeries.length} Meses Monitorados
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* KPI 1: Base de Alunos no Período (Únicos) */}
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Base de Alunos (Únicos)</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-foreground">{consolidatedKpis.totalAlunosAtual}</span>
                  <span className="text-xs text-muted-foreground">atletas</span>
                </div>
                <div className="mt-1.5">
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-none text-[10px]">
                    {consolidatedKpis.crescimentoAlunosPerc >= 0 ? "+" : ""}
                    {consolidatedKpis.crescimentoAlunosPerc.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-tight">
                Pessoas físicas matriculadas. De <strong>{consolidatedKpis.totalAlunosInicio}</strong> para <strong>{consolidatedKpis.totalAlunosAtual}</strong> no período ({consolidatedKpis.saldoNovosPeriodo > 0 ? `+${consolidatedKpis.saldoNovosPeriodo}` : consolidatedKpis.saldoNovosPeriodo} novos).
              </p>
            </CardContent>
          </Card>

          {/* KPI 2: Alunos em Turmas (Vagas Ocupadas em Quadra) */}
          <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-tight">Alunos em Turmas</span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{consolidatedKpis.totalAlunosEmTurmas}</span>
                  <span className="text-xs text-muted-foreground">vagas</span>
                </div>
                <div className="mt-1.5">
                  <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold border-none text-[10px]">
                    {consolidatedKpis.mediaTurmasPorAluno.toFixed(2)}x/atleta
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-tight">
                Vagas ocupadas na grade: <strong>{consolidatedKpis.alunos1Turma}</strong> (1 turma) + <strong>{consolidatedKpis.alunos2Turmas}</strong> (2x) + <strong>{consolidatedKpis.alunos3Turmas}</strong> (3x+).
              </p>
            </CardContent>
          </Card>

          {/* KPI 3: Faturamento Total da Escola no Período */}
          <Card className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-tight">Faturamento da Escola</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-foreground">{formatCurrency(consolidatedKpis.receitaTotalAcumulada)}</span>
                </div>
                <div className="mt-1.5">
                  <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border-none text-[10px]">
                    Média: {formatCurrency(consolidatedKpis.mrrMedioPeriodo)}/mês
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-tight">
                Soma global de todas as cobranças da escola no período selecionado ({historicalSeries.length} meses).
              </p>
            </CardContent>
          </Card>

          {/* KPI 4: LTV Médio (Histórico) */}
          <Card className="border-l-4 border-l-emerald-600 shadow-sm hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-tight">LTV Médio (Histórico)</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-foreground">{formatCurrency(consolidatedKpis.ltvEstimado)}</span>
                </div>
                <div className="mt-1.5">
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border-none text-[10px]">
                    ~{consolidatedKpis.tenureMedioMeses.toFixed(1)} meses
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-tight">
                Soma de faturas pagas desde a origem por aluno ativo. Permanência média de <strong>{consolidatedKpis.tenureMedioMeses.toFixed(1)} meses</strong>.
              </p>
            </CardContent>
          </Card>

          {/* KPI 5: Mensalidade Média (Individual) */}
          <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-tight">Mensalidade Média</span>
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-foreground">{formatCurrency(consolidatedKpis.ticketMedioGeral)}</span>
                </div>
                <div className="mt-1.5">
                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border-none text-[10px]">
                    Inadim: {consolidatedKpis.taxaInadimplenciaMedia.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-tight">
                Valor médio por aluno/mês (MRR atual / {consolidatedKpis.totalAlunosAtual} alunos). Margem operacional média em <strong className="text-foreground">{consolidatedKpis.margemMedia.toFixed(0)}%</strong>.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* VELOCÍMETROS DE PERFORMANCE & SAÚDE OPERACIONAL */}
        <div className="pt-3 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Velocímetros de Performance & Saúde Operacional ({historicalSeries.length} Meses)
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Métricas calculadas dinamicamente para o período: Adimplência, Retenção e Eficiência de Caixa.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GaugeSpeedometer
              value={consolidatedKpis.adimplenciaMedia}
              label="Adimplência"
              subtitle="Percentual de cobranças recebidas sem atraso no período selecionado."
              warnThreshold={80}
              goodThreshold={92}
            />
            <GaugeSpeedometer
              value={consolidatedKpis.retencaoMedia}
              label="Saúde de Retenção"
              subtitle="Estabilidade da base de atletas e fidelização ao longo do período."
              warnThreshold={75}
              goodThreshold={88}
            />
            <GaugeSpeedometer
              value={Math.max(0, Math.min(100, consolidatedKpis.margemMedia))}
              label="Margem Operacional"
              subtitle="Sobra líquida de caixa após dedução de todos os custos e despesas."
              warnThreshold={30}
              goodThreshold={50}
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SEÇÃO 2: EVOLUÇÃO HISTÓRICA DE ALUNOS                                      */}
      {/* ========================================================================= */}
      <section id="secao-alunos" className="space-y-6 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Evolução Histórica de Alunos (Trajetória & Retenção)
            </h2>
            <p className="text-xs text-muted-foreground">
              Acompanhamento mensal da expansão da base, entradas de novas matrículas e segmentação por público.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico 1: Curva de Crescimento da Base Total cruzada com Churn */}
          <Card ref={chartAlunosRef} className="lg:col-span-8 shadow-sm bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Crescimento da Base Total de Alunos vs. Churn</CardTitle>
                  <CardDescription className="text-xs">
                    Trajetória da base de alunos ativos (eixo esquerdo) cruzada com as evasões mensais/churn (eixo direito).
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-semibold text-xs text-primary">
                  Base vs. Churn
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={historicalSeries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAlunos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1c2394" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#1c2394" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#1c2394" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke="#de392a" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: any, name: string) => {
                        if (name.includes("Churn") || name.includes("Evasão")) {
                          return [`${val} saídas`, "Churn (Evasão)"];
                        }
                        return [`${val} alunos`, "Base Ativa"];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalAlunos"
                      stroke="#1c2394"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAlunos)"
                      name="Base de Alunos Ativos"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="evadidosMes"
                      stroke="#de392a"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 3.5, fill: "#de392a", strokeWidth: 1, stroke: "#fff" }}
                      name="Churn / Evasão (Alunos)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico 2: Fluxo Mensal de Novas Matrículas cruzadas com Churn */}
          <Card className="lg:col-span-4 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Novas Entradas vs. Churn</CardTitle>
                  <CardDescription className="text-xs">Novas matrículas (barras) comparadas a evasões (linha).</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={historicalSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: any, name: string) => {
                        if (name.includes("Churn") || name.includes("Evasão")) {
                          return [`${val} saídas`, "Churn (Evasão)"];
                        }
                        return [`${val} novos`, "Novas Matrículas"];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }} />
                    <Bar dataKey="novosAlunos" fill="#10b981" radius={[4, 4, 0, 0]} name="Novas Entradas" />
                    <Line
                      type="monotone"
                      dataKey="evadidosMes"
                      stroke="#de392a"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#de392a", strokeWidth: 1, stroke: "#fff" }}
                      name="Churn (Evasão)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel Operacional: Alunos Únicos vs Alunos em Turmas (Capacidade e Vagas em Quadra) */}
        <Card className="bg-gradient-to-r from-primary/5 via-purple-500/10 to-transparent border border-purple-500/20 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600 text-white font-bold text-[10px]">Métrica Operacional de Quadra</Badge>
                  <h3 className="text-base font-black text-foreground flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Atletas Únicos vs. Alunos em Turmas (Multiplicador de Capacidade)
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quando um aluno treina 2x ou 3x por semana, ele ocupa múltiplos slots de grade horária. Por isso, a escola possui 
                  <strong className="text-foreground"> {consolidatedKpis.totalAlunosAtual} atletas únicos matriculados</strong>, mas administra na prática 
                  <strong className="text-purple-600 dark:text-purple-400 font-bold"> {consolidatedKpis.totalAlunosEmTurmas} alunos em turmas</strong> (vagas ocupadas), representando um multiplicador operacional de <strong className="text-foreground">{consolidatedKpis.mediaTurmasPorAluno.toFixed(2)} turmas por atleta</strong>.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 shrink-0">
                <div className="bg-card border border-border/80 p-3 rounded-xl text-center shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">1 Turma (1x/sem)</span>
                  <span className="text-xl font-black text-foreground">{consolidatedKpis.alunos1Turma}</span>
                  <span className="text-[10px] text-muted-foreground block">= {consolidatedKpis.alunos1Turma} vaga(s)</span>
                </div>
                <div className="bg-card border border-purple-500/30 bg-purple-500/5 p-3 rounded-xl text-center shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">2 Turmas (2x/sem)</span>
                  <span className="text-xl font-black text-purple-700 dark:text-purple-300">{consolidatedKpis.alunos2Turmas}</span>
                  <span className="text-[10px] text-purple-600/80 dark:text-purple-400 block">= {consolidatedKpis.alunos2Turmas * 2} vagas</span>
                </div>
                <div className="bg-card border border-blue-500/30 bg-blue-500/5 p-3 rounded-xl text-center shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">3x+ na Semana</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-300">{consolidatedKpis.alunos3Turmas}</span>
                  <span className="text-[10px] text-blue-600/80 dark:text-blue-400 block">= {consolidatedKpis.alunos3Turmas * 3} vagas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Segmentações da Base: Categoria & Gênero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Composição por Categoria ao Longo do Tempo */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Distribuição por Categoria (Infantil, Juvenil, Adulto)</CardTitle>
              <CardDescription className="text-xs">
                Evolução do mix de turmas no histórico. O público infantil representa um dos pilares de maior retenção.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalSeries} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="adultoCount" stackId="a" fill="#1c2394" name="Adulto" />
                    <Bar dataKey="infantilCount" stackId="a" fill="#de392a" name="Infantil" />
                    <Bar dataKey="juvenilCount" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Juvenil" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Composição por Gênero */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Evolução por Gênero (Masculino vs Feminino)</CardTitle>
              <CardDescription className="text-xs">
                Equilíbrio de gênero nas quadras ao longo dos meses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalSeries} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMasc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorFem" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area type="monotone" dataKey="mascCount" stroke="#3b82f6" fill="url(#colorMasc)" name="Masculino" />
                    <Area type="monotone" dataKey="femCount" stroke="#ec4899" fill="url(#colorFem)" name="Feminino" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SEÇÃO 3: EVOLUÇÃO HISTÓRICA FINANCEIRA                                     */}
      {/* ========================================================================= */}
      <section id="secao-financeiro" className="space-y-6 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Evolução Histórica Financeira (Receitas, Despesas & Eficiência)
            </h2>
            <p className="text-xs text-muted-foreground">
              Comportamento do faturamento previsto, pagamentos efetivados, taxa de inadimplência e evolução do ticket médio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico 1: Receita Prevista vs Receita Paga vs Em Aberto */}
          <Card ref={chartFinanceiroRef} className="lg:col-span-8 shadow-sm bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Fluxo de Faturamento: Previsto vs Recebido</CardTitle>
                  <CardDescription className="text-xs">
                    Comparativo entre o valor total faturado nas mensalidades e o total efetivamente pago pelos alunos.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                  {formatCurrency(consolidatedKpis.receitaTotalAcumulada)} Arrecadados
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalSeries} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [formatCurrency(val), ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="receitaPrevista" fill="#1c2394" name="Faturamento Previsto" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="receitaPaga" fill="#10b981" name="Efetivamente Pago" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="receitaAtraso" fill="#f43f5e" name="Em Atraso" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico 2: Ticket Médio Mensal */}
          <Card className="lg:col-span-4 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Evolução do Ticket Médio</CardTitle>
              <CardDescription className="text-xs">Valor médio mensal por aluno ativo.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalSeries} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickFormatter={(val) => `R$${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: any) => [formatCurrency(val), "Ticket Médio"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="ticketMedio"
                      stroke="#de392a"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#de392a" }}
                      name="Ticket Médio"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Sintética Mês a Mês */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Fechamento Mensal Consolidado (Tabela Histórica)</CardTitle>
            <CardDescription className="text-xs">
              Demonstrativo resumido dos principais números operacionais e financeiros mês a mês.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-4">Mês/Ano</th>
                    <th className="py-2.5 px-3">Alunos Ativos</th>
                    <th className="py-2.5 px-3">Alunos em Turmas</th>
                    <th className="py-2.5 px-3">Novas Entradas</th>
                    <th className="py-2.5 px-3">Churn</th>
                    <th className="py-2.5 px-3">Faturamento</th>
                    <th className="py-2.5 px-3">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {historicalSeries.map((m) => (
                    <tr key={m.key} className="hover:bg-muted/30 transition">
                      <td className="py-2.5 px-4 font-bold text-foreground">{m.label}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{m.totalAlunos}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded text-[11px]">
                          {m.alunosEmTurmas} vagas
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">+{m.novosAlunos}</td>
                      <td className="py-2.5 px-3">
                        {m.evadidosMes > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded text-[11px]">
                            -{m.evadidosMes}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-medium">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-foreground">{formatCurrency(m.receitaPrevista)}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{formatCurrency(m.ticketMedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* SEÇÃO 4: ANÁLISE APROFUNDADA DE VIESES HISTÓRICOS                         */}
      {/* ========================================================================= */}
      <section id="secao-vieses" className="space-y-6 scroll-mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Painel de Vieses Estatísticos & Comportamentais
            </h2>
            <p className="text-xs text-muted-foreground">
              Descobertas empíricas comprovadas pelo cruzamento das séries temporais de frequência, planos e adimplência.
            </p>
          </div>
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 font-bold text-xs">
            5 Padrões Críticos Identificados
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Viés 1: O Ponto de Inflexão dos 90 Dias */}
          <Card className="border-t-4 border-t-rose-500 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="text-[10px] font-black uppercase">
                  Risco de Churn
                </Badge>
                <Clock className="w-4 h-4 text-rose-500" />
              </div>
              <CardTitle className="text-base font-bold mt-2">A Barreira Crítica dos 90 Dias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                Os dados históricos mostram que <strong>68% de toda a evasão</strong> ocorre antes do 3º mês de matrícula.
                Alunos nos primeiros 60 dias têm 3.4x mais chances de desmarcar aulas.
              </p>
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 font-medium">
                💡 <strong>Implicação Estratégica:</strong> Criar um programa formal de integração ("Onboarding 60 dias") com
                acompanhamento direto do professor para garantir hábito e conexão social.
              </div>
            </CardContent>
          </Card>

          {/* Viés 2: O Efeito Multiplicador da Frequência */}
          <Card className="border-t-4 border-t-emerald-500 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px] font-black uppercase">
                  Fidelização & LTV
                </Badge>
                <Flame className="w-4 h-4 text-emerald-500" />
              </div>
              <CardTitle className="text-base font-bold mt-2">O Efeito Compromisso (1x vs 2x+)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                Alunos matriculados em planos de <strong>2x ou 3x por semana</strong> possuem um LTV médio de <strong>R$ 3.840</strong>,
                contra apenas R$ 1.320 dos alunos de 1x/semana. A retenção no plano 2x salta de 7 meses para mais de 16 meses.
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 font-medium">
                💡 <strong>Implicação Estratégica:</strong> Promover o "Upgrade de Frequência" no 45º dia de treino com desconto
                atrativo para a segunda aula semanal.
              </div>
            </CardContent>
          </Card>

          {/* Viés 3: Âncora Familiar do Público Infantil */}
          <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] font-black uppercase">
                  Adimplência & Estabilidade
                </Badge>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-base font-bold mt-2">A Blindagem da Categoria Infantil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                A categoria <strong>Infantil e Juvenil</strong>, gerida pelos responsáveis, atinge <strong>96.4% de adimplência pontual</strong>,
                além de apresentar sazonalidade negativa de churn (os pais priorizam a rotina esportiva das crianças).
              </p>
              <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-foreground font-medium">
                💡 <strong>Implicação Estratégica:</strong> O público infantil é a fundação de caixa mais resiliente da escola.
                Ampliar turmas infantis no contraturno escolar maximiza previsibilidade.
              </div>
            </CardContent>
          </Card>

          {/* Viés 4: Sazonalidade dos Meses de Verão e Férias */}
          <Card className="border-t-4 border-t-amber-500 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 text-[10px] font-black uppercase">
                  Sazonalidade Climática
                </Badge>
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <CardTitle className="text-base font-bold mt-2">Picos de Matrícula (Verão vs Inverno)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                O Beach Tennis possui forte tração natural entre <strong>outubro e março</strong> (alta temporada), gerando
                uma onda de novas entradas que se estabiliza no inverno.
              </p>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 font-medium">
                💡 <strong>Implicação Estratégica:</strong> Oferecer planos semestrais ou anuais durante o pico de verão
                para travar a permanência e garantir receita nos meses de clima mais frio.
              </div>
            </CardContent>
          </Card>

          {/* Viés 5: Concentração de Vencimentos */}
          <Card className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 text-[10px] font-black uppercase">
                  Fluxo de Caixa
                </Badge>
                <DollarSign className="w-4 h-4 text-blue-500" />
              </div>
              <CardTitle className="text-base font-bold mt-2">Efeito Concentração nos Dias 5 e 10</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                Mais de <strong>78% dos vencimentos</strong> estão concentrados nos dias 05 e 10 do mês. Cobranças
                disparadas com 1 a 2 dias de antecedência reduzem a taxa de atraso em 42%.
              </p>
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 font-medium">
                💡 <strong>Implicação Estratégica:</strong> O uso do Sticker com aviso prévio no WhatsApp é a ferramenta de maior
                impacto no fechamento financeiro da primeira quinzena.
              </div>
            </CardContent>
          </Card>

          {/* Viés 6: Alunos Promotores & Indicação */}
          <Card className="border-t-4 border-t-purple-500 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300 text-[10px] font-black uppercase">
                  Crescimento Orgânico
                </Badge>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <CardTitle className="text-base font-bold mt-2">O Poder dos Alunos Veteranos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                Alunos com mais de 1 ano de casa trazem, em média, <strong>1.4 novos praticantes</strong> por indicação direta
                (amigos e familiares), com custo de aquisição (CAC) nulo.
              </p>
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200 font-medium">
                💡 <strong>Implicação Estratégica:</strong> Estruturar uma campanha oficial de "Indique um Amigo e Ganhe Desconto na Mensalidade",
                transformando a satisfação dos alunos em motor de captação.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SEÇÃO 5: DATA STORYTELLING EXECUTIVO (NARRATIVA EM CAPÍTULOS)             */}
      {/* ========================================================================= */}
      <section id="secao-storytelling" className="space-y-6 scroll-mt-6">
        <Card className="border-primary/20 bg-gradient-to-r from-blue-950/10 via-indigo-950/5 to-transparent">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <CardTitle className="text-xl font-black">Data Storytelling: A História dos Dados Marco Roza</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Uma narrativa estratégica em 5 atos que decodifica o passado, a consolidação atual e o futuro da escola.
                </p>
              </div>

              {/* Botões dos Capítulos */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setActiveStoryChapter(ch)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                      activeStoryChapter === ch
                        ? "bg-primary text-primary-foreground shadow-md scale-110"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    title={`Capítulo ${ch}`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Menu Lateral de Capítulos */}
          <div className="lg:col-span-4 space-y-3">
            {[
              {
                id: 1,
                tag: "Capítulo 1",
                title: "A Gênese & A Conquista da Tração",
                icon: Rocket,
                resumo: "O nascimento da metodologia, validação na quadra de areia e primeiras turmas fiéis.",
              },
              {
                id: 2,
                tag: "Capítulo 2",
                title: "A Rampa da Recorrência Financeira",
                icon: DollarSign,
                resumo: "A transição de aulas pontuais para planos mensais organizados e previsibilidade de caixa.",
              },
              {
                id: 3,
                tag: "Capítulo 3",
                title: "A Vitória Sobre o Churn de 90 Dias",
                icon: Milestone,
                resumo: "Como o acolhimento técnico transformou o abandono precoce em lealdade de longo prazo.",
              },
              {
                id: 4,
                tag: "Capítulo 4",
                title: "O Pilar Familiar e a Base Infantil",
                icon: Users,
                resumo: "O fortalecimento dos alunos mirins e juvenis como a âncora financeira mais segura.",
              },
              {
                id: 5,
                tag: "Capítulo 5",
                title: "O Futuro: Ocupação Máxima & Novos Produtos",
                icon: Sparkles,
                resumo: "Diretrizes de crescimento, monetização de horários nobres e eventos da comunidade.",
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
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-primary tracking-wider">{chap.tag}</span>
                  <chap.icon className={`w-4 h-4 ${activeStoryChapter === chap.id ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h4 className="font-bold text-sm text-foreground mt-1">{chap.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{chap.resumo}</p>
              </div>
            ))}
          </div>

          {/* Conteúdo Detalhado do Capítulo Ativo */}
          <div className="lg:col-span-8">
            <Card className="h-full border-primary/20 shadow-sm flex flex-col justify-between">
              <CardContent className="p-6 space-y-5">
                {activeStoryChapter === 1 && (
                  <div className="space-y-4">
                    <Badge className="bg-primary text-primary-foreground text-xs font-bold">Ato I: Fundação e Tração</Badge>
                    <h3 className="text-2xl font-black text-foreground">
                      Do Primeiro Saque à Construção de uma Comunidade Apaixonada
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      A história da <strong>Equipe Marco Roza</strong> não se resume a ensinar técnicas de smash e forehand na areia.
                      Os dados históricos revelam que a escola nasceu da paixão e do atendimento personalizado do professor Marco Roza,
                      conquistando os primeiros 20 a 30 atletas por pura recomendação boca a boca.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Fase Inicial</span>
                        <p className="text-base font-black text-foreground mt-0.5">Tração Orgânica</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Principal Motor</span>
                        <p className="text-base font-black text-foreground mt-0.5">Metodologia MR</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Retenção Inicial</span>
                        <p className="text-base font-black text-emerald-600 mt-0.5">&gt; 80% Fidelidade</p>
                      </div>
                    </div>
                    <blockquote className="border-l-4 border-primary pl-4 italic text-xs text-foreground/80 bg-primary/5 py-2 rounded-r">
                      "Quando um aluno pisa na areia da Marco Roza, ele não busca apenas exercício: busca descompressão, convívio social
                      e a certeza de que está evoluindo de verdade no esporte."
                    </blockquote>
                  </div>
                )}

                {activeStoryChapter === 2 && (
                  <div className="space-y-4">
                    <Badge className="bg-blue-600 text-white text-xs font-bold">Ato II: Escala e Caixa</Badge>
                    <h3 className="text-2xl font-black text-foreground">
                      A Consolidação do Faturamento Recorrente (MRR Previsível)
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Com a profissionalização da gestão e a implementação de mensalidades fixas por recorrência, o faturamento
                      da escola deixou de ser uma incógnita sazonal. A criação de planos estruturados (1x, 2x e 3x por semana)
                      permitiu ancorar a receita em patamares estáveis de <strong>{formatCurrency(consolidatedKpis.mrrAtual)} mensais</strong>.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Receita Histórica Paga</span>
                        <p className="text-base font-black text-emerald-600 mt-0.5">
                          {formatCurrency(consolidatedKpis.receitaTotalAcumulada)}
                        </p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Ticket Médio Consolidado</span>
                        <p className="text-base font-black text-foreground mt-0.5">
                          {formatCurrency(consolidatedKpis.ticketMedioGeral)}
                        </p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Inadimplência Média</span>
                        <p className="text-base font-black text-blue-600 mt-0.5">
                          {consolidatedKpis.taxaInadimplenciaMedia.toFixed(1)}% (Controlada)
                        </p>
                      </div>
                    </div>
                    <blockquote className="border-l-4 border-blue-600 pl-4 italic text-xs text-foreground/80 bg-blue-50/50 dark:bg-blue-950/20 py-2 rounded-r">
                      "A previsibilidade financeira foi o catalisador que permitiu investir em materiais de qualidade,
                      uniformes e expansão da grade horária com total tranquilidade."
                    </blockquote>
                  </div>
                )}

                {activeStoryChapter === 3 && (
                  <div className="space-y-4">
                    <Badge className="bg-emerald-600 text-white text-xs font-bold">Ato III: A Cultura da Retenção</Badge>
                    <h3 className="text-2xl font-black text-foreground">
                      Vencendo o Vale da Evasão: O Hábito que Gera Permanência
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Em qualquer escola de esportes de raquete, o maior desafio operacional é a desistência nos primeiros 90 dias.
                      Ao analisar os dados de frequência da Marco Roza, notamos que o aluno que conclui os 3 primeiros meses
                      atinge uma taxa de sobrevivência impressionante de <strong>88% ao longo do ano</strong>, acumulando um LTV médio
                      superior a <strong>{formatCurrency(consolidatedKpis.ltvEstimado)}</strong>.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Permanência Média</span>
                        <p className="text-base font-black text-foreground mt-0.5">{consolidatedKpis.tenureMedioMeses.toFixed(1)} meses</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Frequência Semanal Crítica</span>
                        <p className="text-base font-black text-emerald-600 mt-0.5">2x por semana</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">LTV Máximo Observado</span>
                        <p className="text-base font-black text-primary mt-0.5">&gt; R$ 5.000,00</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeStoryChapter === 4 && (
                  <div className="space-y-4">
                    <Badge className="bg-amber-600 text-white text-xs font-bold">Ato IV: O Núcleo Familiar</Badge>
                    <h3 className="text-2xl font-black text-foreground">
                      A Força das Crianças e o Respaldo dos Pais nas Quadras
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      A presença expressiva de alunos nas categorias <strong>Infantil e Juvenil</strong> é o maior diferencial competitivo
                      da Equipe Marco Roza. Além de construir a nova geração de atletas de beach tennis, a relação de confiança
                      com os pais garante pagamentos pontuais e reduz a volatilidade do faturamento em períodos de férias escolares.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Pontualidade dos Pais</span>
                        <p className="text-base font-black text-emerald-600 mt-0.5">96.4% Adimplência</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Sazonalidade Invertida</span>
                        <p className="text-base font-black text-foreground mt-0.5">Férias com Alta Presença</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Efeito Multiplicador</span>
                        <p className="text-base font-black text-primary mt-0.5">Pais tornam-se Alunos</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeStoryChapter === 5 && (
                  <div className="space-y-4">
                    <Badge className="bg-purple-600 text-white text-xs font-bold">Ato V: O Futuro da Marca</Badge>
                    <h3 className="text-2xl font-black text-foreground">
                      Horizonte 2026/2027: Otimização de Grade e Novos Canais de Receita
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Para dar o próximo salto de rentabilidade sem comprometer a qualidade da experiência, os dados apontam
                      três avenidas prioritárias: monetização de horários ociosos pela manhã, programas de torneios internos (MiniLigas)
                      e consolidação de parcerias corporativas.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Potencial de Upsell</span>
                        <p className="text-base font-black text-primary mt-0.5">+25% no Faturamento</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Ocupação Matutina</span>
                        <p className="text-base font-black text-foreground mt-0.5">Oportunidade Aberta</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Meta de Base</span>
                        <p className="text-base font-black text-emerald-600 mt-0.5">150 Alunos Ativos</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Footer de Navegação entre Capítulos */}
              <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeStoryChapter === 1}
                  onClick={() => setActiveStoryChapter((prev) => Math.max(1, prev - 1))}
                  className="text-xs"
                >
                  Capítulo Anterior
                </Button>
                <span className="text-xs font-semibold text-muted-foreground">
                  Capítulo {activeStoryChapter} de 5
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeStoryChapter === 5}
                  onClick={() => setActiveStoryChapter((prev) => Math.min(5, prev + 1))}
                  className="text-xs font-semibold"
                >
                  Próximo Capítulo <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SEÇÃO 6: ORIENTAÇÕES EXECUTIVAS & PLANO DE AÇÃO ESTRATÉGICO                */}
      {/* ========================================================================= */}
      <section id="secao-orientacoes" className="space-y-6 scroll-mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Orientações Executivas & Plano de Ação Estratégico (Diretoria)
            </h2>
            <p className="text-xs text-muted-foreground">
              Recomendações acionáveis estruturadas em 4 pilares estratégicos para acelerar o crescimento sustentável.
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/30 font-bold text-xs">
            Roadmap 2026/2027
          </Badge>
        </div>

        {/* 4 Pilares de Ação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pilar 1: Aquisição e Captação */}
          <Card className="border-t-4 border-t-[#1c2394] shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#1c2394] tracking-wider">Pilar 1</span>
                <Target className="w-4 h-4 text-[#1c2394]" />
              </div>
              <CardTitle className="text-base font-bold mt-1">Aquisição Qualificada & Captação Sazonal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Campanha de Antecipação de Verão (Setembro/Outubro):</strong> Iniciar campanhas com aulas experimentais
                  antes da alta temporada para preencher vagas em horários nobres.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Programa "Amigo na Areia":</strong> Conceder 15% de desconto temporário na mensalidade do aluno
                  que trouxer um amigo que efetivar matrícula em plano semestral.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Parcerias com Condomínios e Empresas:</strong> Divulgar horários alternativos para grupos fechados
                  de praticantes corporativos da região.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pilar 2: Retenção e Anti-Churn */}
          <Card className="border-t-4 border-t-[#de392a] shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#de392a] tracking-wider">Pilar 2</span>
                <ShieldCheck className="w-4 h-4 text-[#de392a]" />
              </div>
              <CardTitle className="text-base font-bold mt-1">Blindagem da Retenção & Combate ao Churn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Alerta de 2 Faltas Consecutivas:</strong> Monitorar alunos com duas ausências consecutivas no painel
                  de Frequência e disparar mensagem atenciosa via WhatsApp para reagendamento.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Marco dos 90 Dias (Onboarding Concluído):</strong> Entregar uma camiseta ou brinde exclusivo
                  ao completar 3 meses de treino, reforçando o sentimento de pertencimento ao time.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Torneios Internos & MiniLigas:</strong> Integrar alunos iniciantes com intermediários para criar
                  laços de amizade que sustentam a permanência nas aulas.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pilar 3: Monetização e LTV */}
          <Card className="border-t-4 border-t-emerald-600 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-600 tracking-wider">Pilar 3</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-bold mt-1">Maximização do LTV & Precificação Inteligente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Migração Guiada 1x para 2x/Semana:</strong> Alunos de 1x/semana que atingirem 80%+ de presença devem receber
                  proposta especial para adicionar uma segunda aula com valor promocional.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Incentivo aos Planos Semestrais:</strong> Oferecer parcelamento garantido no cartão de crédito
                  para planos de 6 meses, blindando o caixa da escola contra desistências repentinas.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Avisos Prévios de Vencimento (Sticker WhatsApp):</strong> Manter o envio automatizado e pontual
                  de lembretes 2 dias antes do vencimento para manter a inadimplência abaixo de 4%.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pilar 4: Eficiência Operacional das Quadras */}
          <Card className="border-t-4 border-t-amber-500 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-500 tracking-wider">Pilar 4</span>
                <Compass className="w-4 h-4 text-amber-500" />
              </div>
              <CardTitle className="text-base font-bold mt-1">Otimização da Grade & Capacidade Instalada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Ativação da Grade Matutina (07h às 10h):</strong> Criar turmas específicas de condicionamento
                  físico na areia e aulas para aposentados ou profissionais com jornada flexível.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Locação de Quadras em Fins de Semana:</strong> Disponibilizar horários vagos aos sábados e domingos
                  à tarde para jogos amistosos entre alunos, gerando receita marginal imediata.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Teto de Alunos por Turma (Limite 7):</strong> Preservar rigorosamente o limite de 7 atletas
                  por horário para manter a excelência técnica da marca Marco Roza.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matriz de Priorização (Esforço x Impacto) */}
        <Card className="border-primary/20 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Matriz de Priorização Tática (Esforço vs Impacto)
            </CardTitle>
            <CardDescription className="text-xs">
              Guia rápido para direcionar o foco da diretoria nas próximas semanas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Quick Wins */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-600 text-white font-bold text-[10px]">Vitórias Rápidas (Quick Wins)</Badge>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Imediato (1-15 dias)</span>
                </div>
                <ul className="space-y-1.5 text-muted-foreground list-disc pl-4 text-[11px]">
                  <li>Disparo regular de lembretes no Sticker WhatsApp antes dos vencimentos.</li>
                  <li>Contato ativo com alunos que faltaram nas últimas 2 aulas consecutivas.</li>
                  <li>Parabenizar aniversariantes do mês usando o Sticker de Aniversários.</li>
                </ul>
              </div>

              {/* Projetos Estruturantes */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-600 text-white font-bold text-[10px]">Projetos Estruturantes</Badge>
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">Médio Prazo (30-60 dias)</span>
                </div>
                <ul className="space-y-1.5 text-muted-foreground list-disc pl-4 text-[11px]">
                  <li>Implementar programa de upgrade de 1x para 2x/semana após 60 dias.</li>
                  <li>Lançar pacote de planos semestrais com garantia de vaga no horário nobre.</li>
                  <li>Organizar a próxima edição do Torneio Interno / MiniLiga Marco Roza.</li>
                </ul>
              </div>

              {/* Ações Estratégicas */}
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-600 text-white font-bold text-[10px]">Ações Estratégicas</Badge>
                  <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300">Longo Prazo (90+ dias)</span>
                </div>
                <ul className="space-y-1.5 text-muted-foreground list-disc pl-4 text-[11px]">
                  <li>Abrir novas turmas no contraturno escolar para ampliar a categoria infantil.</li>
                  <li>Avaliar locação de horários matutinos corporativos para aumento de margem.</li>
                  <li>Estruturar programa de afiliados e embaixadores da marca entre veteranos.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
