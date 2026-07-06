import { Module, forwardRef } from "@nestjs/common";
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
import { FeatureAccessGuard } from "../billing/guards/feature-access.guard";
import { BillingModule } from "../billing/billing.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UsersModule } from "../users/users.module";
import { InstitutionModule } from "../institution/institution.module";
import { ActivityLogModule } from "../activity-log/activity-log.module";

@Module({
  imports: [
    PassportModule,
    UsersModule,
    InstitutionModule,
    forwardRef(() => BillingModule),
    NotificationsModule,
    forwardRef(() => ActivityLogModule),
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
    FeatureAccessGuard,
  ],
  exports: [
    AuthService,
    TokenBlacklistService,
    JwtAuthWithBlacklistGuard,
    RolesGuard,
    PermissionsGuard,
    FeatureAccessGuard,
    BillingModule,
  ],
})
export class AuthModule {}
