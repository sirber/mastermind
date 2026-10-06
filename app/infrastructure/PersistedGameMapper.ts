import type { Game } from '../domain/game/entities/Game';
import type { Color } from '../domain/game/valueObjects/Color';
import type { FeedbackPeg } from '../domain/game/valueObjects/FeedbackPeg';
import type { GameStatus } from '../domain/game/contracts/GameStatus';
import type { Guess } from '../domain/game/valueObjects/Guess';
import type { Feedback } from '../domain/game/valueObjects/Feedback';
import type { SecretCode } from '../domain/game/valueObjects/SecretCode';
import { InvalidPersistedGameError } from './errors/InvalidPersistedGameError';

const colors: readonly Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const feedbackPegs: readonly FeedbackPeg[] = ['black', 'white', 'empty'];
const gameStatuses: readonly GameStatus[] = ['in_progress', 'won', 'lost', 'abandoned'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(gameId: string, field: string): never {
  throw new InvalidPersistedGameError(gameId, field);
}

function parseColors(value: unknown, gameId: string, field: string): SecretCode['colors'] {
  if (!isRecord(value) || !Array.isArray(value.colors) || value.colors.length !== 4) {
    return invalid(gameId, field);
  }
  if (!value.colors.every((color): color is Color => colors.includes(color as Color))) {
    return invalid(gameId, field);
  }

  return value.colors as SecretCode['colors'];
}

function parseGuesses(value: unknown, gameId: string): Guess[] {
  if (!Array.isArray(value)) return invalid(gameId, 'guesses');

  return value.map((guess, index) => ({
    colors: parseColors(guess, gameId, `guesses[${index}].colors`),
  }));
}

function parseFeedbacks(value: unknown, gameId: string): Feedback[] {
  if (!Array.isArray(value)) return invalid(gameId, 'feedbacks');

  return value.map((feedback, index) => {
    const field = `feedbacks[${index}].pegs`;
    if (!isRecord(feedback) || !Array.isArray(feedback.pegs) || feedback.pegs.length !== 4) {
      return invalid(gameId, field);
    }
    if (
      !feedback.pegs.every((peg): peg is FeedbackPeg => feedbackPegs.includes(peg as FeedbackPeg))
    ) {
      return invalid(gameId, field);
    }

    return { pegs: feedback.pegs as Feedback['pegs'] };
  });
}

function parseDate(value: unknown, gameId: string, field: string): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return invalid(gameId, field);
  return value;
}

export class PersistedGameMapper {
  static toDomain(value: unknown): Game {
    if (!isRecord(value)) return invalid('<unknown>', 'record');
    const gameId = typeof value.id === 'string' && value.id.length > 0 ? value.id : '<unknown>';

    if (gameId === '<unknown>') return invalid(gameId, 'id');
    if (
      typeof value.maxAttempts !== 'number' ||
      !Number.isInteger(value.maxAttempts) ||
      value.maxAttempts < 1
    ) {
      return invalid(gameId, 'maxAttempts');
    }
    if (
      typeof value.attemptsUsed !== 'number' ||
      !Number.isInteger(value.attemptsUsed) ||
      value.attemptsUsed < 0 ||
      value.attemptsUsed > value.maxAttempts
    ) {
      return invalid(gameId, 'attemptsUsed');
    }
    if (typeof value.status !== 'string' || !gameStatuses.includes(value.status as GameStatus)) {
      return invalid(gameId, 'status');
    }

    const secretCode = { colors: parseColors(value.secretCode, gameId, 'secretCode.colors') };
    const guesses = parseGuesses(value.guesses, gameId);
    const feedbacks = parseFeedbacks(value.feedbacks, gameId);
    if (guesses.length !== value.attemptsUsed || feedbacks.length !== value.attemptsUsed) {
      return invalid(gameId, 'attemptsUsed');
    }

    const status = value.status as GameStatus;
    if (
      (status === 'in_progress' && value.attemptsUsed >= value.maxAttempts) ||
      (status === 'won' &&
        (value.attemptsUsed === 0 || !feedbacks.at(-1)?.pegs.every((peg) => peg === 'black'))) ||
      (status === 'lost' && value.attemptsUsed !== value.maxAttempts)
    ) {
      return invalid(gameId, 'status');
    }

    return {
      id: gameId,
      secretCode,
      maxAttempts: value.maxAttempts,
      attemptsUsed: value.attemptsUsed,
      guesses,
      feedbacks,
      status,
      createdAt: parseDate(value.createdAt, gameId, 'createdAt'),
      updatedAt: parseDate(value.updatedAt, gameId, 'updatedAt'),
    };
  }
}
