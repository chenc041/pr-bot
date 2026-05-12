import OpenAI from 'openai';
import { Provider, ReviewInput, ReviewResult } from '../types';
import { parseReviewResponse } from './parse';
import { buildPrompt } from './prompt';

export class OpenAICompatProvider implements Provider {
  name = 'custom';

  async review(input: ReviewInput): Promise<ReviewResult> {
    const apiKey = process.env.CUSTOM_API_KEY;
    if (!apiKey) {
      throw new Error('CUSTOM_API_KEY environment variable is not set');
    }

    const endpoint = input.config.custom?.endpoint ?? 'https://api.openai.com/v1';
    const model = input.config.custom?.model ?? input.config.model;

    const client = new OpenAI({ apiKey, baseURL: endpoint });
    const prompt = buildPrompt(input);

    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    });

    const text = response.choices[0]?.message?.content ?? '';
    return parseReviewResponse(text);
  }
}
