import { MiniligaSession } from "@/types/miniliga";

const STORAGE_ACTIVE_KEY = "racket_miniliga_active_session";
const STORAGE_HISTORY_KEY = "racket_miniliga_history_sessions";

export const miniligaStorage = {
  getActiveSession(): MiniligaSession | null {
    try {
      const data = localStorage.getItem(STORAGE_ACTIVE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("Falha ao recuperar sessão ativa da Miniliga:", e);
      return null;
    }
  },

  saveActiveSession(session: MiniligaSession): void {
    try {
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn("Falha ao salvar sessão ativa da Miniliga:", e);
    }
  },

  clearActiveSession(): void {
    try {
      localStorage.removeItem(STORAGE_ACTIVE_KEY);
    } catch (e) {
      console.warn("Falha ao limpar sessão ativa da Miniliga:", e);
    }
  },

  getHistory(): MiniligaSession[] {
    try {
      const data = localStorage.getItem(STORAGE_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveToHistory(session: MiniligaSession): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter((s) => s.id !== session.id);
      localStorage.setItem(
        STORAGE_HISTORY_KEY,
        JSON.stringify([session, ...filtered].slice(0, 50)) // guarda as 50 últimas
      );
    } catch (e) {
      console.warn("Falha ao salvar histórico da Miniliga:", e);
    }
  },

  deleteFromHistory(sessionId: string): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter((s) => s.id !== sessionId);
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Falha ao excluir do histórico da Miniliga:", e);
    }
  },
};
