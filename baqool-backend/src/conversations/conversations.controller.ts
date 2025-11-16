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

  private getUserIdFromRequest(req: Request): string {
    const user = (req as any).user;
    const userId = user?.userId ?? user?.id ?? user?.sub;

    if (!userId) {
      throw new UnauthorizedException('User not found in request');
    }

    return userId;
  }

  @Post()
  createConversation(
    @Req() req: Request,
    @Body() dto: CreateConversationDto,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.createConversation(userId, dto);
  }

  @Get()
  listConversations(@Req() req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.listConversations(userId);
  }

  @Get(':id')
  getConversation(@Req() req: Request, @Param('id') id: string) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.getConversation(id, userId);
  }

    // PATCH /conversations/:id
  @Patch(':id')
  updateConversation(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    //const userId = req.user.userId;
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


  @Post(':id/messages')
  addMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.addMessage(id, userId, dto);
  }

  @Get(':id/messages')
  listMessages(@Req() req: Request, @Param('id') id: string) {
    const userId = this.getUserIdFromRequest(req);
    return this.conversationsService.listMessages(id, userId);
  }

  @Post('preview')
  preview(@Body() dto: PreviewMessageDto, @Req() req: any) {
    // At this point dto is validated by ValidationPipe
    return this.conversationsService.preview(dto);
  }

}
