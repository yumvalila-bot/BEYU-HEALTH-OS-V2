import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * The authenticated actor context attached to every request. Populated by the
 * JwtAuthGuard after a valid token is verified. Guards and services read from
 * this context to enforce tenant isolation and authorization.
 */
export interface ActorContext {
  /** Global BEYU user id (from JWT `sub`). */
  userId: string;
  /** Email / login identifier. */
  email: string;
  /** Canonical role id (see permissions.ts). */
  role: string;
  /** Effective permission grants beyond the role (break-glass, explicit grants). */
  permissions: string[];
  /** Tenant (facility/organization unit) the user is acting within. */
  tenantId: string;
  /** Owning organization of the tenant. */
  organizationId?: string;
  /** Professional licence number, when applicable. */
  licenceNumber?: string | null;
}

/**
 * Shared async storage. A store is established per request by the global
 * TenantContextMiddleware; the JwtAuthGuard then enters the authenticated actor
 * via `enterWith` so the whole downstream pipeline reads the correct context.
 */
export const tenantStorage = new AsyncLocalStorage<ActorContext | null>();

@Injectable({ scope: Scope.DEFAULT })
export class TenantContext {
  /** The current actor context, or null when unauthenticated. */
  current(): ActorContext | null {
    return tenantStorage.getStore() ?? null;
  }

  /** Throw-safe accessor. */
  require(): ActorContext {
    const ctx = this.current();
    if (!ctx) {
      throw new Error('AUTH_REQUIRED');
    }
    return ctx;
  }

  /** Current tenant id. */
  tenantId(): string {
    return this.require().tenantId;
  }

  /** Set the actor for the current async context (called by JwtAuthGuard). */
  enterWith(actor: ActorContext): void {
    tenantStorage.enterWith(actor);
  }
}
