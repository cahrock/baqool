// src/llm/anthropic.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { LlmMessage, LlmProvider, LlmProviderName, LlmResponse } from './llm.types';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AnthropicProvider implements LlmProvider {
  public readonly name: LlmProviderName = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY is not set. Anthropic provider will not work.');
    }
    this.client = new Anthropic({ apiKey });
  }

  async generate(params: { model: string; messages: LlmMessage[] }): Promise<LlmResponse> {
    const { model, messages } = params;

    const resp = await this.client.messages.create({
      model,
      max_tokens: 1024,
      messages: messages.map((m) => ({
        role: m.role === 'system' ? 'user' : m.role, // Anthropic has no "system" role; usually merged into user
        content: m.content,
      })),
    });

    const contentBlock = resp.content[0];
    const text = 'text' in contentBlock ? contentBlock.text : '';

    return {
      content: text,
      model: resp.model,
    };
  }
}
