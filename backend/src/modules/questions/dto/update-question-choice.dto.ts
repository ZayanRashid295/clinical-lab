import { PartialType } from "@nestjs/swagger";
import { CreateQuestionChoiceDto } from "./create-question-choice.dto";

export class UpdateQuestionChoiceDto extends PartialType(
  CreateQuestionChoiceDto
) {}
