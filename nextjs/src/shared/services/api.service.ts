"use client";

// import { User } from "../types/user.types";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    roles?: Array<{
      role: {
        name: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Validate URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      throw new Error(
        `Invalid API URL: ${url}. Make sure NEXT_PUBLIC_API_URL is set correctly.`
      );
    }

    // Get auth token from localStorage (client-side only)
    let token: string | null = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("authToken");
    }

    // Set default headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth token if available
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      method: options.method || "GET",
      headers,
    };

    // Add body for non-GET requests
    if (options.body && options.method !== "GET") {
      requestOptions.body = JSON.stringify(options.body);
    }

    console.log(`🌐 Making API request to: ${url}`);
    console.log(`📋 Request options:`, {
      method: options.method || "GET",
      headers,
      body: options.body ? "***" : undefined,
    });

    try {
      const response = await fetch(url, requestOptions);

      // Handle non-2xx responses
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails: any = null;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
        } catch {
          // If response is not JSON, use status text
        }

        const error: ApiError = {
          message: errorMessage,
          status: response.status,
          details: errorDetails,
        };

        console.error(`❌ API request failed:`, error);
        throw error;
      }

      // Parse response
      const data = await response.json();
      console.log(`✅ API request successful:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API request error:`, error);

      // Re-throw API errors as-is
      if (error && typeof error === "object" && "message" in error) {
        throw error;
      }

      // Handle network errors
      const networkError: ApiError = {
        message:
          error instanceof Error ? error.message : "Network error occurred",
        status: 0,
      };
      throw networkError;
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: credentials,
    });
  }

  async register(userData: RegisterRequest): Promise<any> {
    return this.request("/auth/register", {
      method: "POST",
      body: userData,
    });
  }

  async getProfile(): Promise<any> {
    return this.request("/auth/profile", {
      method: "GET",
    });
  }

  async logout(): Promise<any> {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  // User endpoints
  async getUsers(): Promise<any[]> {
    return this.request<any[]>("/users");
  }

  async getUserById(id: string): Promise<any> {
    return this.request<any>(`/users/${id}`);
  }

  async updateUser(id: string, userData: Partial<any>): Promise<any> {
    return this.request<any>(`/users/${id}`, {
      method: "PATCH",
      body: userData,
    });
  }

  // Ride endpoints
  async getRides(): Promise<any[]> {
    return this.request<any[]>("/rides");
  }

  async getRideById(id: string): Promise<any> {
    return this.request<any>(`/rides/${id}`);
  }

  async createRide(rideData: any): Promise<any> {
    return this.request("/rides", {
      method: "POST",
      body: rideData,
    });
  }

  async updateRide(id: string, rideData: any): Promise<any> {
    return this.request(`/rides/${id}`, {
      method: "PATCH",
      body: rideData,
    });
  }

  // Payment endpoints
  async getPayments(): Promise<any[]> {
    return this.request<any[]>("/payments");
  }

  async getPaymentById(id: string): Promise<any> {
    return this.request<any>(`/payments/${id}`);
  }

  async createPayment(paymentData: any): Promise<any> {
    return this.request("/payments", {
      method: "POST",
      body: paymentData,
    });
  }

  // Notification endpoints
  async getNotifications(): Promise<any[]> {
    return this.request<any[]>("/notifications");
  }

  async getUserNotifications(userId: string): Promise<any[]> {
    return this.request<any[]>(`/notifications/user/${userId}`);
  }

  async createNotification(notificationData: any): Promise<any> {
    return this.request("/notifications", {
      method: "POST",
      body: notificationData,
    });
  }

  async markNotificationAsRead(id: string): Promise<any> {
    return this.request(`/notifications/${id}/read`, {
      method: "POST",
    });
  }

  // Chat endpoints
  async getChatRooms(): Promise<any[]> {
    return this.request<any[]>("/chat/rooms");
  }

  async getUserChatRooms(userId: string): Promise<any[]> {
    return this.request<any[]>(`/chat/rooms/user/${userId}`);
  }

  async createChatRoom(roomData: any): Promise<any> {
    return this.request("/chat/rooms", {
      method: "POST",
      body: roomData,
    });
  }

  async getChatMessages(roomId: string): Promise<any[]> {
    return this.request<any[]>(`/chat/rooms/${roomId}/messages`);
  }

  async sendMessage(messageData: any): Promise<any> {
    return this.request("/chat/messages", {
      method: "POST",
      body: messageData,
    });
  }

  // Location endpoints
  async updateDriverLocation(
    driverId: string,
    locationData: any
  ): Promise<any> {
    return this.request(`/locations/driver/${driverId}/location`, {
      method: "POST",
      body: locationData,
    });
  }

  async getDriverLocation(driverId: string): Promise<any> {
    return this.request(`/locations/driver/${driverId}/location`);
  }

  async getNearbyDrivers(locationData: any): Promise<any[]> {
    return this.request<any[]>("/locations/nearby-drivers", {
      method: "POST",
      body: locationData,
    });
  }

  async createAddress(addressData: any): Promise<any> {
    return this.request("/locations/addresses", {
      method: "POST",
      body: addressData,
    });
  }

  async getUserAddresses(userId: string): Promise<any[]> {
    return this.request<any[]>(`/locations/addresses/user/${userId}`);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
