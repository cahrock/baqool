// src/conversations/dto/add-message.dto.ts
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content: string;

  // Optional model selector from the client ("gpt-4o", "gpt-4o-mini", etc.)
  @IsOptional()
  @IsString()
  modelProfile?: string;
}
