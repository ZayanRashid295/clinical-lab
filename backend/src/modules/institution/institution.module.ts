import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { InstitutionService } from "./institution.service";

@Module({
  imports: [NotificationsModule],
  providers: [InstitutionService],
  exports: [InstitutionService],
})
export class InstitutionModule {}
