import { describe, expect, it } from 'vitest';
import { InvalidEmailError } from '../errors/InvalidEmailError';
import { Email } from './Email';

describe('Email', () => {
  it('trims and normalizes addresses for case-insensitive identity', () => {
    expect(Email.create('  Alice.Example@Example.COM ').value).toBe('alice.example@example.com');
  });

  it.each(['', 'invalid', 'a@b', 'a b@example.com', 'x'.repeat(250) + '@example.com'])(
    'rejects invalid email: %s',
    (value) => {
      expect(() => Email.create(value)).toThrow(InvalidEmailError);
    }
  );

  it('rejects non-string values at runtime', () => {
    expect(() => Email.create(null)).toThrow(InvalidEmailError);
  });
});
