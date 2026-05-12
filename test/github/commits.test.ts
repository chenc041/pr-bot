import { describe, it, expect } from 'vitest';
import { formatCommitHistory, getMostChangedFiles, CommitInfo } from '../../src/github/commits';

describe('formatCommitHistory', () => {
  it('formats commit list', () => {
    const commits: CommitInfo[] = [
      { hash: 'abc1234', date: '2026-05-01', author: 'Alice', message: 'fix: login bug', files: ['src/auth.ts', 'src/login.ts'] },
      { hash: 'def5678', date: '2026-05-02', author: 'Bob', message: 'feat: add dashboard', files: ['src/dashboard.ts'] },
    ];
    const result = formatCommitHistory(commits);
    expect(result).toContain('abc1234');
    expect(result).toContain('fix: login bug');
    expect(result).toContain('src/auth.ts');
    expect(result).toContain('Bob');
  });

  it('returns placeholder for empty', () => {
    const result = formatCommitHistory([]);
    expect(result).toContain('no commit history');
  });
});

describe('getMostChangedFiles', () => {
  it('ranks files by change frequency', () => {
    const commits: CommitInfo[] = [
      { hash: 'a', date: '', author: '', message: '', files: ['src/a.ts', 'src/b.ts'] },
      { hash: 'b', date: '', author: '', message: '', files: ['src/a.ts', 'src/c.ts'] },
      { hash: 'c', date: '', author: '', message: '', files: ['src/a.ts'] },
    ];
    const result = getMostChangedFiles(commits);
    expect(result[0]).toBe('src/a.ts');
  });
});
