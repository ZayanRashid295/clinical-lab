import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { MarketingDemoController } from "./marketing-demo.controller";
import { MarketingDemoService } from "./marketing-demo.service";

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>("MARKETING_DEMO_JWT_SECRET") ||
          config.get<string>("JWT_SECRET"),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MarketingDemoController],
  providers: [MarketingDemoService],
  exports: [MarketingDemoService],
})
export class MarketingModule {}
