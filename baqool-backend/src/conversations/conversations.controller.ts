import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // POST /conversations
  @Post()
  createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
    const userId = req.user.userId; // from JwtStrategy.validate
    return this.conversationsService.createConversation(userId, dto);
  }

  // GET /conversations
  @Get()
  listConversations(@Req() req: any) {
    const userId = req.user.userId;
    return this.conversationsService.listConversations(userId);
  }

  // GET /conversations/:id
  @Get(':id')
  getConversation(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.conversationsService.getConversation(id, userId);
  }

  // POST /conversations/:id/messages
  @Post(':id/messages')
  addMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
  ) {
    const userId = req.user.userId;
    return this.conversationsService.addMessage(id, userId, dto);
  }

  // GET /conversations/:id/messages
  @Get(':id/messages')
  listMessages(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.conversationsService.listMessages(id, userId);
  }
}
