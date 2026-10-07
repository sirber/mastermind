import type { Color } from '../valueObjects/Color';
import type { SecretCode } from '../valueObjects/SecretCode';
import type { Guess } from '../valueObjects/Guess';
import type { Feedback } from '../valueObjects/Feedback';
import type { Game } from '../entities/Game';
import type { SubmitGuessResult } from '../contracts/SubmitGuessResult';

import { GameOverError } from '../errors/GameOverError';
import { MaxAttemptsError } from '../errors/MaxAttemptsError';
import { InvalidGameStateError } from '../errors/InvalidGameStateError';

export class GameService {
  static readonly CODE_LENGTH = 4;

  private static validateColors(colors: readonly Color[], field: string): void {
    const allowed: readonly Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    if (
      !Array.isArray(colors) ||
      colors.length !== this.CODE_LENGTH ||
      !colors.every((color) => allowed.includes(color))
    ) {
      throw new InvalidGameStateError(field);
    }
  }

  static validateGame(game: Game): void {
    const invalid = (field: string): never => {
      throw new InvalidGameStateError(field);
    };
    this.validateColors(game.secretCode.colors, 'secretCode.colors');
    if (!Number.isInteger(game.version) || game.version < 0) invalid('version');
    if (!Number.isInteger(game.maxAttempts) || game.maxAttempts < 1) invalid('maxAttempts');
    if (
      !Number.isInteger(game.attemptsUsed) ||
      game.attemptsUsed < 0 ||
      game.attemptsUsed > game.maxAttempts ||
      game.guesses.length !== game.attemptsUsed ||
      game.feedbacks.length !== game.attemptsUsed
    )
      invalid('attemptsUsed');

    let won = false;
    game.guesses.forEach((guess, index) => {
      this.validateColors(guess.colors, `guesses[${index}].colors`);
      const expected = this.calculateFeedback(game.secretCode, guess);
      if (
        game.feedbacks[index].pegs.length !== this.CODE_LENGTH ||
        expected.pegs.some((peg, pegIndex) => peg !== game.feedbacks[index].pegs[pegIndex])
      )
        invalid(`feedbacks[${index}].pegs`);
      if (expected.pegs.every((peg) => peg === 'black')) {
        if (index !== game.guesses.length - 1) invalid(`guesses[${index}]`);
        won = true;
      }
    });
    const exhausted = game.attemptsUsed === game.maxAttempts;
    if (
      (game.status === 'won' && !won) ||
      (game.status !== 'won' && won) ||
      (game.status === 'lost' && !exhausted) ||
      ((game.status === 'in_progress' || game.status === 'abandoned') && exhausted) ||
      !['won', 'lost', 'in_progress', 'abandoned'].includes(game.status)
    )
      invalid('status');
  }

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
      version: 0,
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
    this.validateColors(secretCode.colors, 'secretCode.colors');
    this.validateColors(guess.colors, 'guess.colors');
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

    this.validateGame(game);
    const feedback = this.calculateFeedback(game.secretCode, guess);

    game.guesses.push({ colors: [...guess.colors] });
    game.feedbacks.push({ pegs: [...feedback.pegs] });
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
