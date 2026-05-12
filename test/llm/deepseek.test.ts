import { describe, it, expect, vi } from 'vitest';
import { DeepSeekProvider } from '../../src/llm/deepseek';
import { OpenAICompatProvider } from '../../src/llm/custom';
import { ReviewInput } from '../../src/types';

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{"summary":"ok","comments":[]}' } }],
        }),
      },
    },
  })),
}));

describe('DeepSeekProvider', () => {
  const provider = new DeepSeekProvider();
  const input: ReviewInput = {
    diff: 'test',
    files: [],
    pr: { title: 'T', description: '' },
    config: { provider: 'deepseek', model: 'deepseek-chat' },
  };

  it('throws when DEEPSEEK_API_KEY is not set', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', '');
    await expect(provider.review(input)).rejects.toThrow('DEEPSEEK_API_KEY');
  });
});

describe('OpenAICompatProvider', () => {
  const input: ReviewInput = {
    diff: 'test',
    files: [],
    pr: { title: 'T', description: '' },
    config: {
      provider: 'custom',
      model: 'my-model',
      custom: { endpoint: 'https://api.example.com/v1', model: 'my-model' },
    },
  };

  it('throws when CUSTOM_API_KEY is not set', async () => {
    vi.stubEnv('CUSTOM_API_KEY', '');
    const provider = new OpenAICompatProvider();
    await expect(provider.review(input)).rejects.toThrow('CUSTOM_API_KEY');
  });
});
