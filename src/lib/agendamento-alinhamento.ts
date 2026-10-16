/**
 * Módulo de Agendamento Inteligente para Reunião de Alinhamento com Anderson Diroza
 * Equipe Marco Roza Beach Tennis • Gêmeo Digital do Anderson
 *
 * Regras estritas:
 * - Apenas horas inteiras/redondas (ex.: 10:00, 11:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00), NUNCA horas quebradas.
 * - Leva em conta horários livres na agenda pessoal oficial do Anderson (andersondiroza@gmail.com).
 * - Turno inverso inteligente (acesso pela manhã -> sugere tarde; acesso à tarde/noite -> sugere manhã do próximo dia útil).
 * - Proteção contra fins de semana, feriados nacionais e datas bloqueadas.
 */

// Feriados fixos nacionais brasileiros (MM-DD)
export const FERIADOS_FIXOS = [
  "01-01", // Confraternização Universal
  "04-21", // Tiradentes
  "05-01", // Dia do Trabalho
  "09-07", // Independência do Brasil
  "10-12", // Nossa Senhora Aparecida
  "11-02", // Finados
  "11-15", // Proclamação da República
  "11-20", // Dia da Consciência Negra
  "12-25", // Natal
];

/**
 * Datas bloqueadas na agenda oficial do Anderson Diroza (viagens, eventos esportivos, etc.)
 */
export const DIAS_BLOQUEADOS_ANDERSON = ["2026-10-22", "10-22"];

// Grade estrita de horas certas/inteiras (sem minutos quebrados)
// Regra oficial da agenda andersondiroza@gmail.com:
// - Manhãs: 10:00 às 12:00 (início às 10:00 e 11:00)
// - Tardes/Noite: 13:00 às 19:00 (início às 13:00, 14:00, 15:00, 16:00, 17:00 e 18:00)
export const HORAS_MANHA_CERTAS = ["10:00", "11:00"];
export const HORAS_TARDE_CERTAS = ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export const WHATSAPP_DESTINO = "5548988455454";
export const LINK_GOOGLE_CALENDAR_OFICIAL = "https://calendar.app.google/6MPgmFRuwR8FAF4KA";
export const LINK_MEET_PADRAO = "https://calendar.app.google/6MPgmFRuwR8FAF4KA";
export const GOOGLE_CALENDAR_EMAIL = "andersondiroza@gmail.com";
export const GOOGLE_CALENDAR_SCHEDULE_URL = "https://calendar.app.google/6MPgmFRuwR8FAF4KA";
export const TELEGRAM_CONCIERGE_LINK = "https://t.me/diroza_concierge_bot?start=marco_roza";

const STORAGE_KEY_BLOQUEIOS = "anderson_agenda_bloqueios_marcoroza";

/**
 * Recupera bloqueios dinâmicos salvos no navegador / sessões para não conflitar com outras reuniões
 */
export function obterBloqueiosAgenda(): { datas: string[]; slots: string[] } {
  if (typeof window === "undefined") {
    return { datas: [...DIAS_BLOQUEADOS_ANDERSON], slots: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BLOQUEIOS);
    if (!raw) return { datas: [...DIAS_BLOQUEADOS_ANDERSON], slots: [] };
    const parsed = JSON.parse(raw);
    const datas = Array.from(new Set([...DIAS_BLOQUEADOS_ANDERSON, ...(parsed.datas || [])]));
    return { datas, slots: parsed.slots || [] };
  } catch {
    return { datas: [...DIAS_BLOQUEADOS_ANDERSON], slots: [] };
  }
}

/**
 * Registra um horário ou data ocupada para evitar colisões entre reuniões
 */
export function registrarBloqueioSlot(dataIso: string, hora: string) {
  if (typeof window === "undefined") return;
  try {
    const { datas, slots } = obterBloqueiosAgenda();
    const slotKey = `${dataIso}@${hora}`;
    if (!slots.includes(slotKey)) {
      slots.push(slotKey);
    }
    localStorage.setItem(STORAGE_KEY_BLOQUEIOS, JSON.stringify({ datas, slots }));
  } catch {
    // Silencia erros de storage
  }
}

/**
 * Verifica se uma data específica é dia útil (Segunda a Sexta) e não é feriado nem bloqueio
 */
export function ehDiaDisponivelParaReuniao(data: Date): boolean {
  const diaSemana = data.getDay();
  // 0 = Domingo, 6 = Sábado
  if (diaSemana === 0 || diaSemana === 6) return false;

  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const dd = String(data.getDate()).padStart(2, "0");
  const mmdd = `${mm}-${dd}`;
  const aaaa = data.getFullYear();
  const dataIso = `${aaaa}-${mm}-${dd}`;

  if (FERIADOS_FIXOS.includes(mmdd)) return false;

  const { datas } = obterBloqueiosAgenda();
  if (datas.includes(dataIso) || datas.includes(mmdd)) return false;

  return true;
}

