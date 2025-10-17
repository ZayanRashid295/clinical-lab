// Mock data for development and testing
import { User } from "../app/types/core";
import { Ride } from "../app/types/ride";
import { Alert, StatCard } from "../app/types/ui";
import { ChatRoom, Message, Notification } from "../app/types/chat";
import { LocationData } from "../app/types/location";
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

// Mock rides data
export const MOCK_RIDES: Ride[] = [
  {
    id: "1",
    passengerId: "1",
    driverId: "2",
    status: "IN_PROGRESS",
    fare: 25.5,
    distance: 12.5,
    duration: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    passengerName: "John Smith",
    driverName: "Mike Johnson",
    pickupAddress: "Downtown",
    dropoffAddress: "Airport",
  },
  {
    id: "2",
    passengerId: "2",
    driverId: "3",
    status: "COMPLETED",
    fare: 18.75,
    distance: 8.3,
    duration: 18,
    startTime: new Date(Date.now() - 4200000).toISOString(),
    endTime: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    passengerName: "Mary Johnson",
    driverName: "Sarah Wilson",
    pickupAddress: "Mall",
    dropoffAddress: "Home",
  },
  {
    id: "3",
    passengerId: "3",
    driverId: "4",
    status: "CANCELLED",
    fare: 0,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    passengerName: "Robert Davis",
    driverName: "Tom Brown",
    pickupAddress: "Office",
    dropoffAddress: "Restaurant",
  },
  {
    id: "4",
    passengerId: "4",
    driverId: "5",
    status: "REQUESTED",
    fare: 12.3,
    distance: 5.2,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    passengerName: "Lisa Wilson",
    driverName: "Alex Green",
    pickupAddress: "University",
    dropoffAddress: "Station",
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
        id: "2",
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        phone: "+1234567890",
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
        name: "Support Team",
        email: "support@uber.com",
        phone: "+1234567890",
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
        id: "3",
        name: "Admin User",
        email: "admin@uber.com",
        phone: "+1234567890",
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
      id: "2",
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      phone: "+1234567890",
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
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
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
      id: "2",
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      phone: "+1234567890",
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
      name: "Support Team",
      email: "support@uber.com",
      phone: "+1234567890",
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
      id: "2",
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      phone: "+1234567890",
    },
  },
  {
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
      id: "2",
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      phone: "+1234567890",
    },
  },
  {
    id: "msg7",
    chatRoomId: "3",
    senderId: "3",
    type: "FILE",
    content: "https://example.com/receipt.pdf",
    metadata: {
      fileName: "ride_receipt_2024.pdf",
      fileSize: 245760, // 240 KB
    },
    isRead: true,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    sender: {
      id: "3",
      name: "Admin User",
      email: "admin@uber.com",
      phone: "+1234567890",
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
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
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
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
    },
  },
  {
    id: "3",
    userId: "1",
    type: "PROMOTION",
    title: "Special Offer",
    message: "Get 20% off your next 3 rides with code SAVE20",
    data: { promoCode: "SAVE20", discount: 20 },
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    user: {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
    },
  },
  {
    id: "4",
    userId: "1",
    type: "RIDE_REMINDER",
    title: "Ride Reminder",
    message:
      "Don't forget your scheduled ride to the airport tomorrow at 8:00 AM",
    data: { scheduledTime: "2024-01-20T08:00:00Z", destination: "Airport" },
    isRead: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    user: {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
    },
  },
];

