import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  create(@Body() createNotificationDto: any) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'User notifications retrieved successfully' })
  findByUser(@Param('userId') userId: string) {
    return this.notificationsService.findByUser(userId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
