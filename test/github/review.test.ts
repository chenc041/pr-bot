import { describe, it, expect, vi } from 'vitest';
import { postReview } from '../../src/github/review';
import { ReviewResult } from '../../src/types';

const mockCreateReview = vi.fn().mockResolvedValue({ data: { id: 1 } });

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    pulls: {
      createReview: mockCreateReview,
    },
  })),
}));

describe('postReview', () => {
  const result: ReviewResult = {
    summary: 'Looks good',
    comments: [
      { file: 'src/a.ts', line: 10, body: 'Use const', severity: 'warning' },
      { file: 'src/b.ts', line: 20, body: 'This is a blocker', severity: 'blocker' },
    ],
  };

  it('posts review with REQUEST_CHANGES when blockers or warnings exist', async () => {
    await postReview('token', 'owner', 'repo', 1, 'abc123', result);

    expect(mockCreateReview).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1,
      commit_id: 'abc123',
      body: 'Looks good',
      event: 'REQUEST_CHANGES',
      comments: [
        { path: 'src/a.ts', line: 10, body: 'Use const' },
        { path: 'src/b.ts', line: 20, body: 'This is a blocker' },
      ],
    });
  });

  it('uses APPROVE when no blocker or warning comments', async () => {
    await postReview('token', 'owner', 'repo', 1, 'abc123', {
      summary: 'All good',
      comments: [{ file: 'a.ts', line: 1, body: 'Nice', severity: 'info' }],
    });

    const call = mockCreateReview.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(call.event).toBe('APPROVE');
  });
});
