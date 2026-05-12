import { Provider, LLMConfig } from '../types';
import { ClaudeProvider } from './claude';
import { OpenAIProvider } from './openai';
import { DeepSeekProvider } from './deepseek';
import { OpenAICompatProvider } from './custom';

export function createProvider(config: LLMConfig): Provider {
  switch (config.provider) {
    case 'claude':
      return new ClaudeProvider();
    case 'openai':
      return new OpenAIProvider();
    case 'deepseek':
      return new DeepSeekProvider();
    case 'custom':
      return new OpenAICompatProvider();
  }
}
