import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calcula o percentual de acerto de forma segura e realista.
 * Se em uma prova os acertos ultrapassarem a base cadastrada da atividade (ex: 40 bolas lançadas
 * em 4 rodadas para uma atividade cadastrada com base de 10 bolas), o total de lançamentos
 * se ajusta proporcionalmente para múltiplos da base (rodadas) ou para o maior acerto registrado,
 * garantindo aproveitamento percentual matematicamente correto (0 a 100%).
 */
export function calculateSafePercentage(
  acertos: number,
  baseLancamentos: number,
  maxAcertosInActivity?: number
): number {
  if (!baseLancamentos || baseLancamentos <= 0) return 0;

  const highest = Math.max(acertos, maxAcertosInActivity || 0);
  let effectiveLancamentos = baseLancamentos;

  if (highest > baseLancamentos) {
    const rodadas = Math.ceil(highest / baseLancamentos);
    effectiveLancamentos = rodadas * baseLancamentos;
  }

  if (effectiveLancamentos <= 0) return 0;
  const pct = (acertos / effectiveLancamentos) * 100;
  return Math.min(100, Math.max(0, pct));
}

