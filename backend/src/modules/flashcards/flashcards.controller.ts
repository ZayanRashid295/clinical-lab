import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FlashcardsService } from "./flashcards.service";
import {
  CreateFlashcardDto,
  QueryFlashcardsDto,
  ReviewFlashcardDto,
  UpdateFlashcardDto,
} from "./dto/flashcard.dto";

@ApiTags("flashcards")
@ApiBearerAuth()
@Controller("flashcards")
@UseGuards(JwtAuthGuard)
export class FlashcardsController {
  constructor(private readonly service: FlashcardsService) {}

  private uid(req: any) {
    return req.user.userId ?? req.user.id;
  }

  @Get()
  @ApiOperation({ summary: "List my flashcards (filterable)" })
  list(@Request() req, @Query() q: QueryFlashcardsDto) {
    return this.service.list(this.uid(req), q);
  }

  @Get("stats")
  @ApiOperation({ summary: "Deck stats: total / due / mastered / reviewed today" })
  stats(@Request() req) {
    return this.service.stats(this.uid(req));
  }

  @Get(":id")
  one(@Request() req, @Param("id") id: string) {
    return this.service.findOne(this.uid(req), id);
  }

  @Post()
  @ApiOperation({ summary: "Create a flashcard" })
  create(@Request() req, @Body() dto: CreateFlashcardDto) {
    return this.service.create(this.uid(req), dto);
  }

  @Patch(":id")
  update(@Request() req, @Param("id") id: string, @Body() dto: UpdateFlashcardDto) {
    return this.service.update(this.uid(req), id, dto);
  }

  @Delete(":id")
  remove(@Request() req, @Param("id") id: string) {
    return this.service.remove(this.uid(req), id);
  }

  @Post(":id/review")
  @ApiOperation({ summary: "Submit SRS review (AGAIN/HARD/GOOD/EASY)" })
  review(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: ReviewFlashcardDto
  ) {
    return this.service.review(this.uid(req), id, dto);
  }
}
