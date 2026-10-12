import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/data/mockData";
import { useAppContext } from "@/contexts/AppContext";
import {
  Trophy,
  Sparkles,
  Copy,
  Check,
  Zap,
  Flame,
  MessageCircle,
  TrendingUp,
  CalendarCheck,
  Info,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { cleanPhoneNumber } from "@/lib/whatsapp";

interface AthleteCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}

export const AthleteCardModal: React.FC<AthleteCardModalProps> = ({
  open,
  onOpenChange,
  student,
}) => {
  const { activities, testResults, attendanceLogs } = useAppContext();
  const [copied, setCopied] = useState(false);

  // Atributos, notas, frequência e evolução contínua do atleta
  const athleteStats = useMemo(() => {
    if (!student) return null;

    // 1. Filtrar registros de presença do aluno
    const studentLogs = attendanceLogs.filter((l) => l.alunoId === student.id);

    // Contagem de presenças e eventos
    const presencas = studentLogs.filter((l) => l.presente === "Presente").length;
    const reposicoes = studentLogs.filter((l) => l.presente === "Reposição").length;
    const miniligas = studentLogs.filter((l) => l.presente === "Miniliga").length;
    const faltas = studentLogs.filter((l) => l.presente === "Falta").length;

    const attendedClasses = presencas + reposicoes + miniligas;
    const totalValidClasses = attendedClasses + faltas;

    // Taxa de assiduidade
    const attendanceRate =
      totalValidClasses > 0
        ? Math.round((attendedClasses / totalValidClasses) * 100)
        : 100; // Aluno sem faltas registradas inicia 100%

    // Cálculo de Streak (Sequência de aulas ativas sem faltas não repostas)
    const sortedLogs = [...studentLogs].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
    let streakCount = 0;
    for (const log of sortedLogs) {
      if (
        log.presente === "Presente" ||
        log.presente === "Reposição" ||
        log.presente === "Miniliga"
      ) {
        streakCount++;
      } else if (log.presente === "Falta") {
        break; // Interrompe o streak na primeira falta não compensada
      }
    }

    // Se o aluno é ativo e não tem histórico de faltas, assume um ritmo motivacional
    const effectiveStreak = totalValidClasses === 0 ? 3 : streakCount;

    // Temporada & Pontos de Experiência (XP)
    const studentResults = testResults.filter((tr) => tr.alunoId === student.id);
    const baseXp =
      presencas * 25 +
      reposicoes * 35 +
      miniligas * 50 +
      studentResults.length * 75;
    const totalXp = Math.max(50, baseXp);
    const seasonLevel = Math.max(1, Math.floor(totalXp / 100) + 1);
    const progressToNextLevel = totalXp % 100;

    // Status "ON FIRE 🔥"
    const isOnFire =
      (effectiveStreak >= 2 && attendanceRate >= 80) ||
      (reposicoes > 0 && attendanceRate >= 75) ||
      (student.status === "Ativo" && totalValidClasses === 0);

    // Bônus contínuos por engajamento
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

    let bonusAgilidade = 0;
    if (reposicoes > 0 || miniligas > 0) {
      bonusAgilidade += 3; // Ritmo extra de jogo por partidas extras e reposições
    }
    if (attendedClasses >= 3) {
      bonusAgilidade += 2;
    } else if (isOnFire) {
      bonusAgilidade += 1;
    }

    let ovrBoost = 0;
    if (isOnFire) {
      ovrBoost = 2; // +2 no OVR geral pelo status ON FIRE
    } else if (bonusConsistencia > 0) {
      ovrBoost = 1;
    } else if (bonusConsistencia < 0) {
      ovrBoost = -1;
    }

    // Baseline da Categoria
    let baselineOvr = 75;
    if (student.categoria === "Juvenil") baselineOvr = 78;
    if (student.categoria === "Adulto") baselineOvr = 82;

    let overallCalculated = baselineOvr;
    let forehand = baselineOvr - 2;
    let backhand = baselineOvr - 5;
    let saqueSmash = baselineOvr + 1;
    let voleio = baselineOvr - 4;
    let agilidade = baselineOvr + 3 + bonusAgilidade;
    let consistencia = baselineOvr + bonusConsistencia;

    if (studentResults.length > 0) {
      // Calcula média real dos testes
      let totalAcertos = 0;
      let totalBase = 0;

      studentResults.forEach((res) => {
        const act = activities.find((a) => a.id === res.atividadeId);
        const base = act?.quantidadeLancamentos || 10;
        totalAcertos += res.acertos;
        totalBase += base;

        // Distribui para atributos se o nome da atividade der pistas
        const name = (act?.nome || "").toLowerCase();
        const scorePct = Math.min(99, Math.round((res.acertos / base) * 100));
        if (name.includes("forehand") || name.includes("direita")) {
          forehand = Math.max(60, scorePct);
        } else if (name.includes("backhand") || name.includes("esquerda")) {
          backhand = Math.max(60, scorePct);
        } else if (name.includes("saque") || name.includes("smash")) {
          saqueSmash = Math.max(60, scorePct);
        } else if (name.includes("voleio") || name.includes("rede")) {
          voleio = Math.max(60, scorePct);
        }
      });

      if (totalBase > 0) {
        const avgPct = Math.round((totalAcertos / totalBase) * 100);
        overallCalculated = Math.min(
          99,
          Math.max(65, Math.round(avgPct * 0.4 + baselineOvr * 0.6))
        );
        consistencia = Math.min(
          99,
          Math.max(
            65,
            overallCalculated + (totalAcertos > 15 ? 4 : -2) + bonusConsistencia
          )
        );
        agilidade = Math.min(99, Math.max(65, agilidade + bonusAgilidade));
      }
    }

    const finalOvr = Math.min(99, Math.max(60, overallCalculated + ovrBoost));

    const tier =
      finalOvr >= 90
        ? "ELITE WORLD CLASS"
        : finalOvr >= 84
        ? "MASTER OURO"
        : finalOvr >= 76
        ? "PRO PRATA"
        : "TALENTO BRONZE";

    return {
      ovr: finalOvr,
      rawOvr: overallCalculated,
      ovrBoost,
      tier,
      isOnFire,
      attendanceRate,
      effectiveStreak,
      totalXp,
      seasonLevel,
      progressToNextLevel,
      reposicoes,
      miniligas,
      attendedClasses,
      bonusConsistencia,
      bonusAgilidade,
      attributes: [
        { label: "FOR", name: "Forehand", value: Math.min(99, forehand), boost: 0 },
        { label: "BCK", name: "Backhand", value: Math.min(99, backhand), boost: 0 },
        { label: "SRV", name: "Saque & Smash", value: Math.min(99, saqueSmash), boost: 0 },
        { label: "VOL", name: "Voleio & Rede", value: Math.min(99, voleio), boost: 0 },
        { label: "AGI", name: "Agilidade", value: Math.min(99, agilidade), boost: bonusAgilidade },
        { label: "CON", name: "Consistência", value: Math.min(99, consistencia), boost: bonusConsistencia },
      ],
    };
  }, [student, testResults, activities, attendanceLogs]);

  if (!student || !athleteStats) return null;

  // Cálculo dos pontos do Polígono Radar (6 eixos)
  const size = 260;
  const center = size / 2;
  const radius = 95;
  const numAxes = 6;
  const angleStep = (Math.PI * 2) / numAxes;

  const polygonPoints = athleteStats.attributes
    .map((attr, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (attr.value / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  const gridCircles = [0.33, 0.66, 1.0];

  const handleCopyCardText = async () => {
    const fireText = athleteStats.isOnFire
      ? "🔥 ON FIRE (Sequência Ativa)"
      : "⚡ EM RITMO";
    const text =
      `🏆 *CARD DO ATLETA - EQUIPE MARCO ROZA*\n` +
      `👤 *Atleta:* ${student.nome}\n` +
      `⭐ *Overall (OVR):* ${athleteStats.ovr} (${athleteStats.tier})${
        athleteStats.ovrBoost > 0
          ? ` [Boost +${athleteStats.ovrBoost} Forma Física 🔥]`
          : ""
      }\n` +
      `📊 *Categoria:* ${student.categoria}\n` +
      `🔥 *Status:* ${fireText} • Assiduidade: ${athleteStats.attendanceRate}%\n` +
      `⚡ *Temporada 2026:* Nível ${athleteStats.seasonLevel} (${athleteStats.totalXp} XP)\n\n` +
      `🎾 *Atributos Técnicos:*\n` +
      athleteStats.attributes
        .map(
          (a) =>
            `• ${a.label} (${a.name}): ${a.value}${
              a.boost > 0 ? ` ↗ (+${a.boost} Ritmo)` : ""
            }`
        )
        .join("\n") +
      `\n\nEquipe Marco Roza • Racket Pro Performance 🔥`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Ficha do atleta copiada com sucesso!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Falha ao copiar ficha.");
    }
  };

  const handleShareWhatsApp = () => {
    const phone = student.whatsappAluno || student.whatsappResponsavel || "";
    const cleanPhone = cleanPhoneNumber(phone);
    const fireEmoji = athleteStats.isOnFire ? "🔥 ON FIRE" : "⚡ Em Ritmo";
    const text =
      `Fala, ${student.nome.split(" ")[0]}! 🎾🔥\n\n` +
      `Confira o seu *Card Oficial de Desempenho da Equipe Marco Roza* atualizado!\n\n` +
      `⭐ *Seu Overall Atual (OVR):* *${athleteStats.ovr}* (${athleteStats.tier})${
        athleteStats.ovrBoost > 0
          ? ` (+${athleteStats.ovrBoost} Boost de Frequência 🔥)`
          : ""
      }\n` +
      `🔥 *Status Atual:* *${fireEmoji}* (${athleteStats.attendanceRate}% de Presença)\n` +
      `⚡ *Temporada 2026:* Nível ${athleteStats.seasonLevel} • *${athleteStats.totalXp} XP*\n\n` +
      `📊 *Seus Fundamentos Técnicos:*\n` +
      athleteStats.attributes
        .map(
          (a) =>
            `• ${a.name}: *${a.value}*${
              a.boost > 0 ? ` ↗ (+${a.boost} Ritmo)` : ""
            }`
        )
        .join("\n") +
      `\n\nParabéns pela dedicação nos treinos! Continue marcando presença para manter o boost ativo! 🚀🏆`;

    if (cleanPhone) {
      window.open(
        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`,
        "_blank"
      );
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-slate-950 border-amber-500/30 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-2 border-b border-white/10 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-amber-400 font-black text-xl tracking-wide">
            <Trophy className="h-6 w-6 text-amber-400" />
            Card Oficial do Atleta | EA Performance
          </DialogTitle>
          <div className="flex items-center gap-2">
            {athleteStats.isOnFire && (
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[10px] border-orange-400/50 shadow-md gap-1">
                <Flame className="h-3 w-3 fill-current text-yellow-200 animate-pulse" />
                ON FIRE
              </Badge>
            )}
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
              {athleteStats.tier}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Card Visual FUT Dourado / Flamejante */}
          <div
            className={`relative mx-auto max-w-sm rounded-3xl p-1 shadow-2xl transition-all duration-300 ${
              athleteStats.isOnFire
                ? "bg-gradient-to-b from-orange-400 via-amber-500 to-amber-950 shadow-orange-500/30 ring-1 ring-orange-400/40"
                : "bg-gradient-to-b from-amber-300 via-yellow-600 to-amber-950 shadow-yellow-500/20"
            }`}
          >
            <div className="relative rounded-[22px] bg-gradient-to-b from-slate-900 via-slate-950 to-black p-5 overflow-hidden">
              {/* Efeito de Reflexo de Vidro e Luz */}
              <div
                className={`absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                  athleteStats.isOnFire ? "bg-orange-500/20" : "bg-amber-400/10"
                }`}
              />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              {/* Cabeçalho do Card */}
              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 drop-shadow-md">
                      {athleteStats.ovr}
                    </span>
                    {athleteStats.ovrBoost > 0 && (
                      <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/25 border border-emerald-500/40 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                        +{athleteStats.ovrBoost} FORMA 🔥
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400/90">
                      OVR
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-400/40 text-amber-300 px-1.5 py-0"
                    >
                      {student.categoria}
                    </Badge>
                  </div>

                  {athleteStats.isOnFire ? (
                    <Badge className="mt-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[9px] border-orange-400/40 shadow-sm gap-1 w-fit animate-pulse">
                      <Flame className="h-2.5 w-2.5 fill-current text-yellow-200" />
                      ON FIRE 🔥
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="mt-1.5 text-[9px] border-white/20 text-slate-300 gap-1 w-fit"
                    >
                      <Zap className="h-2.5 w-2.5 text-amber-400" />
                      EM RITMO
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <img
                    src={logo}
                    alt="Marco Roza"
                    className="h-13 w-auto object-contain drop-shadow-[0_4px_12px_rgba(234,179,8,0.3)]"
                  />
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                    Equipe Marco Roza
                  </span>
                </div>
              </div>

              {/* Nome do Atleta */}
              <div className="my-3 text-center border-y border-amber-500/30 py-2 relative z-10">
                <h3 className="text-lg font-extrabold uppercase tracking-wider text-white">
                  {student.nome}
                </h3>
                <p className="text-[10px] text-amber-300/80 font-medium tracking-widest uppercase">
                  RACKET PRO ATHLETE
                </p>
              </div>

              {/* Gráfico de Radar Poligonal SVG */}
              <div className="relative flex justify-center items-center my-1">
                <svg width={size} height={size} className="overflow-visible">
                  {/* Círculos guias */}
                  {gridCircles.map((factor, idx) => (
                    <polygon
                      key={idx}
                      points={athleteStats.attributes
                        .map((_, i) => {
                          const angle = i * angleStep - Math.PI / 2;
                          const r = factor * radius;
                          const x = center + r * Math.cos(angle);
                          const y = center + r * Math.sin(angle);
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Linhas dos eixos */}
                  {athleteStats.attributes.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const x = center + radius * Math.cos(angle);
                    const y = center + radius * Math.sin(angle);
                    return (
                      <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={x}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Polígono de Desempenho do Aluno */}
                  <polygon
                    points={polygonPoints}
                    fill={
                      athleteStats.isOnFire
                        ? "rgba(249, 115, 22, 0.38)"
                        : "rgba(234, 179, 8, 0.35)"
                    }
                    stroke={athleteStats.isOnFire ? "#f97316" : "#f59e0b"}
                    strokeWidth="2.5"
                    className="drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                  />

                  {/* Vértices destacados */}
                  {athleteStats.attributes.map((attr, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const r = (attr.value / 100) * radius;
                    const x = center + r * Math.cos(angle);
                    const y = center + r * Math.sin(angle);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill={attr.boost > 0 ? "#34d399" : "#fbbf24"}
                        stroke="#78350f"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Rótulos dos eixos */}
                  {athleteStats.attributes.map((attr, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const labelR = radius + 22;
                    const x = center + labelR * Math.cos(angle);
                    const y = center + labelR * Math.sin(angle) + 4;
                    return (
                      <text
                        key={i}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        fill="#fde68a"
                        fontSize="10"
                        fontWeight="bold"
                        className="select-none font-mono tracking-wider"
                      >
                        {attr.label}
                      </text>
                    );
                  })}
                </svg>
              </div>

              {/* Grid com Atributos Numéricos */}
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10 text-center">
                {athleteStats.attributes.map((attr) => (
                  <div
                    key={attr.label}
                    className="bg-white/5 rounded-lg p-1.5 border border-white/5 flex flex-col justify-center"
                  >
                    <div className="text-[10px] text-slate-400 font-medium">
                      {attr.name}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm font-black text-amber-300 font-mono">
                        {attr.value}
                      </span>
                      {attr.boost > 0 && (
                        <span
                          className="text-[9px] text-emerald-400 font-bold flex items-center"
                          title={`Boost de frequência e ritmo: +${attr.boost}`}
                        >
                          <TrendingUp className="h-2.5 w-2.5 inline" />
                          +{attr.boost}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* HUD de Ritmo & Temporada (Evolução Contínua entre Avaliações) */}
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-xl p-1.5 border border-amber-500/20">
                  <div className="flex items-center justify-center gap-1 text-[9px] text-amber-300 font-semibold mb-0.5">
                    <CalendarCheck className="h-2.5 w-2.5" />
                    Assiduidade
                  </div>
                  <div className="text-sm font-black text-white font-mono">
                    {athleteStats.attendanceRate}%
                  </div>
                  <div className="text-[8px] text-slate-400">
                    {athleteStats.attendedClasses} treinos
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-xl p-1.5 border border-orange-500/20">
                  <div className="flex items-center justify-center gap-1 text-[9px] text-orange-300 font-semibold mb-0.5">
                    <Flame className="h-2.5 w-2.5" />
                    Sequência
                  </div>
                  <div className="text-sm font-black text-white font-mono">
                    {athleteStats.effectiveStreak} seguidas
                  </div>
                  <div className="text-[8px] text-slate-400">
                    sem faltas
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-xl p-1.5 border border-yellow-500/20">
                  <div className="flex items-center justify-center gap-1 text-[9px] text-yellow-300 font-semibold mb-0.5">
                    <Sparkles className="h-2.5 w-2.5" />
                    Temporada
                  </div>
                  <div className="text-sm font-black text-white font-mono">
                    Nível {athleteStats.seasonLevel}
                  </div>
                  <div className="text-[8px] text-slate-400">
                    {athleteStats.totalXp} XP
                  </div>
                </div>
              </div>

              {/* Barra de Progresso de XP da Temporada */}
              <div className="mt-2.5 px-1">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium mb-1">
                  <span>Rumo ao Nível {athleteStats.seasonLevel + 1}</span>
                  <span className="text-amber-400 font-bold">
                    {athleteStats.progressToNextLevel}/100 XP
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${Math.max(8, athleteStats.progressToNextLevel)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dica Informativa de Engajamento */}
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200/90">
            <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Evolução Contínua:</strong> Entre as avaliações bimestrais, o card evolui a cada semana! Presenças, reposições e miniligas impulsionam a <strong>Consistência (+5)</strong>, o <strong>Ritmo (+3)</strong> e ativam o status <strong>ON FIRE 🔥 (+2 OVR)</strong>.
            </p>
          </div>

          {/* Botões de Ação & Compartilhamento */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
            <Button
              variant="outline"
              onClick={handleCopyCardText}
              className="w-full sm:w-auto text-xs gap-1.5 border-white/20 text-white hover:bg-white/10"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Ficha Copiada!" : "Copiar Ficha do Atleta"}
            </Button>

            <Button
              onClick={handleShareWhatsApp}
              className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-lg shadow-emerald-600/30"
            >
              <MessageCircle className="h-4 w-4" />
              Compartilhar no WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
