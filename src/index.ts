import { loadConfig } from './config';
import { shouldReview } from './triggers';
import { fetchPRContext } from './github/diff';
import { postReview } from './github/review';
import { createProvider } from './llm/provider';
import type { BotConfig, ReviewComment } from './types';
import fs from 'fs';

async function main(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const token = process.env.GITHUB_TOKEN;
  const repoPath = process.env.GITHUB_WORKSPACE ?? '.';

  if (!eventPath || !token) {
    console.error('Missing GITHUB_EVENT_PATH or GITHUB_TOKEN');
    process.exit(0);
  }

  const event = JSON.parse(fs.readFileSync(eventPath, 'utf-8'));
  const eventName = process.env.GITHUB_EVENT_NAME ?? '';

  const config = loadConfig(repoPath);

  if (!shouldReview(config, eventName, event.comment ?? { body: '' })) {
    console.log('No trigger matched. Skipping review.');
    process.exit(0);
  }

  const repo = event.repository?.name;
  const owner = event.repository?.owner?.login;
  const pullNumber =
    event.pull_request?.number ??
    event.issue?.number;

  if (!repo || !owner || !pullNumber) {
    console.error('Could not determine repo, owner, or PR number from event');
    process.exit(0);
  }

  console.log(`Reviewing PR #${pullNumber} in ${owner}/${repo} using ${config.llm.provider}`);

  try {
    const { diff, files, pr } = await fetchPRContext(token, owner, repo, pullNumber);

    if (!diff.trim()) {
      console.log('Empty diff. Skipping review.');
      process.exit(0);
    }

    const maxFiles = config.limits?.max_files ?? 20;
    const maxLines = config.limits?.max_lines_per_file ?? 500;

    let truncatedFiles = files.slice(0, maxFiles).map((f) => ({
      ...f,
      patch: f.patch
        ?.split('\n')
        .slice(0, maxLines)
        .join('\n'),
    }));

    let truncated = files.length > maxFiles;
    const truncatedDiff = truncatedFiles
      .map((f) => `--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch ?? ''}`)
      .join('\n');

    const provider = createProvider(config.llm);
    const result = await provider.review({
      diff: truncatedDiff,
      files: truncatedFiles,
      pr,
      config: config.llm,
    });

    if (truncated) {
      result.summary += `\n\n_(Review truncated: only first ${maxFiles} files were reviewed.)_`;
    }

    const headSha = event.pull_request?.head?.sha;
    if (headSha) {
      await postReview(token, owner, repo, pullNumber, headSha, result);
      console.log(`Review posted: ${result.comments.length} comments`);
    }
  } catch (err) {
    console.error('Review failed:', err instanceof Error ? err.message : String(err));
    process.exit(0);
  }
}

main();
