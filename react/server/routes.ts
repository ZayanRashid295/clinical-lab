import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Auth (now optional for development)
  await setupAuth(app);

  // Auth endpoint to get current user (for development mode)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Cases endpoint
  app.get("/api/cases", isAuthenticated, async (req, res) => {
    try {
      const { specialty, difficulty } = req.query;
      const cases = await storage.getCases({
        specialty: specialty as string,
        difficulty: difficulty as string,
      });
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
