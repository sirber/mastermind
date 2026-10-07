import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getFileInfo } from 'prettier';
import { FormattingChecker } from './FormattingChecker';

const excluded = new Set([
  '.git',
  'node_modules',
  'generated',
  'build',
  'dist',
  '.react-router',
  'coverage',
]);

async function checkDirectory(directory: string): Promise<void> {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!excluded.has(entry.name)) await checkDirectory(path);
    } else if (entry.isFile()) {
      const info = await getFileInfo(path, { ignorePath: '.gitignore' });
      if (info.ignored || !info.inferredParser) continue;
      if (!(await FormattingChecker.isFormatted(readFileSync(path, 'utf8'), path))) {
        console.error(`Formatting required: ${path}`);
        process.exitCode = 1;
      }
    }
  }
}

await checkDirectory('.');
