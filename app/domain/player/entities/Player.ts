import type { Email } from '../valueObjects/Email';

export interface Player {
  id: string;
  email: Email;
  createdAt: Date;
  updatedAt: Date;
}
