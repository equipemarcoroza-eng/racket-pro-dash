import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
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
  const { schedule, students, enrollments, activities, testResults } = useAppContext();
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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

  // Quadras ativas no horário atual ou próximo
  const courtsStatus = useMemo(() => {
    const courtsList = ["Quadra 1", "Quadra 2", "Quadra 3", "Quadra 4"];

    return courtsList.map((courtName) => {
      // Busca aulas de hoje nessa quadra
      const todaySlots = schedule.filter(
        (s) => s.quadra.toLowerCase() === courtName.toLowerCase() && s.dia === currentDayOfWeek
      );

      // Aula atual mais próxima
      const currentSlot = todaySlots.find((s) => s.horario === currentHourStr) || todaySlots[0];

      let enrolledList: string[] = [];
      if (currentSlot) {
        const studentIds = enrollments
          .filter((e) => e.turmaId === currentSlot.id)
          .map((e) => e.alunoId);
        enrolledList = students
          .filter((s) => studentIds.includes(s.id))
          .map((s) => s.nome);
      }

      return {
        courtName,
        slot: currentSlot,
        students: enrolledList,
        isLiveNow: !!currentSlot,
      };
    });
  }, [schedule, enrollments, students, currentDayOfWeek, currentHourStr]);

  // Aniversariantes do mês atual
  const birthdayStudents = useMemo(() => {
    const currentMonth = String(currentTime.getMonth() + 1).padStart(2, "0");
    return students
      .filter((s) => s.status === "Ativo" && s.dataNascimento && s.dataNascimento.split("-")[1] === currentMonth)
      .sort((a, b) => {
        const dayA = parseInt(a.dataNascimento.split("-")[2]);
        const dayB = parseInt(b.dataNascimento.split("-")[2]);
        return dayA - dayB;
      });
  }, [students, currentTime]);

  // Top Atletas em Desempenho Técnico
  const topAthletes = useMemo(() => {
    const studentScores: Record<string, { student: any; totalHits: number; testsCount: number }> = {};

    testResults.forEach((tr) => {
      const student = students.find((s) => s.id === tr.alunoId);
      if (!student || student.status !== "Ativo") return;

      if (!studentScores[tr.alunoId]) {
        studentScores[tr.alunoId] = { student, totalHits: 0, testsCount: 0 };
      }
      studentScores[tr.alunoId].totalHits += tr.acertos;
      studentScores[tr.alunoId].testsCount += 1;
    });

    return Object.values(studentScores)
      .sort((a, b) => b.totalHits - a.totalHits)
      .slice(0, 5);
  }, [testResults, students]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans relative">
      {/* Background futurista com gradientes dinâmicos */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />

      {/* Barra de Progresso do Slide no topo */}
      <div className="w-full bg-slate-900 h-1.5 overflow-hidden">
        <div
          key={currentSlide}
          className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full animate-[progress_12s_linear_infinite]"
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
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all"
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
            <p className="text-xs text-slate-400">Painel Oficial de Quadras & Atletas</p>
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

          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
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
      <main className="flex-1 p-8 flex items-center justify-center relative z-10">
        {/* SLIDE 1: STATUS DAS QUADRAS AO VIVO */}
        {currentSlide === 0 && (
          <div className="w-full max-w-7xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs uppercase tracking-wider mb-1">
                  Transmissão ao Vivo das Quadras
                </Badge>
                <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <Tv className="h-7 w-7 text-blue-400" />
                  Grade de Treinos em Andamento ({currentDayOfWeek})
                </h2>
              </div>
              <span className="text-sm text-slate-400 font-medium">
                Próxima atualização automática em instantes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {courtsStatus.map((court, idx) => (
                <div
                  key={court.courtName}
                  className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-amber-400/50 transition-all"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                        Espaço de Jogo
                      </span>
                      <h3 className="text-2xl font-black text-white">{court.courtName}</h3>
                    </div>

                    <div className="bg-black/40 rounded-2xl p-3 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-blue-400" /> Horário
                        </span>
                        <span className="font-mono text-white text-sm">
                          {court.slot ? court.slot.horario : currentHourStr}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        Turma: <strong className="text-white">{court.slot ? court.slot.turmaId : "Treino Livre"}</strong>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" /> Atletas em Quadra:
                      </p>
                      {court.students.length > 0 ? (
                        <div className="space-y-1.5">
                          {court.students.map((name, i) => (
                            <div
                              key={i}
                              className="text-xs bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 font-medium"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              <span className="truncate">{name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2">
                          Nenhum atleta listado neste horário.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Equipe Marco Roza</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-400/30">
                      Quadra Ativa
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 2: ANIVERSARIANTES DO MÊS */}
        {currentSlide === 1 && (
          <div className="w-full max-w-6xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
              <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-xs uppercase tracking-wider">
                Celebração Especial
              </Badge>
              <h2 className="text-4xl font-black tracking-tight text-white flex items-center justify-center gap-3">
                <Cake className="h-9 w-9 text-pink-400 animate-bounce" />
                Aniversariantes do Mês da Equipe! 🎉
              </h2>
              <p className="text-slate-300 text-sm max-w-xl mx-auto">
                Parabéns a todos os nossos atletas que comemoram mais um ano de vida neste mês! Que não faltem pontos vencedores e muita saúde!
              </p>
            </div>

            {birthdayStudents.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-slate-900/40 rounded-3xl border border-white/10">
                Nenhum aniversariante cadastrado neste mês.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {birthdayStudents.slice(0, 8).map((student) => (
                  <div
                    key={student.id}
                    className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-purple-950/40 border border-pink-500/30 backdrop-blur-xl shadow-xl flex items-center gap-4 relative overflow-hidden group hover:scale-[1.02] transition-transform"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 flex flex-col items-center justify-center font-black text-white shadow-lg shrink-0">
                      <span className="text-xs uppercase tracking-tighter">DIA</span>
                      <span className="text-xl leading-none">
                        {student.dataNascimento.split("-")[2]}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-extrabold text-base text-white truncate">
                        {student.nome}
                      </h4>
                      <p className="text-xs text-pink-300 font-medium">
                        {student.categoria} • Equipe MR
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SLIDE 3: HALL DA FAMA / DESTAQUES TÉCNICOS */}
        {currentSlide === 2 && (
          <div className="w-full max-w-6xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs uppercase tracking-wider">
                Quadro de Honra & Aproveitamento
              </Badge>
              <h2 className="text-4xl font-black tracking-tight text-white flex items-center justify-center gap-3">
                <Trophy className="h-9 w-9 text-amber-400" />
                Hall da Fama | Destaques Técnicos da Semana
              </h2>
              <p className="text-slate-300 text-sm max-w-xl mx-auto">
                Reconhecimento aos atletas com maior pontuação e aproveitamento nos testes práticos de precisão e controle de bola.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topAthletes.slice(0, 3).map((item, index) => (
                <div
                  key={item.student.id}
                  className={`rounded-3xl p-6 border backdrop-blur-xl flex flex-col justify-between shadow-2xl relative overflow-hidden ${
                    index === 0
                      ? "bg-gradient-to-b from-amber-950/60 via-slate-900 to-black border-amber-400/50 shadow-yellow-500/20 scale-105"
                      : "bg-slate-900/60 border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-4xl font-black font-mono ${
                        index === 0
                          ? "text-amber-400"
                          : index === 1
                          ? "text-slate-300"
                          : "text-amber-700"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <Badge
                      className={`text-xs uppercase font-black ${
                        index === 0
                          ? "bg-amber-400 text-slate-950"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      {index === 0 ? "Campeão da Semana" : "Top Atleta"}
                    </Badge>
                  </div>

                  <div className="my-6 space-y-1">
                    <h3 className="text-2xl font-black text-white">{item.student.nome}</h3>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      {item.student.categoria} • {item.testsCount} Testes Concluídos
                    </p>
                  </div>

                  <div className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Acertos Acumulados</span>
                    <span className="text-xl font-black font-mono text-amber-300">
                      {item.totalHits} bolas
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? "w-8 bg-amber-400" : "w-2.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </footer>
    </div>
  );
};

export default ArenaLiveKiosk;
