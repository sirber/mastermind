import type { SecretCode } from '../valueObjects/SecretCode';
import type { Guess } from '../valueObjects/Guess';
import type { Feedback } from '../valueObjects/Feedback';
import type { GameStatus } from '../contracts/GameStatus';

export interface Game {
  readonly id: string;
  version: number;
  readonly secretCode: SecretCode;
  readonly maxAttempts: number;
  attemptsUsed: number;
  guesses: Guess[];
  feedbacks: Feedback[];
  status: GameStatus;
  readonly createdAt: Date;
  updatedAt: Date;
}
