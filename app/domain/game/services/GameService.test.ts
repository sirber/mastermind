import { describe, it, expect } from 'vitest';
import { GameService } from './GameService';
import type { Game } from '../entities/Game';
import type { Guess } from '../valueObjects/Guess';
import type { Color } from '../valueObjects/Color';
import type { FeedbackPeg } from '../valueObjects/FeedbackPeg';

function g(colors: string[]): Guess {
  return { colors: colors as [Color, Color, Color, Color] };
}

function createTestGame(secretColors: string[]): Game {
  return {
    id: 'test-game',
    secretCode: { colors: secretColors as [Color, Color, Color, Color] },
    maxAttempts: 10,
    attemptsUsed: 0,
    guesses: [],
    feedbacks: [],
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function countPegs(fb: { pegs: FeedbackPeg[] }, type: FeedbackPeg): number {
  return fb.pegs.filter((p: FeedbackPeg) => p === type).length;
}

describe('GameService', () => {
  describe('submitGuess', () => {
    describe('correct guess', () => {
      it('returns all black pegs when guess matches secret code exactly', () => {
        const game = createTestGame(['red', 'blue', 'green', 'yellow']);
        const guess = g(['red', 'blue', 'green', 'yellow']);

        const result = GameService.submitGuess(game, guess);

        expect(result.success).toBe(true);
        expect(countPegs(result.feedback!, 'black')).toBe(4);
        expect(result.gameStatus).toBe('won');
      });

      it('sets game status to won when guess is correct', () => {
        const game = createTestGame(['red', 'red', 'blue', 'blue']);
        const guess = g(['red', 'red', 'blue', 'blue']);

        const result = GameService.submitGuess(game, guess);

        expect(result.gameStatus).toBe('won');
      });
    });

    describe('incorrect guess', () => {
      it('returns no black pegs when all colors are wrong', () => {
        const game = createTestGame(['red', 'blue', 'green', 'yellow']);
        const guess = g(['orange', 'purple', 'orange', 'purple']);

        const result = GameService.submitGuess(game, guess);

        expect(result.success).toBe(true);
        expect(countPegs(result.feedback!, 'black')).toBe(0);
        expect(result.gameStatus).toBe('in_progress');
      });

      it('returns white pegs for correct colors in wrong positions', () => {
        const game = createTestGame(['red', 'blue', 'green', 'yellow']);
        const guess = g(['blue', 'red', 'yellow', 'green']);

        const result = GameService.submitGuess(game, guess);

        expect(result.success).toBe(true);
        expect(countPegs(result.feedback!, 'white')).toBe(4);
        expect(countPegs(result.feedback!, 'black')).toBe(0);
        expect(result.gameStatus).toBe('in_progress');
      });

      it('returns black and white pegs for partial matches', () => {
        const game = createTestGame(['red', 'blue', 'green', 'yellow']);
        const guess = g(['red', 'green', 'blue', 'orange']);

        const result = GameService.submitGuess(game, guess);

        expect(result.success).toBe(true);
        expect(countPegs(result.feedback!, 'black')).toBe(1);
        expect(countPegs(result.feedback!, 'white')).toBe(2);
        expect(countPegs(result.feedback!, 'empty')).toBe(1);
      });
    });

    describe('duplicate colors', () => {
      it('handles duplicate colors in secret code', () => {
        const game = createTestGame(['red', 'red', 'blue', 'green']);
        const guess = g(['red', 'blue', 'blue', 'green']);

        const result = GameService.submitGuess(game, guess);

        expect(result.success).toBe(true);
        expect(countPegs(result.feedback!, 'black')).toBe(3);
        expect(countPegs(result.feedback!, 'white')).toBe(0);
      });

      it('handles duplicate colors in guess', () => {
        const game = createTestGame(['red', 'blue', 'green', 'yellow']);
        const guess = g(['red', 'red', 'red', 'red']);

        const result = GameService.submitGuess(game, guess);

        expect(result.success).toBe(true);
        expect(countPegs(result.feedback!, 'black')).toBe(1);
        expect(countPegs(result.feedback!, 'white')).toBe(0);
        expect(countPegs(result.feedback!, 'empty')).toBe(3);
      });

      it('handles all same colors', () => {
        const game = createTestGame(['red', 'red', 'red', 'red']);
        const guess = g(['red', 'red', 'red', 'red']);

        const result = GameService.submitGuess(game, guess);

        expect(result.success).toBe(true);
        expect(countPegs(result.feedback!, 'black')).toBe(4);
        expect(result.gameStatus).toBe('won');
      });
    });

    describe('game state validation', () => {
      it('rejects guess when game is already won', () => {
        const game = createTestGame(['red', 'blue', 'green', 'yellow']);
        GameService.submitGuess(game, g(['red', 'blue', 'green', 'yellow']));

        expect(() =>
          GameService.submitGuess(game, g(['orange', 'purple', 'orange', 'purple']))
        ).toThrow('Game is already over');
      });

      it('rejects guess when max attempts reached', () => {
        const game = createTestGame(['red', 'blue', 'green', 'yellow']);
        game.maxAttempts = 1;
        game.attemptsUsed = 1;

        expect(() => GameService.submitGuess(game, g(['red', 'blue', 'green', 'yellow']))).toThrow(
          'Maximum attempts reached'
        );
      });

      it('allows submitting the same guess more than once', () => {
        const game = createTestGame(['red', 'blue', 'green', 'yellow']);
        GameService.submitGuess(game, g(['red', 'red', 'red', 'red']));

        expect(() => GameService.submitGuess(game, g(['red', 'red', 'red', 'red']))).not.toThrow();
      });
    });

    describe('game progression', () => {
      it('increments attempts used on valid guess', () => {
        const game = createTestGame(['red', 'blue', 'green', 'yellow']);
        const initialAttempts = game.attemptsUsed;

        GameService.submitGuess(game, g(['orange', 'purple', 'orange', 'purple']));

        expect(game.attemptsUsed).toBe(initialAttempts + 1);
        expect(game.guesses.length).toBe(1);
        expect(game.feedbacks.length).toBe(1);
      });

      it('sets game to lost when max attempts reached with wrong guess', () => {
        const game: Game = {
          ...createTestGame(['red', 'blue', 'green', 'yellow']),
          maxAttempts: 1,
        };

        const result = GameService.submitGuess(game, g(['orange', 'purple', 'orange', 'purple']));

        expect(result.success).toBe(true);
        expect(result.gameStatus).toBe('lost');
      });
    });
  });

  describe('calculateFeedback', () => {
    it('returns all black for exact match', () => {
      const secretCode = {
        colors: ['red', 'blue', 'green', 'yellow'] as [Color, Color, Color, Color],
      };
      const guess = { colors: ['red', 'blue', 'green', 'yellow'] as [Color, Color, Color, Color] };

      const feedback = GameService.calculateFeedback(secretCode, guess);

      expect(countPegs(feedback, 'black')).toBe(4);
    });
  });

  describe('createGame', () => {
    it('creates a game with valid structure', () => {
      const game = GameService.createGame('test-123', 10);

      expect(game.id).toBe('test-123');
      expect(game.maxAttempts).toBe(10);
      expect(game.attemptsUsed).toBe(0);
      expect(game.guesses).toEqual([]);
      expect(game.feedbacks).toEqual([]);
      expect(game.secretCode.colors.length).toBe(4);
      expect(game.status).toBe('in_progress');
    });

    it('creates a game with default maxAttempts of 10', () => {
      const game = GameService.createGame('test-456');

      expect(game.maxAttempts).toBe(10);
    });

    it.each([0, -1, 1.5, Number.NaN])('rejects invalid maxAttempts: %s', (maxAttempts) => {
      expect(() => GameService.createGame('test-invalid', maxAttempts)).toThrow(RangeError);
    });
  });
});
