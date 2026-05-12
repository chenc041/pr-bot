// src/types.ts

export interface ContextConfig {
  file: string;
}

export interface FileContent {
  path: string;
  content: string;
  lines: number;
}

export interface BotConfig {
  triggers: {
    pr_open: boolean;
    slash_command: boolean;
    mention: boolean;
  };
  bot_name: string;
  llm: LLMConfig;
  context?: ContextConfig;
  limits?: {
    max_files?: number;
    max_lines_per_file?: number;
  };
}

export interface LLMConfig {
  provider: 'claude' | 'openai' | 'deepseek' | 'custom';
  model: string;
  custom?: {
    endpoint: string;
    model: string;
  };
}

export interface ReviewInput {
  diff: string;
  files: ChangedFile[];
  pr: { title: string; description: string };
  config: LLMConfig;
  context?: string;
}

export interface ChangedFile {
  filename: string;
  patch?: string;
  additions: number;
  deletions: number;
}

export interface ReviewResult {
  summary: string;
  comments: ReviewComment[];
}

export interface ReviewComment {
  file: string;
  line: number;
  body: string;
  severity: 'info' | 'warning' | 'blocker';
}

export interface Provider {
  name: string;
  review(input: ReviewInput): Promise<ReviewResult>;
}
