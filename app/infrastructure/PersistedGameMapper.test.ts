import { describe, expect, it } from 'vitest';
import { InvalidPersistedGameError } from './errors/InvalidPersistedGameError';
import { PersistedGameMapper } from './PersistedGameMapper';

const validRecord = {
  id: 'game-1',
  secretCode: { colors: ['red', 'blue', 'green', 'yellow'] },
  maxAttempts: 10,
  attemptsUsed: 0,
  guesses: [],
  feedbacks: [],
  status: 'in_progress',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('PersistedGameMapper', () => {
  it('maps valid persisted game data to the domain model', () => {
    expect(PersistedGameMapper.toDomain(validRecord)).toEqual({
      id: 'game-1',
      secretCode: { colors: ['red', 'blue', 'green', 'yellow'] },
      maxAttempts: 10,
      attemptsUsed: 0,
      guesses: [],
      feedbacks: [],
      status: 'in_progress',
      createdAt: validRecord.createdAt,
      updatedAt: validRecord.updatedAt,
    });
  });

  it.each([
    [
      'unknown color in secret code',
      { secretCode: { colors: ['red', 'blue', 'green', 'cyan'] } },
      'secretCode.colors',
    ],
    [
      'malformed persisted guess',
      { guesses: [{ colors: ['red', 'blue'] }], attemptsUsed: 1 },
      'guesses[0].colors',
    ],
    [
      'unknown feedback peg',
      { feedbacks: [{ pegs: ['black', 'white', 'empty', 'invalid'] }] },
      'feedbacks[0].pegs',
    ],
    ['unknown game status', { status: 'paused' }, 'status'],
    ['attempt count inconsistent with history', { attemptsUsed: 1 }, 'attemptsUsed'],
    ['invalid attempt limit', { maxAttempts: 0 }, 'maxAttempts'],
    ['invalid timestamp', { createdAt: 'not-a-date' }, 'createdAt'],
  ])('rejects %s', (_description, override, field) => {
    expect(() => PersistedGameMapper.toDomain({ ...validRecord, ...override })).toThrowError(
      expect.objectContaining({
        name: 'InvalidPersistedGameError',
        field,
      })
    );
  });

  it('rejects a won game whose final feedback is not a complete match', () => {
    const record = {
      ...validRecord,
      maxAttempts: 2,
      attemptsUsed: 1,
      guesses: [{ colors: ['red', 'blue', 'green', 'yellow'] }],
      feedbacks: [{ pegs: ['black', 'black', 'black', 'empty'] }],
      status: 'won',
    };

    expect(() => PersistedGameMapper.toDomain(record)).toThrowError(
      new InvalidPersistedGameError('game-1', 'status')
    );
  });
});
