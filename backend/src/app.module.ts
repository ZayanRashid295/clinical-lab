import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/prisma/prisma.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RolesModule } from "./modules/roles/roles.module";

import { BillingModule } from "./modules/billing/billing.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ChatModule } from "./modules/chat/chat.module";
import { ProductsModule } from "./modules/products/products.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { SystemsModule } from "./modules/systems/systems.module";
import { ContentModule } from "./modules/content/content.module";
import { QuestionsModule } from "./modules/questions/questions.module";
import { QuestionBuilderModule } from "./modules/question-builder/question-builder.module";
import { AssessmentsModule } from "./modules/assessments/assessments.module";
import { MedprepAiModule } from "./modules/medprep-ai/medprep-ai.module";
import { BookmarksModule } from "./modules/bookmarks/bookmarks.module";
import { StudyPlansModule } from "./modules/study-plans/study-plans.module";
import { StudentStatsModule } from "./modules/student-stats/student-stats.module";

// Launch modules
import { AchievementsModule } from "./modules/achievements/achievements.module";
import { DiscussionsModule } from "./modules/discussions/discussions.module";
import { AiTutorModule } from "./modules/ai-tutor/ai-tutor.module";
import { MockExamsModule } from "./modules/mock-exams/mock-exams.module";
import { StudyGroupsModule } from "./modules/study-groups/study-groups.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { QuestionReportsModule } from "./modules/question-reports/question-reports.module";
import { InstitutionModule } from "./modules/institution/institution.module";
import { FacultyModule } from "./modules/faculty/faculty.module";
import { ActivityLogModule } from "./modules/activity-log/activity-log.module";
import { QuestionReviewModule } from "./modules/question-review/question-review.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    RolesModule,
    BillingModule,
    NotificationsModule,
    ChatModule,
    ProductsModule,
    CategoriesModule,
    SystemsModule,
    ContentModule,
    QuestionsModule,
    QuestionBuilderModule,
    AssessmentsModule,
    MedprepAiModule,
    BookmarksModule,
    StudyPlansModule,
    StudentStatsModule,
    // Launch modules
    AchievementsModule,
    DiscussionsModule,
    AiTutorModule,
    MockExamsModule,
    StudyGroupsModule,
    FeedbackModule,
    QuestionReportsModule,
    InstitutionModule,
    FacultyModule,
    ActivityLogModule,
    QuestionReviewModule,
  ],
})
export class AppModule {}
