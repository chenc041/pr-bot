import { execSync } from 'child_process';

export interface CommitInfo {
  hash: string;
  date: string;
  author: string;
  message: string;
  files: string[];
}

export function getCommitHistory(repoPath: string, maxCommits = 50): CommitInfo[] {
  try {
    const output = execSync(
      'git log --format="%H||%aI||%an||%s" --name-only',
      { cwd: repoPath, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
    );

    const commits: CommitInfo[] = [];
    const entries = output.split('\n\n');

    for (const entry of entries.slice(0, maxCommits)) {
      const lines = entry.trim().split('\n');
      if (lines.length === 0) continue;

      const [hash, date, author, message] = lines[0].split('||');
      const files = lines.slice(1).filter((f) => f.trim());

      commits.push({
        hash: hash.slice(0, 7),
        date: date?.split('T')[0] ?? 'unknown',
        author: author ?? 'unknown',
        message: message ?? '',
        files,
      });
    }

    return commits;
  } catch {
    return [];
  }
}

export function formatCommitHistory(commits: CommitInfo[]): string {
  if (commits.length === 0) return '_(no commit history)_';

  return commits
    .map((c) => `- ${c.hash} (${c.date}) ${c.author}: ${c.message}\n  Files: ${c.files.slice(0, 10).join(', ')}${c.files.length > 10 ? ` (+${c.files.length - 10} more)` : ''}`)
    .join('\n');
}

export function getMostChangedFiles(commits: CommitInfo[], topN = 30): string[] {
  const counts = new Map<string, number>();

  for (const c of commits) {
    for (const f of c.files) {
      counts.set(f, (counts.get(f) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([file]) => file);
}
