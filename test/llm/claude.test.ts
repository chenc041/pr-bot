import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeProvider } from '../../src/llm/claude';
import { ReviewInput } from '../../src/types';

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"summary":"Looks good","comments":[]}' }],
      }),
    },
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
  });

  it('returns parsed review result', async () => {
    const result = await provider.review(baseInput);
    expect(result.summary).toBe('Looks good');
    expect(result.comments).toEqual([]);
  });

  it('throws when ANTHROPIC_API_KEY is not set', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    await expect(provider.review(baseInput)).rejects.toThrow('ANTHROPIC_API_KEY');
  });
});
