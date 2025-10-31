import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set JSON content type
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      mode,
      isTimed,
      questionPool,
      subjects,
      systems,
      questionCount,
      duration,
    } = req.body;

    // Validation
    if (!name || !mode || !subjects || !systems || !questionCount) {
      return res.status(400).json({ 
        error: "Missing required fields: name, mode, subjects, systems, questionCount" 
      });
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: "At least one subject is required" });
    }

    if (!Array.isArray(systems) || systems.length === 0) {
      return res.status(400).json({ error: "At least one system is required" });
    }

    if (typeof questionCount !== "number" || questionCount <= 0 || questionCount > 40) {
      return res.status(400).json({ 
        error: "Question count must be between 1 and 40" 
      });
    }

    // Generate test ID (simple UUID-like string)
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create test object
    const test = {
      id: testId,
      name,
      mode,
      isTimed: isTimed || false,
      questionPool: questionPool || "unused",
      subjects,
      systems,
      questionCount,
      duration: duration || (isTimed ? questionCount * 1.5 : undefined),
      questions: [],
      answers: {},
      markedQuestions: [],
      status: "created",
      createdAt: new Date().toISOString(),
    };

    // TODO: Save to database/storage when backend is ready
    // For now, just return the test object

    return res.status(201).json(test);
  } catch (error: any) {
    console.error("Error creating test:", error);
    return res.status(500).json({ 
      error: error?.message || "Failed to create test" 
    });
  }
}

