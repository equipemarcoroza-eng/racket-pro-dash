import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/data/mockData";
import type { MiniligaSession } from "@/types/miniliga";
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
  Download,
  Camera,
  Loader2,
  Share2,
  ShieldCheck,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { cleanPhoneNumber } from "@/lib/whatsapp";
import { miniligaStorage } from "@/lib/miniliga-storage";
import { matchStudentByName } from "@/lib/miniliga-excel-parser";

// Cores, gradientes e estilos dinâmicos exclusivos para cada Raridade de Carta (Diamante, Ouro, Prata e Bronze)
// Paleta Oficial Equipe Marco Roza: Fundo Azul Escuro nobre, esportivo, leve e harmonioso
export const getCardTheme = (ovr: number, isOnFire: boolean) => {
  // Base institucional Azul Escuro Marco Roza compartilhada (suave, sem contrastes agressivos)
  const marcoRozaNavyBase = {
    innerBg: "bg-[#091528]",
    accentGlow: "bg-blue-500/15",
    ovrBadgeBg: "bg-slate-900/90 border border-blue-400/30 shadow-inner",
    ovrText: "text-amber-300 font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
    ovrLabel: "text-blue-300 font-black",
    categoryTag: "text-blue-200 bg-blue-500/20 border-blue-400/30",
    nameBorder: "border-blue-500/25",
    nameSub: "text-blue-200/80",
    attrValue: "text-white font-bold",
    attrCardBg: "bg-blue-950/40 border-blue-500/20",
    hudCardBg: "border-blue-500/25",
    hudText: "text-blue-100",
    hudIcon: "text-amber-400",
    miniligaProgress: "bg-gradient-to-r from-blue-500 via-sky-400 to-amber-400",
    footerText: "text-blue-200/80",
    footerIcon: "text-blue-400",
  };

  const outerFrame = isOnFire
    ? "bg-gradient-to-b from-amber-400/80 via-blue-500/40 to-blue-950 shadow-blue-950/40 ring-1 ring-amber-400/40"
    : "bg-gradient-to-b from-blue-400/60 via-blue-600/30 to-blue-950 shadow-blue-950/40 ring-1 ring-blue-500/25";

  if (ovr >= 90) {
    // 💎 DIAMANTE (OVR >= 90)
    return {
      ...marcoRozaNavyBase,
      tier: "DIAMANTE",
      badgeIcon: "💎",
      outerFrame,
      radarFill: "rgba(56, 189, 248, 0.32)",
      radarStroke: "#38bdf8",
      radarPointFill: "#bae6fd",
      radarPointStroke: "#0284c7",
      radarLabel: "#e0f2fe",
      headerBadge: "bg-blue-500/20 text-sky-300 border-sky-400/40 shadow-sm",
      headerIconBox: "bg-sky-500/10 border-sky-400/30 text-sky-400",
    };
  }

  if (ovr >= 80) {
    // 🥇 OURO (80 <= OVR < 90)
    return {
      ...marcoRozaNavyBase,
      tier: "OURO",
      badgeIcon: "🥇",
      outerFrame,
      radarFill: "rgba(245, 158, 11, 0.32)",
      radarStroke: "#f59e0b",
      radarPointFill: "#fde68a",
      radarPointStroke: "#b45309",
      radarLabel: "#fef3c7",
      headerBadge: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm",
      headerIconBox: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    };
  }

  if (ovr >= 67) {
    // 🥈 PRATA (67 <= OVR < 80)
    return {
      ...marcoRozaNavyBase,
      tier: "PRATA",
      badgeIcon: "🥈",
      outerFrame,
      radarFill: "rgba(148, 163, 184, 0.32)",
      radarStroke: "#cbd5e1",
      radarPointFill: "#f1f5f9",
      radarPointStroke: "#475569",
      radarLabel: "#f8fafc",
      headerBadge: "bg-slate-500/20 text-slate-200 border-slate-400/40 shadow-sm",
      headerIconBox: "bg-slate-500/10 border-slate-400/30 text-slate-300",
    };
  }

  // 🥉 BRONZE (OVR < 67)
  return {
    ...marcoRozaNavyBase,
    tier: "BRONZE",
    badgeIcon: "🥉",
    outerFrame,
    radarFill: "rgba(217, 119, 6, 0.28)",
    radarStroke: "#d97706",
    radarPointFill: "#fcd34d",
    radarPointStroke: "#78350f",
    radarLabel: "#fef3c7",
    headerBadge: "bg-amber-900/30 text-amber-300 border-amber-700/40 shadow-sm",
    headerIconBox: "bg-amber-900/20 border-amber-700/30 text-amber-400",
  };
};

interface AthleteCardModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  student: Student | null;
}

