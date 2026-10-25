import { supabase } from "@/integrations/supabase/client";
import {
  MiniligaSession,
  MiniligaParticipant,
  MiniligaMatch,
} from "@/types/miniliga";
import { getDefaultOfficialSessions } from "@/lib/miniliga-excel-parser";

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
  // Usa o carimbo da própria sessão: é ele que decide qual aparelho tem a versão mais recente
  updated_at: session.updatedAt || new Date().toISOString(),
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

export type MiniligaCloudStatus = "local" | "salvando" | "salvo" | "erro";

const CLOUD_DEBOUNCE_MS = 800;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSession: MiniligaSession | null = null;
let statusListener: ((status: MiniligaCloudStatus) => void) | null = null;
// Última versão confirmada na nuvem por sessão, para não regravar o que acabou de chegar de outro aparelho
const syncedStamps = new Map<string, number>();

const stampOf = (iso?: string) => (iso ? new Date(iso).getTime() : 0);
const notify = (status: MiniligaCloudStatus) => statusListener?.(status);

async function upsertCloud(session: MiniligaSession): Promise<void> {
  const { error } = await supabase.from("miniliga_sessions").upsert(sessionToDb(session));
  if (error) throw error;
  syncedStamps.set(session.id, stampOf(session.updatedAt));
}

