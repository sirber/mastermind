import { describe, expect, it, vi } from 'vitest';
import type { PlayerRepository } from '../contracts/PlayerRepository';
import { LoginWithEmailCommandHandler } from './LoginWithEmailCommandHandler';
import { InvalidEmailError } from '../../domain/player/errors/InvalidEmailError';
import { Email } from '../../domain/player/valueObjects/Email';

describe('LoginWithEmailCommandHandler', () => {
  it('normalizes the email and returns the existing or newly created player', async () => {
    const player = {
      id: 'player-1',
      email: Email.create('alice@example.com'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const players: PlayerRepository = {
      getOrCreate: vi.fn().mockResolvedValue(player),
      findById: vi.fn().mockResolvedValue(player),
    };

    await expect(
      new LoginWithEmailCommandHandler(players).handle(' Alice@Example.com ')
    ).resolves.toBe(player);
    expect(players.getOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'alice@example.com' }),
      expect.any(String)
    );
  });

  it('rejects invalid email before accessing persistence', async () => {
    const players: PlayerRepository = {
      getOrCreate: vi.fn(),
      findById: vi.fn(),
    };

    await expect(
      new LoginWithEmailCommandHandler(players).handle('not-an-email')
    ).rejects.toBeInstanceOf(InvalidEmailError);
    expect(players.getOrCreate).not.toHaveBeenCalled();
  });
});
