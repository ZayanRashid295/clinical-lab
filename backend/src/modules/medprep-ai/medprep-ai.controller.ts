import { Controller, Get } from "@nestjs/common";
import { MedprepAiService } from "./medprep-ai.service";

@Controller("medprep-ai")
export class MedprepAiController {
  constructor(private readonly medprepAiService: MedprepAiService) {}

  @Get("modes")
  getModes() {
    return this.medprepAiService.getModes();
  }
}
