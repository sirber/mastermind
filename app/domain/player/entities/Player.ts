import type { Email } from '../valueObjects/Email';

export interface Player {
  id: string;
  email: Email | null;
  createdAt: Date;
  updatedAt: Date;
}
