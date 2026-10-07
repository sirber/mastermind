import { describe, expect, it } from 'vitest';
import { InvalidPersistedGameError } from './errors/InvalidPersistedGameError';
import { PersistedGameMapper } from './PersistedGameMapper';

const validRecord = {
  id: 'game-1',
  version: 0,
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
  it('does not expose mutable persisted arrays or dates through the domain model', () => {
    const record = structuredClone(validRecord);
    const game = PersistedGameMapper.toDomain(record);
    game.secretCode.colors[0] = 'orange';
    game.createdAt.setUTCFullYear(2000);
    expect(record.secretCode.colors[0]).toBe('red');
    expect(record.createdAt.getUTCFullYear()).toBe(2026);
  });
  it('maps valid persisted game data to the domain model', () => {
    expect(PersistedGameMapper.toDomain(validRecord)).toEqual({
      id: 'game-1',
      version: 0,
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
    ['negative version', { version: -1 }, 'version'],
    ['missing version', { version: undefined }, 'version'],
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
      new InvalidPersistedGameError('game-1', 'feedbacks[0].pegs')
    );
  });

  it('rejects forged winning feedback for a wrong guess', () => {
    expect(() =>
      PersistedGameMapper.toDomain({
        ...validRecord,
        attemptsUsed: 1,
        status: 'won',
        guesses: [{ colors: ['orange', 'orange', 'orange', 'orange'] }],
        feedbacks: [{ pegs: ['black', 'black', 'black', 'black'] }],
      })
    ).toThrowError(new InvalidPersistedGameError('game-1', 'feedbacks[0].pegs'));
  });

  it.each(['in_progress', 'lost', 'abandoned'])(
    'rejects a winning guess in a %s game',
    (status) => {
      expect(() =>
        PersistedGameMapper.toDomain({
          ...validRecord,
          maxAttempts: 1,
          attemptsUsed: 1,
          status,
          guesses: [validRecord.secretCode],
          feedbacks: [{ pegs: ['black', 'black', 'black', 'black'] }],
        })
      ).toThrowError(new InvalidPersistedGameError('game-1', 'status'));
    }
  );

  it('rejects history after a winning guess even when the final guess also wins', () => {
    expect(() =>
      PersistedGameMapper.toDomain({
        ...validRecord,
        attemptsUsed: 2,
        status: 'won',
        guesses: [validRecord.secretCode, validRecord.secretCode],
        feedbacks: Array(2).fill({ pegs: ['black', 'black', 'black', 'black'] }),
      })
    ).toThrowError(new InvalidPersistedGameError('game-1', 'guesses[0]'));
  });

  it.each(['won', 'lost', 'abandoned'])('accepts valid %s history', (status) => {
    const winning = status === 'won';
    const record = {
      ...validRecord,
      maxAttempts: status === 'abandoned' ? 2 : 1,
      attemptsUsed: 1,
      status,
      guesses: [
        winning ? validRecord.secretCode : { colors: ['orange', 'orange', 'orange', 'orange'] },
      ],
      feedbacks: [{ pegs: Array(4).fill(winning ? 'black' : 'empty') }],
    };
    expect(PersistedGameMapper.toDomain(record).status).toBe(status);
  });
});
