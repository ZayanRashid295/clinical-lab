import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";

// Controllers
import { LearningCasesController } from "./controllers/learning-cases.controller";
import { LearningSessionsController } from "./controllers/learning-sessions.controller";
import { AIConversationController } from "./controllers/ai-conversation.controller";
import { LearningProgressController } from "./controllers/learning-progress.controller";

// Services
import { LearningCasesService } from "./services/learning-cases.service";
import { LearningSessionsService } from "./services/learning-sessions.service";
import { AIConversationService } from "./services/ai-conversation.service";
import { LearningProgressService } from "./services/learning-progress.service";

@Module({
  imports: [PrismaModule],
  controllers: [
    LearningCasesController,
    LearningSessionsController,
    AIConversationController,
    LearningProgressController,
  ],
  providers: [
    LearningCasesService,
    LearningSessionsService,
    AIConversationService,
    LearningProgressService,
  ],
  exports: [
    LearningCasesService,
    LearningSessionsService,
    AIConversationService,
    LearningProgressService,
  ],
})
export class LearningModule {}
