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
    <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-amber-500/30 text-white shadow-xl overflow-hidden">
      <CardHeader className="border-b border-white/10 pb-4 bg-slate-950/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black flex items-center gap-2 text-white">
                Visitantes da Miniliga
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs">
                  {guests.length} {guests.length === 1 ? "Lead" : "Leads Comerciais"}
                </Badge>
              </CardTitle>
              <p className="text-xs text-slate-300">
                Pessoas convidadas que jogaram torneios oficiais. Oportunidade perfeita para contato e conversão em matrícula!
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {guests.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            Nenhum convidado identificado ainda. Quando você importar ou finalizar uma Miniliga com participantes convidados, eles aparecerão automaticamente aqui!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guests.map((g) => {
              const currentPhone = editingPhone[g.id] ?? g.phone ?? "";
              return (
                <div
                  key={g.id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all shadow-md group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-base text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          <span>{g.name}</span>
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Trophy className="h-3 w-3 text-amber-400" />
                          <span>{g.miniligaTitle}</span>
                        </div>
                      </div>

                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-[10px] font-bold">
                        👤 Convidado
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-white/5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(g.date).toLocaleDateString("pt-BR")}</span>
                      {g.rank && (
                        <span className="ml-auto font-bold text-amber-400">
                          {g.rank}º Lugar • {g.wins ?? 0}V
                        </span>
                      )}
                    </div>

                    {/* Campo de Telefone */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Phone className="h-3 w-3 text-emerald-400" /> WhatsApp / Telefone
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          placeholder="Ex: (11) 98765-4321"
                          value={currentPhone}
                          onChange={(e) => handlePhoneChange(g.id, e.target.value)}
                          className="h-8 text-xs bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                        />
                        {currentPhone !== (g.phone || "") && (
                          <Button
                            size="sm"
                            onClick={() => handleSavePhone(g)}
                            className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            Salvar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleOpenWhatsApp(g)}
                      className="flex-1 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      WhatsApp Convite
                    </Button>

                    {onConvertStudent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onConvertStudent(g.name, currentPhone)}
                        className="h-8 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 gap-1"
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
