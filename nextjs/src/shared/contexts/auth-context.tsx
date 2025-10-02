"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiService, ApiError } from "../services/api.service";

// Types matching Angular
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles?: Array<{
    role?: {
      name: string;
    };
  }>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  getCurrentUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from storage on mount
  useEffect(() => {
    const initializeUser = () => {
      // Only run on client side
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("access_token");
        const userData = localStorage.getItem("user_data");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.warn("Failed to initialize user from storage:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_data");
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure we're fully client-side
    const timer = setTimeout(initializeUser, 0);
    return () => clearTimeout(timer);
  }, []);

  const isAuthenticated = (): boolean => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("access_token");
    return !!token;
  };

  const getCurrentUser = (): User | null => {
    return user;
  };

  // API service configuration (client-side only)
  const useRealAPI =
    typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_USE_REAL_API === "true" ||
      process.env.NODE_ENV === "production");

  // Mock API service for development (fallback)
  const mockApiService = {
    login: async (request: LoginRequest): Promise<LoginResponse> => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login for demo
      return {
        access_token: "mock_access_token_" + Date.now(),
      };
    },

    getProfile: async (): Promise<UserProfile> => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Extract username from email
      const username = user?.email.split("@")[0] || "user";
      const firstName = username.split(".")[0] || username;
      const lastName = username.split(".")[1] || "User";

      return {
        id: "user_" + Date.now(),
        email: user?.email || "",
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        avatar: undefined,
        roles: [{ role: { name: "user" } }, { role: { name: "passenger" } }],
      };
    },
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);

      // Validate credentials (equivalent to Angular's AuthValidationService)
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Call API for authentication
      const loginRequest: LoginRequest = { email, password };
      let response: LoginResponse;
      let userProfile: UserProfile;

      if (useRealAPI) {
        // Use real API service
        console.log("🌐 Using real API service for login");
        response = await apiService.login(loginRequest);

        if (!response) {
          throw new Error("Login failed. Please try again.");
        }

        // Store the access token
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", response.access_token);
        }

        // Get user profile from API
        userProfile = await apiService.getProfile();
        if (!userProfile) {
          throw new Error("Failed to fetch user profile");
        }
      } else {
        // Use mock API service for development
        console.log("🎭 Using mock API service for login");
        response = await mockApiService.login(loginRequest);

        if (!response) {
          throw new Error("Login failed. Please try again.");
        }

        // Store the access token
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", response.access_token);
        }

        // Get user profile from mock
        userProfile = await mockApiService.getProfile();
        if (!userProfile) {
          throw new Error("Failed to fetch user profile");
        }
      }

      // Create user object (matching Angular's User interface)
      const newUser: User = {
        id: userProfile.id,
        email: userProfile.email,
        name: `${userProfile.firstName} ${userProfile.lastName}`,
        roles:
          userProfile.roles
            ?.map((ur) => ur.role?.name)
            .filter((name): name is string => Boolean(name)) || [],
        avatar: userProfile.avatar,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store user data and update state
      if (typeof window !== "undefined") {
        localStorage.setItem("user_data", JSON.stringify(newUser));
      }
      setUser(newUser);

      return newUser;
    } catch (error) {
      // Clear any partial auth data on error
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_data");
      }
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout API if using real API
      if (useRealAPI) {
        console.log("🌐 Calling real API logout");
        await apiService.logout();
      } else {
        console.log("🎭 Using mock logout");
      }
    } catch (error) {
      console.warn("Logout API call failed:", error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage and state
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_data");
      }
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: isAuthenticated(),
    isLoading,
    login,
    logout,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
