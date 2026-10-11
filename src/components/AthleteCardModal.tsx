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
  Award,
  Sparkles,
  Share2,
  Copy,
  Check,
  Zap,
  Activity as ActivityIcon,
  Flame,
  Shield,
  MessageCircle,
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
  const { activities, testResults } = useAppContext();
  const [copied, setCopied] = useState(false);

  // Atributos e notas do atleta
  const athleteStats = useMemo(() => {
    if (!student) return null;

    // Buscar resultados de testes do aluno
    const studentResults = testResults.filter((tr) => tr.alunoId === student.id);

    let baselineOvr = 75;
    if (student.categoria === "Juvenil") baselineOvr = 78;
    if (student.categoria === "Adulto") baselineOvr = 82;

    let overallCalculated = baselineOvr;
    let forehand = baselineOvr - 2;
    let backhand = baselineOvr - 5;
    let saqueSmash = baselineOvr + 1;
    let voleio = baselineOvr - 4;
    let agilidade = baselineOvr + 3;
    let consistencia = baselineOvr;

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
        overallCalculated = Math.min(99, Math.max(65, Math.round(avgPct * 0.4 + baselineOvr * 0.6)));
        consistencia = Math.min(99, Math.max(65, overallCalculated + (totalAcertos > 15 ? 4 : -2)));
      }
    }

    const tier =
      overallCalculated >= 90
        ? "ELITE WORLD CLASS"
        : overallCalculated >= 84
        ? "MASTER OURO"
        : overallCalculated >= 76
        ? "PRO PRATA"
        : "TALENTO BRONZE";

    return {
      ovr: overallCalculated,
      tier,
      attributes: [
        { label: "FOR", name: "Forehand", value: Math.min(99, forehand) },
        { label: "BCK", name: "Backhand", value: Math.min(99, backhand) },
        { label: "SRV", name: "Saque & Smash", value: Math.min(99, saqueSmash) },
        { label: "VOL", name: "Voleio & Rede", value: Math.min(99, voleio) },
        { label: "AGI", name: "Agilidade", value: Math.min(99, agilidade) },
        { label: "CON", name: "Consistência", value: Math.min(99, consistencia) },
      ],
    };
  }, [student, testResults, activities]);

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
    const text = `🏆 *CARD DO ATLETA - EQUIPE MARCO ROZA*\n👤 *Atleta:* ${student.nome}\n⭐ *Overall (OVR):* ${athleteStats.ovr} (${athleteStats.tier})\n📊 *Categoria:* ${student.categoria}\n\n🎾 *Atributos Técnicos:*\n` +
      athleteStats.attributes.map((a) => `• ${a.label} (${a.name}): ${a.value}`).join("\n") +
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
    const text = `Fala, ${student.nome.split(" ")[0]}! 🎾🔥\n\nConfira o seu *Card Oficial de Desempenho da Equipe Marco Roza*!\n\n⭐ *Seu Overall Atual (OVR):* *${athleteStats.ovr}* (${athleteStats.tier})\n\n📊 *Seus Fundamentos Técnicos:*\n` +
      athleteStats.attributes.map((a) => `• ${a.name}: *${a.value}*`).join("\n") +
      `\n\nParabéns pela dedicação nos treinos! Vamos em busca do próximo nível! 🚀🏆`;

    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-slate-950 border-amber-500/30 text-white">
        <DialogHeader className="p-6 pb-2 border-b border-white/10 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-amber-400 font-black text-xl tracking-wide">
            <Trophy className="h-6 w-6 text-amber-400" />
            Card Oficial do Atleta | EA Performance
          </DialogTitle>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
            {athleteStats.tier}
          </Badge>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Card Visual FUT Dourado */}
          <div className="relative mx-auto max-w-sm rounded-3xl p-1 bg-gradient-to-b from-amber-300 via-yellow-600 to-amber-950 shadow-2xl shadow-yellow-500/20">
            <div className="relative rounded-[22px] bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 overflow-hidden">
              {/* Efeito de Reflexo de Vidro e Luz */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              {/* Cabeçalho do Card */}
              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 drop-shadow-md">
                    {athleteStats.ovr}
                  </span>
                  <span className="text-xs font-black uppercase tracking-widest text-amber-400/90">
                    OVR
                  </span>
                  <Badge variant="outline" className="mt-1 text-[10px] border-amber-400/40 text-amber-300 w-fit">
                    {student.categoria}
                  </Badge>
                </div>

                <div className="flex flex-col items-center">
                  <img
                    src={logo}
                    alt="Marco Roza"
                    className="h-14 w-auto object-contain drop-shadow-[0_4px_12px_rgba(234,179,8,0.3)]"
                  />
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                    Equipe Marco Roza
                  </span>
                </div>
              </div>

              {/* Nome do Atleta */}
              <div className="my-4 text-center border-y border-amber-500/30 py-2 relative z-10">
                <h3 className="text-xl font-extrabold uppercase tracking-wider text-white">
                  {student.nome}
                </h3>
                <p className="text-[11px] text-amber-300/80 font-medium tracking-widest uppercase">
                  RACKET PRO ATHLETE
                </p>
              </div>

              {/* Gráfico de Radar Poligonal SVG */}
              <div className="relative flex justify-center items-center my-2">
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
                    fill="rgba(234, 179, 8, 0.35)"
                    stroke="#f59e0b"
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
                        fill="#fbbf24"
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
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center">
                {athleteStats.attributes.map((attr) => (
                  <div
                    key={attr.label}
                    className="bg-white/5 rounded-lg p-1.5 border border-white/5"
                  >
                    <div className="text-[10px] text-slate-400 font-medium">
                      {attr.name}
                    </div>
                    <div className="text-sm font-black text-amber-300 font-mono">
                      {attr.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botões de Ação & Compartilhamento */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
            <Button
              variant="outline"
              onClick={handleCopyCardText}
              className="w-full sm:w-auto text-xs gap-1.5 border-white/20 text-white hover:bg-white/10"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
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
