import { Module } from "@nestjs/common";
import { StudyGroupsController } from "./study-groups.controller";
import { StudyGroupsService } from "./study-groups.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [StudyGroupsController],
  providers: [StudyGroupsService],
  exports: [StudyGroupsService],
})
export class StudyGroupsModule {}
