import type { NextApiRequest, NextApiResponse } from "next";

// Get test storage (shared with test creation)
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
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const tests = Array.from(testStorage.values());
    const completedTests = tests.filter((t: any) => t.completedAt || t.status === "completed");
    
    const stats = {
      totalTests: tests.length,
      completedTests: completedTests.length,
      averageScore: completedTests.length > 0
        ? Math.round(completedTests.reduce((sum: number, t: any) => sum + (t.score || 0), 0) / completedTests.length)
        : 0,
      totalQuestions: tests.reduce((sum: number, t: any) => sum + (t.questionCount || 0), 0),
    };
    
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error("Error fetching performance stats:", error);
    return res.status(500).json({ 
      error: error?.message || "Failed to fetch performance stats" 
    });
  }
}

