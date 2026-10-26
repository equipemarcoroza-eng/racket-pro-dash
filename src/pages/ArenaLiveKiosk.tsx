import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import { CLASS_LIMIT } from "@/data/mockData";
import logo from "@/assets/logo.png";
import {
  Tv,
  Maximize2,
  Minimize2,
  Clock,
  Calendar,
  Cake,
  Trophy,
  Users,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Pause,
  Play,
  ArrowLeft,
  Medal,
  Flame,
  Crown,
  Star,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SLIDE_DURATION = 12000; // 12 segundos por slide

const diasSemanaMap: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

export const ArenaLiveKiosk: React.FC = () => {
  const { 
    schedule = [], 
    students = [], 
    enrollments = [], 
    activities = [], 
    tests = [], 
    testResults = [], 
    attendanceLogs = [] 
  } = useAppContext();
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  // Relógio ao vivo atualizado a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer do Carrossel de 12 segundos
  useEffect(() => {
    if (isPaused) return;

    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, SLIDE_DURATION);

    return () => clearInterval(slideTimer);
  }, [isPaused]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const currentDayOfWeek = diasSemanaMap[currentTime.getDay()] || "Seg";
  const currentHourStr = format(currentTime, "HH:00");

  // ==========================================
  // SLIDE 0: HALL DA FAMA (TOP 3 POR CATEGORIA)
  // Infantil, Juvenil e Adulto
  // ==========================================
  const categoryRankings = useMemo(() => {
    const categories: Array<"Infantil" | "Juvenil" | "Adulto"> = ["Infantil", "Juvenil", "Adulto"];

    const result: Record<
      "Infantil" | "Juvenil" | "Adulto",
      Array<{
        student: any;
        ovr: number;
        scoreSub: string;
        testsCount: number;
        totalHits: number;
        miniligaPontos: number;
        presencas: number;
        isOnFire: boolean;
      }>
    > = {
      Infantil: [],
      Juvenil: [],
      Adulto: [],
    };

    categories.forEach((cat) => {
      const activeInCat = (students || []).filter(
        (s) => s && s.status === "Ativo" && s.categoria === cat
      );

      const scored = activeInCat.map((student) => {
        // Testes técnicos bimestrais
        const sTests = (testResults || []).filter((tr) => tr && tr.alunoId === student.id);
        const totalHits = sTests.reduce((acc, tr) => acc + (tr?.acertos || 0), 0);
        const testsCount = sTests.length;

        // Frequência, Miniligas e Presenças
        const studentLogs = (attendanceLogs || []).filter((l) => l && l.alunoId === student.id);
        const presencas = studentLogs.filter((l) => l?.presente === "Presente").length;
        const reposicoes = studentLogs.filter((l) => l?.presente === "Reposição").length;
        const miniligaLogs = studentLogs.filter((l) => l?.presente === "Miniliga");
        const miniligas = miniligaLogs.length;
        const miniligaPontos = miniligaLogs.reduce((acc, l) => {
          if (typeof l?.miniligaPontos === "number" && l.miniligaPontos > 0) return acc + l.miniligaPontos;
          const legado = l?.motivoCancelamento?.match(/\+(\d+) pts/);
          if (legado) return acc + Number(legado[1]);
          // Base de 3 pontos para presenças de miniliga sem placar lançado
          return acc + 3;
        }, 0);
        const faltas = studentLogs.filter((l) => l?.presente === "Falta").length;

        const attendedClasses = presencas + reposicoes + miniligas;
        const totalValidClasses = attendedClasses + faltas;

        const attendanceRate =
          totalValidClasses > 0
            ? Math.round((attendedClasses / totalValidClasses) * 100)
            : 100;

        // Sequência sem faltas (Streak) com proteção contra nulos
        const sortedLogs = [...studentLogs].sort(
          (a, b) => new Date(b?.data || 0).getTime() - new Date(a?.data || 0).getTime()
        );
        let streakCount = 0;
        for (const log of sortedLogs) {
          if (
            log?.presente === "Presente" ||
            log?.presente === "Reposição" ||
            log?.presente === "Miniliga"
          ) {
            streakCount++;
          } else if (log?.presente === "Falta") {
            break;
          }
        }
        const effectiveStreak = totalValidClasses === 0 ? 3 : streakCount;

        const isOnFire =
          (effectiveStreak >= 2 && attendanceRate >= 80) ||
          (reposicoes > 0 && attendanceRate >= 75) ||
          (student.status === "Ativo" && totalValidClasses === 0);

        // Bônus contínuo no OVR
        let bonusConsistencia = 0;
        if (attendanceRate >= 90 && attendedClasses >= 2) {
          bonusConsistencia = 5;
        } else if (attendanceRate >= 75) {
          bonusConsistencia = 3;
        } else if (totalValidClasses >= 3 && attendanceRate < 60) {
          bonusConsistencia = -3;
        } else {
          bonusConsistencia = 1;
        }

        let ovrBoost = 0;
        if (isOnFire) {
          ovrBoost = 2;
        } else if (bonusConsistencia > 0) {
          ovrBoost = 1;
        } else if (bonusConsistencia < 0) {
          ovrBoost = -1;
        }

        // Baseline por categoria pedagógica
        let baselineOvr = 75;
        if (student.categoria === "Juvenil") baselineOvr = 78;
        if (student.categoria === "Adulto") baselineOvr = 82;

        let overallCalculated = baselineOvr;
        let forehand = baselineOvr - 2;
        let backhand = baselineOvr - 5;
        let lob = baselineOvr - 3;
        let curta = baselineOvr - 4;
        let saque = baselineOvr + 1;
        let smash = baselineOvr + 2;

        let hasForehand = false;
        let hasBackhand = false;
        let hasLob = false;
        let hasCurta = false;
        let hasSaque = false;
        let hasSmash = false;

        let latestDates = {
          forehand: "",
          backhand: "",
          lob: "",
          curta: "",
          saque: "",
          smash: "",
        };

        if (sTests.length > 0) {
          sTests.forEach((res) => {
            const test = (tests || []).find((t) => t?.id === res?.testId);
            const testDate = test?.data || "";
            const act = (activities || []).find((a) => a?.id === res?.atividadeId);
            const base = act?.quantidadeLancamentos || 10;
            const name = (act?.nome || "").toLowerCase();
            const scorePct = Math.min(99, Math.round(((res?.acertos || 0) / Math.max(1, base)) * 100));

            if (name.includes("forehand") || name.includes("direita")) {
              if (!hasForehand || testDate > latestDates.forehand) {
                forehand = Math.max(60, scorePct);
                latestDates.forehand = testDate;
                hasForehand = true;
              } else if (testDate === latestDates.forehand) {
                forehand = Math.max(forehand, Math.max(60, scorePct));
              }
            } else if (name.includes("backhand") || name.includes("esquerda")) {
              if (!hasBackhand || testDate > latestDates.backhand) {
                backhand = Math.max(60, scorePct);
                latestDates.backhand = testDate;
                hasBackhand = true;
              } else if (testDate === latestDates.backhand) {
                backhand = Math.max(backhand, Math.max(60, scorePct));
              }
            } else if (name.includes("lob")) {
              if (!hasLob || testDate > latestDates.lob) {
                lob = Math.max(60, scorePct);
                latestDates.lob = testDate;
                hasLob = true;
              } else if (testDate === latestDates.lob) {
                lob = Math.max(lob, Math.max(60, scorePct));
              }
            } else if (name.includes("curta") || name.includes("curtinha") || name.includes("drop")) {
              if (!hasCurta || testDate > latestDates.curta) {
                curta = Math.max(60, scorePct);
                latestDates.curta = testDate;
                hasCurta = true;
              } else if (testDate === latestDates.curta) {
                curta = Math.max(curta, Math.max(60, scorePct));
              }
            } else if (name.includes("saque") || name.includes("serviço")) {
              if (!hasSaque || testDate > latestDates.saque) {
                saque = Math.max(60, scorePct);
                latestDates.saque = testDate;
                hasSaque = true;
              } else if (testDate === latestDates.saque) {
                saque = Math.max(saque, Math.max(60, scorePct));
              }
            } else if (name.includes("smash")) {
              if (!hasSmash || testDate > latestDates.smash) {
                smash = Math.max(60, scorePct);
                latestDates.smash = testDate;
                hasSmash = true;
              } else if (testDate === latestDates.smash) {
                smash = Math.max(smash, Math.max(60, scorePct));
              }
            }
          });

          overallCalculated = Math.round((forehand + backhand + lob + curta + saque + smash) / 6);
        } else {
          overallCalculated = baselineOvr;
        }

        const ovr = Math.min(99, Math.max(60, overallCalculated + ovrBoost));

        // Subtítulo comprovante com detalhes técnicos
        let scoreSub = "";
        if (testsCount > 0 && miniligaPontos > 0) {
          scoreSub = `${testsCount} ${testsCount === 1 ? "teste" : "testes"} • ${totalHits} bolas • ${miniligaPontos} pts liga`;
        } else if (testsCount > 0) {
          scoreSub = `${testsCount} ${testsCount === 1 ? "teste" : "testes"} • ${totalHits} bolas`;
        } else if (miniligaPontos > 0) {
          scoreSub = `${miniligaPontos} pts na Miniliga`;
        } else if (attendedClasses > 0) {
          scoreSub = `${attendedClasses} aulas • Frequência`;
        } else {
          scoreSub = "Atleta Ativo • Em evolução";
        }

        return {
          student,
          ovr,
          scoreSub,
          testsCount,
          totalHits,
          miniligaPontos,
          presencas: attendedClasses,
          isOnFire,
        };
      });

      // Ordena decrescente pelo OVR (desempate: total de bolas acertadas, pontos de miniliga e aulas)
      result[cat] = scored
        .sort(
          (a, b) =>
            (b.ovr || 0) - (a.ovr || 0) ||
            (b.totalHits || 0) - (a.totalHits || 0) ||
            (b.miniligaPontos || 0) - (a.miniligaPontos || 0) ||
            (b.presencas || 0) - (a.presencas || 0)
        )
        .slice(0, 3);
    });

    return result;
  }, [students, testResults, attendanceLogs, activities, tests]);

  // ==========================================
  // SLIDE 1: GRADE DE HORÁRIOS
  // Exibição do Horário Atual / Selecionado com Cards Largos
  // ==========================================
  const todaySlots = useMemo(() => {
    const list = schedule || [];
    const direct = list.filter((s) => s && s.dia === currentDayOfWeek);
    if (direct.length > 0) return direct;
    // Se o dia atual não tiver aulas cadastradas (ex: domingo ou dia livre),
    // busca o primeiro dia que contenha turmas para nunca exibir tela vazia no totem
    const firstDayWithSlots = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].find((d) =>
      list.some((s) => s && s.dia === d)
    );
    return firstDayWithSlots ? list.filter((s) => s && s.dia === firstDayWithSlots) : list;
  }, [schedule, currentDayOfWeek]);

  // Lista de horários disponíveis no dia de hoje
  const availableHours = useMemo(() => {
    return Array.from(new Set(todaySlots.map((s) => s?.horario).filter(Boolean))).sort();
  }, [todaySlots]);

  // Horário ativo sendo exibido
  const activeHour = useMemo(() => {
    if (selectedHour && availableHours.includes(selectedHour)) {
      return selectedHour;
    }
    if (availableHours.includes(currentHourStr)) {
      return currentHourStr;
    }
    const upcoming = availableHours.find((h) => h >= currentHourStr);
    if (upcoming) return upcoming;
    return availableHours[0] || currentHourStr;
  }, [selectedHour, availableHours, currentHourStr]);

  // Turmas do horário ativo
  const classesInActiveHour = useMemo(() => {
    const slots = todaySlots.filter((s) => s && s.horario === activeHour);
    return slots.sort((a, b) => (a?.quadra || "").localeCompare(b?.quadra || ""));
  }, [todaySlots, activeHour]);

  // Navegação entre horários
  const handlePrevHour = () => {
    if (availableHours.length === 0) return;
    const currentIndex = availableHours.indexOf(activeHour);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableHours.length - 1;
    setSelectedHour(availableHours[prevIndex]);
  };

  const handleNextHour = () => {
    if (availableHours.length === 0) return;
    const currentIndex = availableHours.indexOf(activeHour);
    const nextIndex = currentIndex < availableHours.length - 1 ? currentIndex + 1 : 0;
    setSelectedHour(availableHours[nextIndex]);
  };

  // Aniversariantes do mês atual (suporta YYYY-MM-DD e DD/MM/YYYY)
  const birthdayStudents = useMemo(() => {
    const currentMonth = String(currentTime.getMonth() + 1).padStart(2, "0");
    return (students || [])
      .filter((s) => s && s.status === "Ativo" && typeof s.dataNascimento === "string" && s.dataNascimento.trim() !== "")
      .map((s) => {
        let day = 0;
        let month = "";
        const raw = s.dataNascimento || "";
        if (raw.includes("/")) {
          const parts = raw.split("/");
          day = parseInt(parts[0], 10);
          month = parts[1]?.padStart(2, "0") || "";
        } else if (raw.includes("-")) {
          const parts = raw.split("-");
          day = parseInt(parts[2], 10);
          month = parts[1]?.padStart(2, "0") || "";
        }
        return { student: s, day, month };
      })
      .filter((item) => item.month === currentMonth && !isNaN(item.day) && item.day > 0)
      .sort((a, b) => a.day - b.day);
  }, [students, currentTime]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans relative">
      {/* Background futurista com gradientes dinâmicos */}
      <div className="absolute top-0 left-1/4 w-[650px] h-[650px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[650px] h-[650px] rounded-full bg-amber-500/10 blur-[150px] pointer-events-none" />

      {/* Barra de Progresso do Slide no topo */}
      <div className="w-full bg-slate-900 h-1.5 overflow-hidden">
        <div
          key={currentSlide}
          className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 h-full animate-[progress_12s_linear_infinite]"
          style={{
            animationDuration: `${SLIDE_DURATION}ms`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      </div>

      {/* HEADER DA ARENA LIVE */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-xl relative z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/bi-history"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={logo} alt="Equipe Marco Roza" className="h-12 w-auto object-contain drop-shadow-md" />
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
              Equipe Marco Roza
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px] uppercase font-bold tracking-widest">
                Arena Live Kiosk
              </Badge>
            </h1>
            <p className="text-xs text-slate-400">Painel Oficial de Quadras, Destaques & Atletas</p>
          </div>
        </div>

        {/* Relógio Digital e Data ao Vivo */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-3xl font-black tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-300">
              {format(currentTime, "HH:mm:ss")}
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-300 hover:text-white"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? "Retomar Carrossel" : "Pausar Carrossel"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-300 hover:text-white"
              onClick={toggleFullscreen}
              title="Alternar Tela Cheia"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (SLIDES DINÂMICOS) */}
      <main className="flex-1 p-6 md:p-8 flex items-center justify-center relative z-10 overflow-y-auto">
        {/* ======================================================== */}
        {/* SLIDE 0: HALL DA FAMA - TOP 3 POR CATEGORIA              */}
        {/* (Infantil, Juvenil e Adulto)                             */}
        {/* ======================================================== */}
        {currentSlide === 0 && (
          <div className="w-full max-w-7xl space-y-6 animate-in fade-in zoom-in-95 duration-500 py-2">
            <div className="text-center space-y-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs uppercase tracking-widest px-3 py-1">
                🏆 Quadro de Honra & Destaques Oficiais
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-3">
                <Trophy className="h-8 w-8 md:h-10 md:w-10 text-amber-400 drop-shadow-md" />
                Hall da Fama • Top 3 por Categoria
              </h2>
              <p className="text-slate-300 text-sm max-w-2xl mx-auto">
                Reconhecimento aos atletas com maior OVR e destaque técnico nas três categorias da academia.
              </p>
            </div>

            {/* 3 Colunas: Infantil, Juvenil e Adulto */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CATEGORIA 1: INFANTIL */}
              <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/70 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-cyan-400/60 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider">Infantil</h3>
                      <p className="text-[11px] text-cyan-300 font-semibold">Até 12 anos • Nova Geração</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-cyan-300 border-cyan-500/40">
                    Podium Kids
                  </Badge>
                </div>

                {/* Lista Top 3 Infantil */}
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {categoryRankings.Infantil.length > 0 ? (
                    categoryRankings.Infantil.map((item, index) => {
                      const isGold = index === 0;
                      const isSilver = index === 1;
                      const isBronze = index === 2;

                      return (
                        <div
                          key={item.student.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 relative overflow-hidden ${
                            isGold
                              ? "bg-gradient-to-r from-amber-500/20 via-slate-900/90 to-slate-900/90 border-amber-400/60 shadow-lg shadow-amber-500/10 scale-[1.02]"
                              : isSilver
                              ? "bg-slate-900/80 border-slate-300/40"
                              : "bg-slate-900/60 border-amber-700/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Medalha / Posição */}
                            <div
                              className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-md ${
                                isGold
                                  ? "bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950"
                                  : isSilver
                                  ? "bg-gradient-to-tr from-slate-200 to-slate-400 text-slate-950"
                                  : "bg-gradient-to-tr from-amber-700 to-yellow-800 text-white"
                              }`}
                            >
                              {isGold ? "🥇 1º" : isSilver ? "🥈 2º" : "🥉 3º"}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-base md:text-lg font-black text-white truncate">
                                {item.student.nome}
                              </h4>
                              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                                {item.isOnFire && <span className="text-orange-400 font-bold text-[10px]">🔥</span>}
                                <span>{item.scoreSub}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-baseline justify-end gap-1 font-mono font-black">
                              <span
                                className={`text-xl md:text-2xl font-black ${
                                  isGold ? "text-amber-300 drop-shadow-sm" : isSilver ? "text-slate-100" : "text-amber-400"
                                }`}
                              >
                                {item.ovr}
                              </span>
                              <span className="text-[10px] font-black tracking-wider text-amber-400/80 uppercase">
                                OVR
                              </span>
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-500">
                              {isGold ? "Líder" : "Destaque"}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs italic bg-black/20 rounded-2xl border border-white/5">
                      Nenhum atleta infantil com dados nesta semana.
                    </div>
                  )}

                  {/* Complemento caso haja menos de 3 atletas */}
                  {categoryRankings.Infantil.length > 0 && categoryRankings.Infantil.length < 3 && (
                    <div className="p-3 rounded-2xl border border-dashed border-cyan-500/20 bg-cyan-500/5 text-center text-xs text-cyan-300/80 font-medium">
                      ⭐ Vaga aberta no pódio para os próximos treinos!
                    </div>
                  )}
                </div>

                <div className="pt-2 text-center text-[11px] text-cyan-400/80 font-semibold border-t border-white/5">
                  Top 3 Atletas Categoria Infantil
                </div>
              </div>

              {/* CATEGORIA 2: JUVENIL */}
              <div className="rounded-3xl border border-purple-500/30 bg-slate-900/70 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-purple-400/60 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider">Juvenil</h3>
                      <p className="text-[11px] text-purple-300 font-semibold">13 a 17 anos • Alta Performance</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-purple-300 border-purple-500/40">
                    Podium Teens
                  </Badge>
                </div>

                {/* Lista Top 3 Juvenil */}
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {categoryRankings.Juvenil.length > 0 ? (
                    categoryRankings.Juvenil.map((item, index) => {
                      const isGold = index === 0;
                      const isSilver = index === 1;
                      const isBronze = index === 2;

                      return (
                        <div
                          key={item.student.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 relative overflow-hidden ${
                            isGold
                              ? "bg-gradient-to-r from-amber-500/20 via-slate-900/90 to-slate-900/90 border-amber-400/60 shadow-lg shadow-amber-500/10 scale-[1.02]"
                              : isSilver
                              ? "bg-slate-900/80 border-slate-300/40"
                              : "bg-slate-900/60 border-amber-700/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Medalha / Posição */}
                            <div
                              className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-md ${
                                isGold
                                  ? "bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950"
                                  : isSilver
                                  ? "bg-gradient-to-tr from-slate-200 to-slate-400 text-slate-950"
                                  : "bg-gradient-to-tr from-amber-700 to-yellow-800 text-white"
                              }`}
                            >
                              {isGold ? "🥇 1º" : isSilver ? "🥈 2º" : "🥉 3º"}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-base md:text-lg font-black text-white truncate">
                                {item.student.nome}
                              </h4>
                              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                                {item.isOnFire && <span className="text-orange-400 font-bold text-[10px]">🔥</span>}
                                <span>{item.scoreSub}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-baseline justify-end gap-1 font-mono font-black">
                              <span
                                className={`text-xl md:text-2xl font-black ${
                                  isGold ? "text-amber-300 drop-shadow-sm" : isSilver ? "text-slate-100" : "text-amber-400"
                                }`}
                              >
                                {item.ovr}
                              </span>
                              <span className="text-[10px] font-black tracking-wider text-amber-400/80 uppercase">
                                OVR
                              </span>
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-500">
                              {isGold ? "Líder" : "Destaque"}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs italic bg-black/20 rounded-2xl border border-white/5">
                      Nenhum atleta juvenil com dados nesta semana.
                    </div>
                  )}

                  {/* Complemento caso haja menos de 3 atletas */}
                  {categoryRankings.Juvenil.length > 0 && categoryRankings.Juvenil.length < 3 && (
                    <div className="p-3 rounded-2xl border border-dashed border-purple-500/20 bg-purple-500/5 text-center text-xs text-purple-300/80 font-medium">
                      ⭐ Vaga aberta no pódio para os próximos treinos!
                    </div>
                  )}
                </div>

                <div className="pt-2 text-center text-[11px] text-purple-400/80 font-semibold border-t border-white/5">
                  Top 3 Atletas Categoria Juvenil
                </div>
              </div>

              {/* CATEGORIA 3: ADULTO */}
              <div className="rounded-3xl border border-amber-500/30 bg-slate-900/70 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-amber-400/60 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider">Adulto</h3>
                      <p className="text-[11px] text-amber-300 font-semibold">+18 anos • Mestres & Elite</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-300 border-amber-500/40">
                    Podium Adulto
                  </Badge>
                </div>

                {/* Lista Top 3 Adulto */}
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {categoryRankings.Adulto.length > 0 ? (
                    categoryRankings.Adulto.map((item, index) => {
                      const isGold = index === 0;
                      const isSilver = index === 1;
                      const isBronze = index === 2;

                      return (
                        <div
                          key={item.student.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 relative overflow-hidden ${
                            isGold
                              ? "bg-gradient-to-r from-amber-500/20 via-slate-900/90 to-slate-900/90 border-amber-400/60 shadow-lg shadow-amber-500/10 scale-[1.02]"
                              : isSilver
                              ? "bg-slate-900/80 border-slate-300/40"
                              : "bg-slate-900/60 border-amber-700/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Medalha / Posição */}
                            <div
                              className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-md ${
                                isGold
                                  ? "bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950"
                                  : isSilver
                                  ? "bg-gradient-to-tr from-slate-200 to-slate-400 text-slate-950"
                                  : "bg-gradient-to-tr from-amber-700 to-yellow-800 text-white"
                              }`}
                            >
                              {isGold ? "🥇 1º" : isSilver ? "🥈 2º" : "🥉 3º"}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-base md:text-lg font-black text-white truncate">
                                {item.student.nome}
                              </h4>
                              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                                {item.isOnFire && <span className="text-orange-400 font-bold text-[10px]">🔥</span>}
                                <span>{item.scoreSub}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-baseline justify-end gap-1 font-mono font-black">
                              <span
                                className={`text-xl md:text-2xl font-black ${
                                  isGold ? "text-amber-300 drop-shadow-sm" : isSilver ? "text-slate-100" : "text-amber-400"
                                }`}
                              >
                                {item.ovr}
                              </span>
                              <span className="text-[10px] font-black tracking-wider text-amber-400/80 uppercase">
                                OVR
                              </span>
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-500">
                              {isGold ? "Líder" : "Destaque"}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs italic bg-black/20 rounded-2xl border border-white/5">
                      Nenhum atleta adulto com dados nesta semana.
                    </div>
                  )}

                  {/* Complemento caso haja menos de 3 atletas */}
                  {categoryRankings.Adulto.length > 0 && categoryRankings.Adulto.length < 3 && (
                    <div className="p-3 rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/5 text-center text-xs text-amber-300/80 font-medium">
                      ⭐ Vaga aberta no pódio para os próximos treinos!
                    </div>
                  )}
                </div>

                <div className="pt-2 text-center text-[11px] text-amber-400/80 font-semibold border-t border-white/5">
                  Top 3 Atletas Categoria Adulto
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 1: GRADE DE HORÁRIOS COM CARDS LARGOS              */}
        {/* Alunos da(s) Turma(s) do Horário em Exibição             */}
        {/* ======================================================== */}
        {currentSlide === 1 && (
          <div className="w-full max-w-7xl space-y-6 animate-in fade-in zoom-in-95 duration-500 py-2">
            {/* Header do Horário e Seletor */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs uppercase tracking-wider">
                    Grade de Horários ({currentDayOfWeek})
                  </Badge>
                  {activeHour === currentHourStr ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs uppercase tracking-wider animate-pulse flex items-center gap-1.5 font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      Ao Vivo Agora
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-slate-400 border-white/20">
                      Horário Programado
                    </Badge>
                  )}
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                  <Clock className="h-8 w-8 text-amber-400" />
                  Turmas das {activeHour}
                </h2>
              </div>

              {/* Barra de Seleção Rápida de Horários */}
              <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 shadow-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-300 hover:text-white"
                  onClick={handlePrevHour}
                  title="Horário Anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs md:max-w-md py-1 px-1">
                  {availableHours.map((hour) => {
                    const isCurrent = hour === activeHour;
                    const isRealNow = hour === currentHourStr;

                    return (
                      <button
                        key={hour}
                        onClick={() => setSelectedHour(hour)}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                          isCurrent
                            ? "bg-amber-400 text-slate-950 shadow-md font-black"
                            : isRealNow
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {hour}
                        {isRealNow && " 🔴"}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-300 hover:text-white"
                  onClick={handleNextHour}
                  title="Próximo Horário"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Cards Largos das Turmas deste Horário */}
            {classesInActiveHour.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-slate-900/40 rounded-3xl border border-white/10 space-y-3">
                <Clock className="h-12 w-12 text-slate-600 mx-auto" />
                <h3 className="text-xl font-bold text-white">Nenhuma turma escalada para as {activeHour}</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Utilize os botões acima para navegar pelos demais horários do dia.
                </p>
                {availableHours.length > 0 && (
                  <Button
                    variant="outline"
                    className="border-amber-400/40 text-amber-300 hover:bg-amber-400/10 mt-2"
                    onClick={() => setSelectedHour(availableHours[0])}
                  >
                    Ver Primeiro Horário ({availableHours[0]})
                  </Button>
                )}
              </div>
            ) : (
              <div
                className={`grid gap-8 ${
                  classesInActiveHour.length === 1
                    ? "grid-cols-1 max-w-4xl mx-auto"
                    : "grid-cols-1 lg:grid-cols-2"
                }`}
              >
                {classesInActiveHour.map((slot) => {
                  // Alunos matriculados nesta turma específica
                  const studentIds = (enrollments || [])
                    .filter((e) => e && e.turmaId === slot.id)
                    .map((e) => e.alunoId);
                  const enrolledStudents = (students || []).filter((s) => s && studentIds.includes(s.id));
                  const isCourt1 = (slot?.quadra || "").toLowerCase().includes("1");

                  return (
                    <div
                      key={slot.id}
                      className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-amber-400/50 transition-all"
                    >
                      {/* Top Header do Card Largo */}
                      <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                            <Badge
                              className={`text-xs uppercase font-black tracking-widest px-3 py-1 ${
                                isCourt1
                                  ? "bg-amber-400 text-slate-950 border-amber-300"
                                  : "bg-blue-500 text-white border-blue-400"
                              }`}
                            >
                              {slot.quadra}
                            </Badge>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-black text-white tracking-wide">
                            Turma {slot.turmaId}
                          </h3>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="inline-flex items-center gap-2 bg-black/60 px-4 py-2 rounded-2xl border border-white/10 font-mono text-lg font-black text-amber-300 shadow-inner">
                            <Clock className="h-4 w-4 text-amber-400" />
                            {slot.horario}
                          </div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            {enrolledStudents.length} de {CLASS_LIMIT} Atletas Matriculados
                          </div>
                        </div>
                      </div>

                      {/* Grade de Alunos com Cards Largos e Nomes Bem Visíveis */}
                      <div className="py-6 flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                          <Users className="h-4 w-4 text-amber-400" /> Atletas Escalados na Turma:
                        </p>

                        {enrolledStudents.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {enrolledStudents.map((student) => {
                              const isInfantil = student.categoria === "Infantil";
                              const isJuvenil = student.categoria === "Juvenil";

                              return (
                                <div
                                  key={student.id}
                                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-amber-400/40 flex items-center justify-between gap-3 shadow-md hover:bg-slate-900/90 transition-all"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Avatar com Iniciais */}
                                    <div
                                      className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-base text-white shrink-0 shadow-md ${
                                        isInfantil
                                          ? "bg-gradient-to-tr from-cyan-600 to-blue-500"
                                          : isJuvenil
                                          ? "bg-gradient-to-tr from-purple-600 to-indigo-500"
                                          : "bg-gradient-to-tr from-amber-500 to-red-600"
                                      }`}
                                    >
                                      {(student?.nome || "MR").slice(0, 2).toUpperCase()}
                                    </div>

                                    {/* Nome Grande e Bem Visível na TV */}
                                    <div className="min-w-0">
                                      <h4 className="text-lg xl:text-xl font-black text-white tracking-wide truncate">
                                        {student?.nome || "Atleta"}
                                      </h4>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] uppercase font-bold py-0 px-1.5 ${
                                            isInfantil
                                              ? "text-cyan-300 border-cyan-500/40"
                                              : isJuvenil
                                              ? "text-purple-300 border-purple-500/40"
                                              : "text-amber-300 border-amber-500/40"
                                          }`}
                                        >
                                          {student.categoria}
                                        </Badge>
                                        <span className="text-[10px] text-slate-500 font-medium">Equipe MR</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center text-emerald-400" title="Atleta Confirmado">
                                    <CheckCircle2 className="h-5 w-5" />
                                  </div>
                                </div>
                              );
                            })}

                            {/* Indicadores de Vagas Restantes na Turma */}
                            {Array.from({ length: Math.max(0, CLASS_LIMIT - enrolledStudents.length) }).map((_, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex items-center gap-3 text-slate-500"
                              >
                                <div className="h-11 w-11 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-xs font-mono font-bold text-slate-600">
                                  #{enrolledStudents.length + idx + 1}
                                </div>
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Vaga Aberta
                                  </span>
                                  <p className="text-[10px] text-slate-600 font-medium">Disponível para matrícula</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 text-slate-400 bg-black/30 rounded-2xl border border-white/5 space-y-2">
                            <Users className="h-8 w-8 text-slate-600 mx-auto" />
                            <p className="text-sm font-semibold text-slate-300">
                              Nenhum atleta matriculado nesta turma até o momento.
                            </p>
                            <p className="text-xs text-slate-500">Turma pronta para receber alunos.</p>
                          </div>
                        )}
                      </div>

                      {/* Rodapé do Card Largo */}
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium">Arena Oficial Marco Roza</span>
                        <Badge variant="outline" className="text-[11px] text-emerald-400 border-emerald-400/40 font-bold">
                          Espaço Ativo
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDE 2: ANIVERSARIANTES DO MÊS                          */}
        {/* ======================================================== */}
        {currentSlide === 2 && (
          <div className="w-full max-w-7xl space-y-5 animate-in fade-in zoom-in-95 duration-500 py-2">
            <div className="text-center space-y-2">
              <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-xs uppercase tracking-wider">
                Celebração Especial
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-3">
                <Cake className="h-8 w-8 md:h-10 md:w-10 text-pink-400 animate-bounce" />
                Aniversariantes do Mês da Equipe! 🎉
              </h2>
              <p className="text-slate-300 text-sm max-w-xl mx-auto">
                Parabéns a todos os nossos {birthdayStudents.length} atletas que comemoram mais um ano de vida neste mês! Que não faltem pontos vencedores e muita saúde!
              </p>
            </div>

            {birthdayStudents.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-slate-900/40 rounded-3xl border border-white/10">
                Nenhum aniversariante cadastrado neste mês.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 max-h-[66vh] overflow-y-auto pr-1">
                {birthdayStudents.map(({ student, day }) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-purple-950/40 border border-pink-500/30 backdrop-blur-xl shadow-xl flex items-center gap-3.5 relative overflow-hidden group hover:scale-[1.02] transition-transform"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 flex flex-col items-center justify-center font-black text-white shadow-lg shrink-0">
                      <span className="text-[10px] uppercase tracking-tighter">DIA</span>
                      <span className="text-lg leading-none font-mono">
                        {String(day).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm md:text-base text-white truncate">
                        {student.nome}
                      </h4>
                      <p className="text-xs text-pink-300 font-medium truncate">
                        {student.categoria} • Equipe MR
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER DA ARENA LIVE */}
      <footer className="px-8 py-4 border-t border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between text-xs text-slate-400 relative z-20">
        <div className="flex items-center gap-3">
          <span>Modo Exibição Contínua para Smart TVs</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">Equipe Marco Roza Tennis & Beach Performance</span>
        </div>

        {/* Indicadores de Slide */}
        <div className="flex items-center gap-3">
          {[
            { idx: 0, label: "🏆 Hall da Fama (Categorias)" },
            { idx: 1, label: "📅 Grade de Horários" },
            { idx: 2, label: "🎉 Aniversariantes" },
          ].map((item) => (
            <button
              key={item.idx}
              onClick={() => setCurrentSlide(item.idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer text-xs font-semibold ${
                currentSlide === item.idx
                  ? "bg-amber-400 text-slate-950 font-bold shadow-md"
                  : "bg-white/10 text-slate-400 hover:text-white hover:bg-white/20"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  currentSlide === item.idx ? "bg-slate-950" : "bg-white/40"
                }`}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default ArenaLiveKiosk;
