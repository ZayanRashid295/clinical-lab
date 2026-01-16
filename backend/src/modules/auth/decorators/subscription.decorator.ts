import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ACTIVE_SUBSCRIPTION_KEY = 'requireActiveSubscription';
export const RequireActiveSubscription = () => SetMetadata(REQUIRE_ACTIVE_SUBSCRIPTION_KEY, true);

export const SUBSCRIPTION_STATUS_KEY = 'subscriptionStatus';
export const SubscriptionStatus = (...statuses: string[]) => SetMetadata(SUBSCRIPTION_STATUS_KEY, statuses);