export const miniligaStorage = {
  // Recebe as mudanças de status da gravação na nuvem (para o selo da tela)
  setStatusListener(fn: ((status: MiniligaCloudStatus) => void) | null) {
    statusListener = fn;
  },

  // Marca uma versão como já presente na nuvem (veio do banco ou de outro aparelho)
  markSynced(session: MiniligaSession) {
    syncedStamps.set(session.id, stampOf(session.updatedAt));
  },

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

  // 2. Salvar sessão ativa: cache local na hora e, no Modo Real, nuvem com pequeno atraso
  //    (agrupa a digitação de placares em uma gravação só)
  saveActiveSession(session: MiniligaSession): void {
    try {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn("Falha ao salvar sessão ativa da Miniliga no cache local:", e);
    }

    if (session.isSimulation) {
      notify("local");
      return;
    }
    if (syncedStamps.get(session.id) === stampOf(session.updatedAt)) return;

    pendingSession = session;
    if (pendingTimer) clearTimeout(pendingTimer);
    notify("salvando");
    pendingTimer = setTimeout(() => {
      const s = pendingSession;
      pendingTimer = null;
      pendingSession = null;
      if (!s) return;
      upsertCloud(s)
        .then(() => notify("salvo"))
        .catch((err) => {
          console.error("Erro ao sincronizar sessão da Miniliga no Lovable Cloud:", err);
          notify("erro");
        });
    }, CLOUD_DEBOUNCE_MS);
  },

  // 3. Gravar na nuvem imediatamente e aguardar a confirmação (usado ao validar o torneio)
  async saveCloudNow(session: MiniligaSession): Promise<void> {
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = null;
    pendingSession = null;
    notify("salvando");
    try {
      await upsertCloud(session);
      notify("salvo");
    } catch (err) {
      notify("erro");
      throw err;
    }
  },

  // 3.1 Salvar sessão completa (Histórico local + Lovable Cloud com resiliência para importação)
  async saveSession(session: MiniligaSession): Promise<void> {
    this.saveToHistory(session);
    try {
      await this.saveCloudNow(session);
    } catch (e) {
      console.warn("Aviso ao sincronizar sessão na nuvem (mantida no histórico local):", e);
    }
  },

  // 4. Limpar a mesa. Na nuvem só apaga sessões reais ainda em andamento;
  //    uma Miniliga validada continua no histórico
  clearActiveSession(session?: MiniligaSession | null): void {
    try {
      localStorage.removeItem(STORAGE_ACTIVE_KEY);
    } catch (e) {
      console.warn("Falha ao limpar sessão ativa da Miniliga:", e);
    }
    if (pendingSession?.id === session?.id && pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
      pendingSession = null;
    }
    if (session && !session.isSimulation && session.status !== "finalizada") {
      supabase
        .from("miniliga_sessions")
        .delete()
        .eq("id", session.id)
        .neq("status", "finalizada")
        .then(({ error }) => {
          if (error) console.warn("Aviso ao remover sessão do Lovable Cloud:", error);
        });
    }
  },

  // 5. Buscar histórico local com garantia das sessões oficiais importadas (Desktop, Tablet e Celular)
  getHistory(): MiniligaSession[] {
    try {
      const data = localStorage.getItem(STORAGE_HISTORY_KEY);
      const list: MiniligaSession[] = data ? JSON.parse(data) : [];
      const defaultOfficial = getDefaultOfficialSessions();
      const existingIds = new Set(list.map((s) => s.id));
      const missingDefaults = defaultOfficial.filter((d) => !existingIds.has(d.id));

      if (missingDefaults.length > 0) {
        const merged = [...list, ...missingDefaults].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        try {
          localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(merged.slice(0, 50)));
        } catch (e) {
          // ignore localStorage quota errors
        }
        return merged;
      }
      return list.length > 0 ? list : defaultOfficial;
    } catch (e) {
      return getDefaultOfficialSessions();
    }
  },

  // 6. Salvar no histórico do cache local (a nuvem é gravada por saveCloudNow)
  saveToHistory(session: MiniligaSession): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter((s) => s.id !== session.id);
      localStorage.setItem(
        STORAGE_HISTORY_KEY,
        JSON.stringify([session, ...filtered].slice(0, 50)) // guarda as 50 últimas no cache
      );
    } catch (e) {
      console.warn("Falha ao salvar histórico da Miniliga:", e);
    }
  },

  // 7. Excluir do histórico (Local + Lovable Cloud). Lança erro se a nuvem recusar
  async deleteFromHistory(session: MiniligaSession): Promise<void> {
    if (!session.isSimulation) {
      const { error } = await supabase.from("miniliga_sessions").delete().eq("id", session.id);
      if (error) throw error;
    }
    const filtered = this.getHistory().filter((s) => s.id !== session.id);
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Falha ao atualizar histórico local da Miniliga:", e);
    }
  },

  // 8. Buscar histórico completo da Nuvem (somente Miniligas reais validadas)
  async fetchCloudHistory(): Promise<MiniligaSession[]> {
    try {
      const { data, error } = await supabase
        .from("miniliga_sessions")
        .select("*")
        .eq("is_simulation", false)
        .eq("status", "finalizada")
        .order("date", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("Não foi possível carregar histórico do Lovable Cloud:", error);
        return this.getHistory();
      }

      const cloudSessions = (data || []).map(dbToSession);
      cloudSessions.forEach((s) => this.markSynced(s));
      // Do cache local entram só as simulações; as reais valem pelo que está na nuvem
      const cloudIds = new Set(cloudSessions.map((s) => s.id));
      const localSims = this.getHistory().filter((s) => s.isSimulation && !cloudIds.has(s.id));
      const merged = [...cloudSessions, ...localSims].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      try {
        localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(merged.slice(0, 50)));
      } catch (e) {
        console.warn("Falha ao atualizar histórico local da Miniliga:", e);
      }
      return merged;
    } catch (e) {
      console.warn("Erro ao buscar histórico no Lovable Cloud:", e);
      return this.getHistory();
    }
  },

  // 9. Buscar sessão ativa recente no Lovable Cloud (se houver)
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
      if (!data) return null;
      const session = dbToSession(data);
      this.markSynced(session);
      return session;
    } catch (e) {
      console.warn("Erro ao buscar sessão ativa no Lovable Cloud:", e);
      return null;
    }
  },

  // 10. Tempo real: avisa quando outro aparelho grava ou apaga uma Miniliga real
  subscribe(handlers: {
    onUpsert: (session: MiniligaSession) => void;
    onDelete: (id: string) => void;
  }): () => void {
    const channel = supabase
      .channel("miniliga_sessions_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "miniliga_sessions" },
        (payload: any) => {
          if (payload.eventType === "DELETE") {
            if (payload.old?.id) handlers.onDelete(payload.old.id);
            return;
          }
          if (!payload.new || payload.new.is_simulation) return;
          const session = dbToSession(payload.new);
          this.markSynced(session);
          handlers.onUpsert(session);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
