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
 * 12 Rodadas no total (4 ciclos de 3 rodadas = 24 confrontos 100% inéditos).
 * Cada jogador do G1 faz dupla em 1 ciclo com cada participante do G2:
 * - Ciclo 1 (Rodadas 1 a 3): A1 joga com e1 (enfrenta B1/f1, C1/g1, D1/h1)
 * - Ciclo 2 (Rodadas 4 a 6): A1 joga com f1 (enfrenta B1/g1, C1/h1, D1/e1)
 * - Ciclo 3 (Rodadas 7 a 9): A1 joga com g1 (enfrenta B1/h1, C1/e1, D1/f1)
 * - Ciclo 4 (Rodadas 10 a 12): A1 joga com h1 (enfrenta B1/e1, C1/f1, D1/g1)
 * Todos os 8 alunos jogam exatamente 12 partidas!
 */
function generate8PlayersIntergrupos(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];

  const schedule = [
    // =======================================================
    // CICLO 1 (Rodada 1 do Marco): A1/B1, A2/B2, A3/B3, A4/B4
    // =======================================================
    // Bateria 1 (16:00 / :48)
    { r: 1, c: 1, a: [0, 4], b: [1, 5] }, // A1/B1 vs A2/B2
    { r: 1, c: 2, a: [2, 6], b: [3, 7] }, // A3/B3 vs A4/B4
    // Bateria 2 (16:00)
    { r: 2, c: 1, a: [0, 4], b: [2, 6] }, // A1/B1 vs A3/B3
    { r: 2, c: 2, a: [1, 5], b: [3, 7] }, // A2/B2 vs A4/B4
    // Bateria 3 (16:06)
    { r: 3, c: 1, a: [0, 4], b: [3, 7] }, // A1/B1 vs A4/B4
    { r: 3, c: 2, a: [1, 5], b: [2, 6] }, // A2/B2 vs A3/B3

    // =======================================================
    // CICLO 2 (Rodada 2 do Marco): A1/B2, A2/B1, A3/B4, A4/B3
    // =======================================================
    // Bateria 1 (16:13)
    { r: 4, c: 1, a: [0, 5], b: [1, 4] }, // A1/B2 vs A2/B1
    { r: 4, c: 2, a: [2, 7], b: [3, 6] }, // A3/B4 vs A4/B3
    // Bateria 2 (16:21)
    { r: 5, c: 1, a: [0, 5], b: [2, 7] }, // A1/B2 vs A3/B4
    { r: 5, c: 2, a: [1, 4], b: [3, 6] }, // A2/B1 vs A4/B3
    // Bateria 3 (16:28)
    { r: 6, c: 1, a: [0, 5], b: [3, 6] }, // A1/B2 vs A4/B3
    { r: 6, c: 2, a: [1, 4], b: [2, 7] }, // A2/B1 vs A3/B4

    // =======================================================
    // CICLO 3 (Rodada 3 do Marco): A1/B3, A2/B4, A3/B2, A4/B1
    // =======================================================
    // Bateria 1 (16:37)
    { r: 7, c: 1, a: [0, 6], b: [1, 7] }, // A1/B3 vs A2/B4
    { r: 7, c: 2, a: [2, 5], b: [3, 4] }, // A3/B2 vs A4/B1
    // Bateria 2 (16:44)
    { r: 8, c: 1, a: [0, 6], b: [2, 5] }, // A1/B3 vs A3/B2
    { r: 8, c: 2, a: [1, 7], b: [3, 4] }, // A2/B4 vs A4/B1
    // Bateria 3 (16:51)
    { r: 9, c: 1, a: [0, 6], b: [3, 4] }, // A1/B3 vs A4/B1
    { r: 9, c: 2, a: [1, 7], b: [2, 5] }, // A2/B4 vs A3/B2

    // =======================================================
    // CICLO 4 (Rodada 4 do Marco): A1/B4, A2/B3, A3/B1, A4/B2
    // =======================================================
    // Bateria 1
    { r: 10, c: 1, a: [0, 7], b: [1, 6] }, // A1/B4 vs A2/B3
    { r: 10, c: 2, a: [2, 4], b: [3, 5] }, // A3/B1 vs A4/B2
    // Bateria 2
    { r: 11, c: 1, a: [0, 7], b: [2, 4] }, // A1/B4 vs A3/B1
    { r: 11, c: 2, a: [1, 6], b: [3, 5] }, // A2/B3 vs A4/B2
    // Bateria 3
    { r: 12, c: 1, a: [0, 7], b: [3, 5] }, // A1/B4 vs A4/B2
    { r: 12, c: 2, a: [1, 6], b: [2, 4] }, // A2/B3 vs A3/B1
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

  return { matches, totalRounds: 12, courtsCount: 2 };
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
 * 10 JOGADORES (2 Quadras) - MODELO OFICIAL MARCO ROZA (MINI LIGA MISTA / REPOSIÇÕES)
 * 2 Grupos de 5:
 * Grupo A: A1, A2, A3, A4, A5 (índices 0, 1, 2, 3, 4)
 * Grupo B: B1, B2, B3, B4, B5 (índices 5, 6, 7, 8, 9)
 *
 * 6 Rodadas Oficiais com 2 Baterias cada (2 quadras simultâneas, 4 jogos por rodada) = 24 jogos.
 * 2 Jogos Extras de Sorteio (às 19h57 e 20h52) onde a dupla A5/B4 que folgou enfrenta duplas de apoio sorteadas = 2 jogos.
 * Total da Fase Classificatória: 26 jogos distribuídos em 14 entradas / baterias.
 * Todos os 10 atletas jogam rigorosamente 10 partidas na fase classificatória!
 */
function generate10PlayersIntergrupos(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];

  const schedule = [
    // =======================================================
    // RODADA OFICIAL 1: A1/B2, A3/B3, A4/B4, A5/B5 | Folgam: A2 e B1
    // =======================================================
    // Bateria 1 (19h15)
    { r: 1, c: 1, a: [0, 6], b: [2, 7] }, // A1/B2 vs A3/B3
    { r: 1, c: 2, a: [3, 8], b: [4, 9] }, // A4/B4 vs A5/B5
    // Bateria 2 (19h22)
    { r: 2, c: 1, a: [0, 6], b: [4, 9] }, // A1/B2 vs A5/B5
    { r: 2, c: 2, a: [3, 8], b: [2, 7] }, // A4/B4 vs A3/B3

    // =======================================================
    // RODADA OFICIAL 2: A2/B1, A5/B2, A3/B4, A4/B5 | Folgam: A1 e B3
    // =======================================================
    // Bateria 1 (19h29)
    { r: 3, c: 1, a: [1, 5], b: [4, 6] }, // A2/B1 vs A5/B2
    { r: 3, c: 2, a: [2, 8], b: [3, 9] }, // A3/B4 vs A4/B5
    // Bateria 2 (19h36)
    { r: 4, c: 1, a: [1, 5], b: [3, 9] }, // A2/B1 vs A4/B5
    { r: 4, c: 2, a: [4, 6], b: [2, 8] }, // A5/B2 vs A3/B4

    // =======================================================
    // RODADA OFICIAL 3: A1/B3, A3/B5, A2/B2, A4/B1 | Folgam: A5 e B4
    // =======================================================
    // Bateria 1 (19h43)
    { r: 5, c: 1, a: [0, 7], b: [2, 9] }, // A1/B3 vs A3/B5
    { r: 5, c: 2, a: [1, 6], b: [3, 5] }, // A2/B2 vs A4/B1
    // Bateria 2 (19h50)
    { r: 6, c: 1, a: [0, 7], b: [3, 5] }, // A1/B3 vs A4/B1
    { r: 6, c: 2, a: [1, 6], b: [2, 9] }, // A2/B2 vs A3/B5

    // =======================================================
    // JOGO EXTRA DE SORTEIO 1 (19h57)
    // A5 e B4 enfrentam dupla sorteada de apoio (ex: A1/B1)
    // A dupla de apoio não pontua extra para si mesma (suporte)
    // =======================================================
    { r: 7, c: 1, a: [4, 8], b: [0, 5], support: [0, 5] }, // A5/B4 vs Sorteio Sorteio

    // =======================================================
    // RODADA OFICIAL 4: A1/B4, A5/B1, A4/B3, A2/B5 | Folgam: A3 e B2
    // =======================================================
    // Bateria 1 (20h10)
    { r: 8, c: 1, a: [0, 8], b: [4, 5] }, // A1/B4 vs A5/B1
    { r: 8, c: 2, a: [3, 7], b: [1, 9] }, // A4/B3 vs A2/B5
    // Bateria 2 (20h17)
    { r: 9, c: 1, a: [0, 8], b: [3, 7] }, // A1/B4 vs A4/B3
    { r: 9, c: 2, a: [1, 9], b: [4, 5] }, // A2/B5 vs A5/B1

    // =======================================================
    // RODADA OFICIAL 5: A1/B1, A2/B4, A3/B2, A5/B3 | Folgam: A4 e B5
    // =======================================================
    // Bateria 1 (20h24)
    { r: 10, c: 1, a: [0, 5], b: [1, 8] }, // A1/B1 vs A2/B4
    { r: 10, c: 2, a: [2, 6], b: [4, 7] }, // A3/B2 vs A5/B3
    // Bateria 2 (20h31)
    { r: 11, c: 1, a: [0, 5], b: [4, 7] }, // A1/B1 vs A5/B3
    { r: 11, c: 2, a: [2, 6], b: [1, 8] }, // A3/B2 vs A2/B4

    // =======================================================
    // RODADA OFICIAL 6: A3/B1, A1/B5, A2/B3, A4/B2 | Folgam: A5 e B4
    // =======================================================
    // Bateria 1 (20h38)
    { r: 12, c: 1, a: [2, 5], b: [0, 9] }, // A3/B1 vs A1/B5
    { r: 12, c: 2, a: [1, 7], b: [3, 6] }, // A2/B3 vs A4/B2
    // Bateria 2 (20h45)
    { r: 13, c: 1, a: [3, 6], b: [0, 9] }, // A4/B2 vs A1/B5
    { r: 13, c: 2, a: [1, 7], b: [2, 5] }, // A2/B3 vs A3/B1

    // =======================================================
    // JOGO EXTRA DE SORTEIO 2 (20h52)
    // A5 e B4 enfrentam dupla sorteada de apoio (ex: A3/B3)
    // =======================================================
    { r: 14, c: 1, a: [4, 8], b: [2, 7], support: [2, 7] }, // A5/B4 vs Sorteio Sorteio
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
      ...(pr.support ? { supportPairPlayerIds: pr.support.map((i) => p[i].id) } : {}),
    });
  });

  return { matches, totalRounds: 14, courtsCount: 2 };
}

