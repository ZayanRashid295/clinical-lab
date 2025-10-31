import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RolesModule } from "./modules/roles/roles.module";

import { PaymentsModule } from "./modules/payments/payments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ChatModule } from "./modules/chat/chat.module";
// import { LearningModule } from "./modules/learning/learning.module";
import { ProductsModule } from "./modules/products/products.module";
import { ContentModule } from "./modules/content/content.module";
import { QuestionsModule } from "./modules/questions/questions.module";
import { TagsModule } from "./modules/tags/tags.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { AssessmentsModule } from "./modules/assessments/assessments.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PaymentsModule,
    NotificationsModule,
    ChatModule,
    // LearningModule,
    ProductsModule,
    ContentModule,
    QuestionsModule,
    TagsModule,
    SubscriptionsModule,
    AssessmentsModule,
  ],
})
export class AppModule {}
