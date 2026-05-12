// src/triggers.ts
import { BotConfig } from './types';

interface Comment {
  body: string;
}

export function shouldReview(
  config: BotConfig,
  eventName: string,
  comment: Comment
): boolean {
  if (eventName === 'pull_request') {
    return config.triggers.pr_open;
  }

  if (eventName === 'issue_comment') {
    const body = comment.body.trim();
    if (config.triggers.slash_command && /^\/review\b/.test(body)) {
      return true;
    }
    if (config.triggers.mention && body.includes(`@${config.bot_name}`)) {
      return true;
    }
  }

  return false;
}

export type TriggerAction = 'review' | 'generate-context';

export function getTriggerAction(comment: { body: string }): TriggerAction {
  if (/^\/review\s+generate-context\b/.test(comment.body.trim())) {
    return 'generate-context';
  }
  return 'review';
}
