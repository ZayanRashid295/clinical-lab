import { EntitlementGuard } from "./entitlement.guard";
import { Reflector } from "@nestjs/core";
import { ExecutionContext } from "@nestjs/common";

describe("EntitlementGuard", () => {
  function makeCtx(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  it("allows when no metadata present", async () => {
    const reflector = { getAllAndOverride: () => undefined } as unknown as Reflector;
    const subs = { getUserEntitlementKeys: async () => [] } as any;
    const guard = new EntitlementGuard(reflector, subs);
    await expect(guard.canActivate(makeCtx({ id: "u1", roles: [] }))).resolves.toBe(
      true
    );
  });

  it("denies when missing required entitlement", async () => {
    const reflector = {
      getAllAndOverride: () => ["qbank.access"],
    } as unknown as Reflector;
    const subs = { getUserEntitlementKeys: async () => [] } as any;
    const guard = new EntitlementGuard(reflector, subs);
    await expect(
      guard.canActivate(makeCtx({ id: "u1", roles: [] }))
    ).rejects.toThrow(/Missing entitlements/);
  });

  it("allows admins regardless of entitlements", async () => {
    const reflector = {
      getAllAndOverride: () => ["qbank.access"],
    } as unknown as Reflector;
    const subs = { getUserEntitlementKeys: async () => [] } as any;
    const guard = new EntitlementGuard(reflector, subs);
    await expect(
      guard.canActivate(makeCtx({ id: "u1", roles: [{ name: "ADMIN" }] }))
    ).resolves.toBe(true);
  });
});

