// src/conversations/dto/preview-message.dto.ts
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class PreviewMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;

  // For extra context if you want to bias routing
  @IsOptional()
  @IsString()
  lastModel?: string;
}
