/**
 * Phase 1B — DI wiring smoke test. Proves that the global AuthContextMiddleware
 * and the CsrfOriginGuard resolve all of their constructor dependencies in a
 * real Nest dependency-injection container (with the DB connection substituted
 * for in-process PostgreSQL). Guards against silent DI breakage that a plain
 * compile would not catch.
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PGlite } from "@electric-sql/pglite";
import {
  DB_CONNECTION,
  PGliteConnection,
} from "../../modules/identity/db-connection";
import { IdentityRepository } from "../../modules/identity/identity.repository";
import { AuditService } from "../../modules/identity/audit.service";
import { TenantContext } from "./tenant-context";
import { AuthContextMiddleware } from "./auth-context.middleware";
import { CsrfOriginGuard } from "./csrf-origin.guard";

@Module({
  imports: [
    JwtModule.register({ secret: "test" }),
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  providers: [
    { provide: DB_CONNECTION, useValue: null as any },
    IdentityRepository,
    AuditService,
    TenantContext,
    AuthContextMiddleware,
    CsrfOriginGuard,
  ],
})
class TestHarness {}

describe("Auth DI wiring", () => {
  let pg: PGlite;
  let conn: PGliteConnection;

  beforeAll(async () => {
    pg = new PGlite();
    conn = new PGliteConnection(pg);
  });
  afterAll(async () => {
    await conn.close();
  });

  it("resolves AuthContextMiddleware and CsrfOriginGuard with their deps", async () => {
    const ctx = await Test.createTestingModule({ imports: [TestHarness] })
      .overrideProvider(DB_CONNECTION)
      .useValue(conn)
      .compile();
    const middleware = ctx.get(AuthContextMiddleware);
    const guard = ctx.get(CsrfOriginGuard);
    expect(middleware).toBeInstanceOf(AuthContextMiddleware);
    expect(guard).toBeInstanceOf(CsrfOriginGuard);
    await ctx.close();
  });
});
