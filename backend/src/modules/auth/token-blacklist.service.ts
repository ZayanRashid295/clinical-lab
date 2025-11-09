import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens = new Set<string>();

  constructor(private jwtService: JwtService) {}

  /**
   * Add a token to the blacklist
   * @param token - The JWT token to blacklist
   */
  addToBlacklist(token: string): void {
    try {
      // Decode the token to get its expiration time
      const decoded = this.jwtService.decode(token) as any;
      if (decoded && decoded.exp) {
        const expirationTime = decoded.exp * 1000; // Convert to milliseconds
        const now = Date.now();

        // Only add to blacklist if token hasn't expired
        if (expirationTime > now) {
          this.blacklistedTokens.add(token);

          // Set a timeout to remove the token from blacklist when it expires
          const timeUntilExpiry = expirationTime - now;
          setTimeout(() => {
            this.blacklistedTokens.delete(token);
          }, timeUntilExpiry);
        }
      }
    } catch (error) {
      console.error("Error adding token to blacklist:", error);
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token - The JWT token to check
   * @returns true if the token is blacklisted, false otherwise
   */
  isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Remove a token from the blacklist (useful for testing)
   * @param token - The JWT token to remove from blacklist
   */
  removeFromBlacklist(token: string): void {
    this.blacklistedTokens.delete(token);
  }

  /**
   * Get the current size of the blacklist (useful for monitoring)
   * @returns The number of blacklisted tokens
   */
  getBlacklistSize(): number {
    return this.blacklistedTokens.size;
  }

  /**
   * Clear all blacklisted tokens (useful for testing)
   */
  clearBlacklist(): void {
    this.blacklistedTokens.clear();
  }
}
