export class InvalidEmailError extends Error {
  constructor() {
    super('A valid email address is required');
    this.name = 'InvalidEmailError';
  }
}
