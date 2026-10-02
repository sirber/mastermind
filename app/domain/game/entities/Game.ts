import type { SecretCode } from '../valueObjects/SecretCode';
import type { Guess } from '../valueObjects/Guess';
import type { Feedback } from '../valueObjects/Feedback';
import type { GameStatus } from '../contracts/GameStatus';

export interface Game {
  id: string;
  secretCode: SecretCode;
  maxAttempts: number;
  attemptsUsed: number;
  guesses: Guess[];
  feedbacks: Feedback[];
  status: GameStatus;
  createdAt: Date;
  updatedAt: Date;
}
