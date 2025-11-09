import { PartialType } from "@nestjs/swagger";
import { CreateQuestionPaperDto } from "./create-question-paper.dto";

export class UpdateQuestionPaperDto extends PartialType(
  CreateQuestionPaperDto
) {}
