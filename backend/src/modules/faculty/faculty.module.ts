import { Module } from "@nestjs/common";
import { InstitutionModule } from "../institution/institution.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { FacultyController } from "./faculty.controller";
import { FacultyScopeService } from "./faculty-scope.service";
import { FacultyService } from "./faculty.service";
import { StudentInstitutionController } from "./student-institution.controller";
import { StudentInstitutionService } from "./student-institution.service";

@Module({
  imports: [InstitutionModule, NotificationsModule],
  controllers: [FacultyController, StudentInstitutionController],
  providers: [FacultyScopeService, FacultyService, StudentInstitutionService],
  exports: [FacultyService, StudentInstitutionService],
})
export class FacultyModule {}
