import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadContext, generateContextPrompt } from '../src/context';
import { BotConfig } from '../src/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('loadContext', () => {
  let tmpDir: string;
  const baseConfig: BotConfig = {
    triggers: { pr_open: true, slash_command: true, mention: true },
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
