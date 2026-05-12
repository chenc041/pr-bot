import { Octokit } from '@octokit/rest';

export async function postComment(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string
): Promise<void> {
  const octokit = new Octokit({ auth: token });
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
}
