import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('quality tooling', () => {
  it('runs non-mutating checks and does not filter or mask compose failures', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts.quality).toBe(
      'bun run typecheck && bun run lint:check && bun run prettier:check'
    );
    const recipe = readFileSync('justfile', 'utf8')
      .split('quality:')[1]
      .split(/\r?\n\r?\n/)[0];
    expect(recipe.trim()).toBe('@{{compose}} run --rm app bun run quality; exit $LASTEXITCODE');
  });

  // The repository's justfile deliberately uses its Windows PowerShell fallback.
  it.skipIf(process.platform !== 'win32' || spawnSync('just', ['--version']).error !== undefined)(
    'preserves the original native exit status through just quality',
    () => {
      const directory = mkdtempSync(join(tmpdir(), 'mastermind-quality-'));
      try {
        const fixture = join(directory, 'compose.cjs');
        writeFileSync(fixture, 'process.exit(37);');
        const result = spawnSync('just', ['--set', 'compose', `bun "${fixture}"`, 'quality'], {
          encoding: 'utf8',
        });
        expect(result.error).toBeUndefined();
        expect(result.status, result.stderr).toBe(37);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    }
  );
});
