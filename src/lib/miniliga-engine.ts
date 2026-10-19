import {
  MiniligaParticipant,
  MiniligaMatch,
  MiniligaSession,
  MiniligaParticipantCount,
  MiniligaModelType,
} from "@/types/miniliga";

/**
 * MOTOR DE GERAÇÃO DE CONFRONTOS E RODÍZIOS DA MINILIGA (MÉTODO MARCO ROZA)
 */

export function generateMiniligaMatches(
  participants: MiniligaParticipant[],
  modelType: MiniligaModelType
): { matches: MiniligaMatch[]; totalRounds: number; courtsCount: number } {
  const count = participants.length as MiniligaParticipantCount;

  if (count === 5) {
    return generate5PlayersRotativo(participants);
  } else if (count === 6) {
    if (modelType === "rotativo_5jogos") {
      return generate6Players5Jogos(participants);
    }
    return generate6PlayersRotativo(participants);
  } else if (count === 8) {
    if (modelType === "intergrupos") {
      return generate8PlayersIntergrupos(participants);
    }
    return generate8PlayersRotativo(participants);
  } else if (count === 10) {
    if (modelType === "intergrupos") {
      return generate10PlayersIntergrupos(participants);
    }
    return generate10PlayersRotativo(participants);
  } else if (count === 12) {
    return generate12PlayersRotativo(participants);
  }

  // Fallback padrão
  return generate5PlayersRotativo(participants);
}

/**
 * 5 JOGADORES (1 Quadra) - Rodízio Americano
 * 5 Rodadas, cada um joga 4 vezes e folga 1 vez.
 * Jogadores: P0, P1, P2, P3, P4
 */
function generate5PlayersRotativo(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];
  const schedule = [
    // [Dupla A, Dupla B] - Quem sobra folga
    { r: 1, a: [0, 1], b: [2, 3] }, // Folga 4
    { r: 2, a: [4, 0], b: [1, 2] }, // Folga 3
    { r: 3, a: [3, 4], b: [0, 2] }, // Folga 1
    { r: 4, a: [2, 4], b: [1, 3] }, // Folga 0
    { r: 5, a: [0, 3], b: [4, 1] }, // Folga 2
  ];

  schedule.forEach((s) => {
    matches.push({
      id: `match-5p-r${s.r}-c1`,
      roundNumber: s.r,
      courtNumber: 1,
      teamA: { player1Id: p[s.a[0]].id, player2Id: p[s.a[1]].id },
      teamB: { player1Id: p[s.b[0]].id, player2Id: p[s.b[1]].id },
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    });
  });

  return { matches, totalRounds: 5, courtsCount: 1 };
}

/**
 * 6 JOGADORES (1 Quadra) - MODELO OFICIAL MARCO ROZA (5 JOGOS POR ALUNO)
 * 8 Rodadas no total: todos os 6 alunos jogam exatamente 5 vezes!
 * - Todas as 15 duplas possíveis de 6 participantes são formadas ao longo do torneio.
 * - NENHUM confronto é repetido (8 partidas 100% inéditas).
 * - ZERO folgas consecutivas para todos os atletas.
 * - Na 8ª rodada, os alunos que precisavam do 5º jogo enfrentam a dupla de apoio sorteada.
 * - A dupla de apoio não pontua na classificação individual para garantir que todos
 *   encerrem a Miniliga rigorosamente com 5 jogos computados.
 */
