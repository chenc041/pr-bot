import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../../src/llm/prompt';
import { ChangedFile } from '../../src/types';

describe('buildPrompt', () => {
  it('includes PR title and description', () => {
    const result = buildPrompt({
      diff: 'diff content',
      files: [],
      pr: { title: 'Fix login bug', description: 'Fixes the redirect' },
      config: { provider: 'claude', model: 'claude-sonnet-4-6' },
    });
    expect(result).toContain('Fix login bug');
    expect(result).toContain('Fixes the redirect');
    expect(result).toContain('diff content');
  });

  it('includes file list when provided', () => {
    const files: ChangedFile[] = [
      { filename: 'src/auth.ts', additions: 10, deletions: 5 },
      { filename: 'src/login.ts', additions: 3, deletions: 2 },
    ];
    const result = buildPrompt({
      diff: '',
      files,
      pr: { title: 'T', description: '' },
      config: { provider: 'claude', model: 'claude-sonnet-4-6' },
    });
    expect(result).toContain('src/auth.ts');
    expect(result).toContain('src/login.ts');
  });

  it('instructs JSON output format', () => {
    const result = buildPrompt({
      diff: '',
      files: [],
      pr: { title: 'T', description: '' },
      config: { provider: 'claude', model: 'claude-sonnet-4-6' },
    });
    expect(result).toContain('"summary"');
    expect(result).toContain('"comments"');
    expect(result).toContain('"severity"');
  });

  it('includes project context when provided', () => {
    const result = buildPrompt({
      diff: '',
      files: [],
      pr: { title: 'T', description: '' },
      config: { provider: 'claude', model: 'x' },
      context: '# Architecture\nThis is a microservice.',
    });
    expect(result).toContain('Project Context');
    expect(result).toContain('This is a microservice.');
  });

  it('does not include context section when not provided', () => {
    const result = buildPrompt({
      diff: '',
      files: [],
      pr: { title: 'T', description: '' },
      config: { provider: 'claude', model: 'x' },
    });
    expect(result).not.toContain('Project Context');
  });
});
