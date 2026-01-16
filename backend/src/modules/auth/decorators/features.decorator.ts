import { SetMetadata } from '@nestjs/common';

export const REQUIRED_FEATURES_KEY = 'requiredFeatures';
export const RequiredFeatures = (...features: string[]) => SetMetadata(REQUIRED_FEATURES_KEY, features);