function generate6Players5Jogos(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];

  // Grade perfeita cobrindo as 15 duplas com máxima alternância e zero repetição de jogos
  const schedule = [
    { r: 1, a: [0, 4], b: [2, 5], rest: [1, 3] },
    { r: 2, a: [1, 3], b: [2, 4], rest: [0, 5] },
    { r: 3, a: [0, 2], b: [4, 5], rest: [1, 3] },
    { r: 4, a: [1, 4], b: [3, 5], rest: [0, 2] },
    { r: 5, a: [0, 1], b: [2, 3], rest: [4, 5] },
    { r: 6, a: [1, 5], b: [3, 4], rest: [0, 2] },
    { r: 7, a: [0, 3], b: [1, 2], rest: [4, 5] },
    { r: 8, a: [0, 5], b: [1, 4], rest: [2, 3], support: [1, 4] },
  ];

  schedule.forEach((s) => {
    matches.push({
      id: `match-6p-5j-r${s.r}-c1`,
      roundNumber: s.r,
      courtNumber: 1,
      teamA: { player1Id: p[s.a[0]].id, player2Id: p[s.a[1]].id },
      teamB: { player1Id: p[s.b[0]].id, player2Id: p[s.b[1]].id },
      scoreA: null,
      scoreB: null,
      isCompleted: false,
      ...(s.support ? { supportPairPlayerIds: s.support.map((idx) => p[idx].id) } : {}),
    });
  });

  return { matches, totalRounds: 8, courtsCount: 1 };
}

/**
 * 6 JOGADORES (1 Quadra) - Rodízio Perfeito (4 Jogos)
 * 6 Rodadas: cada um joga exatamente 4 partidas e folga exatamente 2 vezes!
 */
function generate6PlayersRotativo(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];
  const schedule = [
    { r: 1, a: [0, 1], b: [2, 3] }, // Folgam 4, 5
    { r: 2, a: [0, 2], b: [4, 5] }, // Folgam 1, 3
    { r: 3, a: [1, 4], b: [3, 5] }, // Folgam 0, 2
    { r: 4, a: [0, 3], b: [1, 2] }, // Folgam 4, 5
    { r: 5, a: [0, 4], b: [2, 5] }, // Folgam 1, 3
    { r: 6, a: [1, 5], b: [3, 4] }, // Folgam 0, 2
  ];

  schedule.forEach((s) => {
    matches.push({
      id: `match-6p-r${s.r}-c1`,
      roundNumber: s.r,
      courtNumber: 1,
      teamA: { player1Id: p[s.a[0]].id, player2Id: p[s.a[1]].id },
      teamB: { player1Id: p[s.b[0]].id, player2Id: p[s.b[1]].id },
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    });
  });

  return { matches, totalRounds: 6, courtsCount: 1 };
}

/**
 * 8 JOGADORES - MODELO INTERGRUPOS OFICIAL (MÉTODO MARCO ROZA)
 * Grupo 1: 0, 1, 2, 3 (A1, B1, C1, D1)
 * Grupo 2: 4, 5, 6, 7 (e1, f1, g1, h1)
 * 2 Quadras simultâneas (100% de ocupação sem folgas).
 * 4 Rodadas no total (8 partidas 100% inéditas).
 * Cada jogador do G1 faz dupla exatamente 1 vez com cada um do G2:
 * - A1 joga com: e1, f1, g1, h1
 * - B1 joga com: f1, g1, h1, e1
 * - C1 joga com: g1, h1, e1, f1
 * - D1 joga com: h1, e1, f1, g1
 * ZERO repetições de parcerias e ZERO repetições de confrontos!
 */
function generate8PlayersIntergrupos(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];

  const schedule = [
    // Rodada 1: A1/e1 vs B1/f1 (Q1), C1/g1 vs D1/h1 (Q2)
    { r: 1, c: 1, a: [0, 4], b: [1, 5] },
    { r: 1, c: 2, a: [2, 6], b: [3, 7] },
    // Rodada 2: A1/f1 vs B1/g1 (Q1), C1/h1 vs D1/e1 (Q2)
    { r: 2, c: 1, a: [0, 5], b: [1, 6] },
    { r: 2, c: 2, a: [2, 7], b: [3, 4] },
    // Rodada 3: A1/g1 vs C1/e1 (Q1), B1/h1 vs D1/f1 (Q2)
    { r: 3, c: 1, a: [0, 6], b: [2, 4] },
    { r: 3, c: 2, a: [1, 7], b: [3, 5] },
    // Rodada 4: A1/h1 vs C1/f1 (Q1), B1/e1 vs D1/g1 (Q2)
    { r: 4, c: 1, a: [0, 7], b: [2, 5] },
    { r: 4, c: 2, a: [1, 4], b: [3, 6] },
  ];

  schedule.forEach((pr, idx) => {
    matches.push({
      id: `match-8p-ig-${idx + 1}`,
      roundNumber: pr.r,
      courtNumber: pr.c,
      teamA: { player1Id: p[pr.a[0]].id, player2Id: p[pr.a[1]].id },
      teamB: { player1Id: p[pr.b[0]].id, player2Id: p[pr.b[1]].id },
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    });
  });

  return { matches, totalRounds: 4, courtsCount: 2 };
}

