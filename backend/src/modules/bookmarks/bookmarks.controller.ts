import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BookmarksService } from "./bookmarks.service";
import { CreateBookmarkDto, QueryBookmarkDto } from "./dto/bookmark.dto";

@ApiTags("bookmarks")
@ApiBearerAuth()
@Controller("bookmarks")
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly service: BookmarksService) {}

  @Get()
  @ApiOperation({ summary: "List my bookmarks" })
  list(@Request() req, @Query() q: QueryBookmarkDto) {
    return this.service.findForUser(req.user.userId ?? req.user.id, q.resourceType);
  }

  @Post()
  @ApiOperation({ summary: "Create or update a bookmark (idempotent)" })
  create(@Request() req, @Body() dto: CreateBookmarkDto) {
    return this.service.create(req.user.userId ?? req.user.id, dto);
  }

  @Post("toggle")
  @ApiOperation({ summary: "Toggle a bookmark on/off" })
  toggle(@Request() req, @Body() dto: CreateBookmarkDto) {
    return this.service.toggle(req.user.userId ?? req.user.id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a bookmark by id" })
  remove(@Request() req, @Param("id") id: string) {
    return this.service.remove(req.user.userId ?? req.user.id, id);
  }
}
