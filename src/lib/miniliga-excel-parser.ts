import { MiniligaSession, MiniligaParticipant, MiniligaMatch } from "@/types/miniliga";
import { Student } from "@/data/mockData";

export interface ParsedTournamentData {
  sheetName: string;
  title: string;
  date: string;
  participantCount: 5 | 6 | 8 | 10;
  matchesCount: number;
  participants: Array<{
    name: string;
    isGuest: boolean;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    pointsBalance: number;
    rank: number;
    cardPointsAwarded: number;
    studentId?: string | null;
  }>;
  matches: Array<{
    id: string;
    roundNumber: number;
    courtNumber: number;
    teamA: { player1Name: string; player2Name?: string };
    teamB: { player1Name: string; player2Name?: string };
    scoreA: number;
    scoreB: number;
    isBonusFinal?: boolean;
    isSemifinal?: boolean;
  }>;
}

// Dados pré-processados da planilha oficial "Planilha Mini Liga Marco Roza.xlsx"
export const PREPARSED_MARCO_ROZA_MINILIGAS: ParsedTournamentData[] = [
  {
    sheetName: "10 jogadores",
    title: "Mini Liga niver MR",
    date: "2026-10-08",
    participantCount: 10,
    matchesCount: 29,
    participants: [
      { name: "Ida Maria", isGuest: true, wins: 8, losses: 4, pointsFor: 183, pointsAgainst: 144, pointsBalance: 39, rank: 1, cardPointsAwarded: 10 },
      { name: "Valdeci Silva", isGuest: true, wins: 8, losses: 4, pointsFor: 174, pointsAgainst: 136, pointsBalance: 38, rank: 2, cardPointsAwarded: 8 },
      { name: "Fabiele de Paulo", isGuest: true, wins: 8, losses: 4, pointsFor: 154, pointsAgainst: 127, pointsBalance: 27, rank: 3, cardPointsAwarded: 6 },
      { name: "Beatriz Galli", isGuest: false, wins: 7, losses: 4, pointsFor: 142, pointsAgainst: 144, pointsBalance: -2, rank: 4, cardPointsAwarded: 5 },
      { name: "Fabiano Vecchi", isGuest: false, wins: 7, losses: 6, pointsFor: 157, pointsAgainst: 175, pointsBalance: -18, rank: 5, cardPointsAwarded: 4 },
      { name: "Juliano Vecchi", isGuest: false, wins: 6, losses: 5, pointsFor: 140, pointsAgainst: 135, pointsBalance: 5, rank: 6, cardPointsAwarded: 3 },
      { name: "Ricardo Khouri", isGuest: false, wins: 4, losses: 7, pointsFor: 146, pointsAgainst: 145, pointsBalance: 1, rank: 7, cardPointsAwarded: 3 },
      { name: "Daniela Roza", isGuest: false, wins: 4, losses: 8, pointsFor: 144, pointsAgainst: 152, pointsBalance: -8, rank: 8, cardPointsAwarded: 3 },
      { name: "Luiz Felipe", isGuest: false, wins: 4, losses: 7, pointsFor: 125, pointsAgainst: 151, pointsBalance: -26, rank: 9, cardPointsAwarded: 3 },
      { name: "Daniele Chueiri", isGuest: false, wins: 2, losses: 9, pointsFor: 119, pointsAgainst: 175, pointsBalance: -56, rank: 10, cardPointsAwarded: 3 },
    ],
    matches: [
      { id: "m-mr-1", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Juliano Vecchi", player2Name: "Daniela Roza" }, teamB: { player1Name: "Valdeci Silva", player2Name: "Beatriz Galli" }, scoreA: 11, scoreB: 14 },
      { id: "m-mr-2", roundNumber: 1, courtNumber: 2, teamA: { player1Name: "Fabiano Vecchi", player2Name: "Fabiele de Paulo" }, teamB: { player1Name: "Luiz Felipe", player2Name: "Daniele Chueiri" }, scoreA: 15, scoreB: 10 },
      { id: "m-mr-3", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Daniela Roza", player2Name: "Juliano Vecchi" }, teamB: { player1Name: "Luiz Felipe", player2Name: "Daniele Chueiri" }, scoreA: 16, scoreB: 10 },
      { id: "m-mr-4", roundNumber: 1, courtNumber: 2, teamA: { player1Name: "Fabiano Vecchi", player2Name: "Fabiele de Paulo" }, teamB: { player1Name: "Valdeci Silva", player2Name: "Beatriz Galli" }, scoreA: 14, scoreB: 11 },
      { id: "m-mr-5", roundNumber: 2, courtNumber: 1, teamA: { player1Name: "Ricardo Khouri", player2Name: "Ida Maria" }, teamB: { player1Name: "Luiz Felipe", player2Name: "Daniela Roza" }, scoreA: 11, scoreB: 16 },
      { id: "m-mr-6", roundNumber: 2, courtNumber: 2, teamA: { player1Name: "Valdeci Silva", player2Name: "Fabiele de Paulo" }, teamB: { player1Name: "Fabiano Vecchi", player2Name: "Daniele Chueiri" }, scoreA: 18, scoreB: 6 },
      { id: "m-mr-7", roundNumber: 2, courtNumber: 1, teamA: { player1Name: "Ricardo Khouri", player2Name: "Ida Maria" }, teamB: { player1Name: "Fabiano Vecchi", player2Name: "Daniele Chueiri" }, scoreA: 18, scoreB: 11 },
      { id: "m-mr-8", roundNumber: 2, courtNumber: 2, teamA: { player1Name: "Luiz Felipe", player2Name: "Daniela Roza" }, teamB: { player1Name: "Valdeci Silva", player2Name: "Fabiele de Paulo" }, scoreA: 7, scoreB: 18 },
      { id: "m-mr-9", roundNumber: 3, courtNumber: 1, teamA: { player1Name: "Juliano Vecchi", player2Name: "Beatriz Galli" }, teamB: { player1Name: "Valdeci Silva", player2Name: "Daniele Chueiri" }, scoreA: 15, scoreB: 9 },
      { id: "m-mr-10", roundNumber: 3, courtNumber: 2, teamA: { player1Name: "Ricardo Khouri", player2Name: "Daniela Roza" }, teamB: { player1Name: "Fabiano Vecchi", player2Name: "Ida Maria" }, scoreA: 14, scoreB: 15 },
      { id: "m-mr-11", roundNumber: 3, courtNumber: 1, teamA: { player1Name: "Juliano Vecchi", player2Name: "Beatriz Galli" }, teamB: { player1Name: "Fabiano Vecchi", player2Name: "Ida Maria" }, scoreA: 14, scoreB: 12 },
      { id: "m-mr-12", roundNumber: 3, courtNumber: 2, teamA: { player1Name: "Ricardo Khouri", player2Name: "Daniela Roza" }, teamB: { player1Name: "Valdeci Silva", player2Name: "Daniele Chueiri" }, scoreA: 14, scoreB: 15 },
      { id: "m-mr-13", roundNumber: 4, courtNumber: 1, teamA: { player1Name: "Luiz Felipe", player2Name: "Fabiele de Paulo" }, teamB: { player1Name: "Fabiano Vecchi", player2Name: "Daniele Chueiri" }, scoreA: 16, scoreB: 9 },
      { id: "m-mr-14", roundNumber: 4, courtNumber: 2, teamA: { player1Name: "Juliano Vecchi", player2Name: "Fabiele de Paulo" }, teamB: { player1Name: "Luiz Felipe", player2Name: "Ida Maria" }, scoreA: 12, scoreB: 11 },
      { id: "m-mr-15", roundNumber: 4, courtNumber: 1, teamA: { player1Name: "Fabiano Vecchi", player2Name: "Beatriz Galli" }, teamB: { player1Name: "Ricardo Khouri", player2Name: "Daniele Chueiri" }, scoreA: 15, scoreB: 14 },
      { id: "m-mr-16", roundNumber: 4, courtNumber: 2, teamA: { player1Name: "Juliano Vecchi", player2Name: "Fabiele de Paulo" }, teamB: { player1Name: "Fabiano Vecchi", player2Name: "Beatriz Galli" }, scoreA: 11, scoreB: 12 },
      { id: "m-mr-17", roundNumber: 4, courtNumber: 1, teamA: { player1Name: "Ricardo Khouri", player2Name: "Daniele Chueiri" }, teamB: { player1Name: "Luiz Felipe", player2Name: "Ida Maria" }, scoreA: 12, scoreB: 18 },
      { id: "m-mr-18", roundNumber: 5, courtNumber: 2, teamA: { player1Name: "Juliano Vecchi", player2Name: "Ida Maria" }, teamB: { player1Name: "Ricardo Khouri", player2Name: "Fabiele de Paulo" }, scoreA: 11, scoreB: 12 },
      { id: "m-mr-19", roundNumber: 5, courtNumber: 1, teamA: { player1Name: "Valdeci Silva", player2Name: "Daniela Roza" }, teamB: { player1Name: "Luiz Felipe", player2Name: "Beatriz Galli" }, scoreA: 14, scoreB: 15 },
      { id: "m-mr-20", roundNumber: 5, courtNumber: 2, teamA: { player1Name: "Juliano Vecchi", player2Name: "Ida Maria" }, teamB: { player1Name: "Luiz Felipe", player2Name: "Beatriz Galli" }, scoreA: 18, scoreB: 7 },
      { id: "m-mr-21", roundNumber: 5, courtNumber: 1, teamA: { player1Name: "Valdeci Silva", player2Name: "Daniela Roza" }, teamB: { player1Name: "Ricardo Khouri", player2Name: "Fabiele de Paulo" }, scoreA: 14, scoreB: 7 },
      { id: "m-mr-22", roundNumber: 6, courtNumber: 2, teamA: { player1Name: "Valdeci Silva", player2Name: "Ida Maria" }, teamB: { player1Name: "Juliano Vecchi", player2Name: "Daniele Chueiri" }, scoreA: 22, scoreB: 11 },
      { id: "m-mr-23", roundNumber: 6, courtNumber: 1, teamA: { player1Name: "Ricardo Khouri", player2Name: "Beatriz Galli" }, teamB: { player1Name: "Fabiano Vecchi", player2Name: "Daniela Roza" }, scoreA: 16, scoreB: 8 },
      { id: "m-mr-24", roundNumber: 6, courtNumber: 1, teamA: { player1Name: "Fabiano Vecchi", player2Name: "Daniela Roza" }, teamB: { player1Name: "Juliano Vecchi", player2Name: "Daniele Chueiri" }, scoreA: 8, scoreB: 12 },
      { id: "m-mr-25", roundNumber: 6, courtNumber: 2, teamA: { player1Name: "Ricardo Khouri", player2Name: "Beatriz Galli" }, teamB: { player1Name: "Valdeci Silva", player2Name: "Ida Maria" }, scoreA: 14, scoreB: 15 },
      { id: "m-mr-26", roundNumber: 6, courtNumber: 1, teamA: { player1Name: "Luiz Felipe", player2Name: "Fabiele de Paulo" }, teamB: { player1Name: "Ricardo Khouri", player2Name: "Daniela Roza" }, scoreA: 7, scoreB: 14 },
      { id: "m-mr-27", roundNumber: 7, courtNumber: 2, teamA: { player1Name: "Valdeci Silva", player2Name: "Fabiele de Paulo" }, teamB: { player1Name: "Luiz Felipe", player2Name: "Daniela Roza" }, scoreA: 12, scoreB: 8, isSemifinal: true },
      { id: "m-mr-28", roundNumber: 7, courtNumber: 1, teamA: { player1Name: "Juliano Vecchi", player2Name: "Beatriz Galli" }, teamB: { player1Name: "Fabiano Vecchi", player2Name: "Ida Maria" }, scoreA: 9, scoreB: 18, isSemifinal: true },
      { id: "m-mr-29", roundNumber: 8, courtNumber: 2, teamA: { player1Name: "Valdeci Silva", player2Name: "Fabiele de Paulo" }, teamB: { player1Name: "Fabiano Vecchi", player2Name: "Ida Maria" }, scoreA: 12, scoreB: 14, isBonusFinal: true },
    ],
  },
  {
    sheetName: "8 jogadores",
    title: "Mini Liga Adulta Juvenil",
    date: "2026-10-12",
    participantCount: 8,
    matchesCount: 25,
    participants: [
      { name: "Daniela Roza", isGuest: false, wins: 10, losses: 3, pointsFor: 186, pointsAgainst: 131, pointsBalance: 55, rank: 1, cardPointsAwarded: 10 },
      { name: "Juliano vecchi", isGuest: false, wins: 8, losses: 5, pointsFor: 184, pointsAgainst: 142, pointsBalance: 42, rank: 2, cardPointsAwarded: 8 },
      { name: "Alexandre Takatsu", isGuest: false, wins: 8, losses: 5, pointsFor: 164, pointsAgainst: 155, pointsBalance: 9, rank: 3, cardPointsAwarded: 6 },
      { name: "Henri Fogagnoli", isGuest: false, wins: 8, losses: 5, pointsFor: 150, pointsAgainst: 154, pointsBalance: -4, rank: 4, cardPointsAwarded: 5 },
      { name: "Luigi de Bortoli", isGuest: false, wins: 6, losses: 6, pointsFor: 148, pointsAgainst: 169, pointsBalance: -21, rank: 5, cardPointsAwarded: 4 },
      { name: "Cristiane Tragueta", isGuest: false, wins: 4, losses: 8, pointsFor: 143, pointsAgainst: 169, pointsBalance: -26, rank: 6, cardPointsAwarded: 3 },
      { name: "Beatriz Galli", isGuest: false, wins: 3, losses: 9, pointsFor: 138, pointsAgainst: 155, pointsBalance: -17, rank: 7, cardPointsAwarded: 3 },
      { name: "Francisco Furlan", isGuest: false, wins: 3, losses: 9, pointsFor: 127, pointsAgainst: 165, pointsBalance: -38, rank: 8, cardPointsAwarded: 3 },
    ],
    matches: [
      { id: "m-aj-1", roundNumber: 1, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Alexandre Takatsu" }, teamB: { player1Name: "Beatriz Galli", player2Name: "Daniela Roza" }, scoreA: 13, scoreB: 11 },
      { id: "m-aj-2", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Luigi de Bortoli", player2Name: "Francisco Furlan" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Cristiane Tragueta" }, scoreA: 15, scoreB: 12 },
      { id: "m-aj-3", roundNumber: 1, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Alexandre Takatsu" }, teamB: { player1Name: "Luigi de Bortoli", player2Name: "Francisco Furlan" }, scoreA: 12, scoreB: 7 },
      { id: "m-aj-4", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Beatriz Galli", player2Name: "Daniela Roza" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Cristiane Tragueta" }, scoreA: 11, scoreB: 14 },
      { id: "m-aj-5", roundNumber: 1, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Alexandre Takatsu" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Cristiane Tragueta" }, scoreA: 10, scoreB: 15 },
      { id: "m-aj-6", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Beatriz Galli", player2Name: "Daniela Roza" }, teamB: { player1Name: "Luigi de Bortoli", player2Name: "Francisco Furlan" }, scoreA: 18, scoreB: 6 },
      { id: "m-aj-7", roundNumber: 2, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Daniela Roza" }, teamB: { player1Name: "Beatriz Galli", player2Name: "Alexandre Takatsu" }, scoreA: 12, scoreB: 5 },
      { id: "m-aj-8", roundNumber: 2, courtNumber: 1, teamA: { player1Name: "Luigi de Bortoli", player2Name: "Cristiane Tragueta" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Francisco Furlan" }, scoreA: 15, scoreB: 14 },
      { id: "m-aj-9", roundNumber: 2, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Daniela Roza" }, teamB: { player1Name: "Luigi de Bortoli", player2Name: "Cristiane Tragueta" }, scoreA: 16, scoreB: 7 },
      { id: "m-aj-10", roundNumber: 2, courtNumber: 1, teamA: { player1Name: "Beatriz Galli", player2Name: "Alexandre Takatsu" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Francisco Furlan" }, scoreA: 12, scoreB: 11 },
      { id: "m-aj-11", roundNumber: 2, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Daniela Roza" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Francisco Furlan" }, scoreA: 11, scoreB: 10 },
      { id: "m-aj-12", roundNumber: 2, courtNumber: 1, teamA: { player1Name: "Beatriz Galli", player2Name: "Alexandre Takatsu" }, teamB: { player1Name: "Luigi de Bortoli", player2Name: "Cristiane Tragueta" }, scoreA: 17, scoreB: 13 },
      { id: "m-aj-13", roundNumber: 3, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Francisco Furlan" }, teamB: { player1Name: "Beatriz Galli", player2Name: "Cristiane Tragueta" }, scoreA: 11, scoreB: 10 },
      { id: "m-aj-14", roundNumber: 3, courtNumber: 1, teamA: { player1Name: "Luigi de Bortoli", player2Name: "Daniela Roza" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Alexandre Takatsu" }, scoreA: 15, scoreB: 14 },
      { id: "m-aj-15", roundNumber: 3, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Francisco Furlan" }, teamB: { player1Name: "Luigi de Bortoli", player2Name: "Daniela Roza" }, scoreA: 15, scoreB: 14 },
      { id: "m-aj-16", roundNumber: 3, courtNumber: 1, teamA: { player1Name: "Beatriz Galli", player2Name: "Cristiane Tragueta" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Alexandre Takatsu" }, scoreA: 11, scoreB: 15 },
      { id: "m-aj-17", roundNumber: 3, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Francisco Furlan" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Alexandre Takatsu" }, scoreA: 6, scoreB: 15 },
      { id: "m-aj-18", roundNumber: 3, courtNumber: 1, teamA: { player1Name: "Beatriz Galli", player2Name: "Cristiane Tragueta" }, teamB: { player1Name: "Luigi de Bortoli", player2Name: "Daniela Roza" }, scoreA: 11, scoreB: 14 },
      { id: "m-aj-19", roundNumber: 4, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Cristiane Tragueta" }, teamB: { player1Name: "Beatriz Galli", player2Name: "Francisco Furlan" }, scoreA: 14, scoreB: 12 },
      { id: "m-aj-20", roundNumber: 4, courtNumber: 1, teamA: { player1Name: "Luigi de Bortoli", player2Name: "Alexandre Takatsu" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Daniela Roza" }, scoreA: 12, scoreB: 14 },
      { id: "m-aj-21", roundNumber: 4, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Cristiane Tragueta" }, teamB: { player1Name: "Luigi de Bortoli", player2Name: "Alexandre Takatsu" }, scoreA: 14, scoreB: 15 },
      { id: "m-aj-22", roundNumber: 4, courtNumber: 1, teamA: { player1Name: "Beatriz Galli", player2Name: "Francisco Furlan" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Daniela Roza" }, scoreA: 8, scoreB: 17 },
      { id: "m-aj-23", roundNumber: 4, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Cristiane Tragueta" }, teamB: { player1Name: "Juliano vecchi", player2Name: "Daniela Roza" }, scoreA: 7, scoreB: 19 },
      { id: "m-aj-24", roundNumber: 4, courtNumber: 1, teamA: { player1Name: "Luigi de Bortoli", player2Name: "Alexandre Takatsu" }, teamB: { player1Name: "Beatriz Galli", player2Name: "Francisco Furlan" }, scoreA: 15, scoreB: 12 },
      { id: "m-aj-25", roundNumber: 5, courtNumber: 2, teamA: { player1Name: "Henri Fogagnoli", player2Name: "Alexandre Takatsu" }, teamB: { player1Name: "Daniela Roza", player2Name: "Juliano vecchi" }, scoreA: 9, scoreB: 14, isBonusFinal: true },
    ],
  },
  {
    sheetName: "6 jogadores ",
    title: "Mini Liga T6ª15h",
    date: "2026-10-01",
    participantCount: 6,
    matchesCount: 8,
    participants: [
      { name: "Henri", isGuest: false, wins: 4, losses: 1, pointsFor: 46, pointsAgainst: 39, pointsBalance: 7, rank: 1, cardPointsAwarded: 10 },
      { name: "Alexandre", isGuest: false, wins: 4, losses: 2, pointsFor: 53, pointsAgainst: 47, pointsBalance: 6, rank: 2, cardPointsAwarded: 8 },
      { name: "Davi", isGuest: false, wins: 3, losses: 2, pointsFor: 38, pointsAgainst: 39, pointsBalance: -1, rank: 3, cardPointsAwarded: 6 },
      { name: "Luigi", isGuest: false, wins: 2, losses: 4, pointsFor: 47, pointsAgainst: 47, pointsBalance: 0, rank: 4, cardPointsAwarded: 5 },
      { name: "Francisco", isGuest: false, wins: 2, losses: 3, pointsFor: 36, pointsAgainst: 40, pointsBalance: -4, rank: 5, cardPointsAwarded: 4 },
      { name: "Antonio", isGuest: false, wins: 1, losses: 4, pointsFor: 34, pointsAgainst: 42, pointsBalance: -8, rank: 6, cardPointsAwarded: 3 },
    ],
    matches: [
      { id: "m-t6-1", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Antonio", player2Name: "Alexandre" }, teamB: { player1Name: "Davi", player2Name: "Francisco" }, scoreA: 9, scoreB: 6 },
      { id: "m-t6-2", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Henri", player2Name: "Luigi" }, teamB: { player1Name: "Antonio", player2Name: "Davi" }, scoreA: 10, scoreB: 6 },
      { id: "m-t6-3", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Francisco", player2Name: "Luigi" }, teamB: { player1Name: "Alexandre", player2Name: "Henri" }, scoreA: 6, scoreB: 8 },
      { id: "m-t6-4", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Antonio", player2Name: "Francisco" }, teamB: { player1Name: "Davi", player2Name: "Luigi" }, scoreA: 4, scoreB: 7 },
      { id: "m-t6-5", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Alexandre", player2Name: "Davi" }, teamB: { player1Name: "Antonio", player2Name: "Luigi" }, scoreA: 9, scoreB: 7 },
      { id: "m-t6-6", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Francisco", player2Name: "Henri" }, teamB: { player1Name: "Alexandre", player2Name: "Luigi" }, scoreA: 10, scoreB: 8 },
      { id: "m-t6-7", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Antonio", player2Name: "Henri" }, teamB: { player1Name: "Alexandre", player2Name: "Francisco" }, scoreA: 8, scoreB: 10 },
      { id: "m-t6-8", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Davi", player2Name: "Henri" }, teamB: { player1Name: "Alexandre", player2Name: "Luigi" }, scoreA: 10, scoreB: 9 },
    ],
  },
  {
    sheetName: "5 jogadores",
    title: "Mini liga TSáb 9h30",
    date: "2026-10-17",
    participantCount: 5,
    matchesCount: 6,
    participants: [
      { name: "Isabel", isGuest: false, wins: 4, losses: 1, pointsFor: 75, pointsAgainst: 46, pointsBalance: 29, rank: 1, cardPointsAwarded: 10 },
      { name: "Emerson", isGuest: false, wins: 3, losses: 2, pointsFor: 66, pointsAgainst: 55, pointsBalance: 11, rank: 2, cardPointsAwarded: 8 },
      { name: "Mateus Duarte", isGuest: false, wins: 3, losses: 2, pointsFor: 66, pointsAgainst: 57, pointsBalance: 9, rank: 3, cardPointsAwarded: 6 },
      { name: "Mary", isGuest: false, wins: 2, losses: 3, pointsFor: 53, pointsAgainst: 71, pointsBalance: -18, rank: 4, cardPointsAwarded: 5 },
      { name: "Camila M. da Silva", isGuest: false, wins: 0, losses: 4, pointsFor: 36, pointsAgainst: 67, pointsBalance: -31, rank: 5, cardPointsAwarded: 4 },
    ],
    matches: [
      { id: "m-ts-1", roundNumber: 1, courtNumber: 1, teamA: { player1Name: "Emerson", player2Name: "Mateus Duarte" }, teamB: { player1Name: "Camila M. da Silva", player2Name: "Isabel" }, scoreA: 15, scoreB: 9 },
      { id: "m-ts-2", roundNumber: 2, courtNumber: 1, teamA: { player1Name: "Mateus Duarte", player2Name: "Mary" }, teamB: { player1Name: "Emerson", player2Name: "Isabel" }, scoreA: 8, scoreB: 19 },
      { id: "m-ts-3", roundNumber: 3, courtNumber: 1, teamA: { player1Name: "Emerson", player2Name: "Camila M. da Silva" }, teamB: { player1Name: "Isabel", player2Name: "Mary" }, scoreA: 9, scoreB: 16 },
      { id: "m-ts-4", roundNumber: 4, courtNumber: 1, teamA: { player1Name: "Mateus Duarte", player2Name: "Camila M. da Silva" }, teamB: { player1Name: "Emerson", player2Name: "Mary" }, scoreA: 12, scoreB: 15 },
      { id: "m-ts-5", roundNumber: 5, courtNumber: 1, teamA: { player1Name: "Mateus Duarte", player2Name: "Isabel" }, teamB: { player1Name: "Camila M. da Silva", player2Name: "Mary" }, scoreA: 21, scoreB: 6 },
      { id: "m-ts-6", roundNumber: 6, courtNumber: 1, teamA: { player1Name: "Isabel", player2Name: "Mateus Duarte" }, teamB: { player1Name: "Emerson", player2Name: "Mary" }, scoreA: 10, scoreB: 8, isBonusFinal: true },
    ],
  },
];

// Conjunto dos 3 convidados oficiais indicados pelo Marco Roza na planilha
export const KNOWN_OFFICIAL_GUESTS = new Set([
  "ida maria",
  "valdeci silva",
  "fabiele de paulo",
]);

const normalizeStr = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

// Dicionário de equivalências conhecidas da planilha do Marco Roza
const PLAYER_NAME_ALIASES: { [key: string]: string[] } = {
  "daniela roza": ["daniela de carvalho da roza", "daniela carvalho roza", "daniela roza", "dani roza", "dani"],
  "dani roza": ["daniela de carvalho da roza", "daniela carvalho roza", "daniela roza", "dani roza", "dani"],
  "dani": ["daniela de carvalho da roza", "daniela carvalho roza", "daniela roza", "dani roza", "dani"],
  "juliano vecchi": ["juliano vecchi", "juliano"],
  "alexandre": ["alexandre takatsu", "alexandre"],
  "henri": ["henri fogagnoli", "henri"],
  "luigi": ["luigi de bortoli", "luigi"],
  "francisco": ["francisco furlan", "francisco"],
  "mary": ["mariana", "mary"],
  "mateus duarte": ["mateus duarte", "matheus duarte", "mateus", "matheus"],
  "mateus": ["mateus duarte", "matheus duarte", "mateus", "matheus"],
  "matheus": ["mateus duarte", "matheus duarte", "mateus", "matheus"],
  "isabel": ["isabel", "isabela", "maria isabel"],
  "camila": ["camila m da silva", "camila m. da silva", "camila silva"],
  "camila m da silva": ["camila m da silva", "camila m. da silva", "camila silva"],
  "camila m. da silva": ["camila m da silva", "camila m. da silva", "camila silva"],
  "camila agulhon": ["camila agulhon"],
  "antonio": ["antonio", "antônio"],
  "davi": ["davi", "david"],
  "emerson": ["emerson"],
};

// Função inteligente de cruzamento de nome do jogador da planilha com alunos cadastrados
export function matchStudentByName(playerName: string, students: Student[]): Student | null {
  if (!playerName || !students || students.length === 0) return null;
  const pNorm = normalizeStr(playerName);

  // 1. Não vincular se for comprovadamente convidado oficial
  if (KNOWN_OFFICIAL_GUESTS.has(pNorm)) {
    return null;
  }

  // 2. Busca exata após normalização
  const exact = students.find((s) => normalizeStr(s.nome) === pNorm);
  if (exact) return exact;

  // 3. Checagem por Dicionário de Apelidos/Abreviações
  const aliases = PLAYER_NAME_ALIASES[pNorm];
  if (aliases) {
    for (const alias of aliases) {
      const aliasNorm = normalizeStr(alias);
      const matched = students.find((s) => {
        const sNorm = normalizeStr(s.nome);
        return sNorm === aliasNorm || sNorm.includes(aliasNorm);
      });
      if (matched) return matched;
    }
  }

  // 4. Busca por primeiro nome + sobrenome
  const pParts = pNorm.split(/\s+/);
  const pFirst = pParts[0];
  const pLast = pParts.length > 1 ? pParts[pParts.length - 1] : "";

  // Se tiver primeiro e último nome
  if (pFirst && pLast) {
    const fullMatch = students.find((s) => {
      const sNorm = normalizeStr(s.nome);
      return sNorm.includes(pFirst) && sNorm.includes(pLast);
    });
    if (fullMatch) return fullMatch;
  }

  // 5. Match pelo primeiro nome se houver correspondência e não foi especificado sobrenome diferente
  if (pFirst.length >= 3 && !pLast) {
    const firstMatches = students.filter((s) => {
      const sParts = normalizeStr(s.nome).split(/\s+/);
      return sParts[0] === pFirst || (sParts[1] && sParts[1] === pFirst);
    });

    if (firstMatches.length === 1) {
      return firstMatches[0];
    }
    // Se houver mais de um aluno com esse primeiro nome, prioriza o ativo
    if (firstMatches.length > 1) {
      const active = firstMatches.find((s) => s.status === "Ativo");
      if (active) return active;
      return firstMatches[0];
    }
  }

  // 6. Fallback: substring em qualquer parte do nome
  const substringMatch = students.find((s) => normalizeStr(s.nome).includes(pNorm));
  if (substringMatch) return substringMatch;

  return null;
}

// Gera as 4 sessões oficiais de torneio importadas da planilha do Marco Roza
// prontas para serem usadas de forma consistente em qualquer aparelho (Desktop, Tablet, Celular)
export function getDefaultOfficialSessions(): MiniligaSession[] {
  return PREPARSED_MARCO_ROZA_MINILIGAS.map((t, i) => {
    const sessionId = `import-mr-${t.date}-${t.participantCount}p-${i}`;
    const sessionParticipants: MiniligaParticipant[] = t.participants.map((p, idx) => ({
      id: `p-${sessionId}-${idx + 1}`,
      name: p.name,
      studentId: p.studentId || null,
      groupNumber: (idx < t.participants.length / 2 ? 1 : 2) as 1 | 2,
      assignedNumber: idx + 1,
      matchesPlayed: p.wins + p.losses,
      wins: p.wins,
      losses: p.losses,
      pointsFor: p.pointsFor,
      pointsAgainst: p.pointsAgainst,
      pointsBalance: p.pointsBalance,
      totalScore: p.pointsFor + p.wins,
      rank: p.rank,
      cardPointsAwarded: p.cardPointsAwarded,
      isGuest: p.isGuest,
    }));

    const sessionMatches: MiniligaMatch[] = t.matches.map((m) => {
      const findPId = (name?: string) => {
        if (!name) return "";
        const found = sessionParticipants.find(
          (sp) => sp.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        return found?.id || `p-${name}`;
      };

      return {
        id: `match-${sessionId}-${m.id}`,
        roundNumber: m.roundNumber,
        courtNumber: m.courtNumber,
        teamA: {
          player1Id: findPId(m.teamA.player1Name),
          player2Id: m.teamA.player2Name ? findPId(m.teamA.player2Name) : undefined,
        },
        teamB: {
          player1Id: findPId(m.teamB.player1Name),
          player2Id: m.teamB.player2Name ? findPId(m.teamB.player2Name) : undefined,
        },
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        isCompleted: true,
        isBonusFinal: m.isBonusFinal || false,
        isSemifinal: m.isSemifinal || false,
        finishedAt: `${t.date}T12:00:00Z`,
      };
    });

    return {
      id: sessionId,
      title: t.title,
      date: t.date,
      participantCount: t.participantCount as any,
      modelType: t.participantCount === 10 ? "intergrupos" : "rotativo",
      courtsCount: t.participantCount >= 8 ? 2 : 1,
      durationSeconds: 300,
      currentRound: Math.max(...t.matches.map((m) => m.roundNumber), 1),
      totalRounds: Math.max(...t.matches.map((m) => m.roundNumber), 1),
      status: "finalizada",
      isSimulation: false,
      hasBonusFinal: true,
      hasTiebreakSimples: false,
      hasSemifinais: t.participantCount === 10,
      participants: sessionParticipants,
      matches: sessionMatches,
      createdAt: `${t.date}T12:00:00Z`,
      updatedAt: `${t.date}T12:00:00Z`,
    };
  });
}

