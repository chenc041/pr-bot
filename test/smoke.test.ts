// test/smoke.test.ts
import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config';
import { shouldReview, shouldUpdateContext } from '../src/triggers';
import { createProvider } from '../src/llm/provider';
import { buildPrompt } from '../src/llm/prompt';
import { parseReviewResponse } from '../src/llm/parse';

describe('smoke test', () => {
  const config = loadConfig('/nonexistent');

  it('config has expected defaults', () => {
    expect(config.triggers.pr_open).toBe(true);
    expect(config.triggers.pr_merged).toBe(true);
    expect(config.llm.provider).toBe('claude');
  });

  it('creates all provider types', () => {
    expect(createProvider({ provider: 'claude', model: 'x' }).name).toBe('claude');
    expect(createProvider({ provider: 'openai', model: 'x' }).name).toBe('openai');
    expect(createProvider({ provider: 'deepseek', model: 'x' }).name).toBe('deepseek');
    expect(createProvider({
      provider: 'custom', model: 'x',
      custom: { endpoint: 'http://localhost', model: 'x' },
    }).name).toBe('custom');
  });

  it('trigger detection works end-to-end', () => {
    expect(shouldReview(config, 'pull_request', { body: '' })).toBe(true);
    expect(shouldReview(config, 'issue_comment', { body: '/review' })).toBe(true);
    expect(shouldReview(config, 'issue_comment', { body: '@patchfox' })).toBe(true);
    expect(shouldReview(config, 'issue_comment', { body: 'random' })).toBe(false);
  });

  it('prompt builds without error', () => {
    const p = buildPrompt({
      diff: 'test',
      files: [{ filename: 'a.ts', additions: 1, deletions: 0 }],
      pr: { title: 'Test', description: '' },
      config: { provider: 'claude', model: 'x' },
    });
    expect(p).toContain('Test');
    expect(p).toContain('a.ts');
  });

  it('parseReviewResponse parses valid JSON', () => {
    const r = parseReviewResponse('{"summary":"ok","comments":[{"file":"a","line":1,"body":"b","severity":"info"}]}');
    expect(r.summary).toBe('ok');
    expect(r.comments).toHaveLength(1);
  });

  it('merge trigger detection works end-to-end', () => {
    expect(shouldUpdateContext(config, 'pull_request', {
      action: 'closed',
      pull_request: { merged: true },
    })).toBe(true);
    expect(shouldUpdateContext(config, 'pull_request', {
      action: 'closed',
      pull_request: { merged: false },
    })).toBe(false);
    expect(shouldUpdateContext(config, 'pull_request', {
      action: 'synchronize',
    })).toBe(false);
  });

  it('parseReviewResponse handles markdown wrapping', () => {
    const r = parseReviewResponse('```json\n{"summary":"ok","comments":[]}\n```');
    expect(r.summary).toBe('ok');
  });
});
