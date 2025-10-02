// API Configuration for React app
export const apiConfig = {
  // Backend API URL - update this to match your backend
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",

  // Request timeout in milliseconds
  timeout: 10000,

  // Endpoints
  endpoints: {
    auth: {
      login: "/auth/login",
      register: "/auth/register",
      profile: "/auth/profile",
      logout: "/auth/logout",
    },
    users: "/users",
    rides: "/rides",
    payments: "/payments",
    notifications: "/notifications",
    chat: "/chat",
    locations: "/locations",
  },
};

// Types for API requests and responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  roles?: Array<{ role: { name: string } }>;
}

export interface ApiError {
  message: string;
  status: number;
}

// API Service class
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = apiConfig.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("access_token");

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method: options.method || "GET",
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      console.log("🌐 API Request:", {
        url,
        method: options.method || "GET",
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : "none",
      });
      console.log("🚀 Making fetch request with config:", config);

      const response = await fetch(url, config);
      console.log("📡 Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("❌ Error response data:", errorData);
        const error: ApiError = {
          message:
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
        throw error;
      }

      const result = await response.json();
      console.log("✅ Response data:", result);
      return result;
    } catch (error) {
      console.log("💥 Request error:", error);
      if (error instanceof Error && error.name === "TypeError") {
        // Network error
        const networkError: ApiError = {
          message: "Network error - please check your connection",
          status: 0,
        };
        throw networkError;
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>(apiConfig.endpoints.auth.login, {
      method: "POST",
      body: credentials,
    });
  }

  async register(userData: any): Promise<any> {
    return this.request<any>(apiConfig.endpoints.auth.register, {
      method: "POST",
      body: userData,
    });
  }

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>(apiConfig.endpoints.auth.profile);
  }

  async logout(): Promise<any> {
    console.log(
      "🚀 API Service: Making logout request to",
      `${this.baseURL}${apiConfig.endpoints.auth.logout}`
    );
    console.log(
      "🚀 API Service: Request headers will include Authorization token"
    );
    return this.request<any>(apiConfig.endpoints.auth.logout, {
      method: "POST",
    });
  }

  // Other endpoints
  async getUsers(): Promise<any[]> {
    return this.request<any[]>(apiConfig.endpoints.users);
  }

  async getUserById(id: string): Promise<any> {
    return this.request<any>(`${apiConfig.endpoints.users}/${id}`);
  }

  async getRides(): Promise<any[]> {
    return this.request<any[]>(apiConfig.endpoints.rides);
  }

  async getPayments(): Promise<any[]> {
    return this.request<any[]>(apiConfig.endpoints.payments);
  }

  async getNotifications(): Promise<any[]> {
    return this.request<any[]>(apiConfig.endpoints.notifications);
  }
}

export const apiService = new ApiService();
