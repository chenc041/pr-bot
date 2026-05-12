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
    bot_name: 'pr-reviewer',
    llm: { provider: 'claude', model: 'claude-sonnet-4-6' },
    context: { file: 'CLAUDE.md' },
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-bot-ctx-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('finds existing context file', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# My Project\nThis is a test project.');
    const result = loadContext(tmpDir, baseConfig);
    expect(result.exists).toBe(true);
    expect(result.content).toContain('My Project');
    expect(result.filename).toBe('CLAUDE.md');
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
  it('includes project tree and key files', () => {
    const prompt = generateContextPrompt('src/\n  index.ts', {
      'package.json': '{"name": "test"}',
    });
    expect(prompt).toContain('src/');
    expect(prompt).toContain('package.json');
    expect(prompt).toContain('{"name": "test"}');
    expect(prompt).toContain('Project Overview');
  });
});
