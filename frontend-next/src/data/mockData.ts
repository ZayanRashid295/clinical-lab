// Mock data for development and testing
import { User } from "../app/types/core";
// import { Ride } from "../app/types/ride";
import { Alert, StatCard } from "../app/types/ui";
import { ChatRoom, Message, Notification } from "../app/types/chat";
// import { LocationData } from "../app/types/location";
import { Car, AlertTriangle, CreditCard, Users } from "lucide-react";

// Mock users for authentication
export const MOCK_USERS: Record<string, { user: User; password: string }> = {
  "john.doe@example.com": {
    password: "password123",
    user: {
      id: "1",
      email: "john.doe@example.com",
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      roles: ["PASSENGER"],
      avatar: undefined,
      isActive: true,
    },
  },
  "mike.wilson@example.com": {
    password: "password123",
    user: {
      id: "2",
      email: "mike.wilson@example.com",
      name: "Mike Wilson",
      firstName: "Mike",
      lastName: "Wilson",
      roles: ["DRIVER"],
      avatar: undefined,
      isActive: true,
    },
  },
  "admin@uber.com": {
    password: "password123",
    user: {
      id: "3",
      email: "admin@uber.com",
      name: "Admin User",
      firstName: "Admin",
      lastName: "User",
      roles: ["ADMIN"],
      avatar: undefined,
      isActive: true,
    },
  },
  "support@uber.com": {
    password: "password123",
    user: {
      id: "4",
      email: "support@uber.com",
      name: "Support User",
      firstName: "Support",
      lastName: "User",
      roles: ["SUPPORT"],
      avatar: undefined,
      isActive: true,
    },
  },
  "fleet@uber.com": {
    password: "password123",
    user: {
      id: "5",
      email: "fleet@uber.com",
      name: "Fleet Manager",
      firstName: "Fleet",
      lastName: "Manager",
      roles: ["FLEET_MANAGER"],
      avatar: undefined,
      isActive: true,
    },
  },
};

// Mock statistics data
export const MOCK_STATS: StatCard[] = [
  {
    id: "active-rides",
    label: "Active Rides",
    value: 127,
    icon: Car,
    color: "text-blue-600",
    bgColor: "bg-white",
    textColor: "text-gray-900",
  },
  {
    id: "pending-requests",
    label: "Pending Requests",
    value: 8,
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-white",
    textColor: "text-red-600",
  },
  {
    id: "todays-earnings",
    label: "Today's Earnings",
    value: "$1,234",
    icon: CreditCard,
    color: "text-green-600",
    bgColor: "bg-white",
    textColor: "text-green-600",
  },
  {
    id: "online-drivers",
    label: "Online Drivers",
    value: 45,
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-white",
    textColor: "text-purple-600",
  },
];

// Mock alerts data
export const MOCK_ALERTS: Alert[] = [
  {
    id: "1",
    passenger: "John Smith",
    type: "Ride Issue",
    message: "Driver reported passenger issue",
    time: "10 minutes ago",
    severity: "high",
  },
  {
    id: "2",
    passenger: "Sarah Wilson",
    type: "Payment Failed",
    message: "Payment method declined",
    time: "30 minutes ago",
    severity: "medium",
  },
  {
    id: "3",
    passenger: "Robert Davis",
    type: "Vehicle Issue",
    message: "Driver reported vehicle problem",
    time: "1 hour ago",
    severity: "low",
  },
];

// Helper function to get mock user by email
export const getMockUser = (email: string): User | null => {
  const mockUserData = MOCK_USERS[email];
  return mockUserData ? mockUserData.user : null;
};

