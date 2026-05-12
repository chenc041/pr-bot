import OpenAI from 'openai';
import { Provider, ReviewInput, ReviewResult, ReviewComment } from '../types';
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

function parseReviewResponse(raw: string): ReviewResult {
  let json = raw.trim();
  if (json.startsWith('```json')) {
    json = json.slice(7, -3).trim();
  } else if (json.startsWith('```')) {
    json = json.slice(3, -3).trim();
  }

  const parsed = JSON.parse(json);

  if (!parsed.summary || !Array.isArray(parsed.comments)) {
    throw new Error('LLM response missing required fields: summary and comments');
  }

  const comments: ReviewComment[] = parsed.comments.map((c: Record<string, unknown>) => ({
    file: String(c.file || ''),
    line: Number(c.line || 0),
    body: String(c.body || ''),
    severity: (['info', 'warning', 'blocker'].includes(String(c.severity))
      ? String(c.severity)
      : 'info') as ReviewComment['severity'],
  }));

  return { summary: String(parsed.summary), comments };
}
