import type { Feedback } from '../../domain/game/valueObjects/Feedback';
import type { GameStatus } from '../../domain/game/contracts/GameStatus';
import type { Guess } from '../../domain/game/valueObjects/Guess';
import type { SecretCode } from '../../domain/game/valueObjects/SecretCode';

export interface GameView {
  id: string;
  maxAttempts: number;
  attemptsUsed: number;
  guesses: Guess[];
  feedbacks: Feedback[];
  status: GameStatus;
  createdAt: string;
  solution?: SecretCode;
}
