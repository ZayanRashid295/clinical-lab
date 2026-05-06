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
import { NotesService } from "./notes.service";
import {
  CreateNoteDto,
  QueryNotesDto,
  UpdateNoteDto,
} from "./dto/note.dto";

@ApiTags("notes")
@ApiBearerAuth()
@Controller("notes")
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly service: NotesService) {}

  private uid(req: any) {
    return req.user.userId ?? req.user.id;
  }

  @Get()
  @ApiOperation({ summary: "List my notes" })
  list(@Request() req, @Query() q: QueryNotesDto) {
    return this.service.list(this.uid(req), q);
  }

  @Get("stats")
  @ApiOperation({ summary: "Note totals" })
  stats(@Request() req) {
    return this.service.stats(this.uid(req));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one note" })
  one(@Request() req, @Param("id") id: string) {
    return this.service.findOne(this.uid(req), id);
  }

  @Post()
  @ApiOperation({ summary: "Create a note" })
  create(@Request() req, @Body() dto: CreateNoteDto) {
    return this.service.create(this.uid(req), dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a note" })
  update(@Request() req, @Param("id") id: string, @Body() dto: UpdateNoteDto) {
    return this.service.update(this.uid(req), id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a note" })
  remove(@Request() req, @Param("id") id: string) {
    return this.service.remove(this.uid(req), id);
  }
}