/**
 * 10 JOGADORES - ROTATIVO GERAL
 */
function generate10PlayersRotativo(p: MiniligaParticipant[]) {
  return generate10PlayersIntergrupos(p);
}

/**
 * 12 JOGADORES (3 Quadras) - MODELO OFICIAL MARCO ROZA (11 RODADAS COMPLETAS)
 * 11 Rodadas em 3 quadras simultâneas (33 jogos no total)
 * - Ocupação simultânea de 100% (todos os 12 alunos jogam em todas as 11 rodadas, sem nenhuma folga).
 * - Todos os 12 alunos jogam exatamente 11 vezes.
 * - Todas as 66 duplas possíveis são formadas: cada aluno joga com todos os outros 11 alunos exatamente UMA vez!
 * - Todos os 33 confrontos são 100% inéditos (zero repetição).
 */
function generate12PlayersRotativo(p: MiniligaParticipant[]) {
  const matches: MiniligaMatch[] = [];
  const schedule = [
    // Rodada 1
    { r: 1, c: 1, a: [0, 11], b: [1, 2] },
    { r: 1, c: 2, a: [3, 6], b: [4, 8] },
    { r: 1, c: 3, a: [5, 10], b: [7, 9] },
    // Rodada 2
    { r: 2, c: 1, a: [1, 11], b: [2, 3] },
    { r: 2, c: 2, a: [4, 7], b: [5, 9] },
    { r: 2, c: 3, a: [0, 6], b: [8, 10] },
    // Rodada 3
    { r: 3, c: 1, a: [2, 11], b: [3, 4] },
    { r: 3, c: 2, a: [5, 8], b: [6, 10] },
    { r: 3, c: 3, a: [1, 7], b: [0, 9] },
    // Rodada 4
    { r: 4, c: 1, a: [3, 11], b: [4, 5] },
    { r: 4, c: 2, a: [6, 9], b: [0, 7] },
    { r: 4, c: 3, a: [2, 8], b: [1, 10] },
    // Rodada 5
    { r: 5, c: 1, a: [4, 11], b: [5, 6] },
    { r: 5, c: 2, a: [7, 10], b: [1, 8] },
    { r: 5, c: 3, a: [3, 9], b: [0, 2] },
    // Rodada 6
    { r: 6, c: 1, a: [5, 11], b: [6, 7] },
    { r: 6, c: 2, a: [0, 8], b: [2, 9] },
    { r: 6, c: 3, a: [4, 10], b: [1, 3] },
    // Rodada 7
    { r: 7, c: 1, a: [6, 11], b: [7, 8] },
    { r: 7, c: 2, a: [1, 9], b: [3, 10] },
    { r: 7, c: 3, a: [0, 5], b: [2, 4] },
    // Rodada 8
    { r: 8, c: 1, a: [7, 11], b: [8, 9] },
    { r: 8, c: 2, a: [2, 10], b: [0, 4] },
    { r: 8, c: 3, a: [1, 6], b: [3, 5] },
    // Rodada 9
    { r: 9, c: 1, a: [8, 11], b: [9, 10] },
    { r: 9, c: 2, a: [0, 3], b: [1, 5] },
    { r: 9, c: 3, a: [2, 7], b: [4, 6] },
    // Rodada 10
    { r: 10, c: 1, a: [9, 11], b: [0, 10] },
    { r: 10, c: 2, a: [1, 4], b: [2, 6] },
    { r: 10, c: 3, a: [3, 8], b: [5, 7] },
    // Rodada 11
    { r: 11, c: 1, a: [10, 11], b: [0, 1] },
    { r: 11, c: 2, a: [2, 5], b: [3, 7] },
    { r: 11, c: 3, a: [4, 9], b: [6, 8] },
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

  return { matches, totalRounds: 11, courtsCount: 3 };
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

/**
 * INFORMAÇÕES DE CICLO E BATERIAS (MÉTODO MARCO ROZA - 8 JOGADORES INTERGRUPOS)
 * 4 Rodadas Oficiais x 3 Baterias cada = 12 Baterias / Entradas em Quadra.
 */
export interface Miniliga8PCycleInfo {
  oficialRound: number; // 1, 2, 3, 4
  bateriaIndex: number; // 1, 2, 3
  totalBateriasInRound: number; // 3
  pairsDescription: { tag: string; p1Index: number; p2Index: number; codeA: string; codeB: string }[];
}

export function get8PlayersCycleInfo(roundNumber: number): Miniliga8PCycleInfo {
  const boundedRound = Math.max(1, Math.min(12, roundNumber));
  const oficialRound = Math.ceil(boundedRound / 3);
  const bateriaIndex = ((boundedRound - 1) % 3) + 1;

  let pairs: { tag: string; p1Index: number; p2Index: number; codeA: string; codeB: string }[] = [];
  if (oficialRound === 1) {
    pairs = [
      { tag: "Dupla 1", p1Index: 0, p2Index: 4, codeA: "A1", codeB: "B1" },
      { tag: "Dupla 2", p1Index: 1, p2Index: 5, codeA: "A2", codeB: "B2" },
      { tag: "Dupla 3", p1Index: 2, p2Index: 6, codeA: "A3", codeB: "B3" },
      { tag: "Dupla 4", p1Index: 3, p2Index: 7, codeA: "A4", codeB: "B4" },
    ];
  } else if (oficialRound === 2) {
    pairs = [
      { tag: "Dupla 1", p1Index: 0, p2Index: 5, codeA: "A1", codeB: "B2" },
      { tag: "Dupla 2", p1Index: 1, p2Index: 4, codeA: "A2", codeB: "B1" },
      { tag: "Dupla 3", p1Index: 2, p2Index: 7, codeA: "A3", codeB: "B4" },
      { tag: "Dupla 4", p1Index: 3, p2Index: 6, codeA: "A4", codeB: "B3" },
    ];
  } else if (oficialRound === 3) {
    pairs = [
      { tag: "Dupla 1", p1Index: 0, p2Index: 6, codeA: "A1", codeB: "B3" },
      { tag: "Dupla 2", p1Index: 1, p2Index: 7, codeA: "A2", codeB: "B4" },
      { tag: "Dupla 3", p1Index: 2, p2Index: 5, codeA: "A3", codeB: "B2" },
      { tag: "Dupla 4", p1Index: 3, p2Index: 4, codeA: "A4", codeB: "B1" },
    ];
  } else {
    pairs = [
      { tag: "Dupla 1", p1Index: 0, p2Index: 7, codeA: "A1", codeB: "B4" },
      { tag: "Dupla 2", p1Index: 1, p2Index: 6, codeA: "A2", codeB: "B3" },
      { tag: "Dupla 3", p1Index: 2, p2Index: 4, codeA: "A3", codeB: "B1" },
      { tag: "Dupla 4", p1Index: 3, p2Index: 5, codeA: "A4", codeB: "B2" },
    ];
  }

  return {
    oficialRound,
    bateriaIndex,
    totalBateriasInRound: 3,
    pairsDescription: pairs,
  };
}

/**
 * OBTER CÓDIGO DA DUPLA/GRUPO DO JOGADOR (Ex: A1..A4, B1..B4)
 */
export function getPlayerGroupCode(
  participantId: string,
  participants: MiniligaParticipant[],
  modelType?: MiniligaModelType
): string | null {
  if (modelType === "intergrupos" && participants.length === 8) {
    const idx = participants.findIndex((p) => p.id === participantId);
    if (idx >= 0 && idx < 4) return `A${idx + 1}`;
    if (idx >= 4 && idx < 8) return `B${idx - 3}`;
  }
  if (modelType === "intergrupos" && participants.length === 10) {
    const idx = participants.findIndex((p) => p.id === participantId);
    if (idx >= 0 && idx < 5) return `A${idx + 1}`;
    if (idx >= 5 && idx < 10) return `B${idx - 4}`;
  }
  return null;
}

/**
 * INFORMAÇÕES DE CICLO E BATERIAS (MÉTODO MARCO ROZA - 10 JOGADORES INTERGRUPOS)
 * 6 Rodadas Oficiais x 2 Baterias cada + 2 Jogos de Sorteio de Apoio = 14 Entradas / Baterias
 */
export interface Miniliga10PCycleInfo {
  type: "rodada" | "sorteio";
  oficialRound?: number; // 1 a 6
  bateriaIndex?: number; // 1 ou 2
  horario: string;
  pairsDescription: { tag: string; p1Index: number; p2Index: number; codeA: string; codeB: string }[];
  restingDescription?: { p1Index: number; p2Index: number; codeA: string; codeB: string };
  isSorteio?: boolean;
}

export function get10PlayersCycleInfo(roundNumber: number): Miniliga10PCycleInfo {
  switch (roundNumber) {
    case 1:
      return {
        type: "rodada",
        oficialRound: 1,
        bateriaIndex: 1,
        horario: "19h15",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 0, p2Index: 6, codeA: "A1", codeB: "B2" },
          { tag: "Dupla 2", p1Index: 2, p2Index: 7, codeA: "A3", codeB: "B3" },
          { tag: "Dupla 3", p1Index: 3, p2Index: 8, codeA: "A4", codeB: "B4" },
          { tag: "Dupla 4", p1Index: 4, p2Index: 9, codeA: "A5", codeB: "B5" },
        ],
        restingDescription: { p1Index: 1, p2Index: 5, codeA: "A2", codeB: "B1" },
      };
    case 2:
      return {
        type: "rodada",
        oficialRound: 1,
        bateriaIndex: 2,
        horario: "19h22",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 0, p2Index: 6, codeA: "A1", codeB: "B2" },
          { tag: "Dupla 2", p1Index: 2, p2Index: 7, codeA: "A3", codeB: "B3" },
          { tag: "Dupla 3", p1Index: 3, p2Index: 8, codeA: "A4", codeB: "B4" },
          { tag: "Dupla 4", p1Index: 4, p2Index: 9, codeA: "A5", codeB: "B5" },
        ],
        restingDescription: { p1Index: 1, p2Index: 5, codeA: "A2", codeB: "B1" },
      };
    case 3:
      return {
        type: "rodada",
        oficialRound: 2,
        bateriaIndex: 1,
        horario: "19h29",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 1, p2Index: 5, codeA: "A2", codeB: "B1" },
          { tag: "Dupla 2", p1Index: 4, p2Index: 6, codeA: "A5", codeB: "B2" },
          { tag: "Dupla 3", p1Index: 2, p2Index: 8, codeA: "A3", codeB: "B4" },
          { tag: "Dupla 4", p1Index: 3, p2Index: 9, codeA: "A4", codeB: "B5" },
        ],
        restingDescription: { p1Index: 0, p2Index: 7, codeA: "A1", codeB: "B3" },
      };
    case 4:
      return {
        type: "rodada",
        oficialRound: 2,
        bateriaIndex: 2,
        horario: "19h36",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 1, p2Index: 5, codeA: "A2", codeB: "B1" },
          { tag: "Dupla 2", p1Index: 4, p2Index: 6, codeA: "A5", codeB: "B2" },
          { tag: "Dupla 3", p1Index: 2, p2Index: 8, codeA: "A3", codeB: "B4" },
          { tag: "Dupla 4", p1Index: 3, p2Index: 9, codeA: "A4", codeB: "B5" },
        ],
        restingDescription: { p1Index: 0, p2Index: 7, codeA: "A1", codeB: "B3" },
      };
    case 5:
      return {
        type: "rodada",
        oficialRound: 3,
        bateriaIndex: 1,
        horario: "19h43",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 0, p2Index: 7, codeA: "A1", codeB: "B3" },
          { tag: "Dupla 2", p1Index: 2, p2Index: 9, codeA: "A3", codeB: "B5" },
          { tag: "Dupla 3", p1Index: 1, p2Index: 6, codeA: "A2", codeB: "B2" },
          { tag: "Dupla 4", p1Index: 3, p2Index: 5, codeA: "A4", codeB: "B1" },
        ],
        restingDescription: { p1Index: 4, p2Index: 8, codeA: "A5", codeB: "B4" },
      };
    case 6:
      return {
        type: "rodada",
        oficialRound: 3,
        bateriaIndex: 2,
        horario: "19h50",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 0, p2Index: 7, codeA: "A1", codeB: "B3" },
          { tag: "Dupla 2", p1Index: 2, p2Index: 9, codeA: "A3", codeB: "B5" },
          { tag: "Dupla 3", p1Index: 1, p2Index: 6, codeA: "A2", codeB: "B2" },
          { tag: "Dupla 4", p1Index: 3, p2Index: 5, codeA: "A4", codeB: "B1" },
        ],
        restingDescription: { p1Index: 4, p2Index: 8, codeA: "A5", codeB: "B4" },
      };
    case 7:
      return {
        type: "sorteio",
        horario: "19h57",
        isSorteio: true,
        pairsDescription: [
          { tag: "Dupla que Folgou", p1Index: 4, p2Index: 8, codeA: "A5", codeB: "B4" },
          { tag: "Dupla Sorteada de Apoio", p1Index: 0, p2Index: 5, codeA: "A1", codeB: "B1" },
        ],
      };
    case 8:
      return {
        type: "rodada",
        oficialRound: 4,
        bateriaIndex: 1,
        horario: "20h10",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 0, p2Index: 8, codeA: "A1", codeB: "B4" },
          { tag: "Dupla 2", p1Index: 4, p2Index: 5, codeA: "A5", codeB: "B1" },
          { tag: "Dupla 3", p1Index: 3, p2Index: 7, codeA: "A4", codeB: "B3" },
          { tag: "Dupla 4", p1Index: 1, p2Index: 9, codeA: "A2", codeB: "B5" },
        ],
        restingDescription: { p1Index: 2, p2Index: 6, codeA: "A3", codeB: "B2" },
      };
    case 9:
      return {
        type: "rodada",
        oficialRound: 4,
        bateriaIndex: 2,
        horario: "20h17",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 0, p2Index: 8, codeA: "A1", codeB: "B4" },
          { tag: "Dupla 2", p1Index: 4, p2Index: 5, codeA: "A5", codeB: "B1" },
          { tag: "Dupla 3", p1Index: 3, p2Index: 7, codeA: "A4", codeB: "B3" },
          { tag: "Dupla 4", p1Index: 1, p2Index: 9, codeA: "A2", codeB: "B5" },
        ],
        restingDescription: { p1Index: 2, p2Index: 6, codeA: "A3", codeB: "B2" },
      };
    case 10:
      return {
        type: "rodada",
        oficialRound: 5,
        bateriaIndex: 1,
        horario: "20h24",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 0, p2Index: 5, codeA: "A1", codeB: "B1" },
          { tag: "Dupla 2", p1Index: 1, p2Index: 8, codeA: "A2", codeB: "B4" },
          { tag: "Dupla 3", p1Index: 2, p2Index: 6, codeA: "A3", codeB: "B2" },
          { tag: "Dupla 4", p1Index: 4, p2Index: 7, codeA: "A5", codeB: "B3" },
        ],
        restingDescription: { p1Index: 3, p2Index: 9, codeA: "A4", codeB: "B5" },
      };
    case 11:
      return {
        type: "rodada",
        oficialRound: 5,
        bateriaIndex: 2,
        horario: "20h31",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 0, p2Index: 5, codeA: "A1", codeB: "B1" },
          { tag: "Dupla 2", p1Index: 1, p2Index: 8, codeA: "A2", codeB: "B4" },
          { tag: "Dupla 3", p1Index: 2, p2Index: 6, codeA: "A3", codeB: "B2" },
          { tag: "Dupla 4", p1Index: 4, p2Index: 7, codeA: "A5", codeB: "B3" },
        ],
        restingDescription: { p1Index: 3, p2Index: 9, codeA: "A4", codeB: "B5" },
      };
    case 12:
      return {
        type: "rodada",
        oficialRound: 6,
        bateriaIndex: 1,
        horario: "20h38",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 2, p2Index: 5, codeA: "A3", codeB: "B1" },
          { tag: "Dupla 2", p1Index: 0, p2Index: 9, codeA: "A1", codeB: "B5" },
          { tag: "Dupla 3", p1Index: 1, p2Index: 7, codeA: "A2", codeB: "B3" },
          { tag: "Dupla 4", p1Index: 3, p2Index: 6, codeA: "A4", codeB: "B2" },
        ],
        restingDescription: { p1Index: 4, p2Index: 8, codeA: "A5", codeB: "B4" },
      };
    case 13:
      return {
        type: "rodada",
        oficialRound: 6,
        bateriaIndex: 2,
        horario: "20h45",
        pairsDescription: [
          { tag: "Dupla 1", p1Index: 2, p2Index: 5, codeA: "A3", codeB: "B1" },
          { tag: "Dupla 2", p1Index: 0, p2Index: 9, codeA: "A1", codeB: "B5" },
          { tag: "Dupla 3", p1Index: 1, p2Index: 7, codeA: "A2", codeB: "B3" },
          { tag: "Dupla 4", p1Index: 3, p2Index: 6, codeA: "A4", codeB: "B2" },
        ],
        restingDescription: { p1Index: 4, p2Index: 8, codeA: "A5", codeB: "B4" },
      };
    case 14:
      return {
        type: "sorteio",
        horario: "20h52",
        isSorteio: true,
        pairsDescription: [
          { tag: "Dupla que Folgou", p1Index: 4, p2Index: 8, codeA: "A5", codeB: "B4" },
          { tag: "Dupla Sorteada de Apoio", p1Index: 2, p2Index: 7, codeA: "A3", codeB: "B3" },
        ],
      };
    default:
      return {
        type: "rodada",
        horario: "21h00",
        pairsDescription: [],
      };
  }
}

