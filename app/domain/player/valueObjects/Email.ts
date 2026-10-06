import { InvalidEmailError } from '../errors/InvalidEmailError';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: unknown): Email {
    if (typeof value !== 'string') throw new InvalidEmailError();

    const normalized = value.trim().toLowerCase();
    if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError();
    }

    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }
}
