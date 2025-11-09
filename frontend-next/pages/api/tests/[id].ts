import type { NextApiRequest, NextApiResponse } from "next";

// In-memory storage for tests (should match the one in index.ts)
// In production, use a shared database or storage service
declare global {
  // eslint-disable-next-line no-var
  var testStorage: Map<string, any> | undefined;
}

const testStorage = global.testStorage || new Map<string, any>();
if (process.env.NODE_ENV !== "production") {
  global.testStorage = testStorage;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set JSON content type
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET") {
    try {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Test ID is required" });
      }

      const test = testStorage.get(id);

      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      return res.status(200).json(test);
    } catch (error: any) {
      console.error("Error fetching test:", error);
      return res.status(500).json({ 
        error: error?.message || "Failed to fetch test" 
      });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Test ID is required" });
      }

      const test = testStorage.get(id);

      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      // Update test with provided data
      const updatedTest = {
        ...test,
        ...req.body,
      };

      testStorage.set(id, updatedTest);

      return res.status(200).json(updatedTest);
    } catch (error: any) {
      console.error("Error updating test:", error);
      return res.status(500).json({ 
        error: error?.message || "Failed to update test" 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

