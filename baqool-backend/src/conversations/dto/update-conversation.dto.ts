// src/conversations/dto/update-conversation.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  // Optional: allow updating the default model for the conversation
  @IsOptional()
  @IsString()
  modelProfile?: string;
}
