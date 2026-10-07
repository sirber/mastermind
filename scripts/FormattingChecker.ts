import { format, resolveConfig } from 'prettier';

export class FormattingChecker {
  static async isFormatted(content: string, filepath: string): Promise<boolean> {
    // Git's Windows autocrlf checkout is not a source-formatting defect. Compare
    // canonical LF text in memory, keeping the repository's LF formatting policy.
    const canonical = content.replace(/\r\n/g, '\n');
    const expected = await format(canonical, {
      ...(await resolveConfig(filepath)),
      filepath,
    });
    return canonical === expected;
  }
}
