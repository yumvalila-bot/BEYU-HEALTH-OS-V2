import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { InMemoryUserRepository } from '../users/user.repository';

describe('AuthService (Phase 1 identity & authentication)', () => {
  let repo: InMemoryUserRepository;
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    repo = new InMemoryUserRepository();
    const config = new ConfigService({
      JWT_SECRET: 'test-secret',
      JWT_EXPIRATION: '24h',
      JWT_REFRESH_EXPIRATION: '7d',
    });
    jwtService = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '24h' } });
    authService = new AuthService(jwtService, config, repo);
    // Seed a known user for login tests.
    await authService.register({
      email: 'doctor@beyu.example',
      full_name: 'Dr. Neema',
      password: 'password123',
      role: 'doctor',
      tenantId: 'TENANT-A',
    });
  });

  it('registers a new user with a hashed password', async () => {
    const result = await authService.register({
      email: 'nurse@beyu.example',
      full_name: 'Grace',
      password: 'password123',
      role: 'nurse',
      tenantId: 'TENANT-A',
    });
    expect(result.user.role).toBe('nurse');
    const stored = await repo.findByEmail('nurse@beyu.example');
    expect(stored?.passwordHash).not.toBe('password123'); // never plaintext
  });

  it('rejects duplicate registration', async () => {
    await expect(
      authService.register({
        email: 'doctor@beyu.example',
        full_name: 'Dup',
        password: 'password123',
        role: 'patient',
        tenantId: 'TENANT-A',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('issues role/tenant-bearing tokens on login with correct credentials', async () => {
    const tokens = await authService.login({ email: 'doctor@beyu.example', password: 'password123' });
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(tokens.user.role).toBe('doctor');
    expect(tokens.user.tenantId).toBe('TENANT-A');

    // Decode the access token to confirm claims.
    const decoded = jwtService.verify<{ role: string; tenantId: string; sub: string }>(tokens.accessToken);
    expect(decoded.role).toBe('doctor');
    expect(decoded.tenantId).toBe('TENANT-A');
    expect(decoded.sub).toBeTruthy();
  });

  it('rejects login with wrong password', async () => {
    await expect(
      authService.login({ email: 'doctor@beyu.example', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login for unknown email', async () => {
    await expect(
      authService.login({ email: 'nobody@beyu.example', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates an access token from a valid refresh token', async () => {
    const tokens = await authService.login({ email: 'doctor@beyu.example', password: 'password123' });
    const rotated = await authService.refreshToken({ refreshToken: tokens.refreshToken });
    expect(rotated.accessToken).toBeTruthy();
    expect(rotated.accessToken).not.toBe(tokens.accessToken);
  });

  it('rejects an invalid refresh token', async () => {
    await expect(authService.refreshToken({ refreshToken: 'not-a-token' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns a public profile without exposing the password hash', async () => {
    const tokens = await authService.login({ email: 'doctor@beyu.example', password: 'password123' });
    const profile = await authService.getUserProfile(tokens.user.id);
    expect(profile.email).toBe('doctor@beyu.example');
    expect((profile as Record<string, unknown>).passwordHash).toBeUndefined();
  });
});