/**
 * CRIAR JOGOS DAS SEMIFINAIS (MÉTODO MARCO ROZA - 10 JOGADORES)
 * 21h00:
 * Quadra 1: 1º A + 1ª B  x  4º A + 4ª B
 * Quadra 2: 2º A + 2ª B  x  3º A + 3ª B
 */
export function create10PlayersSemifinalsMatches(
  standings: MiniligaParticipant[],
  nextRoundNumber: number
): MiniligaMatch[] {
  const groupA = standings.filter((p) => p.groupNumber === 1);
  const groupB = standings.filter((p) => p.groupNumber === 2);

  if (groupA.length < 4 || groupB.length < 4) return [];

  const a1 = groupA[0]; // 1º A
  const a2 = groupA[1]; // 2º A
  const a3 = groupA[2]; // 3º A
  const a4 = groupA[3]; // 4º A

  const b1 = groupB[0]; // 1ª B
  const b2 = groupB[1]; // 2ª B
  const b3 = groupB[2]; // 3ª B
  const b4 = groupB[3]; // 4ª B

  return [
    {
      id: `match-10p-semi-1-${Date.now()}`,
      roundNumber: nextRoundNumber,
      courtNumber: 1,
      teamA: { player1Id: a1.id, player2Id: b1.id }, // 1º A + 1ª B
      teamB: { player1Id: a4.id, player2Id: b4.id }, // 4º A + 4ª B
      scoreA: null,
      scoreB: null,
      isCompleted: false,
      isSemifinal: true,
    },
    {
      id: `match-10p-semi-2-${Date.now() + 1}`,
      roundNumber: nextRoundNumber,
      courtNumber: 2,
      teamA: { player1Id: a2.id, player2Id: b2.id }, // 2º A + 2ª B
      teamB: { player1Id: a3.id, player2Id: b3.id }, // 3º A + 3ª B
      scoreA: null,
      scoreB: null,
      isCompleted: false,
      isSemifinal: true,
    },
  ];
}

