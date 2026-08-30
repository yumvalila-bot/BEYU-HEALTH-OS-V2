import { Module } from '@nestjs/common';
import { SupabaseController } from './supabase.controller';
import { SupabaseService } from './supabase.service';
import { AuthModule } from '../auth/auth.module';
import { TenantScopeGuard } from '../../common/security/tenant-scope.guard';

@Module({
  imports: [AuthModule],
  controllers: [SupabaseController],
  providers: [SupabaseService, TenantScopeGuard],
  exports: [SupabaseService],
})
export class SupabaseModule {}
