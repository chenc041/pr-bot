import { Provider, ReviewInput, ReviewResult } from '../types';

export class OpenAIProvider implements Provider {
  name = 'openai';
  async review(_input: ReviewInput): Promise<ReviewResult> {
    throw new Error('Not implemented');
  }
}
