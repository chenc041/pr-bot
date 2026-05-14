import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeProvider } from '../../src/llm/claude';
import { ReviewInput } from '../../src/types';

const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: '{"summary":"Looks good","comments":[]}' }],
});

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

describe('ClaudeProvider', () => {
  const provider = new ClaudeProvider();
  const baseInput: ReviewInput = {
    diff: 'test diff',
    files: [],
    pr: { title: 'Test', description: '' },
    config: { provider: 'claude', model: 'claude-sonnet-4-6' },
  };

  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    mockCreate.mockClear();
  });

  it('returns parsed review result', async () => {
    const result = await provider.review(baseInput);
    expect(result.summary).toBe('Looks good');
    expect(result.comments).toEqual([]);
  });

  it('passes max_tokens from config', async () => {
    await provider.review({
      ...baseInput,
      config: { ...baseInput.config, max_tokens: 8192 },
    });
    expect(mockCreate.mock.calls[0][0].max_tokens).toBe(8192);
  });

  it('uses default max_tokens when not configured', async () => {
    await provider.review(baseInput);
    expect(mockCreate.mock.calls[0][0].max_tokens).toBe(4096);
  });

  it('passes temperature from config', async () => {
    await provider.review({
      ...baseInput,
      config: { ...baseInput.config, temperature: 0.5 },
    });
    expect(mockCreate.mock.calls[0][0].temperature).toBe(0.5);
  });

  it('enables thinking with default budget when thinking=true', async () => {
    await provider.review({
      ...baseInput,
      config: { ...baseInput.config, thinking: true },
    });
    expect(mockCreate.mock.calls[0][0].thinking).toEqual({
      type: 'enabled',
      budget_tokens: 1600,
    });
  });

  it('enables thinking with custom budget when thinking=number', async () => {
    await provider.review({
      ...baseInput,
      config: { ...baseInput.config, thinking: 4000 },
    });
    expect(mockCreate.mock.calls[0][0].thinking).toEqual({
      type: 'enabled',
      budget_tokens: 4000,
    });
  });

  it('removes temperature when thinking is enabled', async () => {
    await provider.review({
      ...baseInput,
      config: { ...baseInput.config, thinking: true, temperature: 0.5 },
    });
    expect(mockCreate.mock.calls[0][0].temperature).toBeUndefined();
  });

  it('throws when ANTHROPIC_API_KEY is not set', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    await expect(provider.review(baseInput)).rejects.toThrow('ANTHROPIC_API_KEY');
  });
});
