// src/conversations/conversations.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { LlmOrchestratorService } from '../llm/llm-orchestrator.service';
import { MessageRole, Message } from '@prisma/client';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmOrchestratorService,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    const title = dto.title?.trim() || 'New conversation';
    const modelProfile = dto.modelProfile?.trim() || 'gpt-4o';

    return this.prisma.conversation.create({
      data: {
        userId,
        title,
        modelProfile,
      },
    });
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getConversationOrThrow(id: string, userId: string) {
    const convo = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!convo) {
      throw new NotFoundException('Conversation not found');
    }
    if (convo.userId !== userId) {
      throw new ForbiddenException('You do not own this conversation');
    }

    return convo;
  }

  async getConversation(id: string, userId: string) {
    return this.getConversationOrThrow(id, userId);
  }

  /**
   * Add a user message to a conversation.
   * Returns both the stored userMessage and (if successful) assistantMessage.
   */
  async addMessage(
    conversationId: string,
    userId: string,
    dto: AddMessageDto,
  ) {
    await this.getConversationOrThrow(conversationId, userId);

    // 1. Store user message
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        content: dto.content,
        userId,
      },
    });

    // 2. Bump updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 3. Ask LLM for reply; don't fail the whole request if LLM errors
    let assistantMessage: Message | null = null;

    try {
      const aiReply = await this.llm.generateAssistantReply(conversationId);

      assistantMessage = await this.prisma.message.create({
        data: {
          conversationId,
          role: MessageRole.ASSISTANT,
          content: aiReply.content,
          modelUsed: aiReply.model,
        },
      });
    } catch (err) {
      this.logger.error(
        `LLM generateAssistantReply failed for conversation ${conversationId}`,
        err instanceof Error ? err.stack : String(err),
      );
      // We still return userMessage so the UI isn't blocked.
    }

    return { userMessage, assistantMessage };
  }

  async listMessages(conversationId: string, userId: string) {
    await this.getConversationOrThrow(conversationId, userId);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
