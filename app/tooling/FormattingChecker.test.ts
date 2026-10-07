import { describe, expect, it } from 'vitest';
import { FormattingChecker } from '../../scripts/FormattingChecker';

describe('read-only formatting check', () => {
  it('accepts canonical LF and equivalent Windows autocrlf checkouts', async () => {
    await expect(
      FormattingChecker.isFormatted("const value = 'example';\n", 'example.ts')
    ).resolves.toBe(true);
    await expect(
      FormattingChecker.isFormatted("const value = 'example';\r\n", 'example.ts')
    ).resolves.toBe(true);
  });

  it('still rejects real formatting defects without modifying the input', async () => {
    const input = 'const value="example"\r\n';
    await expect(FormattingChecker.isFormatted(input, 'example.ts')).resolves.toBe(false);
    expect(input).toBe('const value="example"\r\n');
  });
});
