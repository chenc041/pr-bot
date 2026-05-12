import { describe, it, expect, vi } from 'vitest';
import { OpenAIProvider } from '../../src/llm/openai';
import { ReviewInput } from '../../src/types';

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: '{"summary":"LGTM","comments":[{"file":"a.ts","line":1,"body":"ok","severity":"info"}]}',
              },
            },
          ],
        }),
      },
    },
  })),
}));

describe('OpenAIProvider', () => {
  const provider = new OpenAIProvider();
  const baseInput: ReviewInput = {
    diff: 'test',
    files: [],
    pr: { title: 'T', description: '' },
    config: { provider: 'openai', model: 'gpt-4' },
  };

  it('returns parsed review result', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const result = await provider.review(baseInput);
    expect(result.summary).toBe('LGTM');
    expect(result.comments).toHaveLength(1);
    expect(result.comments[0].file).toBe('a.ts');
  });

  it('throws when OPENAI_API_KEY is not set', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    await expect(provider.review(baseInput)).rejects.toThrow('OPENAI_API_KEY');
  });
});
