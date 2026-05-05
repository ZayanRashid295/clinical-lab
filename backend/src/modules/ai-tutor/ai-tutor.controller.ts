import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AiTutorService } from "./ai-tutor.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CreateConversationDto,
  SendMessageDto,
  UpdateConversationDto,
} from "./dto/ai-tutor.dto";

@ApiTags("ai-tutor")
@Controller("ai-tutor")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiTutorController {
  constructor(private readonly service: AiTutorService) {}

  @Get("conversations")
  @ApiOperation({ summary: "List my conversations" })
  list(@Request() req) {
    return this.service.listConversations(req.user?.userId);
  }

  @Post("conversations")
  @ApiOperation({ summary: "Create a new conversation" })
  create(@Request() req, @Body() dto: CreateConversationDto) {
    return this.service.createConversation(req.user?.userId, dto);
  }

  @Get("conversations/:id")
  @ApiOperation({ summary: "Get a conversation with messages" })
  get(@Request() req, @Param("id") id: string) {
    return this.service.getConversation(req.user?.userId, id);
  }

  @Patch("conversations/:id")
  @ApiOperation({ summary: "Update a conversation (rename / pin / archive)" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateConversationDto
  ) {
    return this.service.updateConversation(req.user?.userId, id, dto);
  }

  @Delete("conversations/:id")
  @ApiOperation({ summary: "Delete a conversation" })
  remove(@Request() req, @Param("id") id: string) {
    return this.service.deleteConversation(req.user?.userId, id);
  }

  @Post("conversations/:id/messages")
  @ApiOperation({ summary: "Send a message and get an assistant reply" })
  message(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: SendMessageDto
  ) {
    return this.service.sendMessage(req.user?.userId, id, dto);
  }
}
