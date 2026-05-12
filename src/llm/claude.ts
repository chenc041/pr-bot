import Anthropic from '@anthropic-ai/sdk';
import { Provider, ReviewInput, ReviewResult, ReviewComment } from '../types';
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

    const response = await client.messages.create({
      model: input.config.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;
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
