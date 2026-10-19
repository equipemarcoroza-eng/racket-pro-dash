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
 * - Rodadas 1 a 6: cada um joga 4 vezes e descansa 2 vezes.
 * - Rodada 7: alunos 0, 1, 2 e 3 jogam sua 5ª partida oficial.
 * - Rodada 8: alunos 4 e 5 jogam sua 5ª partida oficial.
 *   Para completar os 4 na quadra, é SORTEADA UMA DUPLA dentre os alunos {0, 1, 2, 3}
 *   para entrar como parceiros de apoio.
 *   Essa dupla sorteada não pontua extra em seu ranking individual (garantindo que todos
 *   os 6 alunos fechem rigorosamente com 5 jogos válidos).
 */
function generate6Players5Jogos(p: MiniligaParticipant[]) {
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
      id: `match-6p-5j-r${s.r}-c1`,
      roundNumber: s.r,
      courtNumber: 1,
      teamA: { player1Id: p[s.a[0]].id, player2Id: p[s.a[1]].id },
      teamB: { player1Id: p[s.b[0]].id, player2Id: p[s.b[1]].id },
      scoreA: null,
      scoreB: null,
      isCompleted: false,
    });
  });

  // Rodada 7: Atletas 0, 1, 2 e 3 completam seu 5º jogo
  matches.push({
    id: `match-6p-5j-r7-c1`,
    roundNumber: 7,
    courtNumber: 1,
    teamA: { player1Id: p[0].id, player2Id: p[1].id },
    teamB: { player1Id: p[2].id, player2Id: p[3].id },
    scoreA: null,
    scoreB: null,
    isCompleted: false,
  });

  // Rodada 8: Atletas 4 e 5 completam seu 5º jogo!
  // Sorteia uma dupla entre os alunos {0, 1, 2, 3} para completar a quadra
  const candidates = [0, 1, 2, 3];
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const supportIndex1 = shuffled[0];
  const supportIndex2 = shuffled[1];

  matches.push({
    id: `match-6p-5j-r8-c1`,
    roundNumber: 8,
    courtNumber: 1,
    teamA: { player1Id: p[4].id, player2Id: p[supportIndex1].id },
    teamB: { player1Id: p[5].id, player2Id: p[supportIndex2].id },
    scoreA: null,
    scoreB: null,
    isCompleted: false,
    supportPairPlayerIds: [p[supportIndex1].id, p[supportIndex2].id],
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
 * 8 JOGADORES - MODELO INTERGRUPOS (MÉTODO DO ÁUDIO DO MARCO ROZA)
 * Grupo 1: 0, 1, 2, 3 (P1, P2, P3, P4)
 * Grupo 2: 4, 5, 6, 7 (P5, P6, P7, P8)
 * 2 Quadras simultâneas.
 * Cada jogador do G1 faz dupla com cada um do G2.
 * Mini-ciclos de 3 jogos por rodada, totalizando 12 jogos!
 */
function generate8PlayersIntergrupos(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];

  // Duplas formadas:
  // Ciclo 1: [0+4, 1+5, 2+6, 3+7]
  // Cada dupla joga contra as outras 3 (total 3 jogos por dupla).
  // Distribuídos em 2 quadras paralelas:
  // Bateria 1 (Rodada 1): Q1 [0+4 vs 1+5], Q2 [2+6 vs 3+7]
  // Bateria 2 (Rodada 2): Q1 [0+4 vs 2+6], Q2 [1+5 vs 3+7]
  // Bateria 3 (Rodada 3): Q1 [0+4 vs 3+7], Q2 [1+5 vs 2+6]
  //
  // Ciclo 2 (Rotaciona parcerias do Grupo 2): [0+5, 1+6, 2+7, 3+4]
  // Bateria 4 (Rodada 4): Q1 [0+5 vs 1+6], Q2 [2+7 vs 3+4]
  // Bateria 5 (Rodada 5): Q1 [0+5 vs 2+7], Q2 [1+6 vs 3+4]
  // Bateria 6 (Rodada 6): Q1 [0+5 vs 3+4], Q2 [1+6 vs 2+7]

  const pairRounds = [
    // Rodada 1
    { r: 1, c: 1, a: [0, 4], b: [1, 5] },
    { r: 1, c: 2, a: [2, 6], b: [3, 7] },
    // Rodada 2
    { r: 2, c: 1, a: [0, 4], b: [2, 6] },
    { r: 2, c: 2, a: [1, 5], b: [3, 7] },
    // Rodada 3
    { r: 3, c: 1, a: [0, 4], b: [3, 7] },
    { r: 3, c: 2, a: [1, 5], b: [2, 6] },
    // Rodada 4
    { r: 4, c: 1, a: [0, 5], b: [1, 6] },
    { r: 4, c: 2, a: [2, 7], b: [3, 4] },
    // Rodada 5
    { r: 5, c: 1, a: [0, 5], b: [2, 7] },
    { r: 5, c: 2, a: [1, 6], b: [3, 4] },
    // Rodada 6
    { r: 6, c: 1, a: [0, 5], b: [3, 4] },
    { r: 6, c: 2, a: [1, 6], b: [2, 7] },
  ];

  pairRounds.forEach((pr, idx) => {
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

  return { matches, totalRounds: 6, courtsCount: 2 };
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
 */
function generate10PlayersIntergrupos(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];

  // 5 Rodadas em 2 quadras = 10 jogos!
  // A cada rodada, 8 jogam e 2 folgam (1 do G1 e 1 do G2 descansam)
  const schedule = [
    // Rodada 1: Folgam 4 e 9
    { r: 1, c: 1, a: [0, 5], b: [1, 6] },
    { r: 1, c: 2, a: [2, 7], b: [3, 8] },
    // Rodada 2: Folgam 0 e 5
    { r: 2, c: 1, a: [1, 7], b: [2, 8] },
    { r: 2, c: 2, a: [3, 9], b: [4, 6] },
    // Rodada 3: Folgam 1 e 6
    { r: 3, c: 1, a: [2, 9], b: [3, 5] },
    { r: 3, c: 2, a: [4, 7], b: [0, 8] },
    // Rodada 4: Folgam 2 e 7
    { r: 4, c: 1, a: [3, 6], b: [4, 8] },
    { r: 4, c: 2, a: [0, 9], b: [1, 5] },
    // Rodada 5: Folgam 3 e 8
    { r: 5, c: 1, a: [4, 5], b: [0, 6] },
    { r: 5, c: 2, a: [1, 8], b: [2, 9] },
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
  // Similar estrutura de 5 rodadas em 2 quadras
  return generate10PlayersIntergrupos(p);
}

/**
 * 12 JOGADORES (3 Quadras) - Rodízio Completo
 * 5 Rodadas em 3 quadras simultâneas
 */
function generate12PlayersRotativo(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];
  const schedule = [
    // R1
    { r: 1, c: 1, a: [0, 1], b: [2, 3] },
    { r: 1, c: 2, a: [4, 5], b: [6, 7] },
    { r: 1, c: 3, a: [8, 9], b: [10, 11] },
    // R2
    { r: 2, c: 1, a: [0, 4], b: [8, 1] },
    { r: 2, c: 2, a: [2, 6], b: [10, 5] },
    { r: 2, c: 3, a: [3, 7], b: [11, 9] },
    // R3
    { r: 3, c: 1, a: [0, 7], b: [10, 2] },
    { r: 3, c: 2, a: [1, 6], b: [11, 4] },
    { r: 3, c: 3, a: [3, 5], b: [8, 9] },
    // R4
    { r: 4, c: 1, a: [0, 10], b: [5, 6] },
    { r: 4, c: 2, a: [1, 9], b: [2, 7] },
    { r: 4, c: 3, a: [3, 8], b: [4, 11] },
    // R5
    { r: 5, c: 1, a: [0, 11], b: [1, 2] },
    { r: 5, c: 2, a: [3, 4], b: [5, 8] },
    { r: 5, c: 3, a: [6, 9], b: [7, 10] },
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
