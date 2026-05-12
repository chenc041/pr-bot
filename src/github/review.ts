import { Octokit } from '@octokit/rest';
import { ReviewResult } from '../types';

export async function postReview(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number,
  commitId: string,
  result: ReviewResult
): Promise<void> {
  const octokit = new Octokit({ auth: token });

  const hasBlockers = result.comments.some((c) => c.severity === 'blocker');
  const hasWarnings = result.comments.some((c) => c.severity === 'warning');

  const event = hasBlockers || hasWarnings ? 'REQUEST_CHANGES' : 'APPROVE';

  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    commit_id: commitId,
    body: result.summary,
    event,
    comments: result.comments.map((c) => ({
      path: c.file,
      line: c.line,
      body: c.body,
    })),
  });
}
