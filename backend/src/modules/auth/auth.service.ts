import { randomUUID } from 'crypto';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { UserRepository } from '../users/user.repository';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenantId: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.userRepository.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }
    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    const user = await this.userRepository.create({
      email: registerDto.email,
      fullName: registerDto.full_name,
      passwordHash,
      role: registerDto.role ?? 'patient',
      tenantId: registerDto.tenantId ?? 'default',
      organizationId: registerDto.organizationId,
      licenceNumber: registerDto.licenceNumber,
    });
    return {
      message: 'User registered successfully',
      user: this.publicUser(user),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify<{ sub: string; refresh: true }>(
        refreshTokenDto.refreshToken,
      );
      if (!payload?.refresh) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.active) {
        throw new UnauthorizedException('User no longer active');
      }
      return {
        accessToken: this.jwtService.sign(
          { email: user.email, role: user.role, tenantId: user.tenantId },
          { subject: user.id, expiresIn: this.configService.get('JWT_EXPIRATION', '24h') },
        ),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.publicUser(user);
  }

  async logout(userId: string) {
    // Token invalidation (revocation list) is wired here for future persistence.
    return { message: 'Logged out successfully', userId };
  }

  private issueTokens(user: { id: string; email: string; role: string; tenantId: string }): AuthTokens {
    const payload = {
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      // Unique token id so every issued token is distinct (enables rotation/revocation).
      jti: randomUUID(),
    };
    return {
      accessToken: this.jwtService.sign(payload, {
        subject: user.id,
        expiresIn: this.configService.get('JWT_EXPIRATION', '24h'),
      }),
      refreshToken: this.jwtService.sign(
        { ...payload, refresh: true },
        {
          subject: user.id,
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
        },
      ),
      user: this.publicUser(user),
    };
  }

  private publicUser(user: { id: string; email: string; fullName?: string; role: string; tenantId: string }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName ?? '',
      role: user.role,
      tenantId: user.tenantId,
    };
  }
}
