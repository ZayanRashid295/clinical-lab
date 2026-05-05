import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import {
  NotificationsAuthedController,
  NotificationsController,
} from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationsScheduler } from "./notifications.scheduler";

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
      }),
    }),
  ],
  controllers: [NotificationsController, NotificationsAuthedController],
  providers: [NotificationsService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
