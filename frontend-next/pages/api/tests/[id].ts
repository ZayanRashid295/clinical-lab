import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set JSON content type
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Test ID is required" });
    }

    // TODO: Fetch test from database/storage when backend is ready
    // For now, return a mock test structure
    
    // In a real implementation, this would fetch from storage:
    // const test = await storage.getTest(id);
    
    // Mock test response - replace with actual database query
    const mockTest = {
      id,
      name: "Test Session",
      mode: "tutor",
      isTimed: false,
      questionPool: "unused",
      subjects: [],
      systems: [],
      questionCount: 0,
      questions: [], // Array of question IDs
      answers: {},
      markedQuestions: [],
      status: "in-progress",
      createdAt: new Date().toISOString(),
    };

    return res.status(200).json(mockTest);
  } catch (error: any) {
    console.error("Error fetching test:", error);
    return res.status(500).json({ 
      error: error?.message || "Failed to fetch test" 
    });
  }
}

