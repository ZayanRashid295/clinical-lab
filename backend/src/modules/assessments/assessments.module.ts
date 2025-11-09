import { Module } from "@nestjs/common";
import { AssessmentsService } from "./assessments.service";
import { AssessmentsController } from "./assessments.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
