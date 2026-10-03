import type { Guess } from '../valueObjects/Guess';

export interface SubmitGuessCommand {
  gameId: string;
  guess: Guess;
}
