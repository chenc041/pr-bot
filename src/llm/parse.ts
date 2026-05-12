import { ReviewResult, ReviewComment } from '../types';

export function parseReviewResponse(raw: string): ReviewResult {
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
