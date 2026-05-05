import { Module } from "@nestjs/common";
import { StudentStatsController } from "./student-stats.controller";
import { StudentStatsService } from "./student-stats.service";

@Module({
  controllers: [StudentStatsController],
  providers: [StudentStatsService],
  exports: [StudentStatsService],
})
export class StudentStatsModule {}
