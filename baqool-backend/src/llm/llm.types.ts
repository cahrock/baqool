// src/llm/llm.types.ts
export type LlmRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export interface LlmResponse {
  content: string;
  model: string;
}

export type LlmProviderName = 'openai' | 'anthropic' | 'gemini';

export interface LlmProvider {
  name: LlmProviderName;
  generate(params: {
    model: string;
    messages: LlmMessage[];
  }): Promise<LlmResponse>;
}
