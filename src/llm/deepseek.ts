import { Provider, ReviewInput, ReviewResult } from '../types';

export class DeepSeekProvider implements Provider {
  name = 'deepseek';
  async review(_input: ReviewInput): Promise<ReviewResult> {
    throw new Error('Not implemented');
  }
}
