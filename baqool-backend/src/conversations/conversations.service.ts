import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { MessageRole } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    const title = dto.title?.trim() || 'New conversation';

    return this.prisma.conversation.create({
      data: {
        userId,
        title,
        modelProfile: dto.modelProfile,
      },
    });
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
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

  async addMessage(conversationId: string, userId: string, dto: AddMessageDto) {
    // ensure the conversation belongs to the user
    await this.getConversationOrThrow(conversationId, userId);

    const msg = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        content: dto.content,
        // modelUsed can be set later when you add AI responses
      },
    });

    // bump updatedAt on conversation
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return msg;
  }

  async listMessages(conversationId: string, userId: string) {
    await this.getConversationOrThrow(conversationId, userId);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
