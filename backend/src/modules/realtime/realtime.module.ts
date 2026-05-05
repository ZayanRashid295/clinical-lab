import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { RealtimeBus } from "./realtime.bus";
import { RealtimeGateway } from "./realtime.gateway";

/**
 * Marked @Global so any feature module can inject `RealtimeBus` without
 * having to import RealtimeModule explicitly. The gateway is instantiated
 * exactly once and the bus singleton is shared across the app.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
      }),
    }),
  ],
  providers: [RealtimeBus, RealtimeGateway],
  exports: [RealtimeBus],
})
export class RealtimeModule {}
