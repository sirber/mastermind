import { GetGameQueryHandler } from '../application/queries/GetGameQueryHandler';
import { StartGameCommandHandler } from '../application/commands/StartGameCommandHandler';
import { SubmitGuessCommandHandler } from '../application/commands/SubmitGuessCommandHandler';
import { PrismaGameRepository } from '../infrastructure/PrismaGameRepository';

const games = new PrismaGameRepository();

export const startGame = new StartGameCommandHandler(games);
export const submitGuess = new SubmitGuessCommandHandler(games);
export const getGame = new GetGameQueryHandler(games);
