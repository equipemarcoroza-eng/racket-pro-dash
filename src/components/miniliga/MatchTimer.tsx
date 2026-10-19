import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchTimerProps {
  initialSeconds?: number;
  onTimeEnd?: () => void;
  isActive: boolean;
}

export const MatchTimer: React.FC<MatchTimerProps> = ({
  initialSeconds = 300,
  onTimeEnd,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio beeps using Web Audio API (no external asset dependencies)
  const playBeep = (freq = 880, duration = 0.2, type: OscillatorType = "sine") => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            // Triple whistle/beep sound on end
            playBeep(880, 0.4, "triangle");
            setTimeout(() => playBeep(880, 0.4, "triangle"), 450);
            setTimeout(() => playBeep(1174, 0.6, "triangle"), 900);
            onTimeEnd?.();
            return 0;
          }
          if (prev === 31 || prev === 11 || prev <= 6) {
            playBeep(440, 0.1, "sine"); // alerta sutil de contagem regressiva
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled, onTimeEnd]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isLowTime = secondsLeft <= 30 && secondsLeft > 0;
  const isTimeOver = secondsLeft === 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-card/80 to-card border border-border/80 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Mostrador Digital Gigante */}
        <div
          className={`px-5 py-2.5 rounded-xl font-mono text-3xl sm:text-4xl font-extrabold tracking-wider transition-all duration-300 shadow-inner flex items-center justify-center min-w-[140px] ${
            isTimeOver
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
              : isLowTime
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
              : isRunning
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10"
              : "bg-muted/40 text-muted-foreground border border-border/40"
          }`}
        >
          {formattedTime}
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cronômetro da Rodada
          </span>
          <span className="text-sm font-medium text-foreground">
            {isTimeOver
              ? "Tempo esgotado! Lance o placar"
              : isRunning
              ? "Bola em jogo (5 min)"
              : "Pronto para iniciar"}
          </span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2">
        <Button
          onClick={toggleTimer}
          size="lg"
          className={`gap-2 font-bold px-6 shadow-md transition-transform active:scale-95 ${
            isRunning
              ? "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" /> Pausar
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" /> Iniciar (5 min)
            </>
          )}
        </Button>

        <Button
          onClick={resetTimer}
          variant="outline"
          size="icon"
          title="Resetar tempo"
          className="h-10 w-10 text-muted-foreground hover:text-foreground border-border/80"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => setSoundEnabled(!soundEnabled)}
          variant="ghost"
          size="icon"
          title={soundEnabled ? "Som ativado" : "Som desativado"}
          className="h-10 w-10 text-muted-foreground hover:text-foreground"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
};
