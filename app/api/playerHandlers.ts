import { LoginWithEmailCommandHandler } from '../application/commands/LoginWithEmailCommandHandler';
import { PlayAsGuestCommandHandler } from '../application/commands/PlayAsGuestCommandHandler';
import { PrismaPlayerRepository } from '../infrastructure/PrismaPlayerRepository';

const players = new PrismaPlayerRepository();

export const loginWithEmail = new LoginWithEmailCommandHandler(players);
export const playAsGuest = new PlayAsGuestCommandHandler(players);
export const getPlayerById = (playerId: string) => players.findById(playerId);
