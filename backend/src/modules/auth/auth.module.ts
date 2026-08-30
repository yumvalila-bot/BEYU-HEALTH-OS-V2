import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { UserRepository, InMemoryUserRepository } from '../users/user.repository';
import { TenantContext } from '../../common/security/tenant-context';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'dev-only-change-me'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION', '24h') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    TenantContext,
    { provide: UserRepository, useClass: InMemoryUserRepository },
  ],
  exports: [AuthService, JwtModule, JwtAuthGuard, TenantContext, UserRepository],
})
export class AuthModule {}
