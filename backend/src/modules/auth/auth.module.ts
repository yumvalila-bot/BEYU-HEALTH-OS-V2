import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { TenantContext } from '../../common/security/tenant-context';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    PassportModule,
    IdentityModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'dev-only-change-me'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION', '15m') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, TenantContext],
  exports: [AuthService, JwtModule, JwtAuthGuard, TenantContext, IdentityModule],
})
export class AuthModule {}
