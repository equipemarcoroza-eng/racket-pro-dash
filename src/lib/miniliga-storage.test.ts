import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      upsert: () => Promise.resolve({ error: null }),
      delete: () => ({ eq: () => ({ neq: () => Promise.resolve({ error: null }) }) }),
    }),
  },
}));

import { miniligaStorage } from "@/lib/miniliga-storage";
import type { MiniligaSession } from "@/types/miniliga";

const mk = (id: string, extra: Partial<MiniligaSession> = {}): MiniligaSession => ({
  id,
  title: id,
  date: "2026-11-13",
  participantCount: 5,
  modelType: "rotativo",
  courtsCount: 1,
  durationSeconds: 300,
  currentRound: 1,
  totalRounds: 5,
  status: "em_andamento",
  participants: [],
  matches: [],
  hasBonusFinal: false,
  hasTiebreakSimples: false,
  isSimulation: true, // evita gravação na nuvem nos testes
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...extra,
});

describe("miniligaStorage: várias Miniligas simultâneas", () => {
  beforeEach(() => localStorage.clear());

  it("migra a sessão única do formato antigo para a lista", () => {
    localStorage.setItem("racket_miniliga_active_session", JSON.stringify(mk("antiga")));
    const list = miniligaStorage.getActiveSessions();
    expect(list.map((s) => s.id)).toEqual(["antiga"]);
    expect(localStorage.getItem("racket_miniliga_active_session")).toBeNull();
    expect(miniligaStorage.getActiveSessions().map((s) => s.id)).toEqual(["antiga"]);
  });

  it("salvar duas ligas não sobrescreve uma à outra", () => {
    miniligaStorage.saveActiveSession(mk("liga-1"));
    miniligaStorage.saveActiveSession(mk("liga-2", { participantCount: 8 }));
    const list = miniligaStorage.getActiveSessions();
    expect(list.map((s) => s.id)).toEqual(["liga-1", "liga-2"]);
    expect(list[1].participantCount).toBe(8);
  });

  it("salvar de novo a mesma liga atualiza em vez de duplicar", () => {
    miniligaStorage.saveActiveSession(mk("liga-1"));
    miniligaStorage.saveActiveSession(mk("liga-1", { currentRound: 3 }));
    const list = miniligaStorage.getActiveSessions();
    expect(list).toHaveLength(1);
    expect(list[0].currentRound).toBe(3);
  });

  it("remover uma liga mantém as outras", () => {
    const a = mk("liga-1");
    miniligaStorage.saveActiveSession(a);
    miniligaStorage.saveActiveSession(mk("liga-2"));
    miniligaStorage.clearActiveSession(a);
    expect(miniligaStorage.getActiveSessions().map((s) => s.id)).toEqual(["liga-2"]);
  });

  it("preserva convidado (isGuest/phone) na sessão", () => {
    const s = mk("liga-1", {
      participants: [
        { id: "g1", name: "Amiga", isGuest: true, phone: "48999990000", leadStatus: "novo",
          matchesPlayed: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointsBalance: 0, totalScore: 0 },
      ],
    });
    miniligaStorage.saveActiveSession(s);
    const p = miniligaStorage.getActiveSessions()[0].participants[0];
    expect(p.isGuest).toBe(true);
    expect(p.studentId).toBeUndefined();
    expect(p.phone).toBe("48999990000");
  });
});
