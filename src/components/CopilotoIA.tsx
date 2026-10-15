import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  PhoneCall,
  ExternalLink,
  Calendar,
  Clock,
  User,
  Building,
  Check,
  Flame,
  MessageCircle,
  Tv,
  LineChart,
  PieChart,
  Users,
  RotateCcw,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import andersonPhoto from "@/assets/anderson-profile-02.png";
import {
  buscarRespostaCopiloto,
  TELEGRAM_CONCIERGE_URL,
  WHATSAPP_ANDERSON_URL,
  type RespostaCopiloto,
} from "@/lib/copiloto-knowledge";
import {
  calcularOpcoesHorariosAlinhamento,
  gerarLinkGoogleCalendar,
  gerarLinkWhatsappAnderson,
  gerarLinkWhatsappContato,
  registrarBloqueioSlot,
  GOOGLE_CALENDAR_EMAIL,
  GOOGLE_CALENDAR_SCHEDULE_URL,
  LINK_MEET_PADRAO,
  type HorarioSugerido,
  type OpcoesHorariosAlinhamento,
  type DadosReuniaoAlinhamento,
} from "@/lib/agendamento-alinhamento";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  rotaSugerida?: string;
  labelRota?: string;
  linkExterno?: {
    label: string;
    url: string;
  };
  cardAgendamento?: {
    nomeContato: string;
    escritorioOuBanca?: string;
    telefoneWhatsapp: string;
    dataFormatada: string;
    hora: string;
    linkMeet: string;
    urlGoogleCalendar: string;
    urlWhatsappAnderson: string;
    urlWhatsappContato: string;
  };
}

const SUGESTOES_RAPIDAS = [
  { label: "💬 Concierge Telegram 24/7", query: "Como funciona o Suporte Concierge do Telegram?" },
  { label: "📺 Modo TV / Arena Live", query: "Como funciona o Modo TV e a sirene de troca de turmas?" },
  { label: "📊 BI Financeiro & Vidro", query: "O que mostram os termômetros de vidro do BI Financeiro?" },
  { label: "🔥 Card do Atleta & Streak", query: "Como funciona o Card do Atleta, streak de presenças e o status ON FIRE?" },
  { label: "🏓 Prancheta Tática & Drills", query: "Como utilizar a Prancheta Tática e planejar treinos?" },
  { label: "🎯 Radar de Churn", query: "Como o Radar de Churn previne a desistência de alunos?" },
  { label: "🔄 Smart Matchmaker Reposição", query: "Como funciona o casamento inteligente de reposições de aulas?" },
  { label: "📅 Agendar com Anderson", query: "Quero agendar uma Reunião de Alinhamento com o Anderson Diroza" },
  { label: "🔒 Modo Discreto na Arena", query: "Para que serve o Modo Discreto na recepção da arena?" },
  { label: "💡 Simulador What-If", query: "Como simular reajustes e novas quadras no simulador financeiro?" },
];

