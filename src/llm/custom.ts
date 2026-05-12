import { Provider, ReviewInput, ReviewResult } from '../types';

export class OpenAICompatProvider implements Provider {
  name = 'custom';
  async review(_input: ReviewInput): Promise<ReviewResult> {
    throw new Error('Not implemented');
  }
}
