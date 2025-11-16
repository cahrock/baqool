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
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { LlmOrchestratorService } from '../llm/llm-orchestrator.service';
import { MessageRole, Message } from '@prisma/client';
import { PreviewMessageDto } from './dto/preview-message.dto';



@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmOrchestratorService,
  ) {}

  async preview(dto: PreviewMessageDto) {
    // No DB access needed for now – pure LLM routing
    return this.llm.previewRouting(dto.content, dto.lastModel);
  }

  /**
   * Create a new messages in a conversation.
   */
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

  
   /**
   * Delete a conversation and all its messages for this user.
   */
  async deleteConversation(id: string, userId: string) {
    // ensure it exists & belongs to this user
    await this.getConversationOrThrow(id, userId);

    // delete child messages first (no onDelete: Cascade in schema)
    await this.prisma.message.deleteMany({
      where: { conversationId: id },
    });

    // then delete the conversation
    await this.prisma.conversation.delete({
      where: { id },
    });

    return { success: true };
  }

    /**
   * Duplicate a conversation and its messages for this user.
   * Returns the newly created conversation.
   */
  async duplicateConversation(id: string, userId: string) {
    const convo = await this.getConversationOrThrow(id, userId);

    // Load all messages (keep order)
    const messages = await this.prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Create the new conversation
    const newConversation = await this.prisma.conversation.create({
      data: {
        userId,
        title: convo.title
          ? `${convo.title} (copy)`
          : 'Untitled conversation (copy)',
        modelProfile: convo.modelProfile,
      },
    });

    // Copy messages over (if any)
    if (messages.length > 0) {
      await this.prisma.message.createMany({
        data: messages.map((m) => ({
          conversationId: newConversation.id,
          role: m.role,
          content: m.content,
          modelUsed: m.modelUsed,
          userId: m.userId,
        })),
      });
    }

    return newConversation;
  }


  /**
   * List Conversations in a conversation.
   */
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

  /**
   * Get conversation messages in a conversation.
   */
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
   * Update a conversation (title, modelProfile, etc.) for this user.
   */
  async updateConversation(
    id: string,
    userId: string,
    dto: UpdateConversationDto,
  ) {
    // Ensure the conversation exists and belongs to this user
    await this.getConversationOrThrow(id, userId);

    const data: any = {};

    if (dto.title !== undefined) {
      const trimmed = dto.title.trim();
      data.title = trimmed || 'Untitled conversation';
    }

    if (dto.modelProfile !== undefined) {
      data.modelProfile = dto.modelProfile.trim();
    }

    return this.prisma.conversation.update({
      where: { id },
      data,
    });
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
      data: {
        updatedAt: new Date(),
        ...(dto.modelProfile ? { modelProfile: dto.modelProfile } : {}),
      },
    });

    // 3. Ask LLM for reply; don't fail the whole request if LLM errors
    let assistantMessage: Message | null = null;

    try {
      const aiReply = await this.llm.generateAssistantReply(
        conversationId,
        dto.modelProfile,
      );

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

  /**
   * List messages in a conversation.
   */
  async listMessages(conversationId: string, userId: string) {
    await this.getConversationOrThrow(conversationId, userId);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
