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
  Layers,
  ChevronDown,
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
  LINK_GOOGLE_CALENDAR_OFICIAL,
  gerarLinkWhatsappEncaixe,
  GOOGLE_CALENDAR_EMAIL,
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
  isWelcome?: boolean;
}

export interface SugestaoRapida {
  icone: string;
  categoria: "Arena" | "BI & Gestão" | "Atletas" | "Atendimento";
  label: string;
  query: string;
  descricao?: string;
}

const TODAS_SUGESTOES: SugestaoRapida[] = [
  {
    icone: "📺",
    categoria: "Arena",
    label: "Modo TV / Arena Live",
    query: "Como funciona o Modo TV e a sirene de troca de turmas?",
    descricao: "Painel para telões com aviso sonoro e grade ao vivo",
  },
  {
    icone: "📅",
    categoria: "Arena",
    label: "Agenda & Horários aos Sábados",
    query: "Como funciona a Agenda de Quadras e os horários aos sábados?",
    descricao: "Grade semanal de quadras e professores (06h às 22h)",
  },
  {
    icone: "📋",
    categoria: "Arena",
    label: "Controle de Turmas & Lotação",
    query: "Como controlar a lotação das turmas e vagas por quadra?",
    descricao: "Gestão de vagas e limites de alunos por quadra",
  },
  {
    icone: "📊",
    categoria: "BI & Gestão",
    label: "BI Financeiro & Vidro",
    query: "O que mostram os termômetros de vidro do BI Financeiro?",
    descricao: "Faturamento, ticket médio e gráficos Glassmorphism",
  },
  {
    icone: "📈",
    categoria: "BI & Gestão",
    label: "BI Comportamental",
    query: "Como analisar a distribuição de níveis e retenção no BI Comportamental?",
    descricao: "Perfil de alunos por categoria, gênero e assiduidade",
  },
  {
    icone: "💡",
    categoria: "BI & Gestão",
    label: "Simulador What-If Financeiro",
    query: "Como simular reajustes e novas quadras no simulador financeiro?",
    descricao: "Projeções de impacto de reajuste ou novas quadras",
  },
  {
    icone: "🔒",
    categoria: "BI & Gestão",
    label: "Modo Discreto na Arena",
    query: "Para que serve o Modo Discreto na recepção da arena?",
    descricao: "Proteção LGPD que oculta cifras à vista de visitantes",
  },
  {
    icone: "🔥",
    categoria: "Atletas",
    label: "Card do Atleta & Streak",
    query: "Como funciona o Card do Atleta, streak de presenças e o status ON FIRE?",
    descricao: "Gamificação esportiva com XP, assiduidade e conquistas",
  },
  {
    icone: "🎯",
    categoria: "Atletas",
    label: "Radar de Churn Preditivo",
    query: "Como o Radar de Churn previne a desistência de alunos?",
    descricao: "Alerta preditivo de evasão para contato via WhatsApp",
  },
  {
    icone: "🔄",
    categoria: "Atletas",
    label: "Smart Matchmaker Reposição",
    query: "Como funciona o casamento inteligente de reposições de aulas?",
    descricao: "Casamento automático de faltas com vagas ociosas",
  },
  {
    icone: "🏓",
    categoria: "Atletas",
    label: "Prancheta Tática & Drills",
    query: "Como utilizar a Prancheta Tática e planejar treinos?",
    descricao: "Desenho de jogadas de duplas e fundamentos de Beach Tennis",
  },
  {
    icone: "🤝",
    categoria: "Atendimento",
    label: "Agendar com Anderson Diroza",
    query: "Quero agendar uma Reunião de Alinhamento com o Anderson Diroza",
    descricao: "Horários em hora inteira com Google Calendar e WhatsApp",
  },
  {
    icone: "💬",
    categoria: "Atendimento",
    label: "Concierge Telegram 24/7",
    query: "Como funciona o Suporte Concierge do Telegram?",
    descricao: "Canal executivo 24/7 para envio de prints e áudios",
  },
];

