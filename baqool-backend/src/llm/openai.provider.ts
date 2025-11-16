// src/llm/openai.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmMessage, LlmProvider, LlmProviderName, LlmResponse } from './llm.types';

export type IntentType = 'chat' | 'code' | 'analysis' | 'rewrite';

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

  // Lightweight router: classify intent + choose model
  async classifyIntentAndModel(
    content: string,
    lastModel?: string,
  ): Promise<{ intent: IntentType; suggestedModel: string; reason: string }> {
    const systemPrompt = `
      You are a lightweight LLM router.

      Given a single user message, you MUST:
      - Classify its intent as one of:
        - "chat"      (general conversation, Q&A, explanation)
        - "code"      (write, debug or explain code)
        - "analysis"  (multi-step reasoning, data analysis, planning)
        - "rewrite"   (rewrite, improve, summarize or translate text)
      - Choose the best model id from:
        - "gpt-4o"
        - "gpt-4o-mini"
        - "claude-3.5-sonnet"
        - "gemini-1.5-pro"

      Rules of thumb:
      - Prefer "gpt-4o-mini" for short casual chat with no deep reasoning.
      - Prefer "gpt-4o" or "claude-3.5-sonnet" for long / complex reasoning or analysis.
      - Prefer "gpt-4o" or "gemini-1.5-pro" for coding tasks.
      - Prefer "gpt-4o-mini" for simple rewrites and summaries.
      - If the user explicitly mentions a model, honour that if it is in the allowed list.

      Respond as a single JSON object:
      {
        "intent": "chat|code|analysis|rewrite",
        "suggestedModel": "<one-of-the-models-above>",
        "reason": "<short natural-language explanation>"
      }
    `;

    const userPrompt = `
      User message:
      "${content}"

      Last model used (if any): ${lastModel ?? 'none'}.
    `;

    const resp = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const raw = resp.choices[0]?.message?.content ?? '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(raw as string);
    } catch {
      parsed = {};
    }

    return {
      intent: (parsed.intent as IntentType) ?? 'chat',
      suggestedModel: parsed.suggestedModel ?? 'gpt-4o',
      reason: parsed.reason ?? '',
    };
  }
}
