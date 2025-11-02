// Chat and messaging type definitions

import { User } from "./user";

// import { RideUser } from "./ride";

export type MessageType = "TEXT" | "IMAGE" | "FILE" | "LOCATION";
export type ChatType = "SUPPORT" | "RIDE" | "GENERAL";

export interface ChatRoom {
  id: string;
  type: ChatType;
  participants: string[];
  rideId?: string;
  title: string;
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: User;
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  sender?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;

  // Relations
  user?: User;
}
