// src/llm/openai.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmMessage, LlmProvider, LlmProviderName, LlmResponse } from './llm.types';

@Injectable()
export class OpenaiProvider implements LlmProvider {
  public readonly name: LlmProviderName = 'openai';
  private readonly logger = new Logger(OpenaiProvider.name);
  private readonly client: OpenAI;

  constructor() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    this.logger.warn('OPENAI_API_KEY is not set. OpenAI provider will not work.');
  } else {
    this.logger.log(`OPENAI_API_KEY loaded, starts with: ${apiKey.slice(0, 7)}***`);
  }
  this.client = new OpenAI({ apiKey });
}


  async generate(params: { model: string; messages: LlmMessage[] }): Promise<LlmResponse> {
    const { model, messages } = params;

    const completion = await this.client.chat.completions.create({
      model: model || 'gpt-4o',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.7,
    });

    const choice = completion.choices[0];
    const content = (choice.message.content as string) ?? '';

    return {
      content,
      model: completion.model || model,
    };
  }
}
