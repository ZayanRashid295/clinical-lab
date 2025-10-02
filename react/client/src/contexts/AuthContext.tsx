import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  apiService,
  LoginRequest,
  LoginResponse,
  UserProfile,
  ApiError,
} from "../lib/api";

// User interface
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: () => boolean;
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
    const initializeUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const userData = localStorage.getItem("user_data");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Verify token is still valid by fetching profile
          try {
            await apiService.getProfile();
          } catch (error) {
            // Token is invalid, clear storage
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_data");
            setUser(null);
          }
        }
      } catch (error) {
        console.warn("Failed to initialize user from storage:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_data");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const isAuthenticated = (): boolean => {
    const token = localStorage.getItem("access_token");
    const hasToken = !!token;
    const hasUser = !!user;
    const isAuth = hasToken && hasUser;

    console.log("🔍 Authentication check:", {
      hasToken,
      hasUser,
      isAuth,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "none",
      userEmail: user?.email || "none",
    });

    return isAuth;
  };

  const getCurrentUser = (): User | null => {
    return user;
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);

      // Validate credentials
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
      console.log("🌐 Using real API service for login");

      const response: LoginResponse = await apiService.login(loginRequest);

      if (!response) {
        throw new Error("Login failed. Please try again.");
      }

      // Store the access token
      localStorage.setItem("access_token", response.access_token);

      // Get user profile from API
      const userProfile: UserProfile = await apiService.getProfile();
      if (!userProfile) {
        throw new Error("Failed to fetch user profile");
      }

      // Create user object
      const newUser: User = {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        profileImageUrl: userProfile.profileImageUrl,
        roles: userProfile.roles?.map((r) => r.role.name) || [],
      };

      // Store user data
      localStorage.setItem("user_data", JSON.stringify(newUser));
      setUser(newUser);

      return newUser;
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log("🔄 Starting logout process...");
      console.log("🔍 User authenticated:", isAuthenticated());
      console.log("🔍 User data:", user);
      console.log("🔍 Token exists:", !!localStorage.getItem("access_token"));

      // Call logout API if there's a token (even if user state is not set)
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          console.log("🌐 Calling real API logout");
          const result = await apiService.logout();
          console.log("✅ Logout API response:", result);
        } catch (error) {
          console.warn("❌ Logout API call failed:", error);
          // Continue with local logout even if API call fails
        }
      } else {
        console.log("🎭 No token found, skipping API call");
      }
    } catch (error) {
      console.error("💥 Logout error:", error);
      // Even if logout fails, clear local state
    } finally {
      console.log("🧹 Clearing local storage and state...");
      // Clear local storage and state
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_data");
      setUser(null);
      setIsLoading(false);
      console.log("✅ Logout process completed");
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
