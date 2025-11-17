import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { PreviewMessageDto } from './dto/preview-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * Extract userId from the JWT payload attached by JwtAuthGuard.
   */
  private getUserIdFromRequest(req: Request): string {
    const user = (req as any).user;
    const userId = user?.userId ?? user?.id ?? user?.sub;

    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    return userId;
  }

  // POST /conversations
  @Post()
  createConversation(
    @Req() req: Request,
    @Body() dto: CreateConversationDto,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.createConversation(userId, dto);
  }

  /**
   * GET /conversations/archived
   * Must be above `@Get(':id')` so it doesn't get captured by the :id route.
   */
  @Get('archived')
  listArchived(@Req() req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.listArchivedConversations(userId);
  }

  /**
   * GET /conversations
   * Returns *active* (non-archived) conversations.
   */
  @Get()
  listActive(@Req() req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.listActiveConversations(userId);
  }

  // GET /conversations/:id
  @Get(':id')
  getConversation(@Req() req: Request, @Param('id') id: string) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.getConversation(id, userId);
  }

  // PATCH /conversations/:id
  // Used for inline rename, change modelProfile, pin/unpin, archive/unarchive, etc.
  @Patch(':id')
  updateConversation(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.updateConversation(id, userId, dto);
  }

  // POST /conversations/:id/duplicate
  @Post(':id/duplicate')
  duplicateConversation(@Req() req: Request, @Param('id') id: string) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.duplicateConversation(id, userId);
  }

  // DELETE /conversations/:id
  @Delete(':id')
  deleteConversation(@Req() req: Request, @Param('id') id: string) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.deleteConversation(id, userId);
  }

  // POST /conversations/:id/messages
  @Post(':id/messages')
  addMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.addMessage(id, userId, dto);
  }

  // GET /conversations/:id/messages
  @Get(':id/messages')
  listMessages(@Req() req: Request, @Param('id') id: string) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.listMessages(id, userId);
  }

  // POST /conversations/preview
  @Post('preview')
  preview(@Body() dto: PreviewMessageDto) {
    return this.conversationsService.preview(dto);
  }
}
