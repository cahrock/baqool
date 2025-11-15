// src/llm/gemini.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { LlmMessage, LlmProvider, LlmProviderName, LlmResponse } from './llm.types';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiProvider implements LlmProvider {
  public readonly name: LlmProviderName = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. Gemini provider will not work.');
    }
    this.client = new GoogleGenerativeAI(apiKey || '');
  }

  async generate(params: { model: string; messages: LlmMessage[] }): Promise<LlmResponse> {
    const { model, messages } = params;

    const genModel = this.client.getGenerativeModel({ model });
    const history = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const resp = await genModel.generateContent({
      contents: history,
    });

    const text = resp.response.text();

    return {
      content: text,
      model,
    };
  }
}