export const AthleteCardModal: React.FC<AthleteCardModalProps> = ({
  open,
  onOpenChange,
  onClose,
  student,
}) => {
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen);
    if (!isOpen && onClose) {
      onClose();
    }
  };

  const { students, activities, tests, testResults, attendanceLogs } = useAppContext();
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);
  const [historySessions, setHistorySessions] = useState<MiniligaSession[]>(() =>
    miniligaStorage.getHistory()
  );
  const cardRef = useRef<HTMLDivElement>(null);

  // Sincronizar sessões de Miniliga oficiais (Local + Lovable Cloud) ao abrir o modal
  useEffect(() => {
    if (open) {
      setHistorySessions(miniligaStorage.getHistory());
      miniligaStorage
        .fetchCloudHistory()
        .then((sessions) => {
          if (sessions && sessions.length > 0) {
            setHistorySessions(sessions);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  // Função unificada para captura do Card em alta resolução e formato perfeito para WhatsApp / Redes
  const captureCardCanvas = async (element: HTMLElement) => {
    const html2canvas = (await import("html2canvas")).default;
    return await html2canvas(element, {
      scale: 2.5, // Resolução ultra nítida para WhatsApp
      useCORS: true,
      allowTaint: true,
      backgroundColor: null, // Cantos arredondados transparentes
      scrollX: 0,
      scrollY: 0,
      logging: false,
      windowWidth: 1200, // Renderização padronizada sem distorções de viewport mobile
      onclone: (clonedDoc) => {
        const clonedCard = clonedDoc.querySelector("[data-athlete-card='true']") as HTMLElement;
        if (clonedCard) {
          clonedCard.style.width = "340px";
          clonedCard.style.maxWidth = "340px";
          clonedCard.style.margin = "0 auto";
        }
      },
    });
  };

  // Pré-renderização em background do card assim que o modal abre (para resposta instantânea no WhatsApp mobile)
  useEffect(() => {
    let isMounted = true;
    if (open && student) {
      const timer = setTimeout(async () => {
        if (!cardRef.current) return;
        try {
          const canvas = await captureCardCanvas(cardRef.current);
          canvas.toBlob((blob) => {
            if (isMounted && blob) {
              setCachedBlob(blob);
            }
          }, "image/png");
        } catch (e) {
          console.warn("Pré-geração do card falhou:", e);
        }
      }, 250);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else {
      setCachedBlob(null);
    }
  }, [open, student?.id, historySessions.length, attendanceLogs.length, testResults.length]);

  // Atributos, notas, frequência e evolução contínua do atleta
  const athleteStats = useMemo(() => {
    if (!student) return null;

    // 1. Filtrar registros de presença do aluno
    const studentLogs = attendanceLogs.filter((l) => l.alunoId === student.id);

    // Contagem de presenças e eventos
    const presencas = studentLogs.filter((l) => l.presente === "Presente").length;
    const reposicoes = studentLogs.filter((l) => l.presente === "Reposição").length;
    const miniligaLogs = studentLogs.filter((l) => l.presente === "Miniliga");

    // 2. Torneios Oficiais disputados (extraídos diretamente do histórico oficial da Miniliga com cruzamento inteligente de nomes e apelidos)
    const realSessions = (historySessions || []).filter((s) => !s.isSimulation);
    const officialTournaments = realSessions
      .map((session) => {
        const p = (session.participants || []).find((part) => {
          if (part.studentId && part.studentId === student.id) return true;
          const matched = matchStudentByName(
            part.name,
            students && students.length > 0 ? students : [student]
          );
          return matched && matched.id === student.id;
        });
        if (!p) return null;
        const points =
          typeof p.cardPointsAwarded === "number" && p.cardPointsAwarded > 0
            ? p.cardPointsAwarded
            : p.rank
            ? Math.max(1, 11 - p.rank)
            : 3;
        return {
          sessionId: session.id,
          title: session.title,
          date: session.date,
          rank: p.rank ?? 0,
          points,
          wins: p.wins ?? 0,
          matchesPlayed: p.matchesPlayed ?? 0,
        };
      })
      .filter(Boolean) as {
      sessionId: string;
      title: string;
      date: string;
      rank: number;
      points: number;
      wins: number;
      matchesPlayed: number;
    }[];

    const officialTournamentSessionIds = new Set(
      officialTournaments.map((t) => t.sessionId)
    );

    // Aulas de liga avulsas no log de presença que NÃO correspondem a uma sessão oficial já computada
    const standaloneLigaLogs = miniligaLogs.filter(
      (l) => l.miniligaSessionId && !officialTournamentSessionIds.has(l.miniligaSessionId)
    );

    const tournamentPoints = officialTournaments.reduce((acc, t) => acc + t.points, 0);
    const standaloneLigaPoints = standaloneLigaLogs.reduce((acc, l) => {
      if (typeof l.miniligaPontos === "number" && l.miniligaPontos > 0) return acc + l.miniligaPontos;
      const legado = l.motivoCancelamento?.match(/\+(\d+) pts/);
      if (legado) return acc + Number(legado[1]);
      return 3;
    }, 0);

    // Se o atleta tiver participações em torneios oficiais com súmula, prevalece a pontuação oficial
    const miniligaPontos =
      tournamentPoints > 0
        ? tournamentPoints + standaloneLigaPoints
        : miniligaLogs.reduce((acc, l) => {
            if (typeof l.miniligaPontos === "number" && l.miniligaPontos > 0) return acc + l.miniligaPontos;
            const legado = l.motivoCancelamento?.match(/\+(\d+) pts/);
            if (legado) return acc + Number(legado[1]);
            return 3;
          }, 0);

    const torneiosOficiais = officialTournaments.length;
    const titulosOficiais = officialTournaments.filter((t) => t.rank === 1).length;
    const podiosOficiais = officialTournaments.filter((t) => t.rank > 0 && t.rank <= 3).length;
    const miniligaAulas = Math.max(torneiosOficiais, miniligaLogs.length);
    const miniligas = miniligaAulas;
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
      miniligaPontos * 10 +
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

    // Baseline da Categoria Pedagógica
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

    if (studentResults.length > 0) {
      // Calcula média real dos testes e distribui pelos fundamentos considerando a prova mais recente
      let totalAcertos = 0;
      let totalBase = 0;

      studentResults.forEach((res) => {
        const test = (tests || []).find((t) => t.id === res.testId);
        const testDate = test?.data || "";
        const act = activities.find((a) => a.id === res.atividadeId);
        const base = act?.quantidadeLancamentos || 10;
        totalAcertos += res.acertos;
        totalBase += base;

        // Distribui para atributos se o nome da atividade der pistas
        const name = (act?.nome || "").toLowerCase();
        const scorePct = Math.min(99, Math.round((res.acertos / Math.max(1, base)) * 100));

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

      // O OVR é derivado diretamente e fielmente da média dos 6 fundamentos técnicos que aparecem no Card
      overallCalculated = Math.round(
        (forehand + backhand + lob + curta + saque + smash) / 6
      );
    } else {
      overallCalculated = Math.round(
        (forehand + backhand + lob + curta + saque + smash) / 6
      );
    }

    const finalOvr = Math.min(99, Math.max(60, overallCalculated + ovrBoost));

    const tier =
      finalOvr >= 90
        ? "DIAMANTE"
        : finalOvr >= 80
        ? "OURO"
        : finalOvr >= 67
        ? "PRATA"
        : "BRONZE";

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
      miniligas: torneiosOficiais > 0 ? torneiosOficiais : miniligaAulas,
      torneiosOficiais,
      titulosOficiais,
      podiosOficiais,
      miniligaAulas,
      miniligaPontos,
      officialTournaments,
      attendedClasses,
      totalValidClasses,
      bonusConsistencia,
      bonusAgilidade,
      attributes: [
        { label: "FOR", name: "Forehand", value: Math.min(99, forehand), boost: 0 },
        { label: "BCK", name: "Backhand", value: Math.min(99, backhand), boost: 0 },
        { label: "LOB", name: "Lob", value: Math.min(99, lob), boost: 0 },
        { label: "CUR", name: "Curta", value: Math.min(99, curta), boost: 0 },
        { label: "SAQ", name: "Saque", value: Math.min(99, saque), boost: 0 },
        { label: "SMH", name: "Smash", value: Math.min(99, smash), boost: 0 },
      ],
    };
  }, [student, students, testResults, activities, attendanceLogs, historySessions, tests]);

  if (!student || !athleteStats) return null;

  // Tema de cores do card baseado no OVR e status
  const cardTheme = getCardTheme(athleteStats.ovr, athleteStats.isOnFire);

  // Cálculo dos pontos do Polígono Radar (6 eixos)
  const size = 240;
  const center = size / 2;
  const radius = 86;
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

  // Helper para disparar download direto de Blob
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };


  // Gerador da imagem do Card em HD usando html2canvas (retorno imediato com cache para preservar user gesture no mobile)
  const generateCardBlob = async (): Promise<Blob | null> => {
    if (cachedBlob) return cachedBlob;
    if (!cardRef.current) return null;
    try {
      const canvas = await captureCardCanvas(cardRef.current);
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) setCachedBlob(blob);
          resolve(blob);
        }, "image/png");
      });
    } catch (err) {
      console.error("Erro ao renderizar canvas do card:", err);
      return null;
    }
  };

  // Copiar Imagem do Card diretamente para a área de transferência
  const handleCopyCardImage = async () => {
    try {
      setIsGenerating(true);
      const blob = await generateCardBlob();
      if (!blob) throw new Error("Não foi possível gerar a imagem");

      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        toast.success("📸 Imagem do Card copiada com sucesso!", {
          description: "Cole com Ctrl+V (ou Cmd+V) no WhatsApp Web, Instagram ou chat!",
          duration: 5000,
        });
        setTimeout(() => setCopiedImage(false), 3000);
        return true;
      } else {
        // Fallback: baixar PNG se não suportar ClipboardItem
        await handleDownloadCard();
        return false;
      }
    } catch (error) {
      console.error("Falha ao copiar imagem:", error);
      toast.info("Cópia direta não suportada pelo navegador. Baixando arquivo PNG...");
      await handleDownloadCard();
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  // Baixar Card em Alta Resolução (PNG)
  const handleDownloadCard = async () => {
    try {
      setIsGenerating(true);
      const blob = await generateCardBlob();
      if (!blob) throw new Error("Erro ao gerar imagem");

      const safeName = student.nome.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const filename = `card-marco-roza-${safeName}.png`;
      downloadBlob(blob, filename);

      toast.success("Card salvo com sucesso em alta definição (PNG)!", {
        description: "A imagem foi salva na sua galeria / pasta de downloads.",
      });
    } catch (err) {
      console.error("Erro ao baixar card:", err);
      toast.error("Falha ao salvar a imagem do card.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar o texto descritivo da Ficha
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
      `📊 *Categoria:* ${student.categoria} • ${fireText}\n\n` +
      `🎾 *Fundamentos Técnicos (Provas Bimestrais):*\n` +
      athleteStats.attributes
        .map((a) => `• ${a.label} (${a.name}): *${a.value}*`)
        .join("\n") +
      `\n\n📅 *Frequência & Miniliga:*\n` +
      `• 7. Assiduidade: *${athleteStats.attendanceRate}%* (${athleteStats.attendedClasses} aulas)\n` +
      `• 8. Sequência: *${athleteStats.effectiveStreak} aulas seguidas* ${athleteStats.isOnFire ? "🔥 ON FIRE" : "sem faltas"}\n` +
      `• 9. Miniliga: *${athleteStats.miniligaPontos} pts acumulados* (${
        athleteStats.torneiosOficiais > 0
          ? `${athleteStats.torneiosOficiais} ${athleteStats.torneiosOficiais === 1 ? "torneio oficial" : "torneios oficiais"}${athleteStats.titulosOficiais > 0 ? `, ${athleteStats.titulosOficiais} título 🏆` : ""}`
          : athleteStats.miniligaAulas > 0
          ? `${athleteStats.miniligaAulas} ${athleteStats.miniligaAulas === 1 ? "aula temática" : "aulas de liga"}`
          : "sem torneios disputados"
      })\n\n` +
      `Equipe Marco Roza • Racket Pro Performance 🔥`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      toast.success("Ficha do atleta copiada em texto com sucesso!");
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      toast.error("Falha ao copiar ficha em texto.");
    }
  };

  // Compartilhamento inteligente no WhatsApp (com Imagem + Texto)
  const handleShareWhatsApp = async () => {
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
      `🔥 *Status Atual:* *${fireEmoji}*\n\n` +
      `📊 *Fundamentos Técnicos (Provas Bimestrais):*\n` +
      athleteStats.attributes
        .map((a) => `• ${a.name}: *${a.value}*`)
        .join("\n") +
      `\n\n📅 *Frequência & Miniligas:*\n` +
      `• 7. Assiduidade: *${athleteStats.attendanceRate}%* de presença\n` +
      `• 8. Sequência de Aulas: *${athleteStats.effectiveStreak} aulas seguidas* sem faltas\n` +
      `• 9. Miniliga Marco Roza: *${athleteStats.miniligaPontos} pontos acumulados* (${
        athleteStats.torneiosOficiais > 0
          ? `${athleteStats.torneiosOficiais} ${athleteStats.torneiosOficiais === 1 ? "torneio oficial" : "torneios oficiais"}${athleteStats.titulosOficiais > 0 ? `, ${athleteStats.titulosOficiais} título 🏆` : ""}`
          : athleteStats.miniligaAulas > 0
          ? `${athleteStats.miniligaAulas} ${athleteStats.miniligaAulas === 1 ? "aula temática" : "aulas de liga"}`
          : "sem torneios disputados"
      })\n\n` +
      `Parabéns pela dedicação nos treinos! Continue marcando presença e somando pontos nas miniligas! 🚀🏆`;

    setIsGenerating(true);
    const blob = await generateCardBlob();
    const safeName = student.nome.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const filename = `card-marco-roza-${safeName}.png`;

    let sharedViaNative = false;

    // 1. Tentar Web Share API nativa com arquivo PNG (Chrome Android / Celular)
    if (blob && typeof navigator !== "undefined" && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Card Oficial do Atleta - ${student.nome}`,
              text: text,
              files: [file],
            });
            sharedViaNative = true;
            toast.success("Card compartilhado com sucesso!");
            setIsGenerating(false);
            return;
          } catch (shareErr: any) {
            // Se o usuário cancelou o menu nativo de compartilhamento no celular
            if (shareErr?.name === "AbortError") {
              setIsGenerating(false);
              return;
            }
            console.warn("Falha no Web Share nativo, aplicando fallback direto:", shareErr);
          }
        }
      } catch (errFile) {
        console.warn("Erro ao instanciar arquivo para Web Share:", errFile);
      }
    }

    // 2. Fallback de Segurança: Salva automaticamente a imagem no dispositivo e copia para o clipboard
    if (!sharedViaNative && blob) {
      // Dispara o download automático do PNG para a galeria/downloads do celular ou PC
      downloadBlob(blob, filename);

      // Copia a imagem para o clipboard se suportado
      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
        } catch (clipErr) {
          console.warn("Não foi possível copiar imagem automaticamente:", clipErr);
        }
      }

      toast.success("📸 Card salvo na sua Galeria!", {
        description:
          "O WhatsApp vai abrir: toque no 📎 clipe ou 📷 câmera para enviar o card recém-salvo junto com o texto!",
        duration: 8000,
      });
    }

    setIsGenerating(false);

    // 3. Abrir WhatsApp com a mensagem pronta
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl lg:max-w-5xl w-[96vw] sm:w-[92vw] lg:w-full p-0 overflow-hidden bg-slate-950 border-white/10 text-white max-h-[92vh] flex flex-col shadow-2xl rounded-2xl sm:rounded-3xl">
        {/* Top Header - Responsivo com explicação detalhada do OVR */}
        <DialogHeader className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur-md gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-1.5 rounded-lg border shrink-0 ${cardTheme.headerIconBox}`}>
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-white font-black text-base sm:text-xl tracking-wide flex items-center gap-2">
                <span>Card Oficial do Atleta</span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest hidden sm:inline">
                  | EA Performance
                </span>
              </DialogTitle>
              {/* Explicação visível no cabeçalho (especialmente útil no telefone responsivo) */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs text-slate-300 mt-0.5">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span>⭐ OVR (Overall):</span>
                </span>
                <span>Nível Geral de Habilidade</span>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  <span>{cardTheme.badgeIcon}</span>
                  <span>Carta {athleteStats.tier}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-6 sm:pr-8 self-end sm:self-auto">
            {athleteStats.isOnFire && (
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[10px] border-orange-400/50 shadow-md gap-1">
                <Flame className="h-3 w-3 fill-current text-yellow-200 animate-pulse" />
                ON FIRE
              </Badge>
            )}
            <Badge className={`${cardTheme.headerBadge} text-xs font-bold gap-1`}>
              <span>{cardTheme.badgeIcon}</span>
              <span>{athleteStats.tier}</span>
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Modal Body: 2 Columns on Desktop & Tablet Landscape, 1 Column on Mobile & Tablet Portrait */}
        <div className="p-3 sm:p-5 md:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* COLUNA ESQUERDA: Card Visual Colecionável FUT EA */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div
              ref={cardRef}
              data-athlete-card="true"
              className={`relative mx-auto w-full max-w-[340px] rounded-3xl p-1 shadow-2xl transition-all duration-300 ${cardTheme.outerFrame}`}
            >
              <div
                className="relative rounded-[22px] p-4 pb-3.5 sm:p-5 sm:pb-4 overflow-hidden flex flex-col justify-between"
                style={{
                  backgroundColor: "#091528",
                  backgroundImage:
                    "radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.12) 0%, transparent 55%), linear-gradient(180deg, #0e1e38 0%, #091528 50%, #050b17 100%)",
                }}
              >
                {/* Efeito de Reflexo de Vidro e Luz (ignorado no canvas para evitar artefatos de blur no Safari/iOS) */}
                <div
                  data-html2canvas-ignore="true"
                  className={`absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full ${cardTheme.accentGlow} blur-3xl pointer-events-none`}
                />

                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between relative z-10 pb-1.5">
                  {/* Bloco Esquerdo: Rating OVR & Status */}
                  <div className="flex items-center gap-2.5">
                    {/* Badge OVR Destacado com cores dinâmicas da carta */}
                    <div className={`flex flex-col items-center justify-center ${cardTheme.ovrBadgeBg} rounded-xl px-2.5 py-1.5 min-w-[56px] shadow-sm`}>
                      <span className={`text-3xl font-black font-mono leading-none tracking-tight ${cardTheme.ovrText}`}>
                        {athleteStats.ovr}
                      </span>
                      <span className={`text-[7.5px] font-black uppercase tracking-widest ${cardTheme.ovrLabel} leading-none mt-1`}>
                        OVR • OVERALL
                      </span>
                    </div>

                    {/* Coluna de Tags Pedagógicas e Status */}
                    <div className="flex flex-col gap-1 justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md leading-none ${cardTheme.categoryTag}`}>
                          {student.categoria}
                        </span>
                        {athleteStats.ovrBoost > 0 && (
                          <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 rounded-md leading-none flex items-center gap-0.5">
                            +{athleteStats.ovrBoost} FORMA 🔥
                          </span>
                        )}
                      </div>

                      {athleteStats.isOnFire ? (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[9px] border border-orange-400/50 px-2 py-0.5 rounded-full shadow-sm leading-none w-fit">
                          <Flame className="h-2.5 w-2.5 fill-current text-yellow-200" />
                          <span>ON FIRE 🔥</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[9px] border border-white/20 text-slate-300 px-2 py-0.5 rounded-full leading-none w-fit">
                          <Zap className={`h-2.5 w-2.5 ${cardTheme.hudIcon}`} />
                          <span>EM RITMO</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bloco Direito: Escudo Equipe Marco Roza */}
                  <div className="flex flex-col items-center justify-center bg-slate-900/80 border border-white/10 rounded-xl px-2.5 py-1.5 min-w-[68px] shadow-sm">
                    <img
                      src={logo}
                      alt="Marco Roza"
                      className="h-9 w-auto object-contain drop-shadow-[0_2px_8px_rgba(234,179,8,0.25)]"
                    />
                    <span className="text-[7.5px] uppercase tracking-wider text-slate-300 font-bold mt-1 text-center leading-none">
                      Marco Roza
                    </span>
                  </div>
                </div>

                {/* Nome do Atleta (Sem truncate para não cortar caracteres no canvas) */}
                <div className={`my-2.5 text-center border-y ${cardTheme.nameBorder} py-1.5 relative z-10 overflow-visible`}>
                  <h3 className="text-base sm:text-lg font-black uppercase text-white px-2 overflow-visible leading-tight tracking-wide">
                    {student.nome}
                  </h3>
                  <p className={`text-[9px] ${cardTheme.nameSub} font-bold tracking-widest uppercase mt-0.5 flex items-center justify-center gap-1.5`}>
                    <span>RACKET PRO ATHLETE</span>
                    <span>•</span>
                    <span>{cardTheme.badgeIcon} CARTA {athleteStats.tier}</span>
                  </p>
                </div>

                {/* Gráfico de Radar Poligonal SVG */}
                <div className="relative flex justify-center items-center my-0.5">
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
                      fill={cardTheme.radarFill}
                      stroke={cardTheme.radarStroke}
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
                          r="3"
                          fill={attr.boost > 0 ? "#34d399" : cardTheme.radarPointFill}
                          stroke={cardTheme.radarPointStroke}
                          strokeWidth="1.5"
                        />
                      );
                    })}

                    {/* Rótulos dos eixos */}
                    {athleteStats.attributes.map((attr, i) => {
                      const angle = i * angleStep - Math.PI / 2;
                      const labelR = radius + 18;
                      const x = center + labelR * Math.cos(angle);
                      const y = center + labelR * Math.sin(angle) + 4;
                      return (
                        <text
                          key={i}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          fill={cardTheme.radarLabel}
                          fontSize="9.5"
                          fontWeight="bold"
                          className="select-none font-mono tracking-wider"
                        >
                          {attr.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>

                {/* Grid com Atributos Numéricos dos 6 Fundamentos Técnicos */}
                <div className="grid grid-cols-3 gap-1.5 mt-1 pt-2 border-t border-white/10 text-center">
                  {athleteStats.attributes.map((attr) => (
                    <div
                      key={attr.label}
                      className={`${cardTheme.attrCardBg} rounded-lg p-1 border flex flex-col justify-center`}
                    >
                      <div className="text-[9px] text-slate-400 font-medium">
                        {attr.name}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className={`text-xs font-black font-mono ${cardTheme.attrValue}`}>
                          {attr.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* HUD dos Itens 7, 8 e 9: Assiduidade, Sequência & Miniliga */}
                <div className="mt-2.5 pt-2 border-t border-white/10 grid grid-cols-3 gap-1.5 text-center">
                  {/* 7. Assiduidade */}
                  <div className={`bg-slate-900/95 rounded-xl p-1.5 border ${cardTheme.hudCardBg} flex flex-col justify-between min-h-[58px] shadow-sm`}>
                    <div className={`flex items-center justify-center gap-1 text-[8.5px] ${cardTheme.hudText} font-bold leading-none`}>
                      <CalendarCheck className={`h-2.5 w-2.5 ${cardTheme.hudIcon}`} />
                      Assiduidade
                    </div>
                    <div className="text-sm font-black text-white font-mono leading-none my-1">
                      {athleteStats.attendanceRate}%
                    </div>
                    <div className="text-[8px] text-slate-400 font-medium leading-none">
                      {athleteStats.attendedClasses} aulas
                    </div>
                  </div>

                  {/* 8. Sequência */}
                  <div className="bg-slate-900/95 rounded-xl p-1.5 border border-orange-500/25 flex flex-col justify-between min-h-[58px] shadow-sm">
                    <div className="flex items-center justify-center gap-1 text-[8.5px] text-orange-300 font-bold leading-none">
                      <Flame className="h-2.5 w-2.5 text-orange-400" />
                      Sequência
                    </div>
                    <div className="text-sm font-black text-white font-mono leading-none my-1">
                      {athleteStats.effectiveStreak} <span className="text-[9px] font-semibold text-slate-300">aulas</span>
                    </div>
                    <div className="text-[8px] text-orange-300 font-bold leading-none">
                      {athleteStats.isOnFire ? "🔥 ON FIRE" : "sem faltas"}
                    </div>
                  </div>

                  {/* 9. Miniliga */}
                  <div className={`bg-slate-900/95 rounded-xl p-1.5 border ${cardTheme.hudCardBg} flex flex-col justify-between min-h-[58px] shadow-sm`}>
                    <div className={`flex items-center justify-center gap-1 text-[8.5px] ${cardTheme.hudText} font-black leading-none`}>
                      <Trophy className={`h-2.5 w-2.5 ${cardTheme.hudIcon} fill-current`} />
                      Miniliga
                    </div>
                    <div className={`text-sm font-black font-mono leading-none my-1 ${cardTheme.hudText}`}>
                      {athleteStats.miniligaPontos} <span className="text-[9px] font-semibold">pts</span>
                    </div>
                    <div className="text-[8px] text-slate-400 font-medium leading-none">
                      {athleteStats.torneiosOficiais > 0
                        ? `${athleteStats.torneiosOficiais} ${athleteStats.torneiosOficiais === 1 ? "torneio" : "torneios"}${athleteStats.titulosOficiais > 0 ? " 🏆" : ""}`
                        : athleteStats.miniligaAulas > 0
                        ? `${athleteStats.miniligaAulas} ${athleteStats.miniligaAulas === 1 ? "aula temática" : "aulas de liga"}`
                        : "sem torneios"}
                    </div>
                  </div>
                </div>

                {/* Barra de Pontuação da Miniliga */}
                <div className="mt-2 px-1">
                  <div className="flex justify-between items-center text-[8.5px] text-slate-400 font-medium mb-1">
                    <span className={`flex items-center gap-1 ${cardTheme.hudText} font-semibold`}>
                      <Trophy className={`h-2.5 w-2.5 ${cardTheme.hudIcon}`} />
                      Pontos Acumulados Miniliga
                    </span>
                    <span className={`font-bold font-mono ${cardTheme.hudText}`}>
                      {athleteStats.miniligaPontos} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-white/5">
                    <div
                      className={`${cardTheme.miniligaProgress} h-full rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.min(100, Math.max(10, athleteStats.miniligaPontos > 0 ? (athleteStats.miniligaPontos % 100 || 100) : 0))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Rodapé Oficial do Card com respiro de segurança */}
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-400 uppercase tracking-widest font-semibold px-0.5">
                  <span className={`${cardTheme.footerText} flex items-center gap-1 font-bold`}>
                    <ShieldCheck className={`h-2.5 w-2.5 ${cardTheme.footerIcon}`} />
                    Racket Pro Athlete
                  </span>
                  <span className="text-slate-400 font-medium">
                    Equipe Marco Roza
                  </span>
                </div>
              </div>
            </div>

            {/* Ações Rápidas de Imagem sob o Card */}
            <div className="flex items-center justify-center gap-2 mt-3 w-full max-w-[340px]">
              <Button
                type="button"
                size="sm"
                onClick={handleCopyCardImage}
                disabled={isGenerating}
                className="flex-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold gap-1.5 shadow-sm transition-all"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                ) : copiedImage ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-amber-400" />
                )}
                {copiedImage ? "Imagem Copiada!" : "Copiar Imagem"}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleDownloadCard}
                disabled={isGenerating}
                className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 text-xs font-medium gap-1.5 shadow-sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-slate-300" />
                )}
                Baixar PNG
              </Button>
            </div>
          </div>

          {/* COLUNA DIREITA: Painel de Desempenho, Análise & Ações */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Box de Boas-Vindas & Status Geral */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">
                    Ficha Oficial de Rendimento
                  </span>
                  <h2 className="text-xl font-black text-white leading-tight">
                    {student.nome}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Categoria {student.categoria} • Temporada 2026
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {athleteStats.ovr}{" "}
                    <span className="text-xs font-bold text-slate-400">OVR</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    {athleteStats.ovrBoost > 0
                      ? `+${athleteStats.ovrBoost} Boost Ativo 🔥`
                      : "Ritmo Estável"}
                  </div>
                </div>
              </div>

              {/* Progressão dos 6 Fundamentos Técnicos das Provas Bimestrais */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                  <span>Fundamentos Técnicos Bimestrais (1 ao 6)</span>
                  <span className="text-[10px] text-slate-500">Escala 60-99 • Provas de Quadra</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {athleteStats.attributes.map((attr, idx) => (
                    <div
                      key={attr.label}
                      className="bg-slate-950/60 rounded-xl p-2.5 border border-white/5 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                          <strong className="text-amber-400 font-mono">
                            {attr.label}
                          </strong>
                          {attr.name}
                        </span>
                        <div className="flex items-center gap-1 font-mono font-bold text-white">
                          <span>{attr.value}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            attr.value >= 85
                              ? "bg-gradient-to-r from-amber-400 to-yellow-300"
                              : attr.value >= 75
                              ? "bg-gradient-to-r from-amber-500 to-orange-400"
                              : "bg-gradient-to-r from-slate-500 to-amber-600"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(10, ((attr.value - 50) / 50) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frequência, Sequência & Miniliga (Itens 7, 8 e 9) */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                  <span>Frequência, Sequência & Miniliga (7, 8 e 9)</span>
                  <span className="text-[10px] text-amber-400 font-semibold">Engajamento & Competição</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Item 7: Assiduidade */}
                  <div className="bg-slate-950/70 rounded-xl p-2.5 border border-amber-500/20 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <CalendarCheck className="h-3 w-3 text-amber-400" />
                      7. Assiduidade
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-lg font-black font-mono text-white">
                        {athleteStats.attendanceRate}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {athleteStats.attendedClasses} aulas
                      </span>
                    </div>
                  </div>

                  {/* Item 8: Sequência de Aulas */}
                  <div className="bg-slate-950/70 rounded-xl p-2.5 border border-orange-500/20 flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-400" />
                      8. Sequência
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-lg font-black font-mono text-white">
                        {athleteStats.effectiveStreak}
                      </span>
                      <span className="text-[10px] text-orange-300 font-bold">
                        {athleteStats.isOnFire ? "🔥 ON FIRE" : "sem faltas"}
                      </span>
                    </div>
                  </div>

                  {/* Item 9: Miniliga */}
                  <div className="bg-gradient-to-br from-amber-500/15 via-slate-950 to-slate-950 rounded-xl p-2.5 border border-amber-400/40 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] text-amber-300 font-black uppercase flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-amber-400 fill-current" />
                      9. Miniliga
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-lg font-black font-mono text-amber-300">
                        {athleteStats.miniligaPontos} <span className="text-xs font-bold">pts</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {athleteStats.torneiosOficiais > 0
                          ? `${athleteStats.torneiosOficiais} ${athleteStats.torneiosOficiais === 1 ? "torneio oficial" : "torneios oficiais"}${athleteStats.titulosOficiais > 0 ? ` (${athleteStats.titulosOficiais} 🏆 Título)` : ""}`
                          : athleteStats.miniligaAulas > 0
                          ? `${athleteStats.miniligaAulas} ${athleteStats.miniligaAulas === 1 ? "aula temática" : "aulas de liga"}`
                          : "sem torneios"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Torneios Oficiais Disputados pelo Atleta */}
                {athleteStats.officialTournaments && athleteStats.officialTournaments.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-amber-400" />
                      Histórico Oficial de Torneios
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {athleteStats.officialTournaments.map((t, idx) => (
                        <div
                          key={t.sessionId || idx}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] border ${
                            t.rank === 1
                              ? "bg-amber-500/15 border-amber-400/50 text-amber-200"
                              : t.rank <= 3
                              ? "bg-slate-800/80 border-slate-600 text-slate-200"
                              : "bg-slate-900/60 border-slate-700/60 text-slate-300"
                          }`}
                        >
                          <Trophy className={`h-3 w-3 ${t.rank === 1 ? "text-amber-400 fill-current" : "text-amber-400/80"}`} />
                          <span className="font-medium text-slate-300">{t.title}:</span>
                          <strong className="text-white font-bold">{t.rank}º lugar</strong>
                          <span className="text-amber-400 font-mono font-bold">(+{t.points} pts)</span>
                          {t.rank === 1 && <span className="text-xs">🏆</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dica Informativa de Engajamento e Evolução Semanal */}
            <div className="flex items-start gap-2.5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/25 rounded-2xl p-3.5 text-xs text-amber-200/95 shadow-sm">
              <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-amber-300">Estrutura Pedagógica Marco Roza:</strong> Os itens{" "}
                <span className="text-white font-bold">1 ao 6</span> são os fundamentos das provas bimestrais (Forehand, Backhand, Lob, Curta, Saque e Smash). A{" "}
                <span className="text-white font-bold">Assiduidade (7)</span> e a{" "}
                <span className="text-white font-bold">Sequência (8)</span> derivam das frequências em aula ativando o status{" "}
                <span className="text-orange-300 font-bold">ON FIRE 🔥 (+2 OVR)</span>, e a{" "}
                <span className="text-amber-300 font-bold">Miniliga (9)</span> possui seu contador à parte acumulando os pontos ganhos a cada partida e torneio disputado, registrando tanto as presenças em quadra quanto os torneios oficiais com súmula!
              </div>
            </div>

            {/* Painel de Compartilhamento & Ações */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                  Compartilhamento Oficial
                </span>
                <span className="text-[10px] text-slate-400">
                  Alta Resolução (PNG + Texto)
                </span>
              </div>

              {/* Dica de envio clara para celular e computador */}
              <div className="bg-slate-950/80 border border-emerald-500/25 rounded-xl p-3 text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Dica de Envio do Card Oficial:</span>
                </div>
                <p className="leading-relaxed">
                  • <strong>No Celular:</strong> Ao tocar no botão verde, se o WhatsApp abrir apenas com o texto, <strong>o card já foi salvo na sua galeria</strong>: basta tocar no ícone de 📎 clipe ou 📷 câmera no WhatsApp para anexar o card recém-salvo junto com o texto!
                </p>
                <p className="text-slate-400 leading-relaxed">
                  • <strong>No Computador:</strong> Ao abrir o WhatsApp Web, o card já fica copiado na memória: basta dar <strong>Ctrl+V</strong> na conversa.
                </p>
              </div>

              {/* Botão Principal: WhatsApp */}
              <Button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={isGenerating}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm gap-2.5 shadow-lg shadow-emerald-600/30 transition-all rounded-xl"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-5 w-5 fill-current" />
                )}
                Compartilhar no WhatsApp com Imagem do Card
              </Button>

              {/* Botões Secundários: Salvar Imagem, Copiar Imagem e Copiar Texto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-white/5">
                <Button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={isGenerating}
                  className="w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="h-3.5 w-3.5 text-amber-400" />
                  Salvar Imagem (PNG)
                </Button>

                <Button
                  type="button"
                  onClick={handleCopyCardImage}
                  disabled={isGenerating}
                  className="w-full bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold gap-1.5 transition-colors shadow-sm"
                >
                  {copiedImage ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Camera className="h-3.5 w-3.5 text-slate-300" />
                  )}
                  {copiedImage ? "Imagem Copiada!" : "Copiar Imagem"}
                </Button>

                <Button
                  type="button"
                  onClick={handleCopyCardText}
                  disabled={isGenerating}
                  className="w-full bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold gap-1.5 transition-colors shadow-sm"
                >
                  {copiedText ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-300" />
                  )}
                  {copiedText ? "Texto Copiado!" : "Copiar Texto"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
