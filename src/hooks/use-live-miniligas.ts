import { useEffect, useState } from "react";
import { miniligaStorage } from "@/lib/miniliga-storage";
import type { MiniligaSession } from "@/types/miniliga";

const todayIso = () => new Date().toISOString().split("T")[0];
const sameDay = (iso?: string) => !!iso && iso.split("T")[0] === todayIso();

/**
 * Miniligas reais para o telão (Arena Live): as que estão em andamento (todos os aparelhos)
 * mais as finalizadas hoje (pódio do dia). Atualiza em tempo real via Lovable Cloud.
 */
export function useLiveMiniligas(): MiniligaSession[] {
  const [sessions, setSessions] = useState<MiniligaSession[]>(() =>
    miniligaStorage.getActiveSessions().filter((s) => !s.isSimulation)
  );

  useEffect(() => {
    const merge = (incoming: MiniligaSession[]) =>
      setSessions((prev) => {
        const map = new Map(prev.map((s) => [s.id, s]));
        incoming.forEach((s) => {
          if (s.isSimulation) return;
          const cur = map.get(s.id);
          if (!cur || new Date(s.updatedAt) >= new Date(cur.updatedAt)) map.set(s.id, s);
        });
        return Array.from(map.values()).filter(
          (s) => s.status !== "finalizada" || sameDay(s.date) || sameDay(s.updatedAt)
        );
      });

    miniligaStorage.fetchCloudActiveSessions().then(merge);
    miniligaStorage
      .fetchCloudHistory()
      .then((hist) => merge(hist.filter((s) => sameDay(s.date) || sameDay(s.updatedAt))));

    const unsubscribe = miniligaStorage.subscribe({
      onUpsert: (remote) => merge([remote]),
      onDelete: (id) => setSessions((prev) => prev.filter((s) => s.id !== id)),
    });
    return unsubscribe;
  }, []);

  return sessions;
}