// Mock locations data
export const MOCK_LOCATIONS: LocationData[] = [
  {
    id: "1",
    name: "Downtown Central",
    address: "123 Main St, Downtown, City 12345",
    latitude: 37.7749,
    longitude: -122.4194,
    type: "PICKUP",
    isActive: true,
    metadata: {
      placeId: "ChIJd8BlQ2BZwokRAFUEcm_qrcA",
      category: "Business District",
      popularity: 95,
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "2",
    name: "Airport Terminal 1",
    address: "456 Airport Blvd, Airport District, City 12345",
    latitude: 37.6213,
    longitude: -122.379,
    type: "DROPOFF",
    isActive: true,
    metadata: {
      placeId: "ChIJVVVVVVVVVVVVVVVVVVVVVVV",
      category: "Transportation Hub",
      popularity: 88,
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "3",
    name: "University Campus",
    address: "789 University Ave, University District, City 12345",
    latitude: 37.8719,
    longitude: -122.2585,
    type: "PICKUP",
    isActive: true,
    metadata: {
      placeId: "ChIJWWWWWWWWWWWWWWWWWWWWWWW",
      category: "Educational",
      popularity: 76,
    },
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "4",
    name: "Shopping Mall",
    address: "321 Commerce St, Shopping District, City 12345",
    latitude: 37.7849,
    longitude: -122.4094,
    type: "DROPOFF",
    isActive: true,
    metadata: {
      placeId: "ChIJXXXXXXXXXXXXXXXXXXXXXXXX",
      category: "Shopping",
      popularity: 82,
    },
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "5",
    name: "Home Sweet Home",
    address: "555 Residential Ave, Suburbia, City 12345",
    latitude: 37.7849,
    longitude: -122.4094,
    type: "FAVORITE",
    userId: "1",
    isActive: true,
    metadata: {
      placeId: "ChIJYYYYYYYYYYYYYYYYYYYYYY",
      category: "Residential",
      popularity: 0,
    },
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: "6",
    name: "Office Building",
    address: "777 Business Blvd, Corporate District, City 12345",
    latitude: 37.7849,
    longitude: -122.4094,
    type: "FAVORITE",
    userId: "1",
    isActive: true,
    metadata: {
      placeId: "ChIJZZZZZZZZZZZZZZZZZZZZZZ",
      category: "Business",
      popularity: 0,
    },
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    updatedAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: "7",
    name: "Train Station",
    address: "999 Transit Way, Transportation Hub, City 12345",
    latitude: 37.7849,
    longitude: -122.4094,
    type: "PICKUP",
    isActive: true,
    metadata: {
      placeId: "ChIJAAAAAAAAAAAAAAAAAAAAAAAA",
      category: "Transportation",
      popularity: 91,
    },
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 25200000).toISOString(),
  },
  {
    id: "8",
    name: "Hospital",
    address: "111 Health St, Medical District, City 12345",
    latitude: 37.7849,
    longitude: -122.4094,
    type: "DROPOFF",
    isActive: true,
    metadata: {
      placeId: "ChIJBBBBBBBBBBBBBBBBBBBBBB",
      category: "Healthcare",
      popularity: 67,
    },
    createdAt: new Date(Date.now() - 691200000).toISOString(),
    updatedAt: new Date(Date.now() - 28800000).toISOString(),
  },
];

// Mock fleet data
export const MOCK_VEHICLES = [
  {
    id: "1",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    licensePlate: "ABC-123",
    vin: "1HGBH41JXMN109186",
    color: "Silver",
    status: "ACTIVE",
    driverId: "2",
    driverName: "Mike Johnson",
    mileage: 15420,
    lastMaintenance: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
    nextMaintenance: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
    fuelLevel: 85,
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: "123 Market St, San Francisco, CA",
    },
    createdAt: new Date(Date.now() - 31536000000).toISOString(), // 1 year ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: "2",
    make: "Honda",
    model: "Civic",
    year: 2021,
    licensePlate: "XYZ-789",
    vin: "2HGBH41JXMN109187",
    color: "Blue",
    status: "MAINTENANCE",
    driverId: null,
    driverName: null,
    mileage: 28750,
    lastMaintenance: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    nextMaintenance: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
    fuelLevel: 45,
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
      address: "456 Mission St, San Francisco, CA",
    },
    createdAt: new Date(Date.now() - 37843200000).toISOString(), // 1.2 years ago
    updatedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
  },
  {
    id: "3",
    make: "Ford",
    model: "Escape",
    year: 2023,
    licensePlate: "DEF-456",
    vin: "3HGBH41JXMN109188",
    color: "White",
    status: "ACTIVE",
    driverId: "3",
    driverName: "Sarah Wilson",
    mileage: 8750,
    lastMaintenance: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
    nextMaintenance: new Date(Date.now() + 3456000000).toISOString(), // 40 days from now
    fuelLevel: 92,
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
      address: "789 Castro St, San Francisco, CA",
    },
    createdAt: new Date(Date.now() - 15552000000).toISOString(), // 6 months ago
    updatedAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
  },
  {
    id: "4",
    make: "Nissan",
    model: "Altima",
    year: 2020,
    licensePlate: "GHI-012",
    vin: "4HGBH41JXMN109189",
    color: "Black",
    status: "INACTIVE",
    driverId: null,
    driverName: null,
    mileage: 45200,
    lastMaintenance: new Date(Date.now() - 5184000000).toISOString(), // 60 days ago
    nextMaintenance: new Date(Date.now() + 864000000).toISOString(), // 10 days from now
    fuelLevel: 0,
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
      address: "321 Folsom St, San Francisco, CA",
    },
    createdAt: new Date(Date.now() - 126144000000).toISOString(), // 4 years ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
];

export const MOCK_DRIVERS = [
  {
    id: "2",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    phone: "+1234567890",
    licenseNumber: "D123456789",
    licenseExpiry: new Date(Date.now() + 31536000000).toISOString(), // 1 year from now
    status: "ACTIVE",
    rating: 4.8,
    totalRides: 1247,
    totalEarnings: 18750.5,
    vehicleId: "1",
    vehicleInfo: "2022 Toyota Camry - ABC-123",
    joinDate: new Date(Date.now() - 31536000000).toISOString(), // 1 year ago
    lastActive: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: "123 Market St, San Francisco, CA",
    },
  },
  {
    id: "3",
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phone: "+1234567891",
    licenseNumber: "D987654321",
    licenseExpiry: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
    status: "ACTIVE",
    rating: 4.9,
    totalRides: 892,
    totalEarnings: 13420.75,
    vehicleId: "3",
    vehicleInfo: "2023 Ford Escape - DEF-456",
    joinDate: new Date(Date.now() - 15552000000).toISOString(), // 6 months ago
    lastActive: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
      address: "789 Castro St, San Francisco, CA",
    },
  },
  {
    id: "4",
    name: "Tom Brown",
    email: "tom.brown@example.com",
    phone: "+1234567892",
    licenseNumber: "D456789123",
    licenseExpiry: new Date(Date.now() - 86400000).toISOString(), // 1 day ago (expired)
    status: "SUSPENDED",
    rating: 4.2,
    totalRides: 456,
    totalEarnings: 6780.25,
    vehicleId: null,
    vehicleInfo: null,
    joinDate: new Date(Date.now() - 63072000000).toISOString(), // 2 years ago
    lastActive: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
    location: null,
  },
];

