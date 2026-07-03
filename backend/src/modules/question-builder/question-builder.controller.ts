import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Request,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import * as path from "node:path";
import type { Response } from "express";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { QuestionBuilderService } from "./question-builder.service";
import { ActivityLogService } from "../activity-log/activity-log.service";
import {
  ACTIVITY_COMPONENTS,
  ACTIVITY_EVENTS,
} from "../activity-log/activity-log.constants";
import { extractRequestContext } from "../../common/utils/request-context.util";

const DOCX_FILE_FILTER = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.toLowerCase().endsWith(".docx")) {
    callback(new BadRequestException("Only .docx files are supported"), false);
    return;
  }
  callback(null, true);
};

@ApiTags("question-builder")
@Controller("question-builder")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPERADMIN")
@ApiBearerAuth()
export class QuestionBuilderController {
  constructor(
    private readonly questionBuilderService: QuestionBuilderService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Post("convert")
  @UseInterceptors(
    FilesInterceptor("files", 50, {
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: DOCX_FILE_FILTER,
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Convert structured DOCX files to question JSON (no AI)" })
  @ApiResponse({ status: 201, description: "Conversion completed" })
  async convertFiles(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) {
      throw new BadRequestException("No files uploaded");
    }

    const results = await this.questionBuilderService.convertMultiple(files);
    const succeeded = results.filter((result) => result.success);
    const failed = results.filter((result) => !result.success);

    const ctx = extractRequestContext(req);
    this.activityLogService.logAsync({
      userId: req.user?.userId,
      component: ACTIVITY_COMPONENTS.QBANK,
      eventName: ACTIVITY_EVENTS.QUESTION_IMPORTED,
      contextType: "import_batch",
      contextLabel: `${succeeded.length} of ${results.length} files converted`,
      metadata: {
        total: results.length,
        succeeded: succeeded.length,
        failed: failed.length,
        filenames: files.map((f) => f.originalname),
      },
      ...ctx,
    });

    return {
      total: results.length,
      succeeded: succeeded.length,
      failed: failed.length,
      results,
    };
  }

  @Get("preview/:id")
  @ApiOperation({ summary: "Get converted question JSON by question ID" })
  @ApiResponse({ status: 200, description: "Question data retrieved" })
  @ApiResponse({ status: 404, description: "Question not found" })
  async getQuestion(@Param("id") id: string) {
    const jsonPath = path.join(this.questionBuilderService.getQuestionDir(id), "question.json");
    try {
      const content = await readFile(jsonPath, "utf-8");
      return JSON.parse(content);
    } catch {
      throw new NotFoundException(`Question ${id} not found`);
    }
  }

  @Get("preview/:id/images/:filename")
  @ApiOperation({ summary: "Serve extracted image from converted question" })
  @ApiResponse({ status: 200, description: "Image served" })
  @ApiResponse({ status: 404, description: "Image not found" })
  async getImage(
    @Param("id") id: string,
    @Param("filename") filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const imagePath = this.questionBuilderService.getImagePath(id, filename);
    try {
      await stat(imagePath);
    } catch {
      throw new NotFoundException("Image not found");
    }

    const ext = filename.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : "application/octet-stream";
    res.set({ "Content-Type": mime });
    return new StreamableFile(createReadStream(imagePath));
  }
}
