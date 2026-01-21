// Base services
export { BaseApiService } from "./base/base-api.service";
export * from "./base/api-types";

// Auth services - using shared auth service
export { authService, AuthService } from "../../shared/services/auth.service";

// Payments services
export { paymentsService, PaymentsService } from "./payments/payments.service";
export * from "./payments/payments.types";

// Users services
export { UsersService } from "./users/users.service";
export * from "./users/users.types";

// Re-import for the api object
import { paymentsService } from "./payments/payments.service";
import { authService } from "../../shared/services/auth.service";

// Convenience exports for commonly used services
export const api = {
  auth: authService,
  payments: paymentsService,
};
