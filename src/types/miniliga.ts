export type MiniligaParticipantCount = 5 | 6 | 8 | 10 | 12;

export type MiniligaModelType = "rotativo" | "intergrupos" | "rotativo_5jogos";

export interface MiniligaParticipant {
  id: string; // unique ID in this miniliga session
  studentId?: string | null; // ID from students table if linked
  name: string;
  avatarUrl?: string | null;
  groupNumber?: 1 | 2; // For intergroups (Grupo 1 or Grupo 2)
  assignedNumber?: number; // 1..N
  
  // Scoring
  matchesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number; // PP (Pontos Pró feitos nos 5 minutos)
  pointsAgainst: number; // PC (Pontos Contra levados)
  pointsBalance: number; // Saldo (PP - PC)
  
  // Master score: PP + Wins (Marco Roza rule)
  totalScore: number;
  
  // Placement & Rewards
  rank?: number;
  cardPointsAwarded?: number; // 5, 4, 3, 2, 1...
}

export interface MiniligaMatch {
  id: string;
  roundNumber: number;
  courtNumber: number; // 1, 2, 3
  
  // Team A
  teamA: {
    player1Id: string;
    player2Id?: string; // Optional for singles tiebreak
  };
  
  // Team B
  teamB: {
    player1Id: string;
    player2Id?: string; // Optional for singles tiebreak
  };
  
  scoreA: number | null;
  scoreB: number | null;
  
  isCompleted: boolean;
  isBonusFinal?: boolean; // 1º+3º vs 2º+4º
  isTiebreakSimples?: boolean; // Partida Extra de Simples 1º vs 2º
  
  // Dupla sorteada para completar a rodada de 5 jogos (não pontua extra para si mesma)
  supportPairPlayerIds?: string[];

  // Timestamp
  finishedAt?: string | null;
}

export interface MiniligaSession {
  id: string;
  title: string;
  date: string;
  participantCount: MiniligaParticipantCount;
  modelType: MiniligaModelType;
  courtsCount: number;
  
  // Time control per match in seconds (default 300 = 5 min)
  durationSeconds: number;
  currentRound: number;
  totalRounds: number;
  status: "configuracao" | "em_andamento" | "aguardando_final" | "finalizada";
  
  participants: MiniligaParticipant[];
  matches: MiniligaMatch[];
  
  // Special matches flags
  hasBonusFinal: boolean;
  hasTiebreakSimples: boolean;
  
  // Modo de operação: Simulação (Sandbox de teste) vs Real (Oficial com pontos no card)
  isSimulation?: boolean;
  
  createdAt: string;
  updatedAt: string;
}