export const MOCK_MAINTENANCE_RECORDS = [
  {
    id: "1",
    vehicleId: "1",
    vehicleInfo: "2022 Toyota Camry - ABC-123",
    type: "ROUTINE",
    description: "Oil change and filter replacement",
    cost: 89.5,
    mileage: 15000,
    date: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
    nextDue: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
    status: "COMPLETED",
    technician: "John's Auto Service",
    notes: "Vehicle in excellent condition",
  },
  {
    id: "2",
    vehicleId: "2",
    vehicleInfo: "2021 Honda Civic - XYZ-789",
    type: "REPAIR",
    description: "Brake pad replacement and brake fluid flush",
    cost: 245.75,
    mileage: 28500,
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    nextDue: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
    status: "IN_PROGRESS",
    technician: "City Auto Repair",
    notes: "Brake pads were worn down to 2mm",
  },
  {
    id: "3",
    vehicleId: "3",
    vehicleInfo: "2023 Ford Escape - DEF-456",
    type: "INSPECTION",
    description: "Annual safety inspection",
    cost: 125.0,
    mileage: 8500,
    date: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
    nextDue: new Date(Date.now() + 3456000000).toISOString(), // 40 days from now
    status: "COMPLETED",
    technician: "State Inspection Center",
    notes: "Passed all safety checks",
  },
  {
    id: "4",
    vehicleId: "4",
    vehicleInfo: "2020 Nissan Altima - GHI-012",
    type: "MAJOR_REPAIR",
    description: "Transmission rebuild",
    cost: 1850.0,
    mileage: 45000,
    date: new Date(Date.now() - 5184000000).toISOString(), // 60 days ago
    nextDue: new Date(Date.now() + 864000000).toISOString(), // 10 days from now
    status: "SCHEDULED",
    technician: "Transmission Specialists",
    notes: "Major transmission failure, needs complete rebuild",
  },
];

export const MOCK_FUEL_RECORDS = [
  {
    id: "1",
    vehicleId: "1",
    vehicleInfo: "2022 Toyota Camry - ABC-123",
    fuelAmount: 12.5,
    cost: 45.75,
    pricePerGallon: 3.66,
    mileage: 15420,
    date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    location: "Shell Station - 123 Market St",
    driverId: "2",
    driverName: "Mike Johnson",
  },
  {
    id: "2",
    vehicleId: "3",
    vehicleInfo: "2023 Ford Escape - DEF-456",
    fuelAmount: 15.2,
    cost: 55.62,
    pricePerGallon: 3.66,
    mileage: 8750,
    date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    location: "Chevron Station - 456 Mission St",
    driverId: "3",
    driverName: "Sarah Wilson",
  },
  {
    id: "3",
    vehicleId: "1",
    vehicleInfo: "2022 Toyota Camry - ABC-123",
    fuelAmount: 11.8,
    cost: 43.18,
    pricePerGallon: 3.66,
    mileage: 15200,
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    location: "BP Station - 789 Castro St",
    driverId: "2",
    driverName: "Mike Johnson",
  },
];

export const MOCK_ROUTES = [
  {
    id: "1",
    name: "Downtown Express",
    description:
      "High-frequency route connecting downtown to major business districts",
    startLocation: "Downtown Central",
    endLocation: "Financial District",
    distance: 8.5,
    estimatedTime: 25,
    frequency: "Every 10 minutes",
    status: "ACTIVE",
    vehicleCount: 12,
    passengerCount: 156,
    revenue: 2340.5,
    createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: "2",
    name: "Airport Shuttle",
    description: "Direct route from downtown to airport terminals",
    startLocation: "Downtown Central",
    endLocation: "Airport Terminal 1",
    distance: 15.2,
    estimatedTime: 35,
    frequency: "Every 15 minutes",
    status: "ACTIVE",
    vehicleCount: 8,
    passengerCount: 89,
    revenue: 1780.25,
    createdAt: new Date(Date.now() - 1728000000).toISOString(), // 20 days ago
    updatedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
  {
    id: "3",
    name: "University Line",
    description: "Route serving university campus and surrounding areas",
    startLocation: "University Campus",
    endLocation: "Student Housing",
    distance: 6.8,
    estimatedTime: 20,
    frequency: "Every 20 minutes",
    status: "PLANNED",
    vehicleCount: 0,
    passengerCount: 0,
    revenue: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
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
