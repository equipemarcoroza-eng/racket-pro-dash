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
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cachedBlob, setCachedBlob] = useState<Blob | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Pré-renderização em background do card assim que o modal abre (declarado no topo para respeitar as regras de hooks do React)
  useEffect(() => {
    let isMounted = true;
    if (open && student) {
      const timer = setTimeout(async () => {
        if (!cardRef.current) return;
        try {
          const html2canvas = (await import("html2canvas")).default;
          const canvas = await html2canvas(cardRef.current, {
            scale: 2.2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#030712",
            logging: false,
          });
          canvas.toBlob((blob) => {
            if (isMounted && blob) {
              setCachedBlob(blob);
            }
          }, "image/png");
        } catch (e) {
          console.warn("Pré-geração do card falhou:", e);
        }
      }, 350);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else {
      setCachedBlob(null);
    }
  }, [open, student?.id]);

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


  // Gerador da imagem do Card em HD usando html2canvas (com cache para resposta instantânea)
  const generateCardBlob = async (): Promise<Blob | null> => {
    if (cachedBlob) return cachedBlob;
    if (!cardRef.current) return null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.2, // Ultra HD para ficar nítido e perfeito no WhatsApp e impressão
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#030712",
        logging: false,
      });

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl lg:max-w-5xl w-full p-0 overflow-hidden bg-slate-950 border-amber-500/30 text-white max-h-[92vh] flex flex-col shadow-2xl">
        {/* Top Header */}
        <DialogHeader className="px-5 py-3.5 border-b border-white/10 flex flex-row items-center justify-between shrink-0 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-amber-400 font-black text-lg sm:text-xl tracking-wide flex items-center gap-2">
                Card Oficial do Atleta
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest hidden sm:inline">
                  | EA Performance
                </span>
              </DialogTitle>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-6 sm:pr-8">
            {athleteStats.isOnFire && (
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[10px] border-orange-400/50 shadow-md gap-1">
                <Flame className="h-3 w-3 fill-current text-yellow-200 animate-pulse" />
                ON FIRE
              </Badge>
            )}
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-bold">
              {athleteStats.tier}
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Modal Body: 2 Columns on Desktop */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* COLUNA ESQUERDA: Card Visual Colecionável FUT EA */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div
              ref={cardRef}
              className={`relative mx-auto w-full max-w-[340px] rounded-3xl p-1 shadow-2xl transition-all duration-300 ${
                athleteStats.isOnFire
                  ? "bg-gradient-to-b from-orange-400 via-amber-500 to-amber-950 shadow-orange-500/30 ring-1 ring-orange-400/40"
                  : "bg-gradient-to-b from-amber-300 via-yellow-600 to-amber-950 shadow-yellow-500/20"
              }`}
            >
              <div className="relative rounded-[22px] bg-gradient-to-b from-slate-900 via-slate-950 to-black p-4 sm:p-5 overflow-hidden">
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
                      className="h-12 w-auto object-contain drop-shadow-[0_4px_12px_rgba(234,179,8,0.3)]"
                    />
                    <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                      Equipe Marco Roza
                    </span>
                  </div>
                </div>

                {/* Nome do Atleta */}
                <div className="my-2.5 text-center border-y border-amber-500/30 py-1.5 relative z-10">
                  <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-wider text-white truncate px-1">
                    {student.nome}
                  </h3>
                  <p className="text-[9px] text-amber-300/80 font-medium tracking-widest uppercase">
                    RACKET PRO ATHLETE
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
                          r="3"
                          fill={attr.boost > 0 ? "#34d399" : "#fbbf24"}
                          stroke="#78350f"
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
                          fill="#fde68a"
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

                {/* Grid com Atributos Numéricos */}
                <div className="grid grid-cols-3 gap-1.5 mt-1 pt-2 border-t border-white/10 text-center">
                  {athleteStats.attributes.map((attr) => (
                    <div
                      key={attr.label}
                      className="bg-white/5 rounded-lg p-1 border border-white/5 flex flex-col justify-center"
                    >
                      <div className="text-[9px] text-slate-400 font-medium">
                        {attr.name}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-black text-amber-300 font-mono">
                          {attr.value}
                        </span>
                        {attr.boost > 0 && (
                          <span
                            className="text-[8px] text-emerald-400 font-bold flex items-center"
                            title={`Boost de frequência e ritmo: +${attr.boost}`}
                          >
                            <TrendingUp className="h-2 w-2 inline" />
                            +{attr.boost}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* HUD de Ritmo & Temporada */}
                <div className="mt-2.5 pt-2 border-t border-white/10 grid grid-cols-3 gap-1 text-center">
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-lg p-1 border border-amber-500/20">
                    <div className="flex items-center justify-center gap-0.5 text-[8.5px] text-amber-300 font-semibold mb-0.5">
                      <CalendarCheck className="h-2 w-2" />
                      Assiduidade
                    </div>
                    <div className="text-xs font-black text-white font-mono">
                      {athleteStats.attendanceRate}%
                    </div>
                    <div className="text-[7.5px] text-slate-400">
                      {athleteStats.attendedClasses} aulas
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-lg p-1 border border-orange-500/20">
                    <div className="flex items-center justify-center gap-0.5 text-[8.5px] text-orange-300 font-semibold mb-0.5">
                      <Flame className="h-2 w-2" />
                      Sequência
                    </div>
                    <div className="text-xs font-black text-white font-mono">
                      {athleteStats.effectiveStreak} seguidas
                    </div>
                    <div className="text-[7.5px] text-slate-400">sem faltas</div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-lg p-1 border border-yellow-500/20">
                    <div className="flex items-center justify-center gap-0.5 text-[8.5px] text-yellow-300 font-semibold mb-0.5">
                      <Sparkles className="h-2 w-2" />
                      Temporada
                    </div>
                    <div className="text-xs font-black text-white font-mono">
                      Nível {athleteStats.seasonLevel}
                    </div>
                    <div className="text-[7.5px] text-slate-400">
                      {athleteStats.totalXp} XP
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso de XP da Temporada */}
                <div className="mt-2 px-1">
                  <div className="flex justify-between items-center text-[8.5px] text-slate-400 font-medium mb-1">
                    <span>Rumo ao Nível {athleteStats.seasonLevel + 1}</span>
                    <span className="text-amber-400 font-bold">
                      {athleteStats.progressToNextLevel}/100 XP
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(8, athleteStats.progressToNextLevel)}%`,
                      }}
                    />
                  </div>
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
          <div className="md:col-span-7 flex flex-col gap-4">
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

              {/* Progressão de Fundamentos Técnicos Detalhada */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                  <span>Fundamentos Técnicos & Físicos</span>
                  <span className="text-[10px] text-slate-500">Escala 60-99</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {athleteStats.attributes.map((attr) => (
                    <div
                      key={attr.label}
                      className="bg-slate-950/60 rounded-xl p-2.5 border border-white/5 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">
                          <strong className="text-amber-400 font-mono mr-1.5">
                            {attr.label}
                          </strong>
                          {attr.name}
                        </span>
                        <div className="flex items-center gap-1 font-mono font-bold text-white">
                          <span>{attr.value}</span>
                          {attr.boost > 0 && (
                            <span className="text-[9px] text-emerald-400 font-normal">
                              (+{attr.boost})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
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
            </div>

            {/* Dica Informativa de Engajamento e Evolução Semanal */}
            <div className="flex items-start gap-2.5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/25 rounded-2xl p-3.5 text-xs text-amber-200/95 shadow-sm">
              <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-amber-300">Evolução Contínua:</strong> Entre
                as avaliações bimestrais, o card evolui a cada semana! Presenças,
                reposições e miniligas impulsionam a{" "}
                <span className="text-white font-bold">Consistência (+5)</span>, o{" "}
                <span className="text-white font-bold">Ritmo (+3)</span> e ativam o status{" "}
                <span className="text-orange-300 font-bold">ON FIRE 🔥 (+2 OVR)</span>.
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
