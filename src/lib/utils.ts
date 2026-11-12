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

/** Máscara de telefone: (00) 00000-0000 no celular, (00) 0000-0000 no fixo */
export const maskPhone = (value: string) => {
  if (!value) return "";
  const numeric = value.replace(/\D/g, "");
  if (numeric.length <= 10) {
    return numeric
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  } else {
    return numeric
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }
};
