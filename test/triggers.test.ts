import { describe, it, expect } from 'vitest';
import { shouldReview, shouldUpdateContext } from '../src/triggers';
import { BotConfig } from '../src/types';

const baseConfig: BotConfig = {
  triggers: { pr_open: true, slash_command: true, mention: true, pr_merged: true },
  bot_name: 'patchfox',
  llm: { provider: 'claude', model: 'claude-sonnet-4-6' },
};

describe('shouldReview', () => {
  it('returns true for pull_request event when pr_open enabled', () => {
    expect(shouldReview(baseConfig, 'pull_request', { body: '' })).toBe(true);
  });

  it('returns false for pull_request event when pr_open disabled', () => {
    const config = {
      ...baseConfig,
      triggers: { ...baseConfig.triggers, pr_open: false },
    };
    expect(shouldReview(config, 'pull_request', { body: '' })).toBe(false);
  });

  it('returns true for /review command when slash_command enabled', () => {
    expect(
      shouldReview(baseConfig, 'issue_comment', { body: '/review please' })
    ).toBe(true);
  });

  it('returns false for /review command when slash_command disabled', () => {
    const config = {
      ...baseConfig,
      triggers: { ...baseConfig.triggers, slash_command: false },
    };
    expect(
      shouldReview(config, 'issue_comment', { body: '/review please' })
    ).toBe(false);
  });

  it('returns true for @mention when mention enabled', () => {
    expect(
      shouldReview(baseConfig, 'issue_comment', { body: 'hey @patchfox take a look' })
    ).toBe(true);
  });

  it('returns false for @mention when mention disabled', () => {
    const config = {
      ...baseConfig,
      triggers: { ...baseConfig.triggers, mention: false },
    };
    expect(
      shouldReview(config, 'issue_comment', { body: 'hey @patchfox take a look' })
    ).toBe(false);
  });

  it('returns false for plain comment with no trigger', () => {
    expect(
      shouldReview(baseConfig, 'issue_comment', { body: 'nice work!' })
    ).toBe(false);
  });

  it('matches /review at start of line only', () => {
    expect(
      shouldReview(baseConfig, 'issue_comment', { body: 'please /review this' })
    ).toBe(false);
  });
});

describe('shouldUpdateContext', () => {
  it('returns true for merged pull_request closed event', () => {
    expect(shouldUpdateContext(baseConfig, 'pull_request', {
      action: 'closed',
      pull_request: { merged: true },
    })).toBe(true);
  });

  it('returns false for closed but not merged', () => {
    expect(shouldUpdateContext(baseConfig, 'pull_request', {
      action: 'closed',
      pull_request: { merged: false },
    })).toBe(false);
  });

  it('returns false for non-pull_request events', () => {
    expect(shouldUpdateContext(baseConfig, 'issue_comment', {})).toBe(false);
  });

  it('returns false when pr_merged trigger is disabled', () => {
    const config = {
      ...baseConfig,
      triggers: { ...baseConfig.triggers, pr_merged: false },
    };
    expect(shouldUpdateContext(config, 'pull_request', {
      action: 'closed',
      pull_request: { merged: true },
    })).toBe(false);
  });

  it('returns false for synchronize event', () => {
    expect(shouldUpdateContext(baseConfig, 'pull_request', {
      action: 'synchronize',
      pull_request: { merged: true },
    })).toBe(false);
  });
});
