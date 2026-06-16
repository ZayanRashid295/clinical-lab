import { Injectable } from "@nestjs/common";
import { mkdir } from "node:fs/promises";
import * as path from "node:path";
import { convertFilesInParallel } from "./converter/convertDocx";
import type { ConvertFileResult } from "./converter/types";

@Injectable()
export class QuestionBuilderService {
  private readonly uploadsDir = path.resolve(process.cwd(), "uploads", "question-builder");

  getQuestionDir(questionId: string): string {
    return path.join(this.uploadsDir, questionId);
  }

  getImagePath(questionId: string, filename: string): string {
    return path.join(this.uploadsDir, questionId, "images", filename);
  }

  async convertMultiple(files: Express.Multer.File[]): Promise<ConvertFileResult[]> {
    await mkdir(this.uploadsDir, { recursive: true });
    const payloads = files.map((file) => ({
      buffer: file.buffer,
      originalname: file.originalname,
    }));
    return convertFilesInParallel(payloads, this.uploadsDir);
  }
}