export function CopilotoIA() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estado para fluxo de agendamento de alinhamento
  const [modoAgendamento, setModoAgendamento] = useState(false);
  const [opcoesHorarios, setOpcoesHorarios] = useState<OpcoesHorariosAlinhamento | null>(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<"maisProxima" | "semanaSeguinte">(
    "maisProxima",
  );
  const [horarioEscolhidoCustom, setHorarioEscolhidoCustom] = useState<string | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formArena, setFormArena] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");

  const initialWelcomeText =
    "Olá! Sou o **Copiloto IA**, o **Gêmeo Digital do Anderson Diroza**, treinado com toda a inteligência e tecnologia do ecossistema **Equipe Marco Roza Beach Tennis**.\n\n" +
    "Posso guiar você na gestão de **Quadras e Turmas**, configuração do **Modo TV / Arena Live**, análise dos **Termômetros de Vidro do BI Financeiro**, retenção pelo **Radar de Churn**, estratégias na **Prancheta Tática** ou agendar um alinhamento direto comigo.\n\n" +
    "Como posso impulsionar sua arena de beach tennis hoje?";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: initialWelcomeText,
      timestamp: "Agora",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping, modoAgendamento]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-copiloto-ia", handleOpen);
    return () => window.removeEventListener("open-copiloto-ia", handleOpen);
  }, []);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: "Agora",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const resp: RespostaCopiloto = buscarRespostaCopiloto(text);

      if (resp.acaoEspecial === "abrir_agendamento") {
        const opcoes = calcularOpcoesHorariosAlinhamento();
        setOpcoesHorarios(opcoes);
        setHorarioEscolhidoCustom(opcoes.maisProxima.hora);
        setModoAgendamento(true);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: resp.texto,
        timestamp: "Agora",
        rotaSugerida: resp.rotaSugerida,
        labelRota: resp.labelRota,
        linkExterno: resp.linkExterno,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNavegar = async (rota: string, labelRota?: string) => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.info("Acesso ao Módulo", {
          description: `Faça login no painel para acessar ${labelRota || "este módulo"}.`,
        });
        const emailInput = document.getElementById("email") as HTMLInputElement | null;
        if (emailInput) {
          emailInput.focus();
        }
        setIsOpen(false);
        navigate(rota);
        return;
      }
      setIsOpen(false);
      navigate(rota);
    } catch {
      setIsOpen(false);
      navigate(rota);
    }
  };

  const handleConfirmarAgendamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formWhatsapp.trim() || !opcoesHorarios) return;

    const horarioBase: HorarioSugerido =
      opcaoSelecionada === "maisProxima"
        ? opcoesHorarios.maisProxima
        : opcoesHorarios.semanaSeguinte;

    const horaFinal = horarioEscolhidoCustom || horarioBase.hora;

    const dadosReuniao: DadosReuniaoAlinhamento = {
      nomeContato: formNome.trim(),
      escritorioOuBanca: formArena.trim() || "Equipe Marco Roza Beach Tennis",
      telefoneWhatsapp: formWhatsapp.trim(),
      dataIso: horarioBase.dataIso,
      dataFormatada: horarioBase.dataFormatada,
      diaSemanaExtenso: horarioBase.diaSemanaExtenso,
      hora: horaFinal,
      linkMeet: LINK_MEET_PADRAO,
    };

    const urlCalendar = gerarLinkGoogleCalendar(dadosReuniao);
    const urlWaAnderson = gerarLinkWhatsappAnderson(dadosReuniao);
    const urlWaContato = gerarLinkWhatsappContato(dadosReuniao);

    // Bloqueia o slot para evitar colisões
    registrarBloqueioSlot(dadosReuniao.dataIso, dadosReuniao.hora);

    // Dispara WhatsApp para notificar Anderson Diroza
    if (typeof window !== "undefined") {
      try {
        window.open(urlWaAnderson, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.warn("Abertura da janela bloqueada:", err);
      }
    }
    toast.success("Reunião agendada com sucesso! Abrindo confirmação no WhatsApp...");

    const msgConfirmacao: ChatMessage = {
      id: Date.now().toString(),
      sender: "bot",
      text:
        `🎉 **Reunião de Alinhamento Pré-Agendada com Sucesso!**\n\n` +
        `• **Data:** ${dadosReuniao.diaSemanaExtenso}, ${dadosReuniao.dataFormatada}\n` +
        `• **Horário:** ${dadosReuniao.hora} (Hora Inteira Reservada)\n` +
        `• **Apresentador:** Anderson Diroza (${GOOGLE_CALENDAR_EMAIL})\n` +
        `• **Google Meet:** Sala privativa gerada\n\n` +
        `O WhatsApp de confirmação foi acionado automaticamente. Você também pode salvar o compromisso no seu Google Calendar ou reenviar abaixo:`,
      timestamp: "Agora",
      cardAgendamento: {
        nomeContato: dadosReuniao.nomeContato,
        escritorioOuBanca: dadosReuniao.escritorioOuBanca,
        telefoneWhatsapp: dadosReuniao.telefoneWhatsapp,
        dataFormatada: dadosReuniao.dataFormatada,
        hora: dadosReuniao.hora,
        linkMeet: dadosReuniao.linkMeet || LINK_MEET_PADRAO,
        urlGoogleCalendar: urlCalendar,
        urlWhatsappAnderson: urlWaAnderson,
        urlWhatsappContato: urlWaContato,
      },
    };

    setMessages((prev) => [...prev, msgConfirmacao]);
    setModoAgendamento(false);
    setFormNome("");
    setFormArena("");
    setFormWhatsapp("");
  };

  return (
    <>
      {/* Botão Flutuante Gatilho no Canto Inferior Direito */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 p-2 pr-4 rounded-full bg-[#13142e]/95 border border-[#2d2b82]/70 text-white shadow-2xl shadow-indigo-950/70 backdrop-blur-xl hover:border-[#ea3829] hover:shadow-[0_0_28px_rgba(234,56,41,0.35)] transition-all duration-300 hover:scale-[1.03] cursor-pointer"
            aria-label="Abrir Copiloto IA - Gêmeo Digital do Anderson"
          >
            {/* Foto / Avatar com Anel Gradiente Marco Roza (Azul + Vermelho/Coral) */}
            <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#2d2b82] via-[#ea3829] to-[#38bdf8] shadow-md shrink-0">
              <img
                src={andersonPhoto}
                alt="Anderson Diroza AI"
                className="w-full h-full object-cover rounded-full"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#13142e] animate-pulse" />
            </div>

            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-white tracking-tight">
                  Copiloto IA
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#ea3829]/20 text-[#ff8f84] border border-[#ea3829]/40">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-zinc-300 font-medium">Gêmeo Digital do Anderson</p>
            </div>
          </button>
        )}
      </div>

      {/* Janela Executiva do Chat Flutuante */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[440px] max-h-[88vh] h-[670px] z-50 rounded-3xl border border-[#2d2b82]/80 bg-[#0c0d1c] shadow-2xl shadow-indigo-950/90 backdrop-blur-2xl flex flex-col overflow-hidden text-white transition-all duration-300 print:hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header do Chat em Paleta Marco Roza */}
          <div className="p-4 border-b border-[#242650] bg-gradient-to-r from-[#17193b] via-[#1f2150] to-[#17193b] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#2d2b82] via-[#ea3829] to-[#38bdf8] shrink-0">
                <img
                  src={andersonPhoto}
                  alt="Anderson Diroza"
                  className="w-full h-full object-cover rounded-full"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#17193b] absolute bottom-0 right-0 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white tracking-tight">Copiloto IA</h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#ea3829]/25 text-[#ffb0a8] border border-[#ea3829]/40 font-bold">
                    IA OFICIAL
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 font-medium">Gêmeo Digital do Anderson</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={TELEGRAM_CONCIERGE_URL}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#242650]/70 transition-all cursor-pointer"
                title="Transferir para Suporte Concierge Telegram 24/7"
              >
                <MessageCircle className="w-4 h-4 text-[#ea3829]" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setMessages([
                    {
                      id: "welcome",
                      sender: "bot",
                      text: initialWelcomeText,
                      timestamp: "Agora",
                    },
                  ]);
                  setModoAgendamento(false);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#242650]/70 transition-all cursor-pointer"
                title="Reiniciar Conversa"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#242650]/70 transition-all cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de Suporte Concierge Telegram 24/7 */}
          <div className="px-4 py-2 border-b border-[#242650] bg-[#12132b] flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-7 w-7 rounded-full bg-[#ea3829]/15 border border-[#ea3829]/40 flex items-center justify-center shrink-0">
                <MessageCircle className="w-3.5 h-3.5 text-[#ff8f84]" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-white leading-tight">
                  Suporte Concierge Telegram 24/7
                </p>
                <p className="text-[9px] text-zinc-400 truncate">
                  Envie prints da quadra, áudios ou fale com Anderson Diroza
                </p>
              </div>
            </div>
            <a
              href={TELEGRAM_CONCIERGE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-[#ea3829] hover:bg-[#d42d20] text-white rounded-lg transition-all shadow-sm shrink-0"
            >
              Transferir <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>

          {/* Área de Mensagens com Scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed bg-[#0e0f24]/90">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[90%] ${
                    m.sender === "user"
                      ? "bg-gradient-to-r from-[#2d2b82] to-[#201e63] text-white rounded-br-none shadow-md shadow-indigo-950/40 border border-[#3f4185]"
                      : "bg-[#141633] text-zinc-200 border border-[#272952] rounded-bl-none shadow-sm"
                  }`}
                >
                  {/* Texto com formatação de negrito e parágrafos */}
                  <div className="whitespace-pre-line space-y-1.5">
                    {m.text.split("\n\n").map((paragraph, pIdx) => (
                      <p key={pIdx}>
                        {paragraph.split("**").map((chunk, cIdx) =>
                          cIdx % 2 === 1 ? (
                            <strong key={cIdx} className="font-bold text-white">
                              {chunk}
                            </strong>
                          ) : (
                            chunk
                          ),
                        )}
                      </p>
                    ))}
                  </div>

                  {/* Botão de Navegação Interna com 1 clique */}
                  {m.rotaSugerida && m.labelRota && (
                    <div className="mt-3 pt-2 border-t border-[#272952]">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleNavegar(m.rotaSugerida!, m.labelRota)}
                        className="w-full bg-gradient-to-r from-[#2d2b82] to-[#ea3829] hover:from-[#373599] hover:to-[#f0493b] text-white font-bold text-xs py-2 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        {m.labelRota}
                        <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                      </Button>
                    </div>
                  )}

                  {/* Link Externo (Telegram Concierge / WhatsApp) */}
                  {m.linkExterno && (
                    <div className="mt-2.5 pt-2 border-t border-[#272952]">
                      <a
                        href={m.linkExterno.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-bold rounded-xl bg-[#1b1d42] hover:bg-[#232657] text-[#ffb0a8] border border-[#ea3829]/40 transition-all text-center"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#ea3829]" />
                        {m.linkExterno.label}
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    </div>
                  )}

                  {/* Card de Agendamento Confirmado */}
                  {m.cardAgendamento && (
                    <div className="mt-3 pt-3 border-t border-[#272952] space-y-2">
                      <div className="p-3 rounded-xl bg-[#0c0d1c] border border-[#272952] text-[11px] space-y-1.5">
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="font-semibold text-white">Google Calendar:</span>
                          <span className="text-[#a5b4fc]">{GOOGLE_CALENDAR_EMAIL}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="font-semibold text-white">Google Meet:</span>
                          <a
                            href={m.cardAgendamento.linkMeet}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#ea3829] hover:underline flex items-center gap-1"
                          >
                            Abrir Sala <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={m.cardAgendamento.urlGoogleCalendar}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1 py-2 px-2.5 bg-[#1b1d42] hover:bg-[#232657] text-white border border-[#2d2b82]/70 rounded-xl text-[10px] font-bold text-center transition-all"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#a5b4fc]" />
                          Salvar no Calendar
                        </a>
                        <a
                          href={m.cardAgendamento.urlWhatsappAnderson}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1 py-2 px-2.5 bg-gradient-to-r from-[#ea3829] to-[#c7261a] hover:from-[#f0493b] text-white rounded-xl text-[10px] font-bold text-center transition-all shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
                          Confirmar no WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 px-1 font-mono">{m.timestamp}</span>
              </div>
            ))}

            {/* FORMULÁRIO DE AGENDAMENTO INTELIGENTE */}
            {modoAgendamento && opcoesHorarios && (
              <div className="p-4 rounded-2xl bg-[#141635] border border-[#ea3829]/60 shadow-xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#ea3829]" />
                    <h4 className="font-bold text-xs text-white">
                      Agendamento com Anderson Diroza
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModoAgendamento(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0c0d1c] border border-[#272952] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="leading-tight">
                        <span className="text-white font-semibold">Agenda Google Calendar Oficial ({GOOGLE_CALENDAR_EMAIL})</span>
                        <div className="text-zinc-400 text-[9.5px]">
                          Manhãs: 10h às 12h (início 10h e 11h) · Tardes: 13h às 19h (início 13h às 18h)
                        </div>
                      </div>
                    </div>
                  </div>
                  <a
                    href={GOOGLE_CALENDAR_SCHEDULE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-1 px-2 rounded-lg bg-[#181a3d] hover:bg-[#232657] text-[#a5b4fc] text-[10px] font-medium border border-[#2d2b82]/40 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Abrir Página Oficial de Agendamento Google
                  </a>
                </div>

                {/* Seletor de Opções Inteligentes */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Opção 1: Mais Próxima */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpcaoSelecionada("maisProxima");
                      setHorarioEscolhidoCustom(opcoesHorarios.maisProxima.hora);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      opcaoSelecionada === "maisProxima"
                        ? "bg-[#1f2150] border-[#ea3829] shadow-sm shadow-red-950/40"
                        : "bg-[#0f1026] border-[#272952] opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#ff8f84] font-bold">
                      <span>Mais Próxima</span>
                      {opcaoSelecionada === "maisProxima" && <Check className="w-3 h-3 text-[#ea3829]" />}
                    </div>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {opcoesHorarios.maisProxima.diaSemanaExtenso.split("-")[0]},{" "}
                      {opcoesHorarios.maisProxima.dataFormatada.slice(0, 5)}
                    </p>
                    <p className="text-[10px] text-zinc-300 font-mono mt-0.5">
                      {opcoesHorarios.maisProxima.hora} ({opcoesHorarios.maisProxima.turno})
                    </p>
                  </button>

                  {/* Opção 2: Semana Seguinte */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpcaoSelecionada("semanaSeguinte");
                      setHorarioEscolhidoCustom(opcoesHorarios.semanaSeguinte.hora);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      opcaoSelecionada === "semanaSeguinte"
                        ? "bg-[#1f2150] border-[#ea3829] shadow-sm shadow-red-950/40"
                        : "bg-[#0f1026] border-[#272952] opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#ff8f84] font-bold">
                      <span>Semana Seguinte</span>
                      {opcaoSelecionada === "semanaSeguinte" && (
                        <Check className="w-3 h-3 text-[#ea3829]" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {opcoesHorarios.semanaSeguinte.diaSemanaExtenso.split("-")[0]},{" "}
                      {opcoesHorarios.semanaSeguinte.dataFormatada.slice(0, 5)}
                    </p>
                    <p className="text-[10px] text-zinc-300 font-mono mt-0.5">
                      {opcoesHorarios.semanaSeguinte.hora} ({opcoesHorarios.semanaSeguinte.turno})
                    </p>
                  </button>
                </div>

                {/* Seletor de Hora Inteira Disponível no Dia Selecionado */}
                {(() => {
                  const horarioRef =
                    opcaoSelecionada === "maisProxima"
                      ? opcoesHorarios.maisProxima
                      : opcoesHorarios.semanaSeguinte;
                  const horasDisponiveis = horarioRef.horariosDisponiveisNoDia || [horarioRef.hora];

                  return (
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-300 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#ea3829]" />
                        Horários em Hora Inteira Disponíveis no Dia:
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {horasDisponiveis.map((h) => {
                          const ativa = (horarioEscolhidoCustom || horarioRef.hora) === h;
                          return (
                            <button
                              type="button"
                              key={h}
                              onClick={() => setHorarioEscolhidoCustom(h)}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all text-center border cursor-pointer ${
                                ativa
                                  ? "bg-[#ea3829] text-white border-[#ea3829] shadow-sm"
                                  : "bg-[#0c0d1c] text-zinc-300 border-[#272952] hover:bg-[#181a3d] hover:text-white"
                              }`}
                            >
                              {h}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Formulário de Identificação */}
                <form onSubmit={handleConfirmarAgendamento} className="space-y-2 pt-1">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Seu Nome Completo"
                      value={formNome}
                      onChange={(e) => setFormNome(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#0c0d1c] border border-[#272952] text-white placeholder-zinc-500 focus:outline-none focus:border-[#ea3829]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Arena / Unidade (Opcional)"
                      value={formArena}
                      onChange={(e) => setFormArena(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#0c0d1c] border border-[#272952] text-white placeholder-zinc-500 focus:outline-none focus:border-[#ea3829]"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp (ex: 48 98845-5454)"
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#0c0d1c] border border-[#272952] text-white placeholder-zinc-500 focus:outline-none focus:border-[#ea3829]"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#ea3829] via-[#c7261a] to-[#2d2b82] hover:from-[#f0493b] hover:to-[#3836a0] text-white font-bold text-xs py-2 rounded-xl shadow-lg cursor-pointer"
                  >
                    Confirmar Reserva & Notificar no WhatsApp
                  </Button>
                </form>
              </div>
            )}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[#141633] border border-[#272952] text-zinc-400 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea3829] animate-bounce" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#ea3829] animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#ea3829] animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas em Chips Deslizáveis */}
          <div className="p-2 border-t border-[#242650] bg-[#12132b] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {SUGESTOES_RAPIDAS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(s.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#191b3f] hover:bg-[#25285e] border border-[#2d2b82]/60 text-[10px] text-zinc-200 hover:text-white transition-all cursor-pointer shrink-0"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Input de Mensagem */}
          <div className="p-3 border-t border-[#242650] bg-[#0c0d1c] flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Pergunte ao Copiloto IA da Equipe Marco Roza..."
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-[#141633] border border-[#272952] text-white placeholder-zinc-500 focus:outline-none focus:border-[#ea3829] transition-all"
            />
            <Button
              type="button"
              size="icon"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="h-9 w-9 rounded-xl bg-gradient-to-r from-[#2d2b82] to-[#ea3829] hover:from-[#373599] hover:to-[#f0493b] text-white shrink-0 disabled:opacity-40 cursor-pointer shadow-md"
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
