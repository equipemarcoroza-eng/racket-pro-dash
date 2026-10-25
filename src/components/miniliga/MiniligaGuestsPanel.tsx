import React, { useState } from "react";
import { MiniligaSession, MiniligaGuestLead } from "@/types/miniliga";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  MessageSquare,
  Sparkles,
  Phone,
  Trophy,
  Calendar,
  CheckCircle2,
  UserPlus,
  Flame,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { miniligaStorage } from "@/lib/miniliga-storage";

interface MiniligaGuestsPanelProps {
  sessions: MiniligaSession[];
  onConvertStudent?: (guestName: string, phone?: string) => void;
  onRefresh?: () => void;
}

export const MiniligaGuestsPanel: React.FC<MiniligaGuestsPanelProps> = ({
  sessions,
  onConvertStudent,
  onRefresh,
}) => {
  // Extrair convidados de todas as sessões finalizadas
  const guests: MiniligaGuestLead[] = [];
  const seen = new Set<string>();

  sessions.forEach((s) => {
    (s.participants || []).forEach((p) => {
      if (p.isGuest || !p.studentId) {
        // Ignora se for claramente um mock de teste genérico
        const cleanName = p.name.trim();
        if (cleanName.toLowerCase().startsWith("atleta ") || cleanName.toLowerCase().startsWith("jogador ")) {
          return;
        }

        const key = `${cleanName}-${s.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          guests.push({
            id: p.id || `${s.id}-${cleanName}`,
            name: cleanName,
            phone: p.phone || "",
            miniligaSessionId: s.id,
            miniligaTitle: s.title,
            date: s.date,
            rank: p.rank,
            wins: p.wins,
            leadStatus: p.leadStatus || "novo",
            notes: p.notes || "",
          });
        }
      }
    });
  });

  const [editingPhone, setEditingPhone] = useState<{ [id: string]: string }>({});

  const handlePhoneChange = (id: string, value: string) => {
    setEditingPhone((prev) => ({ ...prev, [id]: value }));
  };

  const handleSavePhone = async (guest: MiniligaGuestLead) => {
    const newPhone = editingPhone[guest.id] ?? guest.phone ?? "";
    const sessionToUpdate = sessions.find((s) => s.id === guest.miniligaSessionId);
    if (!sessionToUpdate) return;

    const updatedParticipants = sessionToUpdate.participants.map((p) => {
      if (p.name.trim().toLowerCase() === guest.name.toLowerCase()) {
        return { ...p, phone: newPhone, isGuest: true };
      }
      return p;
    });

    const updatedSession = { ...sessionToUpdate, participants: updatedParticipants };
    await miniligaStorage.saveSession(updatedSession);
    toast.success(`Telefone de ${guest.name} salvo com sucesso!`);
    if (onRefresh) onRefresh();
  };

  const handleOpenWhatsApp = (guest: MiniligaGuestLead) => {
    const rawPhone = editingPhone[guest.id] ?? guest.phone ?? "";
    const cleanPhone = rawPhone.replace(/\D/g, "");

    const firstName = guest.name.split(" ")[0];
    const performanceText =
      guest.rank && guest.rank <= 3
        ? `Você arrebentou e foi destaque ficando em ${guest.rank}º lugar`
        : `Você jogou super bem`;

    const message =
      `Olá, ${firstName}! Tudo bem? 🎾🔥\n\n` +
      `Aqui é da *Equipe Marco Roza Beach Tennis*!\n\n` +
      `Vimos que você jogou nossa *${guest.miniligaTitle}* como convidado(a) e ${performanceText}!\n\n` +
      `Queremos te convidar para vir fazer uma *aula experimental gratuita* conosco esta semana e conhecer nossa metodologia oficial! Qual o melhor horário para você? 🚀🏆`;

    const url = cleanPhone
      ? `https://wa.me/55${cleanPhone.replace(/^55/, "")}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  return (
    <Card className="bg-white/95 dark:bg-slate-900 border-2 border-amber-500/30 text-card-foreground shadow-xl rounded-2xl overflow-hidden backdrop-blur-sm">
      <CardHeader className="border-b border-amber-200/80 dark:border-white/10 p-5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-slate-950/90 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25">
              <Users className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Visitantes da Miniliga
                </h3>
                <Badge className="bg-amber-500 text-slate-950 font-black border-0 text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                  {guests.length} {guests.length === 1 ? "Lead Comercial" : "Leads Comerciais"}
                </Badge>
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                Pessoas convidadas que jogaram torneios oficiais. Oportunidade perfeita para contato comercial e conversão em matrícula!
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40">
        {guests.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-2">
            <Users className="h-8 w-8 text-amber-500 mx-auto opacity-70" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhum convidado identificado ainda
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Quando você importar ou finalizar uma Miniliga com participantes convidados, eles aparecerão automaticamente aqui com botão direto para WhatsApp!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {guests.map((g) => {
              const currentPhone = editingPhone[g.id] ?? g.phone ?? "";
              return (
                <div
                  key={g.id}
                  className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/60 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-sm hover:shadow-lg group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors tracking-tight flex items-center gap-1.5">
                          <span>{g.name}</span>
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 mt-1">
                          <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                          <span>{g.miniligaTitle}</span>
                        </div>
                      </div>

                      <Badge className="bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs shrink-0">
                        👤 Convidado
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{new Date(g.date).toLocaleDateString("pt-BR")}</span>
                      </span>
                      {g.rank && (
                        <span className="font-black text-amber-700 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-300/80 dark:border-amber-500/30">
                          {g.rank}º Lugar • {g.wins ?? 0}V
                        </span>
                      )}
                    </div>

                    {/* Campo de Telefone */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> WhatsApp / Telefone
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Ex: (11) 98765-4321"
                          value={currentPhone}
                          onChange={(e) => handlePhoneChange(g.id, e.target.value)}
                          className="h-9 text-xs font-bold bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500 shadow-inner"
                        />
                        {currentPhone !== (g.phone || "") && (
                          <Button
                            size="sm"
                            onClick={() => handleSavePhone(g)}
                            className="h-9 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                          >
                            Salvar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleOpenWhatsApp(g)}
                      className="flex-1 h-9 text-xs font-black bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2 shadow-md shadow-emerald-500/20 rounded-xl transition-all active:scale-[0.98]"
                    >
                      <MessageSquare className="h-4 w-4 fill-white/20" />
                      WhatsApp Convite
                    </Button>

                    {onConvertStudent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onConvertStudent(g.name, currentPhone)}
                        className="h-9 text-xs font-black border-2 border-amber-500 text-amber-800 hover:bg-amber-500 hover:text-white dark:text-amber-300 dark:hover:bg-amber-500/20 rounded-xl transition-all shadow-xs gap-1.5"
                        title="Cadastrar como Aluno Oficial"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Matricular
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
