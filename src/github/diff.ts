import { Octokit } from '@octokit/rest';
import { ChangedFile, ReviewInput } from '../types';

export async function fetchPRContext(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<Pick<ReviewInput, 'diff' | 'files' | 'pr'>> {
  const octokit = new Octokit({ auth: token });

  const [prResponse, filesResponse] = await Promise.all([
    octokit.pulls.get({ owner, repo, pull_number: pullNumber }),
    octokit.pulls.listFiles({ owner, repo, pull_number: pullNumber }),
  ]);

  const pr = {
    title: prResponse.data.title,
    description: prResponse.data.body ?? '',
  };

  const files: ChangedFile[] = filesResponse.data.map((f) => ({
    filename: f.filename,
    patch: f.patch,
    additions: f.additions,
    deletions: f.deletions,
  }));

  const diff = files
    .map((f) => `--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch ?? ''}`)
    .join('\n');

  return { diff, files, pr };
}
