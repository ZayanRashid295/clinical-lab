import { Module } from "@nestjs/common";
import { MedprepAiController } from "./medprep-ai.controller";
import { MedprepAiService } from "./medprep-ai.service";

@Module({
  controllers: [MedprepAiController],
  providers: [MedprepAiService],
  exports: [MedprepAiService],
})
export class MedprepAiModule {}
