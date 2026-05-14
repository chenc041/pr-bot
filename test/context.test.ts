import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadContext, generateContextPrompt, generateMergeUpdatePrompt, appendMergeUpdateToContext } from '../src/context';
import { BotConfig } from '../src/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('loadContext', () => {
  let tmpDir: string;
  const baseConfig: BotConfig = {
    triggers: { pr_open: true, slash_command: true, mention: true, pr_merged: true },
    bot_name: 'patchfox',
    llm: { provider: 'claude', model: 'claude-sonnet-4-6' },
    context: { file: 'CONTEXT.md' },
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-bot-ctx-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('finds existing context file', () => {
    fs.writeFileSync(path.join(tmpDir, 'CONTEXT.md'), '# My Project\nThis is a test project.');
    const result = loadContext(tmpDir, baseConfig);
    expect(result.exists).toBe(true);
    expect(result.content).toContain('My Project');
    expect(result.filename).toBe('CONTEXT.md');
  });

  it('reports missing context file', () => {
    const result = loadContext(tmpDir, baseConfig);
    expect(result.exists).toBe(false);
    expect(result.content).toBeUndefined();
  });

  it('uses custom context filename from config', () => {
    const config = { ...baseConfig, context: { file: 'PROJECT_CONTEXT.md' } };
    fs.writeFileSync(path.join(tmpDir, 'PROJECT_CONTEXT.md'), 'custom context');
    const result = loadContext(tmpDir, config);
    expect(result.exists).toBe(true);
    expect(result.content).toBe('custom context');
  });
});

describe('generateContextPrompt', () => {
  it('includes project tree, key files, commit history, and source files', () => {
    const prompt = generateContextPrompt(
      'src/\n  index.ts',
      { 'package.json': '{"name": "test"}' },
      '- abc1234 (2026-05-01) Alice: initial commit',
      { 'src/index.ts': 'console.log("hello");' }
    );
    expect(prompt).toContain('src/');
    expect(prompt).toContain('package.json');
    expect(prompt).toContain('{"name": "test"}');
    expect(prompt).toContain('abc1234');
    expect(prompt).toContain('Alice');
    expect(prompt).toContain('console.log');
    expect(prompt).toContain('Project Overview');
    expect(prompt).toContain('Commit History');
    expect(prompt).toContain('Frequently Changed Source Files');
  });
});

describe('appendMergeUpdateToContext', () => {
  it('appends Recent Changes section when it does not exist', () => {
    const result = appendMergeUpdateToContext(
      '# My Project\n\nThis is a project.',
      '- Fixed login bug'
    );
    expect(result).toContain('# My Project');
    expect(result).toContain('## Recent Changes');
    expect(result).toContain('- Fixed login bug');
  });

  it('inserts new entry at top of existing Recent Changes section', () => {
    const existing = '# My Project\n\n## Recent Changes\n\n### 2026-05-13\n\n- Old entry';
    const result = appendMergeUpdateToContext(existing, '- New entry');
    const newIndex = result.indexOf('New entry');
    const oldIndex = result.indexOf('Old entry');
    expect(newIndex).toBeLessThan(oldIndex);
  });

  it('preserves content before Recent Changes section', () => {
    const existing = '# Overview\n\nStuff here\n\n## Recent Changes\n\n- old';
    const result = appendMergeUpdateToContext(existing, '- new');
    expect(result.startsWith('# Overview')).toBe(true);
    expect(result).toContain('Stuff here');
  });

  it('handles empty current content', () => {
    const result = appendMergeUpdateToContext('', '- first entry');
    expect(result).toContain('## Recent Changes');
    expect(result).toContain('- first entry');
  });
});

describe('generateMergeUpdatePrompt', () => {
  it('includes PR title, number, and current context', () => {
    const prompt = generateMergeUpdatePrompt({
      currentContext: '# Existing Context',
      prNumber: 42,
      prTitle: 'Fix login redirect',
      prDescription: 'Fixes a bug in the login flow',
      diff: '--- a/src/login.ts\n+++ b/src/login.ts\n@@ -1,3 +1,4 @@',
      changedFiles: ['src/login.ts (+5/-2)'],
    });
    expect(prompt).toContain('#42');
    expect(prompt).toContain('Fix login redirect');
    expect(prompt).toContain('# Existing Context');
    expect(prompt).toContain('src/login.ts');
    expect(prompt).toContain('Recent Changes');
  });
});
