// src/llm/llm.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmOrchestratorService } from './llm-orchestrator.service';
import { OpenaiProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';

@Module({
  imports: [PrismaModule],
  providers: [LlmOrchestratorService, OpenaiProvider, AnthropicProvider, GeminiProvider],
  exports: [LlmOrchestratorService], // Export the orchestrator for use in other modules
})
export class LlmModule {}
