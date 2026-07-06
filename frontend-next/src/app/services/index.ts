// Base services
export { BaseApiService } from "./base/base-api.service";
export * from "./base/api-types";

// Auth services - using shared auth service
export { authService, AuthService } from "../../shared/services/auth.service";

// Billing services
export { billingService, BillingService } from "./billing/billing.service";

// Users services
export { UsersService } from "./users/users.service";
export * from "./users/users.types";

import { billingService } from "./billing/billing.service";
import { authService } from "../../shared/services/auth.service";

export const api = {
  auth: authService,
  billing: billingService,
};
