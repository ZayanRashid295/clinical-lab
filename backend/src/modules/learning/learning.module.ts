import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";

// Import from organized modules
import { LearningCasesController, LearningCasesService } from "./cases";

import {
  LearningSessionsController,
  LearningSessionsService,
} from "./sessions";

import {
  AIConversationController,
  AIConversationService,
} from "./ai-conversation";

import {
  LearningProgressController,
  LearningProgressService,
} from "./progress";

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
