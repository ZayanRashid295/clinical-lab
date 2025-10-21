// Base services
export { BaseApiService } from "./base/base-api.service";
export * from "./base/api-types";

// Auth services - using shared auth service
export { authService, AuthService } from "../../shared/services/auth.service";

// Payments services
export { paymentsService, PaymentsService } from "./payments/payments.service";
export * from "./payments/payments.types";


// TODO: Add other services as they are created
// export { payoutsService, PayoutsService } from "./payouts/payouts.service";
// export { fleetService, FleetService } from "./fleet/fleet.service";
// export { locationsService, LocationsService } from "./locations/locations.service";
// export { chatService, ChatService } from "./chat/chat.service";
// export { notificationsService, NotificationsService } from "./notifications/notifications.service";
// export { adminService, AdminService } from "./admin/admin.service";
// export { usersService, UsersService } from "./users/users.service";

// Re-import for the api object
import { paymentsService } from "./payments/payments.service";
import { authService } from "../../shared/services/auth.service";

// Convenience exports for commonly used services
export const api = {
  auth: authService,
  payments: paymentsService,
  // TODO: Add other services
};
