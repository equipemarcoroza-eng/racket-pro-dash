import { supabase } from "@/integrations/supabase/client";
import {
  MiniligaSession,
  MiniligaParticipant,
  MiniligaMatch,
} from "@/types/miniliga";

const STORAGE_ACTIVE_KEY = "racket_miniliga_active_session";
const STORAGE_HISTORY_KEY = "racket_miniliga_history_sessions";

// Conversores entre o formato do Banco de Dados (Supabase/Lovable Cloud) e o Modelo da Aplicação
export const sessionToDb = (session: MiniligaSession) => ({
  id: session.id,
  title: session.title,
  date: session.date,
  participant_count: session.participantCount,
  model_type: session.modelType,
  courts_count: session.courtsCount,
  duration_seconds: session.durationSeconds,
  current_round: session.currentRound,
  total_rounds: session.totalRounds,
  status: session.status,
  is_simulation: !!session.isSimulation,
  has_bonus_final: !!session.hasBonusFinal,
  has_tiebreak_simples: !!session.hasTiebreakSimples,
  has_semifinais: !!session.hasSemifinais,
  participants: session.participants as any,
  matches: session.matches as any,
  updated_at: new Date().toISOString(),
});

export const dbToSession = (row: any): MiniligaSession => ({
  id: row.id,
  title: row.title,
  date: row.date,
  participantCount: row.participant_count,
  modelType: row.model_type,
  courtsCount: row.courts_count,
  durationSeconds: row.duration_seconds,
  currentRound: row.current_round,
  totalRounds: row.total_rounds,
  status: row.status,
  isSimulation: !!row.is_simulation,
  hasBonusFinal: !!row.has_bonus_final,
  hasTiebreakSimples: !!row.has_tiebreak_simples,
  hasSemifinais: !!row.has_semifinais,
  participants: (Array.isArray(row.participants)
    ? row.participants
    : []) as MiniligaParticipant[],
  matches: (Array.isArray(row.matches) ? row.matches : []) as MiniligaMatch[],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const miniligaStorage = {
  // 1. Recuperar sessão ativa do cache local (imediato)
  getActiveSession(): MiniligaSession | null {
    try {
      const data = localStorage.getItem(STORAGE_ACTIVE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("Falha ao recuperar sessão ativa da Miniliga no cache local:", e);
      return null;
    }
  },

  // 2. Salvar sessão ativa (Cache Local + Nuvem no Lovable Cloud se for Modo Real)
  saveActiveSession(session: MiniligaSession): void {
    try {
      // Sempre mantém cache local síncrono e instantâneo
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(session));

      // Se for Modo Real Oficial, sincroniza na nuvem com o Supabase / Lovable Cloud
      if (!session.isSimulation) {
        supabase
          .from("miniliga_sessions")
          .upsert(sessionToDb(session))
          .then(({ error }) => {
            if (error) {
              console.error("Erro ao sincronizar sessão da Miniliga no Lovable Cloud:", error);
            }
          })
          .catch((err) => {
            console.error("Falha de rede ao sincronizar Miniliga no Lovable Cloud:", err);
          });
      }
    } catch (e) {
      console.warn("Falha ao salvar sessão ativa da Miniliga:", e);
    }
  },

  // 3. Limpar sessão ativa localmente e na nuvem
  clearActiveSession(sessionId?: string): void {
    try {
      localStorage.removeItem(STORAGE_ACTIVE_KEY);
      if (sessionId) {
        supabase
          .from("miniliga_sessions")
          .delete()
          .eq("id", sessionId)
          .eq("is_simulation", false)
          .then(({ error }) => {
            if (error) {
              console.warn("Aviso ao remover sessão do Lovable Cloud:", error);
            }
          })
          .catch((e) => console.warn(e));
      }
    } catch (e) {
      console.warn("Falha ao limpar sessão ativa da Miniliga:", e);
    }
  },

  // 4. Buscar histórico local
  getHistory(): MiniligaSession[] {
    try {
      const data = localStorage.getItem(STORAGE_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // 5. Salvar no histórico (Local + Lovable Cloud)
  saveToHistory(session: MiniligaSession): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter((s) => s.id !== session.id);
      localStorage.setItem(
        STORAGE_HISTORY_KEY,
        JSON.stringify([session, ...filtered].slice(0, 50)) // guarda as 50 últimas no cache
      );

      // Se for Modo Real, persiste com status finalizada no Lovable Cloud
      if (!session.isSimulation) {
        supabase
          .from("miniliga_sessions")
          .upsert(sessionToDb({ ...session, status: "finalizada" }))
          .then(({ error }) => {
            if (error) {
              console.error("Erro ao salvar histórico de Miniliga no Lovable Cloud:", error);
            }
          })
          .catch((err) => {
            console.error("Falha ao persistir no Lovable Cloud:", err);
          });
      }
    } catch (e) {
      console.warn("Falha ao salvar histórico da Miniliga:", e);
    }
  },

  // 6. Excluir do histórico (Local + Lovable Cloud)
  async deleteFromHistory(sessionId: string): Promise<void> {
    try {
      const history = this.getHistory();
      const filtered = history.filter((s) => s.id !== sessionId);
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(filtered));

      await supabase
        .from("miniliga_sessions")
        .delete()
        .eq("id", sessionId);
    } catch (e) {
      console.warn("Falha ao excluir do histórico da Miniliga:", e);
    }
  },

  // 7. Buscar histórico completo da Nuvem (Lovable Cloud)
  async fetchCloudHistory(): Promise<MiniligaSession[]> {
    try {
      const { data, error } = await supabase
        .from("miniliga_sessions")
        .select("*")
        .eq("is_simulation", false)
        .order("date", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("Não foi possível carregar histórico do Lovable Cloud:", error);
        return this.getHistory();
      }

      if (data && data.length > 0) {
        const cloudSessions = data.map(dbToSession);
        // Mesclar com eventuais sessões locais sem duplicatas
        const local = this.getHistory();
        const mergedMap = new Map<string, MiniligaSession>();
        cloudSessions.forEach((s) => mergedMap.set(s.id, s));
        local.forEach((s) => {
          if (!mergedMap.has(s.id)) mergedMap.set(s.id, s);
        });
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(merged.slice(0, 50)));
        return merged;
      }
      return this.getHistory();
    } catch (e) {
      console.warn("Erro ao buscar histórico no Lovable Cloud:", e);
      return this.getHistory();
    }
  },

  // 8. Buscar sessão ativa recente no Lovable Cloud (se houver)
  async fetchCloudActiveSession(): Promise<MiniligaSession | null> {
    try {
      const { data, error } = await supabase
        .from("miniliga_sessions")
        .select("*")
        .neq("status", "finalizada")
        .eq("is_simulation", false)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("Erro ao buscar sessão ativa no Lovable Cloud:", error);
        return null;
      }

      if (data) {
        return dbToSession(data);
      }
      return null;
    } catch (e) {
      console.warn("Erro ao buscar sessão ativa no Lovable Cloud:", e);
      return null;
    }
  },
};
