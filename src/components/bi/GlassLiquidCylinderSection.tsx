import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, FlaskConical } from "lucide-react";

export interface LiquidCylinderMetric {
  id: string;
  title: string;
  subtitle?: string;
  percentage: number;
  colorScheme: "emerald" | "cyan" | "purple" | "amber";
  status: {
    label: string;
    type: "success" | "warning" | "info" | "purple";
  };
  observation: string;
  meta: string;
}

interface GlassLiquidCylinderSectionProps {
  title?: string;
  description?: string;
  metrics: LiquidCylinderMetric[];
}

export const GlassLiquidCylinderSection: React.FC<GlassLiquidCylinderSectionProps> = ({
  title = "Cilindros de Vidro Líquido (Nível Operacional & Estratégico)",
  description = "Aferição em recipientes de vidro graduados com líquido dinâmico, percentuais de precisão e observações executivas pertinentes.",
  metrics,
}) => {
  // Configurações de cores e gradientes dos fluidos líquidos
  const getColorClasses = (scheme: LiquidCylinderMetric["colorScheme"]) => {
    switch (scheme) {
      case "emerald":
        return {
          liquidBg: "from-emerald-400 via-teal-500 to-emerald-600",
          waveColor: "#34d399",
          glowShadow: "0 0 20px rgba(16, 185, 129, 0.45)",
          textGlow: "text-emerald-600 dark:text-emerald-400",
          badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/60",
          borderAccent: "border-emerald-500/30",
          dotColor: "bg-emerald-500",
          lightBg: "bg-emerald-500/10",
        };
      case "cyan":
        return {
          liquidBg: "from-cyan-400 via-sky-500 to-blue-600",
          waveColor: "#38bdf8",
          glowShadow: "0 0 20px rgba(6, 182, 212, 0.45)",
          textGlow: "text-cyan-600 dark:text-cyan-400",
          badgeBg: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-300/60",
          borderAccent: "border-cyan-500/30",
          dotColor: "bg-cyan-500",
          lightBg: "bg-cyan-500/10",
        };
      case "purple":
        return {
          liquidBg: "from-fuchsia-400 via-purple-500 to-indigo-600",
          waveColor: "#c084fc",
          glowShadow: "0 0 20px rgba(168, 85, 247, 0.45)",
          textGlow: "text-purple-600 dark:text-purple-400",
          badgeBg: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/60",
          borderAccent: "border-purple-500/30",
          dotColor: "bg-purple-500",
          lightBg: "bg-purple-500/10",
        };
      case "amber":
      default:
        return {
          liquidBg: "from-amber-300 via-amber-500 to-orange-600",
          waveColor: "#fbbf24",
          glowShadow: "0 0 20px rgba(245, 158, 11, 0.45)",
          textGlow: "text-amber-600 dark:text-amber-400",
          badgeBg: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300/60",
          borderAccent: "border-amber-500/30",
          dotColor: "bg-amber-500",
          lightBg: "bg-amber-500/10",
        };
    }
  };

  return (
    <section className="space-y-4">
      {/* Cabeçalho do Bloco de Cilindros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center bi-glass-pill shadow-inner">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              {title}
              <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider hidden sm:inline-flex">
                <Sparkles className="w-3 h-3 mr-1" /> Fluido em Tempo Real
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      {/* Grid com os Cilindros de Vidro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric) => {
          const clampedPerc = Math.min(100, Math.max(5, metric.percentage));
          const colors = getColorClasses(metric.colorScheme);

          return (
            <Card
              key={metric.id}
              className="bi-glass-card bi-glass-reflection border border-white/80 dark:border-white/10 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-5 flex flex-col h-full justify-between space-y-4">
                {/* Topo do Card: Título e Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-foreground tracking-tight leading-snug">
                      {metric.title}
                    </h3>
                    {metric.subtitle && (
                      <p className="text-[11px] text-muted-foreground">{metric.subtitle}</p>
                    )}
                  </div>
                  <Badge className={`text-[10px] font-bold px-2 py-0.5 border ${colors.badgeBg} shrink-0`}>
                    {metric.status.label}
                  </Badge>
                </div>

                {/* Centro: O Cilindro de Vidro com Líquido Colorido */}
                <div className="py-2 flex items-center justify-center gap-4">
                  {/* Estrutura do Cilindro */}
                  <div className="relative w-20 h-52 flex flex-col items-center justify-end">
                    {/* Borda / Boca superior do copo (Elipse 3D) */}
                    <div className="absolute top-0 w-full h-3 rounded-full border border-white/90 bg-white/40 shadow-sm z-30 pointer-events-none" />

                    {/* Corpo de Vidro Graduado */}
                    <div className="relative w-full h-full rounded-b-2xl rounded-t-lg border-2 border-white/80 dark:border-white/20 bg-white/20 dark:bg-slate-900/30 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_inset_0_-2px_4px_rgba(0,0,0,0.1),_0_8px_20px_rgba(28,35,148,0.06)] overflow-hidden flex flex-col justify-end">
                      {/* Reflexo de brilho especular vertical (lado esquerdo) */}
                      <div className="absolute top-0 bottom-0 left-1.5 w-2 bg-gradient-to-r from-white/70 via-white/30 to-transparent z-20 pointer-events-none rounded-full" />
                      {/* Reflexo fino (lado direito) */}
                      <div className="absolute top-0 bottom-0 right-1.5 w-1 bg-white/30 z-20 pointer-events-none rounded-full" />

                      {/* Marcações Graduadas na parede de vidro (100%, 75%, 50%, 25%) */}
                      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between py-2 px-1 opacity-60">
                        <div className="flex items-center justify-between border-t border-dashed border-white/70 pt-0.5">
                          <span className="text-[8px] font-bold text-foreground/70">100%</span>
                          <span className="w-2 h-0.5 bg-white/80" />
                        </div>
                        <div className="flex items-center justify-between border-t border-dashed border-white/50 pt-0.5">
                          <span className="text-[8px] font-bold text-foreground/70">75%</span>
                          <span className="w-1.5 h-0.5 bg-white/70" />
                        </div>
                        <div className="flex items-center justify-between border-t border-dashed border-white/50 pt-0.5">
                          <span className="text-[8px] font-bold text-foreground/70">50%</span>
                          <span className="w-2 h-0.5 bg-white/70" />
                        </div>
                        <div className="flex items-center justify-between border-t border-dashed border-white/50 pt-0.5">
                          <span className="text-[8px] font-bold text-foreground/70">25%</span>
                          <span className="w-1.5 h-0.5 bg-white/70" />
                        </div>
                        <div className="w-full h-0.5 border-t border-white/50" />
                      </div>

                      {/* LÍQUIDO COLORIDO NO CILINDRO */}
                      <div
                        className={`w-full bg-gradient-to-t ${colors.liquidBg} relative transition-all duration-1000 ease-out`}
                        style={{
                          height: `${clampedPerc}%`,
                          boxShadow: colors.glowShadow,
                        }}
                      >
                        {/* Onda / Superfície Líquida no topo do fluido */}
                        <div className="absolute -top-2 left-0 right-0 h-3 overflow-hidden pointer-events-none z-10">
                          <svg
                            viewBox="0 0 100 20"
                            preserveAspectRatio="none"
                            className="w-[160%] h-full animate-liquid-wave opacity-90"
                            style={{ fill: colors.waveColor }}
                          >
                            <path d="M0,10 C20,18 40,2 60,10 C80,18 100,2 120,10 C140,18 160,2 180,10 L180,20 L0,20 Z" />
                          </svg>
                        </div>

                        {/* Linha de menisco / brilho da superfície */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/50 blur-[0.5px]" />

                        {/* Bolhas efervescentes subindo no líquido */}
                        <div className="absolute bottom-2 left-3 w-1.5 h-1.5 rounded-full bg-white/60 animate-bubble-1" />
                        <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-white/50 animate-bubble-2" />
                        <div className="absolute bottom-1 left-5 w-1 h-1 rounded-full bg-white/70 animate-bubble-1" />
                      </div>
                    </div>

                    {/* Base física do cilindro / Prato de apoio de vidro */}
                    <div className="w-24 h-2 mt-[-2px] rounded-full border border-white/80 bg-white/60 dark:bg-slate-800/80 shadow-md backdrop-blur-sm z-30" />
                  </div>

                  {/* Informação Numérica ao Lado do Cilindro */}
                  <div className="flex flex-col items-start justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Nível Aferido
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-3xl font-black tracking-tight ${colors.textGlow}`}>
                        {metric.percentage.toFixed(1)}
                      </span>
                      <span className={`text-base font-bold ${colors.textGlow}`}>%</span>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors.dotColor}`} />
                      {metric.meta}
                    </span>
                  </div>
                </div>

                {/* Observação Pertinente de BI no Rodapé do Cilindro */}
                <div className={`p-3 rounded-xl ${colors.lightBg} border ${colors.borderAccent} mt-2`}>
                  <div className="flex items-start gap-2">
                    <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${colors.textGlow}`} />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-foreground block">
                        Diagnóstico & Observação
                      </span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {metric.observation}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
