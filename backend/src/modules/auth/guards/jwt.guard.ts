import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantContext, ActorContext } from '../../../common/security/tenant-context';

/**
 * Authenticates the request via the JWT strategy and enters the actor's
 * TenantContext so downstream guards/services can enforce authorization and
 * tenant isolation. Denies unauthenticated requests by default.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly tenantContext: TenantContext) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ok = (await super.canActivate(context)) as boolean;
    if (!ok) return false;
    return this.enterActorContext(context);
  }

  private enterActorContext(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as ActorContext | undefined;
    if (!user) return false;

    const actor: ActorContext = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      licenceNumber: user.licenceNumber,
    };
    // Enter the actor context for the remainder of the request pipeline.
    this.tenantContext.enterWith(actor);
    return true;
  }
}
