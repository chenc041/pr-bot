import { Provider, ReviewInput, ReviewResult } from '../types';

export class ClaudeProvider implements Provider {
  name = 'claude';
  async review(_input: ReviewInput): Promise<ReviewResult> {
    throw new Error('Not implemented');
  }
}
