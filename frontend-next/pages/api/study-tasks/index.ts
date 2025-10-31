import type { NextApiRequest, NextApiResponse } from "next";

// In-memory storage for study tasks
declare global {
  // eslint-disable-next-line no-var
  var studyTaskStorage: Map<string, any> | undefined;
}

const studyTaskStorage = global.studyTaskStorage || new Map<string, any>();
if (process.env.NODE_ENV !== "production") {
  global.studyTaskStorage = studyTaskStorage;
}

// Mock study tasks
const initializeMockTasks = () => {
  if (studyTaskStorage.size === 0) {
    const mockTasks = [
      {
        id: "task-1",
        title: "Complete Cardiology Chapter Review",
        type: "Study Session",
        duration: "2 hours",
        status: "upcoming" as const,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "task-2",
        title: "Practice Test - 50 Questions",
        type: "Practice Test",
        duration: "1.5 hours",
        status: "upcoming" as const,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "task-3",
        title: "Review Biochemistry Notes",
        type: "Review",
        duration: "1 hour",
        status: "upcoming" as const,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "task-4",
        title: "Pathology Flashcards Session",
        type: "Flashcards",
        duration: "45 minutes",
        status: "overdue" as const,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    mockTasks.forEach((task) => {
      studyTaskStorage.set(task.id, task);
    });
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET") {
    try {
      initializeMockTasks();
      const tasks = Array.from(studyTaskStorage.values());
      return res.status(200).json(tasks);
    } catch (error: any) {
      console.error("Error fetching study tasks:", error);
      return res.status(500).json({ 
        error: error?.message || "Failed to fetch study tasks" 
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

