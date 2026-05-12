import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../src/config';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-bot-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns defaults when no config file exists', () => {
    const config = loadConfig(tmpDir);
    expect(config.triggers.pr_open).toBe(true);
    expect(config.triggers.slash_command).toBe(true);
    expect(config.triggers.mention).toBe(true);
    expect(config.bot_name).toBe('pr-reviewer');
    expect(config.llm.provider).toBe('claude');
    expect(config.llm.model).toBe('claude-sonnet-4-6');
  });

  it('loads and merges user config', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.pr-review-bot.yml'),
      `
triggers:
  pr_open: false
llm:
  provider: openai
  model: gpt-4
`
    );
    const config = loadConfig(tmpDir);
    expect(config.triggers.pr_open).toBe(false);
    expect(config.triggers.slash_command).toBe(true); // default preserved
    expect(config.llm.provider).toBe('openai');
    expect(config.llm.model).toBe('gpt-4');
  });

  it('loads custom provider config', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.pr-review-bot.yml'),
      `
llm:
  provider: custom
  model: my-model
  custom:
    endpoint: https://api.example.com/v1
    model: deepseek-chat
`
    );
    const config = loadConfig(tmpDir);
    expect(config.llm.provider).toBe('custom');
    expect(config.llm.custom?.endpoint).toBe('https://api.example.com/v1');
  });
});
