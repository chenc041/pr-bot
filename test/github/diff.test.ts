import { describe, it, expect, vi } from 'vitest';
import { fetchPRContext } from '../../src/github/diff';

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    pulls: {
      get: vi.fn().mockResolvedValue({
        data: { title: 'Test PR', body: 'Description' },
      }),
      listFiles: vi.fn().mockResolvedValue({
        data: [
          { filename: 'src/a.ts', patch: '@@ -1,1 +1,1 @@\n-old\n+new', additions: 1, deletions: 1 },
        ],
      }),
    },
  })),
}));

describe('fetchPRContext', () => {
  it('returns diff and PR info', async () => {
    const result = await fetchPRContext('test-token', 'owner', 'repo', 42);
    expect(result.pr.title).toBe('Test PR');
    expect(result.pr.description).toBe('Description');
    expect(result.files).toHaveLength(1);
    expect(result.diff).toContain('src/a.ts');
  });
});
