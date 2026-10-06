import { LoginWithEmailCommandHandler } from '../application/commands/LoginWithEmailCommandHandler';
import { PrismaPlayerRepository } from '../infrastructure/PrismaPlayerRepository';

const players = new PrismaPlayerRepository();

export const loginWithEmail = new LoginWithEmailCommandHandler(players);
export const getPlayerById = (playerId: string) => players.findById(playerId);
