import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  RotateCcw,
  Save,
  Printer,
  Compass,
  Zap,
  Target,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export interface TacticalElement {
  id: string;
  type: "coach" | "student" | "cone" | "ball_basket" | "arrow";
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label?: string;
  targetX?: number;
  targetY?: number;
}

interface TacticalBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveToLessonPlan?: (tacticalSummary: string) => void;
  initialNotes?: string;
  classNameInfo?: string;
}

export const TacticalBoardModal: React.FC<TacticalBoardModalProps> = ({
  open,
  onOpenChange,
  onSaveToLessonPlan,
  initialNotes = "",
  classNameInfo = "Treino Técnico",
}) => {
  const [courtType, setCourtType] = useState<"tennis" | "beach">("tennis");
  const [tacticalNotes, setTacticalNotes] = useState(initialNotes);

  // Elementos padrão iniciais
  const defaultElements: TacticalElement[] = [
    { id: "1", type: "coach", x: 50, y: 18, label: "Treinador" },
    { id: "2", type: "ball_basket", x: 42, y: 16 },
    { id: "3", type: "student", x: 50, y: 82, label: "A1" },
    { id: "4", type: "student", x: 65, y: 88, label: "Fila" },
    { id: "5", type: "cone", x: 25, y: 75, label: "Alvo" },
    { id: "6", type: "cone", x: 75, y: 75, label: "Alvo" },
    { id: "7", type: "arrow", x: 50, y: 22, targetX: 25, targetY: 74, label: "Bola Lançada" },
  ];

  const [elements, setElements] = useState<TacticalElement[]>(defaultElements);
  const [selectedTool, setSelectedTool] = useState<"student" | "cone" | "arrow" | null>(null);

  // Presets de Exercícios
  const applyPreset = (presetName: string) => {
    if (presetName === "cruzada") {
      setElements([
        { id: "1", type: "coach", x: 30, y: 20, label: "Coach" },
        { id: "2", type: "ball_basket", x: 24, y: 18 },
        { id: "3", type: "student", x: 70, y: 82, label: "A1 (Cruzada)" },
        { id: "4", type: "cone", x: 25, y: 35, label: "Alvo Cruzado" },
        { id: "5", type: "arrow", x: 30, y: 24, targetX: 70, targetY: 80, label: "Alimentação" },
        { id: "6", type: "arrow", x: 70, y: 80, targetX: 25, targetY: 36, label: "Direita Cruzada" },
      ]);
      setTacticalNotes("Drill: Troca de bola em diagonal cruzada buscando profundidade após o quique.");
      toast.success("Preset aplicado: Cruzada & Profundidade");
    } else if (presetName === "ataque_rede") {
      setElements([
        { id: "1", type: "coach", x: 50, y: 15, label: "Coach" },
        { id: "2", type: "ball_basket", x: 44, y: 14 },
        { id: "3", type: "student", x: 50, y: 55, label: "A1 (Voleio)" },
        { id: "4", type: "student", x: 50, y: 88, label: "A2 (Aproximação)" },
        { id: "5", type: "cone", x: 20, y: 30, label: "Alvo Curto" },
        { id: "6", type: "cone", x: 80, y: 30, label: "Alvo Curto" },
        { id: "7", type: "arrow", x: 50, y: 75, targetX: 50, targetY: 55, label: "Split Step & Voleio" },
      ]);
      setTacticalNotes("Drill: Aproximação do meio de quadra com finalização de voleio nos cantos.");
      toast.success("Preset aplicado: Transição & Voleio");
    } else if (presetName === "saque_devolucao") {
      setElements([
        { id: "1", type: "student", x: 35, y: 90, label: "Sacador" },
        { id: "2", type: "student", x: 65, y: 12, label: "Devolvedor" },
        { id: "3", type: "coach", x: 85, y: 50, label: "Treinador" },
        { id: "4", type: "cone", x: 60, y: 35, label: "T do Saque" },
        { id: "5", type: "arrow", x: 35, y: 90, targetX: 62, targetY: 35, label: "Saque Aberto" },
      ]);
      setTacticalNotes("Drill: Trabalho de consistência no primeiro saque e posicionamento de devolução.");
      toast.success("Preset aplicado: Saque & Devolução");
    }
  };

  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!selectedTool) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newElem: TacticalElement = {
      id: String(Date.now()),
      type: selectedTool,
      x,
      y,
      label: selectedTool === "student" ? "Aluno" : selectedTool === "cone" ? "Alvo" : undefined,
    };

    setElements((prev) => [...prev, newElem]);
    setSelectedTool(null);
    toast.success("Elemento posicionado na quadra!");
  };

  const handleClear = () => {
    setElements([]);
    toast.info("Lousa tática limpa.");
  };

  const handleSave = () => {
    const summary = `[DIAGRAMA TÁTICO: ${elements.length} elementos na quadra (${courtType === "tennis" ? "Tênis" : "Beach Tennis"})] - ${tacticalNotes}`;
    if (onSaveToLessonPlan) {
      onSaveToLessonPlan(summary);
    }
    toast.success("Diagrama tático anexado ao plano de aula!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-primary">
              <Compass className="h-6 w-6 text-primary" />
              Quadro Tático 2D do Treinador | {classNameInfo}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Desenhe posicionamentos, trajetórias e alvos táticos para aplicar em quadra.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={courtType === "tennis" ? "default" : "outline"}
              onClick={() => setCourtType("tennis")}
              className="text-xs h-7"
            >
              Tênis de Campo
            </Button>
            <Button
              size="sm"
              variant={courtType === "beach" ? "default" : "outline"}
              onClick={() => setCourtType("beach")}
              className="text-xs h-7"
            >
              Beach Tennis
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
          {/* Coluna da Quadra Visual Interativa */}
          <div className="md:col-span-2 flex flex-col items-center">
            {/* Barra de Ferramentas da Lousa */}
            <div className="flex items-center justify-between w-full max-w-[420px] mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant={selectedTool === "student" ? "default" : "outline"}
                  onClick={() => setSelectedTool(selectedTool === "student" ? null : "student")}
                  className="h-7 text-xs gap-1"
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> + Aluno
                </Button>
                <Button
                  size="sm"
                  variant={selectedTool === "cone" ? "default" : "outline"}
                  onClick={() => setSelectedTool(selectedTool === "cone" ? null : "cone")}
                  className="h-7 text-xs gap-1"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> + Alvo/Cone
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Limpar
              </Button>
            </div>

            {/* SVG da Quadra de Tênis / Beach Tennis */}
            <div className="relative w-full max-w-[420px] aspect-[1/1.7] rounded-2xl shadow-xl overflow-hidden border-2 border-slate-700 select-none">
              <svg
                viewBox="0 0 100 170"
                onClick={handleCourtClick}
                className={`w-full h-full cursor-crosshair transition-colors duration-500 ${
                  courtType === "tennis"
                    ? "bg-gradient-to-b from-[#1e3a8a] via-[#172554] to-[#1e3a8a]"
                    : "bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e]"
                }`}
              >
                {/* Linhas externas da quadra */}
                <rect
                  x="10"
                  y="10"
                  width="80"
                  height="150"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeOpacity="0.9"
                />

                {/* Corredores laterais (se for tênis) */}
                {courtType === "tennis" && (
                  <>
                    <line x1="18" y1="10" x2="18" y2="160" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.7" />
                    <line x1="82" y1="10" x2="82" y2="160" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.7" />
                  </>
                )}

                {/* Rede Central */}
                <line
                  x1="6"
                  y1="85"
                  x2="94"
                  y2="85"
                  stroke="#f8fafc"
                  strokeWidth="2.5"
                  strokeDasharray="2,1"
                  strokeOpacity="0.95"
                />
                {/* Postes da rede */}
                <circle cx="6" cy="85" r="1.8" fill="#e2e8f0" />
                <circle cx="94" cy="85" r="1.8" fill="#e2e8f0" />

                {/* Linhas de Saque */}
                <line x1="18" y1="45" x2="82" y2="45" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />
                <line x1="18" y1="125" x2="82" y2="125" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />

                {/* Linha Central de Saque */}
                <line x1="50" y1="45" x2="50" y2="125" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />

                {/* Traço de Centro no Fundo */}
                <line x1="50" y1="10" x2="50" y2="15" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.9" />
                <line x1="50" y1="155" x2="50" y2="160" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.9" />

                {/* Elementos Renderizados */}
                {elements.map((el) => {
                  const cx = el.x;
                  const cy = (el.y / 100) * 170;

                  if (el.type === "coach") {
                    return (
                      <g key={el.id} className="cursor-move">
                        <circle cx={cx} cy={cy} r="4.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
                        <text
                          x={cx}
                          y={cy + 1.5}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="3.8"
                          fontWeight="bold"
                        >
                          C
                        </text>
                        {el.label && (
                          <text
                            x={cx}
                            y={cy - 6}
                            textAnchor="middle"
                            fill="#fef08a"
                            fontSize="3"
                            fontWeight="bold"
                          >
                            {el.label}
                          </text>
                        )}
                      </g>
                    );
                  }

                  if (el.type === "student") {
                    return (
                      <g key={el.id} className="cursor-move">
                        <circle cx={cx} cy={cy} r="4.5" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1" />
                        <text
                          x={cx}
                          y={cy + 1.5}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="3.5"
                          fontWeight="bold"
                        >
                          {el.label?.slice(0, 2) || "A"}
                        </text>
                        {el.label && (
                          <text
                            x={cx}
                            y={cy + 7.5}
                            textAnchor="middle"
                            fill="#bfdbfe"
                            fontSize="2.8"
                            fontWeight="bold"
                          >
                            {el.label}
                          </text>
                        )}
                      </g>
                    );
                  }

                  if (el.type === "cone") {
                    return (
                      <g key={el.id}>
                        <polygon
                          points={`${cx},${cy - 3.5} ${cx - 3.5},${cy + 3} ${cx + 3.5},${cy + 3}`}
                          fill="#ef4444"
                          stroke="#7f1d1d"
                          strokeWidth="0.8"
                        />
                        {el.label && (
                          <text
                            x={cx}
                            y={cy + 6.5}
                            textAnchor="middle"
                            fill="#fecaca"
                            fontSize="2.8"
                            fontWeight="bold"
                          >
                            {el.label}
                          </text>
                        )}
                      </g>
                    );
                  }

                  if (el.type === "ball_basket") {
                    return (
                      <g key={el.id}>
                        <rect x={cx - 3} y={cy - 3} width="6" height="6" rx="1.5" fill="#10b981" stroke="#064e3b" strokeWidth="0.8" />
                        <circle cx={cx - 1} cy={cy - 1} r="0.8" fill="#fef08a" />
                        <circle cx={cx + 1} cy={cy + 1} r="0.8" fill="#fef08a" />
                      </g>
                    );
                  }

                  if (el.type === "arrow" && el.targetX !== undefined && el.targetY !== undefined) {
                    const tx = el.targetX;
                    const ty = (el.targetY / 100) * 170;
                    return (
                      <g key={el.id}>
                        <defs>
                          <marker
                            id={`arrowhead-${el.id}`}
                            markerWidth="6"
                            markerHeight="6"
                            refX="4"
                            refY="3"
                            orient="auto"
                          >
                            <polygon points="0 0, 6 3, 0 6" fill="#fbbf24" />
                          </marker>
                        </defs>
                        <line
                          x1={cx}
                          y1={cy}
                          x2={tx}
                          y2={ty}
                          stroke="#fbbf24"
                          strokeWidth="1.2"
                          strokeDasharray="2,2"
                          markerEnd={`url(#arrowhead-${el.id})`}
                        />
                      </g>
                    );
                  }

                  return null;
                })}
              </svg>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Clique na quadra para posicionar novos alunos ou cones.
            </p>
          </div>

          {/* Coluna Lateral de Presets e Metodologia */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Exercícios Prontos (Presets)
              </Label>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("cruzada")}
                  className="justify-start text-xs h-9 gap-2 hover:border-amber-400"
                >
                  <Target className="h-4 w-4 text-amber-500" />
                  Cruzada & Profundidade
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("ataque_rede")}
                  className="justify-start text-xs h-9 gap-2 hover:border-blue-400"
                >
                  <Zap className="h-4 w-4 text-blue-500" />
                  Transição & Voleio na Rede
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("saque_devolucao")}
                  className="justify-start text-xs h-9 gap-2 hover:border-emerald-400"
                >
                  <ArrowRight className="h-4 w-4 text-emerald-500" />
                  Saque & Posicionamento
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Instruções Pedagógicas do Treino
              </Label>
              <Textarea
                rows={5}
                value={tacticalNotes}
                onChange={(e) => setTacticalNotes(e.target.value)}
                placeholder="Ex: Ponto de contato na frente, deslocamento cruzado e recuperação na linha de base..."
                className="text-xs resize-none"
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-xl border text-[11px] space-y-1.5 text-muted-foreground">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Dica da Metodologia Marco Roza
              </p>
              <p>
                Quadras bem setorizadas por alvos aumentam em até 40% a retenção e o foco dos alunos durante o aquecimento e as repetições técnicas.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-primary font-bold">
            <Save className="h-4 w-4" />
            Anexar Tática ao Plano de Aula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