/**
 * CRIAR JOGO DA GRANDE FINAL (MÉTODO MARCO ROZA - 10 JOGADORES)
 * 21h10:
 * Quadra 1: Vencedor Semi 1  x  Vencedor Semi 2
 */
export function create10PlayersFinalMatch(
  semi1Match: MiniligaMatch,
  semi2Match: MiniligaMatch,
  nextRoundNumber: number
): MiniligaMatch | null {
  if (!semi1Match.isCompleted || !semi2Match.isCompleted) return null;

  const s1Winner = (semi1Match.scoreA ?? 0) >= (semi1Match.scoreB ?? 0) ? semi1Match.teamA : semi1Match.teamB;
  const s2Winner = (semi2Match.scoreA ?? 0) >= (semi2Match.scoreB ?? 0) ? semi2Match.teamA : semi2Match.teamB;

  return {
    id: `match-10p-final-${Date.now()}`,
    roundNumber: nextRoundNumber,
    courtNumber: 1,
    teamA: { player1Id: s1Winner.player1Id, player2Id: s1Winner.player2Id },
    teamB: { player1Id: s2Winner.player1Id, player2Id: s2Winner.player2Id },
    scoreA: null,
    scoreB: null,
    isCompleted: false,
    isBonusFinal: true,
  };
}


