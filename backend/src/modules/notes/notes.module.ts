import { Module } from "@nestjs/common";
import { NotesController } from "./notes.controller";
import { NotesService } from "./notes.service";
import { AchievementsModule } from "../achievements/achievements.module";
import { GoalsModule } from "../goals/goals.module";

@Module({
  imports: [AchievementsModule, GoalsModule],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
