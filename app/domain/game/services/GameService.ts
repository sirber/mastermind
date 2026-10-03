import type { Color } from '../valueObjects/Color';
import type { SecretCode } from '../valueObjects/SecretCode';
import type { Guess } from '../valueObjects/Guess';
import type { Feedback } from '../valueObjects/Feedback';
import type { Game } from '../entities/Game';
import type { SubmitGuessResult } from '../contracts/SubmitGuessResult';

import { GameOverError } from '../errors/GameOverError';
import { MaxAttemptsError } from '../errors/MaxAttemptsError';

export class GameService {
  static CODE_LENGTH = 4;

  static createGame(id: string, maxAttempts: number = 10): Game {
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      throw new RangeError('Maximum attempts must be a positive integer');
    }

    const allColors: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const secretColors: Color[] = [];
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      secretColors.push(allColors[Math.floor(Math.random() * allColors.length)]);
    }

    return {
      id,
      secretCode: { colors: secretColors as [Color, Color, Color, Color] },
      maxAttempts,
      attemptsUsed: 0,
      guesses: [],
      feedbacks: [],
      status: 'in_progress',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static calculateFeedback(secretCode: SecretCode, guess: Guess): Feedback {
    const CODE_LENGTH = 4;
    const secretColors = secretCode.colors;
    const guessColors = guess.colors;

    const secretMatched: boolean[] = Array(CODE_LENGTH).fill(false);
    const guessMatched: boolean[] = Array(CODE_LENGTH).fill(false);

    let blackCount = 0;
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (secretColors[i] === guessColors[i]) {
        secretMatched[i] = true;
        guessMatched[i] = true;
        blackCount++;
      }
    }

    let whiteCount = 0;
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessMatched[i]) continue;

      for (let j = 0; j < CODE_LENGTH; j++) {
        if (secretMatched[j] || i === j) continue;

        if (guessColors[i] === secretColors[j]) {
          secretMatched[j] = true;
          whiteCount++;
          break;
        }
      }
    }

    const pegs: ('black' | 'white' | 'empty')[] = [];
    for (let i = 0; i < blackCount; i++) pegs.push('black');
    for (let i = 0; i < whiteCount; i++) pegs.push('white');
    while (pegs.length < CODE_LENGTH) pegs.push('empty');

    return {
      pegs: pegs as [
        'black' | 'white' | 'empty',
        'black' | 'white' | 'empty',
        'black' | 'white' | 'empty',
        'black' | 'white' | 'empty',
      ],
    };
  }

  static submitGuess(game: Game, guess: Guess): SubmitGuessResult {
    if (game.status !== 'in_progress') {
      throw new GameOverError();
    }

    if (game.attemptsUsed >= game.maxAttempts) {
      throw new MaxAttemptsError();
    }

    const feedback = this.calculateFeedback(game.secretCode, guess);

    game.guesses.push(guess);
    game.feedbacks.push(feedback);
    game.attemptsUsed++;
    game.updatedAt = new Date();

    if (feedback.pegs.every((p) => p === 'black')) {
      game.status = 'won';
    } else if (game.attemptsUsed >= game.maxAttempts) {
      game.status = 'lost';
    }

    return {
      success: true,
      feedback,
      gameStatus: game.status,
    };
  }
}
