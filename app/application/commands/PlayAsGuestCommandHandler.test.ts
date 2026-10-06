import { describe, expect, it, vi } from 'vitest';
import { PlayAsGuestCommandHandler } from './PlayAsGuestCommandHandler';

describe('PlayAsGuestCommandHandler', () => {
  it('creates a fresh persisted guest identity with a server-generated UUID', async () => {
    const guests = {
      createGuest: vi.fn().mockImplementation(async (id: string) => ({ id, email: null })),
    };
    const handler = new PlayAsGuestCommandHandler(guests);
    const first = await handler.handle();
    const second = await handler.handle();
    expect(first.email).toBeNull();
    expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(second.id).not.toBe(first.id);
    expect(guests.createGuest).toHaveBeenCalledWith(first.id);
  });
});
