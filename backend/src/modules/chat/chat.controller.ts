import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Create chat room' })
  @ApiResponse({ status: 201, description: 'Chat room created successfully' })
  createRoom(@Body() createRoomDto: any) {
    return this.chatService.createRoom(createRoomDto);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  sendMessage(@Body() createMessageDto: any) {
    return this.chatService.sendMessage(createMessageDto);
  }

  @Get('rooms/user/:userId')
  @ApiOperation({ summary: 'Get user chat rooms' })
  @ApiResponse({ status: 200, description: 'Chat rooms retrieved successfully' })
  getRoomsByUser(@Param('userId') userId: string) {
    return this.chatService.getRoomsByUser(userId);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get room messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  getRoomMessages(@Param('roomId') roomId: string) {
    return this.chatService.getRoomMessages(roomId);
  }
}
