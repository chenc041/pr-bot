import Anthropic from '@anthropic-ai/sdk';
import { Provider, ReviewInput, ReviewResult } from '../types';
import { parseReviewResponse } from './parse';
import { buildPrompt } from './prompt';

export class ClaudeProvider implements Provider {
  name = 'claude';

  async review(input: ReviewInput): Promise<ReviewResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    const client = new Anthropic({ apiKey });
    const prompt = buildPrompt(input);

    const params: Record<string, unknown> = {
      model: input.config.model,
      max_tokens: input.config.max_tokens ?? 4096,
      messages: [{ role: 'user', content: prompt }],
    };

    if (input.config.temperature !== undefined) {
      params.temperature = input.config.temperature;
    }

    if (input.config.thinking) {
      const budget = typeof input.config.thinking === 'number' ? input.config.thinking : 1600;
      params.thinking = { type: 'enabled', budget_tokens: budget };
      delete params.temperature;
    }

    const response = await client.messages.create(params as any);

    const text = (response.content[0] as { type: 'text'; text: string }).text;
    return parseReviewResponse(text);
  }
}
