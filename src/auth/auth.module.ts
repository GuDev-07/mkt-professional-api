import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthController } from './auth.controller';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [SupabaseService, AdminGuard],
  exports: [SupabaseService, AdminGuard, PrismaModule],
})
export class AuthModule {}