/**
 * Procura o próximo dia útil disponível a partir de uma data de referência
 */
export function proximoDiaDisponivelParaReuniao(dataRef: Date): Date {
  const d = new Date(dataRef);
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);

  while (!ehDiaDisponivelParaReuniao(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export interface HorarioSugerido {
  data: Date;
  dataIso: string;
  dataFormatada: string;
  diaSemanaExtenso: string;
  hora: string;
  turno: "Manhã" | "Tarde";
  descricaoTurno: string;
  horariosDisponiveisNoDia: string[];
}

export interface OpcoesHorariosAlinhamento {
  maisProxima: HorarioSugerido;
  semanaSeguinte: HorarioSugerido;
}

const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

/**
 * Filtra horários livres no dia, removendo slots passados (se for hoje) e slots já bloqueados
 */
function obterHorariosLivresNoDia(
  data: Date,
  turno: "Manhã" | "Tarde",
  dataReferencia: Date,
): string[] {
  const grade = turno === "Manhã" ? HORAS_MANHA_CERTAS : HORAS_TARDE_CERTAS;
  const { slots } = obterBloqueiosAgenda();

  const dd = String(data.getDate()).padStart(2, "0");
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const aaaa = data.getFullYear();
  const dataIso = `${aaaa}-${mm}-${dd}`;

  const ehHoje =
    data.getFullYear() === dataReferencia.getFullYear() &&
    data.getMonth() === dataReferencia.getMonth() &&
    data.getDate() === dataReferencia.getDate();

  const horaAtual = dataReferencia.getHours();

  return grade.filter((h) => {
    const slotKey = `${dataIso}@${h}`;
    if (slots.includes(slotKey)) return false;

    // Se for hoje, precisa de pelo menos 2 horas de antecedência
    if (ehHoje) {
      const [horaStr] = h.split(":");
      const horaNum = parseInt(horaStr, 10);
      if (horaNum <= horaAtual + 1) return false;
    }
    return true;
  });
}

/**
 * Calcula horário mais próximo respeitando:
 * - Se acessou pela manhã (antes das 12h) em dia útil: sugere tarde do mesmo dia (se houver vaga com folga)
 *   ou manhã do dia seguinte útil.
 * - Se acessou à tarde/noite: sugere manhã do próximo dia útil.
 */
export function calcularProximoHorarioAlinhamento(
  dataReferencia: Date = new Date(),
): HorarioSugerido {
  const horaAtual = dataReferencia.getHours();
  const ehDiaUtil = ehDiaDisponivelParaReuniao(dataReferencia);

  let dataFinal: Date;
  let turnoFinal: "Manhã" | "Tarde";
  let horaFinal: string;
  let descricaoTurno: string;
  let horariosLivres: string[] = [];

  if (ehDiaUtil && horaAtual < 12) {
    // Acessando de manhã em dia útil: tenta a tarde do mesmo dia (Turno Inverso)
    dataFinal = new Date(dataReferencia);
    horariosLivres = obterHorariosLivresNoDia(dataFinal, "Tarde", dataReferencia);

    if (horariosLivres.length > 0) {
      turnoFinal = "Tarde";
      horaFinal = horariosLivres[0];
      descricaoTurno = "Hoje à tarde (Turno Inverso Inteligente)";
    } else {
      // Se a tarde de hoje já estiver cheia ou sem folga, pula para o próximo dia útil de manhã
      dataFinal = proximoDiaDisponivelParaReuniao(dataReferencia);
      horariosLivres = obterHorariosLivresNoDia(dataFinal, "Manhã", dataReferencia);
      horaFinal = horariosLivres[0] || "10:00";
      turnoFinal = "Manhã";
      descricaoTurno = "Próximo dia útil pela manhã (Turno Inverso)";
    }
  } else {
    // Acessando à tarde/noite ou dia não útil: próximo dia disponível pela manhã
    dataFinal = proximoDiaDisponivelParaReuniao(dataReferencia);
    horariosLivres = obterHorariosLivresNoDia(dataFinal, "Manhã", dataReferencia);
    if (horariosLivres.length === 0) {
      horariosLivres = obterHorariosLivresNoDia(dataFinal, "Tarde", dataReferencia);
      turnoFinal = "Tarde";
      horaFinal = horariosLivres[0] || "13:00";
      descricaoTurno = "Próximo dia útil à tarde (Turno Inverso)";
    } else {
      turnoFinal = "Manhã";
      horaFinal = horariosLivres[0] || "10:00";
      descricaoTurno = "Próximo dia útil pela manhã (Turno Inverso)";
    }
  }

  const dd = String(dataFinal.getDate()).padStart(2, "0");
  const mm = String(dataFinal.getMonth() + 1).padStart(2, "0");
  const aaaa = dataFinal.getFullYear();
  const dataIso = `${aaaa}-${mm}-${dd}`;

  return {
    data: dataFinal,
    dataIso,
    dataFormatada: `${dd}/${mm}/${aaaa}`,
    diaSemanaExtenso: DIAS_SEMANA[dataFinal.getDay()],
    hora: horaFinal,
    turno: turnoFinal,
    descricaoTurno,
    horariosDisponiveisNoDia: horariosLivres.length > 0 ? horariosLivres : [horaFinal],
  };
}

/**
 * Retorna duas opções inteligentes em hora inteira:
 * 1. Mais próxima no turno inverso livre
 * 2. Semana seguinte no mesmo turno
 */
export function calcularOpcoesHorariosAlinhamento(
  dataBase: Date = new Date(),
): OpcoesHorariosAlinhamento {
  const maisProxima = calcularProximoHorarioAlinhamento(dataBase);

  // Segunda opção: 7 dias à frente da primeira
  let dataSemanaSeguinte = new Date(maisProxima.data);
  dataSemanaSeguinte.setDate(dataSemanaSeguinte.getDate() + 7);

  while (!ehDiaDisponivelParaReuniao(dataSemanaSeguinte)) {
    dataSemanaSeguinte.setDate(dataSemanaSeguinte.getDate() + 1);
  }

  let horariosSemanaSeguinte = obterHorariosLivresNoDia(
    dataSemanaSeguinte,
    maisProxima.turno,
    dataBase,
  );

  let horaSemanaSeguinte: string;
  let turnoSemanaSeguinte: "Manhã" | "Tarde" = maisProxima.turno;

  if (horariosSemanaSeguinte.length > 0) {
    horaSemanaSeguinte = horariosSemanaSeguinte[0];
  } else {
    const outroTurno = maisProxima.turno === "Manhã" ? "Tarde" : "Manhã";
    const outrosHorarios = obterHorariosLivresNoDia(dataSemanaSeguinte, outroTurno, dataBase);
    if (outrosHorarios.length > 0) {
      horaSemanaSeguinte = outrosHorarios[0];
      turnoSemanaSeguinte = outroTurno;
      horariosSemanaSeguinte = outrosHorarios;
    } else {
      horaSemanaSeguinte = maisProxima.turno === "Manhã" ? "10:00" : "13:00";
      horariosSemanaSeguinte = [horaSemanaSeguinte];
    }
  }

  const dd = String(dataSemanaSeguinte.getDate()).padStart(2, "0");
  const mm = String(dataSemanaSeguinte.getMonth() + 1).padStart(2, "0");
  const aaaa = dataSemanaSeguinte.getFullYear();
  const dataIso = `${aaaa}-${mm}-${dd}`;

  const semanaSeguinte: HorarioSugerido = {
    data: dataSemanaSeguinte,
    dataIso,
    dataFormatada: `${dd}/${mm}/${aaaa}`,
    diaSemanaExtenso: DIAS_SEMANA[dataSemanaSeguinte.getDay()],
    hora: horaSemanaSeguinte,
    turno: turnoSemanaSeguinte,
    descricaoTurno: `Semana seguinte (${turnoSemanaSeguinte})`,
    horariosDisponiveisNoDia:
      horariosSemanaSeguinte.length > 0 ? horariosSemanaSeguinte : [horaSemanaSeguinte],
  };

  return {
    maisProxima,
    semanaSeguinte,
  };
}

export interface DadosReuniaoAlinhamento {
  nomeContato: string;
  escritorioOuBanca?: string;
  telefoneWhatsapp: string;
  dataIso: string;
  dataFormatada: string;
  diaSemanaExtenso: string;
  hora: string;
  linkMeet?: string;
}

/**
 * Gera link direto para inclusão do evento na conta Google Calendar andersondiroza@gmail.com
 * Sempre reservando bloco de 1 hora inteira
 */
export function gerarLinkGoogleCalendar(dados: DadosReuniaoAlinhamento): string {
  const linkMeet = dados.linkMeet || LINK_MEET_PADRAO;
  const [hora, minuto] = dados.hora.split(":");
  const hInicio = parseInt(hora || "10", 10);
  const mInicio = parseInt(minuto || "00", 10);

  // Reserva 1 hora inteira (ex: 10:00 -> 11:00)
  const hFim = hInicio + 1;
  const mFim = mInicio;

  const yyyymmdd = dados.dataIso.replace(/-/g, "");
  const startStr = `${yyyymmdd}T${String(hInicio).padStart(2, "0")}${String(mInicio).padStart(2, "0")}00`;
  const endStr = `${yyyymmdd}T${String(hFim).padStart(2, "0")}${String(mFim).padStart(2, "0")}00`;

  const titulo = `Reunião de Alinhamento Equipe Marco Roza | Anderson Diroza`;
  const detalhes = [
    `Reunião de Alinhamento e Demonstração do ecossistema Equipe Marco Roza Beach Tennis com Anderson Diroza (${GOOGLE_CALENDAR_EMAIL}).`,
    ``,
    `👤 Contato: ${dados.nomeContato}`,
    dados.escritorioOuBanca ? `🎾 Arena / Unidade: ${dados.escritorioOuBanca}` : "",
    `📱 WhatsApp: ${dados.telefoneWhatsapp}`,
    `📧 Google Calendar: ${GOOGLE_CALENDAR_EMAIL}`,
    `🔗 Sala Google Meet: ${linkMeet}`,
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo,
    dates: `${startStr}/${endStr}`,
    details: detalhes,
    location: linkMeet,
    add: GOOGLE_CALENDAR_EMAIL,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Gera mensagem e link WhatsApp direto para notificar Anderson Diroza
 */
export function gerarLinkWhatsappAnderson(dados: DadosReuniaoAlinhamento): string {
  const linkMeet = dados.linkMeet || LINK_MEET_PADRAO;
  const texto = [
    `*Solicitação de Reunião de Alinhamento | Equipe Marco Roza* 🎾✨`,
    ``,
    `Olá, Anderson! Acabei de navegar pela plataforma da *Equipe Marco Roza Beach Tennis* e gostaria de agendar nossa Reunião de Alinhamento.`,
    ``,
    `👤 *Contato:* ${dados.nomeContato}`,
    dados.escritorioOuBanca ? `🎾 *Arena / Unidade:* ${dados.escritorioOuBanca}` : "",
    `📱 *WhatsApp do Contato:* ${dados.telefoneWhatsapp}`,
    `📅 *Data:* ${dados.diaSemanaExtenso}, ${dados.dataFormatada}`,
    `⏰ *Horário:* ${dados.hora} (Hora Inteira Reservada)`,
    `📧 *Google Calendar:* ${GOOGLE_CALENDAR_EMAIL}`,
    `📅 *Agenda Oficial:* ${GOOGLE_CALENDAR_SCHEDULE_URL}`,
    `🔗 *Google Meet:* ${linkMeet}`,
    ``,
    `Aguardo sua confirmação. Obrigado!`,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WHATSAPP_DESTINO}?text=${encodeURIComponent(texto)}`;
}

/**
 * Gera link de confirmação para o WhatsApp do próprio contato
 */
export function gerarLinkWhatsappContato(dados: DadosReuniaoAlinhamento): string {
  const linkMeet = dados.linkMeet || LINK_MEET_PADRAO;
  const digitos = (dados.telefoneWhatsapp || "").replace(/\D/g, "");
  const completo = digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : digitos;

  const texto = [
    `*Confirmação de Reunião de Alinhamento | Equipe Marco Roza & Anderson Diroza* 🎾✨`,
    ``,
    `Olá, *${dados.nomeContato}*!`,
    ``,
    `Sua Reunião de Alinhamento sobre a plataforma de gestão e inteligência esportiva da *Equipe Marco Roza Beach Tennis* com o *Anderson Diroza* foi pré-agendada com sucesso!`,
    ``,
    `📅 *Data:* ${dados.diaSemanaExtenso}, ${dados.dataFormatada}`,
    `⏰ *Horário:* ${dados.hora} (Hora Inteira)`,
    `👨‍💻 *Apresentação:* Anderson Diroza (${GOOGLE_CALENDAR_EMAIL})`,
    `📅 *Página Oficial do Google Calendar:* ${GOOGLE_CALENDAR_SCHEDULE_URL}`,
    `🔗 *Sala Google Meet:* ${linkMeet}`,
    ``,
    `💡 *Dica:* O horário foi reservado na agenda oficial do Google Calendar. Salve este link para participar no horário marcado!`,
  ]
    .filter(Boolean)
    .join("\n");

  return completo
    ? `https://wa.me/${completo}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`;
}


export function gerarLinkWhatsappEncaixe(): string {
  const texto = "Olá, Anderson! Gostaria de verificar a possibilidade de um encaixe para nossa Reunião de Alinhamento / Suporte Concierge da Equipe Marco Roza Beach Tennis.";
  return `https://wa.me/${WHATSAPP_DESTINO}?text=${encodeURIComponent(texto)}`;
}
