// src/llm/llm-orchestrator.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageRole } from '@prisma/client';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';
import { OpenaiProvider } from './openai.provider';
import { LlmMessage, LlmProviderName, LlmResponse } from './llm.types';
import { IntentType } from './openai.provider';

@Injectable()
export class LlmOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenaiProvider,
    private readonly anthropic: AnthropicProvider,
    private readonly gemini: GeminiProvider,
  ) {}

  private resolveProvider(modelProfile: string | null): {
    providerName: LlmProviderName;
    model: string;
  } {
    const profile = modelProfile || process.env.DEFAULT_MODEL_PROFILE || 'gpt-4o';

    // Map your "modelProfile" string to a provider + actual API model
    switch (profile) {
      case 'gpt-4o':
      case 'gpt-4.1-mini':
        return { providerName: 'openai', model: profile };
      case 'claude-3-5-sonnet':
        return { providerName: 'anthropic', model: 'claude-3-5-sonnet-20241022' };
      case 'gemini-1.5-pro':
        return { providerName: 'gemini', model: 'gemini-1.5-pro' };
      default:
        return { providerName: 'openai', model: 'gpt-4o' };
    }
  }

  private getProvider(name: LlmProviderName) {
    switch (name) {
      case 'openai':
        return this.openai;
      case 'anthropic':
        return this.anthropic;
      case 'gemini':
        return this.gemini;
    }
  }

  /* TEMP: mock reply so we don't depend on external API during development */

  // async generateAssistantReply(conversationId: string) {
  //   // TEMP: mock reply so we don't depend on external API during development
  //   return {
  //     content: 'This is a mock AI reply (no real model call).',
  //     model: 'mock-model',
  //   };
  // }

  async generateAssistantReply(
    conversationId: string,
    overrideModelProfile?: string,
  ): Promise<LlmResponse> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 30,
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const profileToUse =
      overrideModelProfile ||
      conversation.modelProfile ||
      process.env.DEFAULT_MODEL_PROFILE ||
      'gpt-4o';

    const { providerName, model } = this.resolveProvider(profileToUse);

    const messages: LlmMessage[] = conversation.messages.map((m) => ({
      role:
        m.role === MessageRole.USER
          ? 'user'
          : m.role === MessageRole.ASSISTANT
          ? 'assistant'
          : 'system',
      content: m.content,
    }));

    const provider = this.getProvider(providerName);
    return provider.generate({ model, messages });
  }  

  async previewRouting(
    content: string,
    lastModel?: string,
  ): Promise<{ intent: IntentType; suggestedModel: string; reason: string }> {
    // For now use OpenAI router; later you can plug in Gemini/Claude variants
    return this.openai.classifyIntentAndModel(content, lastModel);
  }
}