// Mock chat rooms data
export const MOCK_CHAT_ROOMS: ChatRoom[] = [
  {
    id: "1",
    type: "RIDE",
    participants: ["1", "2"],
    rideId: "1",
    title: "Ride to Airport",
    unreadCount: 2,
    isActive: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
    lastMessage: {
      id: "msg6",
      chatRoomId: "1",
      senderId: "2",
      type: "LOCATION",
      content: "Current location",
      metadata: {
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          address: "123 Market St, San Francisco, CA 94102",
        },
      },
      isRead: false,
      createdAt: new Date(Date.now() - 30000).toISOString(),
      updatedAt: new Date(Date.now() - 30000).toISOString(),
      sender: {
        id: "4",
        firstName: "Support",
        lastName: "Team",
        email: "support@uber.com",
        phone: "+1234567890",
        isActive: true,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
    },
  },
  {
    id: "2",
    type: "SUPPORT",
    participants: ["1", "4"],
    title: "Payment Issue Support",
    unreadCount: 0,
    isActive: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    lastMessage: {
      id: "msg2",
      chatRoomId: "2",
      senderId: "4",
      type: "TEXT",
      content: "Your payment has been processed successfully",
      isRead: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      sender: {
        id: "4",
        firstName: "Support",
        lastName: "Team",
        email: "support@uber.com",
        phone: "+1234567890",
        isActive: true,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
    },
  },
  {
    id: "3",
    type: "GENERAL",
    participants: ["1", "3"],
    title: "General Inquiry",
    unreadCount: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString(),
    lastMessage: {
      id: "msg7",
      chatRoomId: "3",
      senderId: "3",
      type: "FILE",
      content: "https://example.com/receipt.pdf",
      metadata: {
        fileName: "ride_receipt_2024.pdf",
        fileSize: 245760,
      },
      isRead: true,
      createdAt: new Date(Date.now() - 900000).toISOString(),
      updatedAt: new Date(Date.now() - 900000).toISOString(),
      sender: {
        id: "4",
        firstName: "Support",
        lastName: "Team",
        email: "support@uber.com",
        phone: "+1234567890",
        isActive: true,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
    },
  },
];

// Mock messages data
export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg1",
    chatRoomId: "1",
    senderId: "2",
    type: "TEXT",
    content: "I'm 5 minutes away from your pickup location",
    isRead: false,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
    sender: {
      id: "4",
      firstName: "Support",
      lastName: "Team",
      email: "support@uber.com",
      phone: "+1234567890",
      isActive: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  },
  {
    id: "msg2",
    chatRoomId: "1",
    senderId: "1",
    type: "TEXT",
    content: "Perfect, I'll be waiting outside the main entrance",
    isRead: true,
    createdAt: new Date(Date.now() - 240000).toISOString(),
    updatedAt: new Date(Date.now() - 240000).toISOString(),
    sender: {
      id: "4",
      firstName: "Support",
      lastName: "Team",
      email: "support@uber.com",
      phone: "+1234567890",
      isActive: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  },
  {
    id: "msg3",
    chatRoomId: "1",
    senderId: "2",
    type: "TEXT",
    content: "I've arrived! Look for the blue Toyota Camry",
    isRead: false,
    createdAt: new Date(Date.now() - 120000).toISOString(),
    updatedAt: new Date(Date.now() - 120000).toISOString(),
    sender: {
      id: "4",
      firstName: "Support",
      lastName: "Team",
      email: "support@uber.com",
      phone: "+1234567890",
      isActive: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  },
  {
    id: "msg4",
    chatRoomId: "2",
    senderId: "4",
    type: "TEXT",
    content: "Your payment has been processed successfully",
    isRead: true,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    sender: {
      id: "4",
      firstName: "Support",
      lastName: "Team",
      email: "support@uber.com",
      phone: "+1234567890",
      isActive: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  },
  {
    id: "msg5",
    chatRoomId: "1",
    senderId: "2",
    type: "IMAGE",
    content:
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
    metadata: {
      fileName: "car_photo.jpg",
    },
    isRead: false,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    updatedAt: new Date(Date.now() - 60000).toISOString(),
    sender: {
      id: "4",
      firstName: "Support",
      lastName: "Team",
      email: "support@uber.com",
      phone: "+1234567890",
      isActive: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  },
];

// Mock notifications data
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    userId: "1",
    type: "RIDE_UPDATE",
    title: "Ride Status Update",
    message: "Your driver Mike Johnson is 5 minutes away",
    data: { rideId: "1", driverId: "2" },
    isRead: false,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    user: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      isActive: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  },
  {
    id: "2",
    userId: "1",
    type: "PAYMENT_SUCCESS",
    title: "Payment Successful",
    message: "Your payment of $25.50 has been processed",
    data: { amount: 25.5, rideId: "1" },
    isRead: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    user: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      isActive: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  },
];

// Helper function to validate mock credentials
// Mock payment methods data
export const MOCK_PAYMENT_METHODS = [
  {
    id: "pm_1",
    userId: "user_1",
    type: "CARD" as const,
    provider: "Visa",
    providerId: "vis_123456789",
    isDefault: true,
    isActive: true,
    metadata: {
      last4: "4242",
      brand: "Visa",
      expiryMonth: 12,
      expiryYear: 2025,
      holderName: "John Doe",
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "pm_2",
    userId: "user_1",
    type: "CARD" as const,
    provider: "Mastercard",
    providerId: "mc_987654321",
    isDefault: false,
    isActive: true,
    metadata: {
      last4: "5555",
      brand: "Mastercard",
      expiryMonth: 8,
      expiryYear: 2026,
      holderName: "John Doe",
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "pm_3",
    userId: "user_1",
    type: "WALLET" as const,
    provider: "PayPal",
    providerId: "pp_456789123",
    isDefault: false,
    isActive: true,
    metadata: {
      holderName: "john.doe@example.com",
    },
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "pm_4",
    userId: "user_2",
    type: "CARD" as const,
    provider: "American Express",
    providerId: "amex_111222333",
    isDefault: true,
    isActive: true,
    metadata: {
      last4: "1234",
      brand: "American Express",
      expiryMonth: 6,
      expiryYear: 2027,
      holderName: "Sarah Johnson",
    },
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "pm_5",
    userId: "user_3",
    type: "BANK_TRANSFER" as const,
    provider: "Chase Bank",
    providerId: "chase_444555666",
    isDefault: true,
    isActive: true,
    metadata: {
      last4: "7890",
      bankName: "Chase Bank",
      accountType: "Checking",
      holderName: "Mike Wilson",
    },
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 432000000).toISOString(),
  },
];

export const validateMockCredentials = (
  email: string,
  password: string
): boolean => {
  const mockUserData = MOCK_USERS[email];
  return mockUserData ? mockUserData.password === password : false;
};
