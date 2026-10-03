import type { Color } from '../domain/game/valueObjects/Color';
import type { Guess } from '../domain/game/valueObjects/Guess';

const colors: Color[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export function parseGuess(value: unknown): Guess | null {
  if (typeof value !== 'object' || value === null || !('colors' in value)) return null;
  const guessColors = (value as { colors?: unknown }).colors;
  if (!Array.isArray(guessColors) || guessColors.length !== 4) return null;
  if (!guessColors.every((color) => colors.includes(color as Color))) return null;

  return { colors: [...guessColors] as Guess['colors'] };
}
