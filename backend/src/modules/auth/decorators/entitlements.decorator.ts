import { SetMetadata } from "@nestjs/common";

export const REQUIRED_ENTITLEMENTS_KEY = "required_entitlements";

export const RequiredEntitlements = (...entitlementKeys: string[]) =>
  SetMetadata(REQUIRED_ENTITLEMENTS_KEY, entitlementKeys);

