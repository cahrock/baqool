import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    // Load .env and make ConfigService available app-wide
    ConfigModule.forRoot({ isGlobal: true }),

    // Database + Prisma
    PrismaModule,

    // Feature modules
    UsersModule,
    AuthModule,
    ConversationsModule,
    LlmModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