/**
 * 8 JOGADORES - MODELO ROTATIVO AMERICANO GERAL
 * 7 Rodadas perfeitas (cada um joga exatamente 7 vezes em 2 quadras)
 */
function generate8PlayersRotativo(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];
  const schedule = [
    // R1
    { r: 1, c: 1, a: [0, 1], b: [2, 3] },
    { r: 1, c: 2, a: [4, 5], b: [6, 7] },
    // R2
    { r: 2, c: 1, a: [0, 2], b: [4, 6] },
    { r: 2, c: 2, a: [1, 3], b: [5, 7] },
    // R3
    { r: 3, c: 1, a: [0, 3], b: [5, 6] },
    { r: 3, c: 2, a: [1, 2], b: [4, 7] },
    // R4
    { r: 4, c: 1, a: [0, 4], b: [1, 7] },
    { r: 4, c: 2, a: [2, 5], b: [3, 6] },
    // R5
    { r: 5, c: 1, a: [0, 5], b: [2, 7] },
    { r: 5, c: 2, a: [1, 6], b: [3, 4] },
    // R6
    { r: 6, c: 1, a: [0, 6], b: [1, 5] },
    { r: 6, c: 2, a: [2, 4], b: [3, 7] },
    // R7
    { r: 7, c: 1, a: [0, 7], b: [3, 5] },
    { r: 7, c: 2, a: [1, 4], b: [2, 6] },
  ];

  schedule.forEach((pr, idx) => {
    matches.push({
      id: `match-8p-rot-${idx + 1}`,
      roundNumber: pr.r,
      courtNumber: pr.c,
      teamA: { player1Id: p[pr.a[0]].id, player2Id: p[pr.a[1]].id },
      teamB: { player1Id: p[pr.b[0]].id, player2Id: p[pr.b[1]].id },
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    });
  });

  return { matches, totalRounds: 7, courtsCount: 2 };
}

/**
 * 10 JOGADORES - MODELO INTERGRUPOS (MÉTODO DO ÁUDIO DO MARCO ROZA)
 * Grupo 1: 0, 1, 2, 3, 4
 * Grupo 2: 5, 6, 7, 8, 9
 * Exatamente 10 jogos no total em 2 quadras (5 baterias de 5 minutos!)
 * - Todos os 10 atletas jogam rigorosamente 4 partidas e folgam exatamente 1 vez.
 * - Todas as 20 duplas formadas são 100% ÚNICAS (sem nenhuma dupla repetida).
 * - Todos os 10 confrontos são 100% inéditos.
 */
function generate10PlayersIntergrupos(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];

  // 5 Rodadas em 2 quadras = 10 jogos calibrados com isonomia perfeita
  const schedule = [
    // Rodada 1: Folgam 0 e 5
    { r: 1, c: 1, a: [1, 9], b: [4, 6] },
    { r: 1, c: 2, a: [3, 7], b: [2, 8] },
    // Rodada 2: Folgam 1 e 6
    { r: 2, c: 1, a: [2, 5], b: [0, 8] },
    { r: 2, c: 2, a: [3, 9], b: [4, 7] },
    // Rodada 3: Folgam 2 e 7
    { r: 3, c: 1, a: [0, 9], b: [3, 6] },
    { r: 3, c: 2, a: [1, 8], b: [4, 5] },
    // Rodada 4: Folgam 3 e 8
    { r: 4, c: 1, a: [2, 6], b: [4, 9] },
    { r: 4, c: 2, a: [0, 5], b: [1, 7] },
    // Rodada 5: Folgam 4 e 9
    { r: 5, c: 1, a: [2, 7], b: [0, 6] },
    { r: 5, c: 2, a: [3, 8], b: [1, 5] },
  ];

  schedule.forEach((pr, idx) => {
    matches.push({
      id: `match-10p-ig-${idx + 1}`,
      roundNumber: pr.r,
      courtNumber: pr.c,
      teamA: { player1Id: p[pr.a[0]].id, player2Id: p[pr.a[1]].id },
      teamB: { player1Id: p[pr.b[0]].id, player2Id: p[pr.b[1]].id },
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    });
  });

  return { matches, totalRounds: 5, courtsCount: 2 };
}

