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

  if (req.method === "GET") {
    try {
      const tests = Array.from(testStorage.values());
      return res.status(200).json(tests);
    } catch (error: any) {
      console.error("Error fetching tests:", error);
      return res.status(500).json({ 
        error: error?.message || "Failed to fetch tests" 
      });
    }
  }

  if (req.method === "POST") {
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

      // Fetch questions from questions API
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (req.headers.host ? `http://${req.headers.host}` : "http://localhost:52941");
      const questionsResponse = await fetch(`${baseUrl}/api/questions`);
      if (!questionsResponse.ok) {
        return res.status(500).json({ error: "Failed to fetch questions" });
      }
      const allQuestions = await questionsResponse.json();

      // Filter questions by subjects OR systems (like uworld-replit)
      let filteredQuestions = allQuestions.filter((q: any) => {
        const matchesSubject = subjects.length === 0 || subjects.includes(q.subject);
        const matchesSystem = systems.length === 0 || systems.includes(q.system);
        // Question matches if it matches ANY selected subject OR ANY selected system
        return matchesSubject || matchesSystem;
      });

      // Check if we have enough questions
      if (filteredQuestions.length === 0) {
        return res.status(400).json({
          error: "No questions found matching the selected subjects or systems. Please adjust your filters.",
        });
      }

      if (filteredQuestions.length < questionCount) {
        return res.status(400).json({
          error: `Only ${filteredQuestions.length} question(s) available for the selected filters. Please reduce the question count or adjust your filters.`,
        });
      }

      // Shuffle and select questions
      const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, questionCount);
      const questionIds = selectedQuestions.map((q: any) => q.id);

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
        questions: questionIds,
        answers: {},
        markedQuestions: [],
        status: "in-progress",
        createdAt: new Date().toISOString(),
      };

      // Store test in memory
      testStorage.set(testId, test);

      return res.status(201).json(test);
    } catch (error: any) {
      console.error("Error creating test:", error);
      return res.status(500).json({ 
        error: error?.message || "Failed to create test" 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
