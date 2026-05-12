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
