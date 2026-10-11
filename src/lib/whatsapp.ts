/**
 * Utilitário de formatação e geração de links para WhatsApp
 * Equipe Marco Roza - Racket Pro Dash
 */

export interface WhatsAppMessageOptions {
  phone: string;
  studentName: string;
  type: "birthday" | "payment" | "churn_alert" | "replacement" | "test_result" | "custom";
  customText?: string;
  details?: {
    dueDate?: string;
    amount?: number;
    planName?: string;
    pixKey?: string;
    replacementDate?: string;
    replacementTime?: string;
    court?: string;
    testScore?: number;
    activityName?: string;
  };
}

/**
 * Normaliza o número de telefone para o padrão WhatsApp internacional (DDI 55 Brasil)
 */
export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return "";

  // Se já começar com 55 e tiver 12 ou 13 dígitos
  if (cleaned.startsWith("55") && (cleaned.length === 12 || cleaned.length === 13)) {
    return cleaned;
  }

  // Se for DDD + 8 ou 9 dígitos (10 ou 11 dígitos)
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`;
  }

  return cleaned;
};

/**
 * Gera mensagem formatada e cordial de acordo com o modelo selecionado
 */
export const buildWhatsAppMessage = (options: WhatsAppMessageOptions): string => {
  const { studentName, type, details, customText } = options;
  const firstName = studentName ? studentName.split(" ")[0] : "Atleta";

  switch (type) {
    case "birthday":
      return `🎂 *Parabéns, ${firstName}!* 🎾🎉\n\nToda a equipe da *Equipe Marco Roza* deseja a você um feliz aniversário, repleto de saúde, alegria e muitos pontos vencedores dentro e fora das quadras!\n\nEstamos muito felizes em ter você conosco em nosso time. Que este novo ano seja sensacional! 🚀✨`;

    case "payment": {
      const valorStr = details?.amount
        ? ` R$ ${details.amount.toFixed(2).replace(".", ",")}`
        : "";
      const planoStr = details?.planName ? ` (${details.planName})` : "";
      const vencStr = details?.dueDate ? ` com vencimento em *${details.dueDate}*` : "";
      const pixStr = details?.pixKey
        ? `\n\n🔑 *Chave PIX:* \`${details.pixKey}\``
        : "";

      return `Olá, ${firstName}! Tudo bem? 😊\n\nPassando para enviar o lembrete da mensalidade da *Equipe Marco Roza*${planoStr}${vencStr}.${valorStr ? `\n💰 *Valor:*${valorStr}` : ""}${pixStr}\n\nQualquer dúvida sobre o pagamento ou caso já tenha realizado, é só nos avisar por aqui. Muito obrigado e bons treinos! 🎾`;
    }

    case "churn_alert":
      return `Olá, ${firstName}! Tudo bem? 🎾👋\n\nSentimos muito a sua falta nos treinos da *Equipe Marco Roza* ultimamente!\n\nPassando para saber se está tudo bem com você e te convidar para voltar com tudo às quadras. Se precisar remarcar ou organizar reposição de aulas, conte 100% conosco!\n\nBora marcar seu retorno para essa semana? Abraço! 🚀`;

    case "replacement": {
      const dataStr = details?.replacementDate || "data a confirmar";
      const horaStr = details?.replacementTime ? ` às ${details.replacementTime}` : "";
      const quadraStr = details?.court ? ` na *${details.court}*` : "";

      return `Olá, ${firstName}! Tudo bem? 🎾\n\nSua aula de reposição na *Equipe Marco Roza* foi confirmada!\n\n📅 *Data:* ${dataStr}${horaStr}${quadraStr}\n\nPor favor, chegue com 10 minutinhos de antecedência para aquecer. Nos vemos na quadra! 🔥`;
    }

    case "test_result": {
      const atividadeStr = details?.activityName ? ` no teste de *${details.activityName}*` : " em seus testes recentes";
      const scoreStr = details?.testScore !== undefined ? ` Aproveitamento: *${details.testScore.toFixed(0)}%*` : "";

      return `Fala, ${firstName}! Parabéns pelo seu desempenho técnico na *Equipe Marco Roza*! 🎾🌟\n\nVocê mandou muito bem${atividadeStr}!${scoreStr}\n\nContinue treinando com essa dedicação que sua evolução está cada dia mais visível. Grande abraço do seu treinador! 🏆`;
    }

    case "custom":
    default:
      return (
        customText ||
        `Olá, ${firstName}! Mensagem da *Equipe Marco Roza*. Qualquer dúvida estamos à disposição! 🎾`
      );
  }
};

/**
 * Cria a URL pronta do wa.me
 */
export const createWhatsAppUrl = (options: WhatsAppMessageOptions): string => {
  const phone = cleanPhoneNumber(options.phone);
  const text = buildWhatsAppMessage(options);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};
