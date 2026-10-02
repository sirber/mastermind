import type { Feedback } from '../valueObjects/Feedback';
import type { GameStatus } from './GameStatus';

export interface SubmitGuessResult {
  success: boolean;
  feedback?: Feedback;
  gameStatus?: GameStatus;
  error?: string;
}
