import OpenAI from 'openai';
import { Provider, ReviewInput, ReviewResult } from '../types';
import { parseReviewResponse } from './parse';
import { buildPrompt } from './prompt';

export class DeepSeekProvider implements Provider {
  name = 'deepseek';

  async review(input: ReviewInput): Promise<ReviewResult> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com/v1',
    });
    const prompt = buildPrompt(input);

    const params: Record<string, unknown> = {
      model: input.config.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: input.config.max_tokens ?? 4096,
    };

    if (input.config.temperature !== undefined) {
      params.temperature = input.config.temperature;
    }

    const response = await client.chat.completions.create(params as any);

    const text = response.choices[0]?.message?.content ?? '';
    return parseReviewResponse(text);
  }
}
