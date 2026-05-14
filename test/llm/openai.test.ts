import { describe, it, expect, vi } from 'vitest';
import { OpenAIProvider } from '../../src/llm/openai';
import { ReviewInput } from '../../src/types';

const mockCreate = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: '{"summary":"LGTM","comments":[{"file":"a.ts","line":1,"body":"ok","severity":"info"}]}',
      },
    },
  ],
});

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
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

  it('passes max_tokens from config', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    mockCreate.mockClear();
    await provider.review({
      ...baseInput,
      config: { ...baseInput.config, max_tokens: 2048 },
    });
    expect(mockCreate.mock.calls[0][0].max_tokens).toBe(2048);
  });

  it('uses default max_tokens when not configured', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    mockCreate.mockClear();
    await provider.review(baseInput);
    expect(mockCreate.mock.calls[0][0].max_tokens).toBe(4096);
  });

  it('passes temperature from config', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    mockCreate.mockClear();
    await provider.review({
      ...baseInput,
      config: { ...baseInput.config, temperature: 0.3 },
    });
    expect(mockCreate.mock.calls[0][0].temperature).toBe(0.3);
  });

  it('throws when OPENAI_API_KEY is not set', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    await expect(provider.review(baseInput)).rejects.toThrow('OPENAI_API_KEY');
  });
});
