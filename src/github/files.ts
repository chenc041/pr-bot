// src/github/files.ts
import fs from 'fs';
import path from 'path';

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  '.venv', 'venv', 'vendor', '.cache', '.turbo', 'coverage',
  '.superpowers',
]);

const IGNORE_FILES = new Set([
  '.DS_Store', 'package-lock.json', 'yarn.lock', 'bun.lock',
  'pnpm-lock.yaml', '.eslintcache',
]);

const KEY_FILES = [
  'package.json', 'tsconfig.json', 'README.md', 'CLAUDE.md',
  'Gemfile', 'Cargo.toml', 'go.mod', 'pyproject.toml',
  'Makefile', 'Dockerfile', 'docker-compose.yml',
  '.eslintrc.js', '.eslintrc.json', '.prettierrc',
  'jest.config.js', 'vitest.config.ts',
];

export function walkTree(dir: string, prefix = ''): string {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let result = '';

  const dirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !IGNORE_DIRS.has(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = entries
    .filter((e) => e.isFile() && !IGNORE_FILES.has(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const f of files) {
    result += `${prefix}${f.name}\n`;
  }

  for (const d of dirs) {
    result += `${prefix}${d.name}/\n`;
    try {
      result += walkTree(path.join(dir, d.name), `${prefix}  `);
    } catch {
      result += `${prefix}  [error reading]\n`;
    }
  }

  return result;
}

export function readKeyFiles(dir: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const filename of KEY_FILES) {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        result[filename] = content.slice(0, 4000); // limit per file
      } catch {
        // skip unreadable files
      }
    }
  }

  return result;
}

export function readChangedFiles(dir: string, filenames: string[]): string {
  const parts: string[] = [];

  for (const filename of filenames) {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const numbered = lines
          .map((line, i) => `${String(i + 1).padStart(4, ' ')}| ${line}`)
          .join('\n');
        parts.push(`### ${filename} (${lines.length} lines)\n\n\`\`\`\n${numbered}\n\`\`\``);
      } catch {
        parts.push(`### ${filename}\n\n_[binary or unreadable file]_`);
      }
    } else {
      parts.push(`### ${filename}\n\n_[file deleted]_`);
    }
  }

  return parts.join('\n\n');
}
