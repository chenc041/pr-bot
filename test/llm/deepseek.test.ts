import { describe, it, expect, vi } from 'vitest';
import { DeepSeekProvider } from '../../src/llm/deepseek';
import { OpenAICompatProvider } from '../../src/llm/custom';
import { ReviewInput } from '../../src/types';

const mockCreate = vi.fn().mockResolvedValue({
  choices: [{ message: { content: '{"summary":"ok","comments":[]}' } }],
});

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
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

  it('passes max_tokens from config', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', 'test-key');
    mockCreate.mockClear();
    await provider.review({
      ...input,
      config: { ...input.config, max_tokens: 2048 },
    });
    expect(mockCreate.mock.calls[0][0].max_tokens).toBe(2048);
  });

  it('uses default max_tokens', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', 'test-key');
    mockCreate.mockClear();
    await provider.review(input);
    expect(mockCreate.mock.calls[0][0].max_tokens).toBe(4096);
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

  it('passes max_tokens from config', async () => {
    vi.stubEnv('CUSTOM_API_KEY', 'test-key');
    mockCreate.mockClear();
    const provider = new OpenAICompatProvider();
    await provider.review({
      ...input,
      config: { ...input.config, max_tokens: 1024 },
    });
    expect(mockCreate.mock.calls[0][0].max_tokens).toBe(1024);
  });
});