/**
 * 10 JOGADORES - ROTATIVO GERAL
 */
function generate10PlayersRotativo(p: MiniligaParticipant[]) {
  return generate10PlayersIntergrupos(p);
}

/**
 * 12 JOGADORES (3 Quadras) - Rodízio Completo
 * 5 Rodadas em 3 quadras simultâneas (15 jogos no total)
 * - Ocupação simultânea de 100% (sem folgas para nenhum aluno).
 * - Todos os 12 alunos jogam exatamente 5 vezes.
 * - Todas as 30 duplas formadas são 100% ÚNICAS (zero repetições).
 * - Todos os 15 confrontos são 100% inéditos com rotação equilibrada entre quadras.
 */
function generate12PlayersRotativo(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];
  const schedule = [
    // Rodada 1
    { r: 1, c: 1, a: [0, 5], b: [4, 11] },
    { r: 1, c: 2, a: [1, 10], b: [3, 8] },
    { r: 1, c: 3, a: [2, 9], b: [6, 7] },
    // Rodada 2
    { r: 2, c: 1, a: [1, 2], b: [6, 9] },
    { r: 2, c: 2, a: [0, 11], b: [4, 7] },
    { r: 2, c: 3, a: [3, 5], b: [8, 10] },
    // Rodada 3
    { r: 3, c: 1, a: [5, 9], b: [7, 8] },
    { r: 3, c: 2, a: [1, 6], b: [2, 3] },
    { r: 3, c: 3, a: [0, 4], b: [10, 11] },
    // Rodada 4
    { r: 4, c: 1, a: [1, 7], b: [3, 11] },
    { r: 4, c: 2, a: [0, 9], b: [2, 10] },
    { r: 4, c: 3, a: [4, 8], b: [5, 6] },
    // Rodada 5
    { r: 5, c: 1, a: [2, 6], b: [3, 10] },
    { r: 5, c: 2, a: [4, 5], b: [8, 11] },
    { r: 5, c: 3, a: [0, 1], b: [7, 9] },
  ];

  schedule.forEach((pr, idx) => {
    matches.push({
      id: `match-12p-rot-${idx + 1}`,
      roundNumber: pr.r,
      courtNumber: pr.c,
      teamA: { player1Id: p[pr.a[0]].id, player2Id: p[pr.a[1]].id },
      teamB: { player1Id: p[pr.b[0]].id, player2Id: p[pr.b[1]].id },
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    });
  });

  return { matches, totalRounds: 5, courtsCount: 3 };
}

/**
 * RECALCULAR CLASSIFICAÇÃO GERAL
 * Regra Marco Roza:
 * Total = Pontos Pró de Jogo + Pontos de Vitórias (1 pt por vitória)
 */
