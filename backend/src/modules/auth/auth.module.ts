import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { TokenBlacklistService } from "./token-blacklist.service";
import { JwtAuthWithBlacklistGuard } from "./guards/jwt-auth-with-blacklist.guard";
import { RolesGuard } from "./guards/roles.guard";
import { PermissionsGuard } from "./guards/permissions.guard";
import { SubscriptionGuard } from "./guards/subscription.guard";
import { FeatureGuard } from "./guards/feature.guard";
import { CombinedAccessGuard } from "./guards/combined-access.guard";
import { EntitlementGuard } from "./guards/entitlement.guard";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UsersModule } from "../users/users.module";
import { InstitutionModule } from "../institution/institution.module";

@Module({
  imports: [
    PassportModule,
    UsersModule,
    InstitutionModule,
    SubscriptionsModule, // Import to use SubscriptionsService in guards
    NotificationsModule, // Welcome notification on signup
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRES_IN") || "7d",
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    TokenBlacklistService,
    JwtAuthWithBlacklistGuard,
    RolesGuard,
    PermissionsGuard,
    SubscriptionGuard,
    FeatureGuard,
    CombinedAccessGuard,
    EntitlementGuard,
  ],
  exports: [
    AuthService,
    RolesGuard,
    PermissionsGuard,
    SubscriptionGuard,
    FeatureGuard,
    CombinedAccessGuard,
    EntitlementGuard,
    // Re-export so feature modules that import AuthModule can resolve
    // EntitlementGuard → SubscriptionsService without importing SubscriptionsModule.
    SubscriptionsModule,
  ],
})
export class AuthModule {}
