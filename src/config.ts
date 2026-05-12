import { BotConfig } from './types';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const DEFAULTS: BotConfig = {
  triggers: {
    pr_open: true,
    slash_command: true,
    mention: true,
  },
  bot_name: 'pr-reviewer',
  llm: {
    provider: 'claude',
    model: 'claude-sonnet-4-6',
  },
  context: {
    file: 'CLAUDE.md',
  },
};

export function loadConfig(repoPath: string): BotConfig {
  const configPath = path.join(repoPath, '.pr-review-bot.yml');
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULTS, llm: { ...DEFAULTS.llm } };
  }
  const raw = yaml.load(fs.readFileSync(configPath, 'utf-8')) as Partial<BotConfig>;
  return mergeConfig(DEFAULTS, raw);
}

function mergeConfig(defaults: BotConfig, overrides: Partial<BotConfig>): BotConfig {
  return {
    triggers: { ...defaults.triggers, ...overrides.triggers },
    bot_name: overrides.bot_name ?? defaults.bot_name,
    llm: {
      ...defaults.llm,
      ...overrides.llm,
      custom: overrides.llm?.custom ?? defaults.llm.custom,
    },
    limits: overrides.limits ?? defaults.limits,
    context: overrides.context ? { ...defaults.context, ...overrides.context } : defaults.context,
  };
}
