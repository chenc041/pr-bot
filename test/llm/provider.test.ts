import { describe, it, expect } from 'vitest';
import { createProvider } from '../../src/llm/provider';
import { ClaudeProvider } from '../../src/llm/claude';
import { OpenAIProvider } from '../../src/llm/openai';
import { DeepSeekProvider } from '../../src/llm/deepseek';
import { OpenAICompatProvider } from '../../src/llm/custom';

describe('createProvider', () => {
  it('creates ClaudeProvider for claude', () => {
    const p = createProvider({ provider: 'claude', model: 'claude-sonnet-4-6' });
    expect(p).toBeInstanceOf(ClaudeProvider);
  });

  it('creates OpenAIProvider for openai', () => {
    const p = createProvider({ provider: 'openai', model: 'gpt-4' });
    expect(p).toBeInstanceOf(OpenAIProvider);
  });

  it('creates DeepSeekProvider for deepseek', () => {
    const p = createProvider({ provider: 'deepseek', model: 'deepseek-chat' });
    expect(p).toBeInstanceOf(DeepSeekProvider);
  });

  it('creates OpenAICompatProvider for custom', () => {
    const p = createProvider({
      provider: 'custom',
      model: 'my-model',
      custom: { endpoint: 'https://api.example.com/v1', model: 'my-model' },
    });
    expect(p).toBeInstanceOf(OpenAICompatProvider);
  });
});
