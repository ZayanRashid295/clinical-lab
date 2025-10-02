import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RidesModule } from "./modules/rides/rides.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { PayoutsModule } from "./modules/payouts/payouts.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ChatModule } from "./modules/chat/chat.module";
import { LocationsModule } from "./modules/locations/locations.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RidesModule,
    PaymentsModule,
    PayoutsModule,
    NotificationsModule,
    ChatModule,
    LocationsModule,
  ],
})
export class AppModule {}
