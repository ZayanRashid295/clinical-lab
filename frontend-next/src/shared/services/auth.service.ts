import { BaseApiService } from "../../app/services/base/base-api.service";

export class AuthService extends BaseApiService {
  async login(email: string, password: string): Promise<any> {
    const url = `${this.baseURL}/auth/login`;
    const config: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    };

    return new Promise(async (resolve, reject) => {
      try {
        console.log(`Making login request to: ${url}`);
        const response = await fetch(url, config);

        let responseData;
        try {
          responseData = await response.json();
        } catch (parseError) {
          responseData = {};
        }

        if (!response.ok) {
          // For authentication endpoints, we want to handle 401 errors gracefully
          // and return the error message from the backend
          console.error(
            `Login failed with status ${response.status}:`,
            responseData
          );

          const errorMessage =
            responseData.message || `Authentication failed: ${response.status}`;
          console.log(`🚫 Rejecting with error: ${errorMessage}`);
          reject(new Error(errorMessage));
          return;
        }

        console.log(`✅ Login successful, resolving with data:`, responseData);

        // Store auth token in localStorage
        if (responseData.access_token) {
          localStorage.setItem("authToken", responseData.access_token);
        }

        // Fetch complete user profile with roles
        try {
          const profileResponse = await this.getProfile();
          console.log(`✅ Profile fetched with roles:`, profileResponse);

          // Transform roles to simple array format for menu system
          const userWithRoles = {
            ...profileResponse,
            roles:
              profileResponse.roles
                ?.map((userRole: any) => userRole.role?.name)
                .filter(Boolean) || [],
          };

          localStorage.setItem("userData", JSON.stringify(userWithRoles));
          resolve({ ...responseData, user: userWithRoles });
        } catch (profileError) {
          console.error("Failed to fetch user profile:", profileError);
          // Fallback to basic user data
          if (responseData.user) {
            localStorage.setItem("userData", JSON.stringify(responseData.user));
          }
          resolve(responseData);
        }
      } catch (error) {
        console.error("Login request failed:", error);
        // If it's a network error (like connection refused), provide a more helpful message
        if (error instanceof TypeError && error.message.includes("fetch")) {
          reject(
            new Error(
              `Unable to connect to API server at ${url}. Please ensure the backend is running.`
            )
          );
        } else {
          reject(error);
        }
      }
    });
  }

  async register(userData: any): Promise<any> {
    return this.post("/auth/register", userData);
  }

  async getProfile(): Promise<any> {
    return this.get("/auth/profile");
  }

  async logout(): Promise<any> {
    try {
      // Make logout API call first (while we still have the token)
      const result = await this.post("/auth/logout");

      // Clear localStorage data after successful API call
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");

      return result;
    } catch (error) {
      // Even if the API call fails, clear localStorage data
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");

      // Don't throw the error - logout should always succeed locally
      console.warn(
        "Logout API call failed, but local logout completed:",
        error
      );
      return { success: true, message: "Logged out locally" };
    }
  }

  isAuthenticated(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    const token = localStorage.getItem("authToken");
    return !!token;
  }

  getCurrentUser(): any {
    if (typeof window === "undefined") {
      return null;
    }
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
        return null;
      }
    }
    return null;
  }
}

export const authService = new AuthService();
