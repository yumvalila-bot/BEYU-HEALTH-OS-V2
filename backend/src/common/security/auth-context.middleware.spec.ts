/**
 * Phase 1B — DB-driven authorization freshness. Proves that revoked
 * authorization (membership removal, disablement, security-version change)
 * takes effect on the next authenticated request, and that role/permissions are
 * loaded from the database (not trusted from token claims).
 */
import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import { PGlite } from "@electric-sql/pglite";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import { PGliteConnection } from "../../modules/identity/db-connection";
import { IdentityRepository } from "../../modules/identity/identity.repository";
import { AuditService } from "../../modules/identity/audit.service";
import { TenantContext, ActorContext } from "./tenant-context";
import { AuthContextMiddleware } from "./auth-context.middleware";
import * as bcrypt from "bcryptjs";

jest.setTimeout(60_000);

function makeRequest(token: string | null): any {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: {},
  };
}

describe("AuthContextMiddleware (DB-driven authorization freshness)", () => {
  let conn: PGliteConnection;
  let repo: IdentityRepository;
  let audit: AuditService;
  let tenant: TenantContext;
  let jwt: JwtService;
  let middleware: AuthContextMiddleware;

  let tenantAId: string;
  const SECRET = "test-secret";
  const PASSWORD = "password123";

  const enter = (token: string | null, onNext?: () => void) =>
    middleware.use(makeRequest(token), {} as any, () => onNext?.());

  const signToken = (
    sub: string,
    sv: number,
    tenantId: string | null,
    role = "doctor",
  ) =>
    jwt.sign(
      { sub, email: "doc@a.example", role, tenantId, sv },
      { secret: SECRET },
    );

  /** Fresh user + membership per test so tests never mutate shared state. */
  const freshDoctor = async () => {
    const hash = await bcrypt.hash(PASSWORD, 10);
    const user = await repo.createUser({
      email: `doc-${Math.random().toString(36).slice(2)}@a.example`,
      displayName: "Doc",
      passwordHash: hash,
    });
    await repo.ensureMembership({
      globalUserId: user.global_user_id,
      tenantId: tenantAId,
      role: "doctor",
    });
    return user.global_user_id;
  };

  beforeAll(async () => {
    conn = new PGliteConnection(new PGlite());
    repo = new IdentityRepository(conn);
    await repo.ensureSchema();
    audit = new AuditService(repo);
    tenant = new TenantContext();
    jwt = new JwtService({ secret: SECRET, signOptions: { expiresIn: "15m" } });
    middleware = new AuthContextMiddleware(jwt, repo, audit, tenant);
    const ta = await repo.createTenant({ code: "TENANT-A", name: "A" });
    tenantAId = ta.tenant_id;
  });

  afterAll(async () => {
    await conn.close();
  });

  it("enters a DB-derived actor for a valid, current token", async () => {
    const doctorId = await freshDoctor();
    const token = signToken(
      doctorId,
      await repo.getSecurityVersion(doctorId),
      tenantAId,
    );
    // The actor is scoped to the request's async chain, so capture it inside `next`.
    let actor: ActorContext | null = null;
    await enter(token, () => {
      actor = tenant.current();
    });
    expect(actor).not.toBeNull();
    expect(actor!.userId).toBe(doctorId);
    expect(actor!.role).toBe("doctor");
    expect(actor!.permissions).toContain("rx:write"); // from DB, not claims
    expect(actor!.tenantId).toBe(tenantAId);
    // run() scoping means the actor does NOT leak outside the request chain.
    expect(tenant.current()).toBeNull();
  });

  it("rejects a stale token after a security-version bump (role change)", async () => {
    const doctorId = await freshDoctor();
    const oldSv = await repo.getSecurityVersion(doctorId);
    const token = signToken(doctorId, oldSv, tenantAId);
    // Role change bumps security_version → old token must now be rejected.
    await repo.setMembershipRole(doctorId, tenantAId, "nurse");
    await expect(enter(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a disabled account even with a valid token", async () => {
    const doctorId = await freshDoctor();
    const token = signToken(
      doctorId,
      await repo.getSecurityVersion(doctorId),
      tenantAId,
    );
    await repo.setAccountStatus(doctorId, "disabled");
    await repo.bumpSecurityVersion(doctorId);
    await expect(enter(token)).rejects.toThrow("ACCOUNT_DISABLED");
  });

  it("rejects a token after tenant membership is revoked", async () => {
    const doctorId = await freshDoctor();
    // revokeMembership bumps security_version; sign the token with the CURRENT
    // (post-revoke) sv so the freshness check passes and the missing-membership
    // denial is reached.
    await repo.revokeMembership(doctorId, tenantAId);
    const token = signToken(
      doctorId,
      await repo.getSecurityVersion(doctorId),
      tenantAId,
    );
    await expect(enter(token)).rejects.toThrow("NO_TENANT_MEMBERSHIP");
  });

  it("does not enter an actor for a request without a token", async () => {
    await enter(null);
    // No actor should have been established for this (fresh) async chain.
    expect(tenant.current()).toBeNull();
  });
});