export function CopilotoIA() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todas");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estado para fluxo de agendamento de alinhamento
  const [modoAgendamento, setModoAgendamento] = useState(false);

  const initialWelcomeText =
    "Olá! Sou o **Copiloto IA**, o **Gêmeo Digital do Anderson Diroza**, treinado com toda a inteligência e tecnologia do ecossistema **Equipe Marco Roza Beach Tennis**.\n\n" +
    "Posso guiar você na gestão de **Quadras e Turmas**, configuração do **Modo TV / Arena Live**, análise dos **Termômetros de Vidro do BI Financeiro**, retenção pelo **Radar de Churn**, estratégias na **Prancheta Tática** ou agendar um alinhamento direto comigo.\n\n" +
    "Selecione um dos tópicos rápidos abaixo ou digite sua pergunta:";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: initialWelcomeText,
      timestamp: "Agora",
      isWelcome: true,
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

  // Listener para acionamento apenas pelo botão superior
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("toggle-copiloto-ia", handleToggle);
    window.addEventListener("open-copiloto-ia", handleOpen);
    return () => {
      window.removeEventListener("toggle-copiloto-ia", handleToggle);
      window.removeEventListener("open-copiloto-ia", handleOpen);
    };
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


  const sugestoesFiltradas =
    categoriaAtiva === "Todas"
      ? TODAS_SUGESTOES
      : TODAS_SUGESTOES.filter((s) => s.categoria === categoriaAtiva);

  return (
    <>
      {/* Janela Executiva do Chat Flutuante (Acionada apenas pela barra superior) */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[460px] max-h-[90vh] h-[700px] z-50 rounded-3xl border border-[#2d2b82]/80 bg-[#0c0d1c] shadow-2xl shadow-indigo-950/90 backdrop-blur-2xl flex flex-col overflow-hidden text-white transition-all duration-300 print:hidden animate-in fade-in slide-in-from-bottom-5">
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
                      isWelcome: true,
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
                  className={`p-3.5 rounded-2xl max-w-[92%] ${
                    m.sender === "user"
                      ? "bg-gradient-to-r from-[#2d2b82] to-[#201e63] text-white rounded-br-none shadow-md shadow-indigo-950/40 border border-[#3f4185]"
                      : "bg-[#141633] text-zinc-200 border border-[#272952] rounded-bl-none shadow-sm"
                  }`}
                >
                  {/* Texto com formatação de negrito e parágrafos */}
                  <div className="whitespace-pre-wrap font-normal leading-relaxed space-y-1">
                    {m.text.split("\n").map((paragrafo, idx) => {
                      if (!paragrafo.trim()) return <div key={idx} className="h-1.5" />;

                      // Renderiza tópicos em bullet points com destaque
                      if (paragrafo.startsWith("• ") || paragrafo.startsWith("- ")) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5 pl-1 py-0.5">
                            <span className="text-[#ea3829] font-bold leading-none mt-1">▸</span>
                            <span className="flex-1">
                              {renderMarkdownBold(paragrafo.replace(/^[•-]\s*/, ""))}
                            </span>
                          </div>
                        );
                      }

                      return <p key={idx}>{renderMarkdownBold(paragrafo)}</p>;
                    })}
                  </div>

                  {/* No Card de Boas-vindas: Exibe as opções completas em grade para máxima visibilidade */}
                  {m.isWelcome && (
                    <div className="mt-3 pt-3 border-t border-[#272952] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#ea3829]" />
                          Dúvidas Frequentes & Funcionalidades:
                        </span>
                        <span className="text-[10px] text-[#ff8f84] font-mono">
                          {TODAS_SUGESTOES.length} tópicos
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 pt-1">
                        {TODAS_SUGESTOES.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(s.query)}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0c0d1c] hover:bg-[#1a1c45] border border-[#272952] hover:border-[#ea3829] text-left transition-all cursor-pointer group shadow-xs"
                          >
                            <span className="text-base shrink-0">{s.icone}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-white group-hover:text-[#ff8f84] truncate">
                                {s.label}
                              </p>
                              {s.descricao && (
                                <p className="text-[9.5px] text-zinc-400 truncate">
                                  {s.descricao}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#ea3829] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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

            {/* Card de Agendamento Executivo em 1 Clique (Contrato Ativo & Suporte Concierge) */}
            {modoAgendamento && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#181a3d] to-[#0c0d1c] border border-[#ea3829]/50 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 border-b border-[#272952] pb-2.5">
                  <div className="relative">
                    <img
                      src={andersonPhoto}
                      alt="Anderson Diroza"
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#ea3829] shadow-sm"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#17193b] animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white truncate">
                        Reunião Executiva & Concierge
                      </span>
                      <Badge className="bg-[#ea3829]/20 text-[#ff8f84] text-[8.5px] border-[#ea3829]/40 shrink-0 font-bold">
                        1 HORA
                      </Badge>
                    </div>
                    <p className="text-[10px] text-[#ffb0a8] font-medium truncate">
                      Anderson Diroza · Suporte Estratégico Marco Roza
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModoAgendamento(false)}
                    className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                    title="Fechar agendamento"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3 Pilares de Confiança Executiva */}
                <div className="space-y-1.5 py-0.5">
                  <div className="flex items-center gap-2 text-[10.5px] text-zinc-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>
                      <strong className="text-white font-semibold">Conflito Zero:</strong> Sincronização direta na agenda oficial ({GOOGLE_CALENDAR_EMAIL}).
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-zinc-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>
                      <strong className="text-white font-semibold">Google Meet Automático:</strong> Sala exclusiva gerada no convite com link direto.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-zinc-300">
                    <Sparkles className="h-3.5 w-3.5 text-[#ff8f84] shrink-0" />
                    <span>
                      <strong className="text-white font-semibold">Zero Retrabalho:</strong> 1 clique para escolher o melhor dia e horário.
                    </span>
                  </div>
                </div>

                {/* Ações em 1 Clique */}
                <div className="space-y-2 pt-1">
                  <a
                    href={LINK_GOOGLE_CALENDAR_OFICIAL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      toast.success("Abrindo Agenda Oficial Google Calendar", {
                        description: "Escolha seu melhor horário diretamente na agenda do Anderson.",
                      });
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2d2b82] to-[#ea3829] hover:from-[#373599] hover:to-[#f0493b] text-white font-bold text-xs py-2.5 px-3 transition shadow-md hover:scale-[1.01] cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Escolher Horário na Agenda Oficial Google</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <a
                    href={gerarLinkWhatsappEncaixe()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#ea3829]/40 bg-[#141635] hover:bg-white/5 text-[#ffb0a8] font-medium text-[10.5px] py-1.5 px-3 transition"
                  >
                    <MessageCircle className="h-3 w-3 text-emerald-400" />
                    <span>Solicitar encaixe ou dúvida no WhatsApp</span>
                  </a>

                  <a
                    href={TELEGRAM_CONCIERGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#229ED9]/40 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#70c9f5] font-medium text-[10.5px] py-1.5 px-3 transition"
                  >
                    <MessageCircle className="h-3 w-3 text-[#229ED9]" />
                    <span>Canal Direto: Suporte Concierge no Telegram 24/7</span>
                  </a>
                </div>
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

          {/* Seção Completa de Dúvidas & Atalhos Rápidos (Multi-linhas e Categorias) */}
          <div className="p-2.5 border-t border-[#242650] bg-[#12132b] flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between text-[10px] text-zinc-300 font-bold px-0.5">
              <span className="flex items-center gap-1 text-white">
                <Sparkles className="w-3 h-3 text-[#ea3829]" />
                Dúvidas & Funcionalidades:
              </span>
              {/* Filtro por Categorias */}
              <div className="flex items-center gap-1">
                {["Todas", "Arena", "BI & Gestão", "Atletas"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaAtiva(cat)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors cursor-pointer ${
                      categoriaAtiva === cat
                        ? "bg-[#ea3829] text-white font-bold"
                        : "bg-[#181a3d] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Chips em Múltiplas Linhas com Quebra Automática (flex-wrap) */}
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {sugestoesFiltradas.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(s.query)}
                  className="inline-flex items-center gap-1.5 text-[10.5px] font-medium px-2.5 py-1 rounded-lg bg-[#181a3d] border border-[#2d2b82]/70 text-zinc-200 hover:border-[#ea3829] hover:text-white hover:bg-[#25285e] transition-all cursor-pointer shadow-xs active:scale-95"
                  title={s.query}
                >
                  <span>{s.icone}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
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

/**
 * Função utilitária para converter negrito em Markdown simples (**texto**) e código em crase (`código`)
 */
function renderMarkdownBold(text: string) {
  const parts = text.split(/(\*{2}[^*]+\*{2}|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const inner = part.slice(2, -2);
      const sub = inner.split(/(`[^`]+`)/g);
      return (
        <strong key={i} className="font-bold text-white">
          {sub.map((s, sIdx) =>
            s.startsWith("`") && s.endsWith("`") ? (
              <code
                key={sIdx}
                className="px-1 py-0.5 rounded bg-white/10 text-[#ff8f84] font-mono text-[10.5px]"
              >
                {s.slice(1, -1)}
              </code>
            ) : (
              s
            ),
          )}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-white/10 text-[#ff8f84] font-mono text-[10.5px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