export function recalculateMiniligaStandings(
  participants: MiniligaParticipant[],
  matches: MiniligaMatch[]
): MiniligaParticipant[] {
  // Mapa de pontuação zerado
  const statsMap = new Map<
    string,
    {
      matchesPlayed: number;
      wins: number;
      losses: number;
      pointsFor: number;
      pointsAgainst: number;
    }
  >();

  participants.forEach((p) => {
    statsMap.set(p.id, {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });
  });

  // Percorrer jogos concluídos
  matches.forEach((m) => {
    if (!m.isCompleted || m.scoreA === null || m.scoreB === null) return;

    const teamAPlayers = [m.teamA.player1Id, m.teamA.player2Id].filter(
      Boolean
    ) as string[];
    const teamBPlayers = [m.teamB.player1Id, m.teamB.player2Id].filter(
      Boolean
    ) as string[];

    const aWon = m.scoreA > m.scoreB;
    const bWon = m.scoreB > m.scoreA;

    // Se a partida tiver dupla sorteada de apoio (ex: 8ª rodada para fechar 5 jogos),
    // seus pontos contam para os atletas que completam seu 5º jogo, mas não somam como 6º jogo para a dupla sorteada
    const supportIds = new Set(m.supportPairPlayerIds || []);

    // Team A
    teamAPlayers.forEach((pId) => {
      if (supportIds.has(pId)) return; // Não contabiliza jogo a mais para a dupla sorteada de apoio
      const curr = statsMap.get(pId);
      if (curr) {
        curr.matchesPlayed++;
        curr.pointsFor += m.scoreA!;
        curr.pointsAgainst += m.scoreB!;
        if (aWon) curr.wins++;
        else if (bWon) curr.losses++;
      }
    });

    // Team B
    teamBPlayers.forEach((pId) => {
      if (supportIds.has(pId)) return; // Não contabiliza jogo a mais para a dupla sorteada de apoio
      const curr = statsMap.get(pId);
      if (curr) {
        curr.matchesPlayed++;
        curr.pointsFor += m.scoreB!;
        curr.pointsAgainst += m.scoreA!;
        if (bWon) curr.wins++;
        else if (aWon) curr.losses++;
      }
    });
  });

  // Atualizar participantes
  const updated = participants.map((p) => {
    const s = statsMap.get(p.id)!;
    const balance = s.pointsFor - s.pointsAgainst;
    // REGRA DE OURO DO MARCO ROZA: Pontos de Jogo + Vitórias
    const totalScore = s.pointsFor + s.wins;

    return {
      ...p,
      matchesPlayed: s.matchesPlayed,
      wins: s.wins,
      losses: s.losses,
      pointsFor: s.pointsFor,
      pointsAgainst: s.pointsAgainst,
      pointsBalance: balance,
      totalScore,
    };
  });

  // Ordenar por TotalScore decrescente, depois Saldo, depois Pontos Pró
  updated.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.pointsBalance !== a.pointsBalance) return b.pointsBalance - a.pointsBalance;
    return b.pointsFor - a.pointsFor;
  });

  // Atribuir Rank e Pontos do Card (Ex: 1º ganha N, último ganha 1)
  const totalP = updated.length;
  return updated.map((p, idx) => ({
    ...p,
    rank: idx + 1,
    cardPointsAwarded: Math.max(1, totalP - idx),
  }));
}

/**
 * CRIAR JOGO DA GRANDE FINAL (1º+3º vs 2º+4º)
 */
export function createBonusFinalMatch(
  standings: MiniligaParticipant[],
  nextRoundNumber: number
): MiniligaMatch | null {
  if (standings.length < 4) return null;

  const p1 = standings[0];
  const p2 = standings[1];
  const p3 = standings[2];
  const p4 = standings[3];

  return {
    id: `match-bonus-final-${Date.now()}`,
    roundNumber: nextRoundNumber,
    courtNumber: 1,
    teamA: { player1Id: p1.id, player2Id: p3.id }, // 1º + 3º
    teamB: { player1Id: p2.id, player2Id: p4.id }, // 2º + 4º
    scoreA: null,
    scoreB: null,
    isCompleted: false,
    isBonusFinal: true,
  };
}

/**
 * CRIAR JOGO DE DESEMPATE SIMPLES (1º vs 2º)
 */
export function createTiebreakSimplesMatch(
  p1: MiniligaParticipant,
  p2: MiniligaParticipant,
  nextRoundNumber: number
): MiniligaMatch {
  return {
    id: `match-tiebreak-simples-${Date.now()}`,
    roundNumber: nextRoundNumber,
    courtNumber: 1,
    teamA: { player1Id: p1.id },
    teamB: { player1Id: p2.id },
    scoreA: null,
    scoreB: null,
    isCompleted: false,
    isTiebreakSimples: true,
  };
}
