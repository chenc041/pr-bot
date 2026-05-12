import { describe, it, expect, vi } from 'vitest';
import { postComment } from '../../src/github/comment';

const mockCreateComment = vi.fn().mockResolvedValue({ data: { id: 1 } });

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    issues: {
      createComment: mockCreateComment,
    },
  })),
}));

describe('postComment', () => {
  it('posts a comment on the PR', async () => {
    await postComment('token', 'owner', 'repo', 42, 'Hello world');

    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 42,
      body: 'Hello world',
    });
  });
});
