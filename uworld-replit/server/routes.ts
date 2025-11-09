import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTestSchema,
  insertFlashcardDeckSchema,
  insertFlashcardSchema,
  insertNoteSchema,
  insertStudyTaskSchema,
  insertQuestionSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Questions API
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/search", async (req, res) => {
    try {
      const { subject, system, status, searchTerm } = req.query;
      const questions = await storage.searchQuestions({
        subject: subject as string,
        system: system as string,
        status: status as string,
        searchTerm: searchTerm as string,
      });
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to search questions" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      res.status(400).json({ error: "Invalid question data" });
    }
  });

  // Tests API
  app.get("/api/tests", async (req, res) => {
    try {
      const tests = await storage.getTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  });

  app.get("/api/tests/:id", async (req, res) => {
    try {
      const test = await storage.getTest(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      res.json(test);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch test" });
    }
  });

  app.post("/api/tests", async (req, res) => {
    try {
      const validatedData = insertTestSchema.parse(req.body);
      const test = await storage.createTest(validatedData);
      res.status(201).json(test);
    } catch (error) {
      // Return the actual error message from storage
      const errorMessage = error instanceof Error ? error.message : "Invalid test data";
      res.status(400).json({ error: errorMessage });
    }
  });

  app.patch("/api/tests/:id", async (req, res) => {
    try {
      const test = await storage.updateTest(req.params.id, req.body);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      res.json(test);
    } catch (error) {
      res.status(500).json({ error: "Failed to update test" });
    }
  });

  app.delete("/api/tests/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Test not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete test" });
    }
  });

  // Flashcard Decks API
  app.get("/api/flashcard-decks", async (req, res) => {
    try {
      const decks = await storage.getFlashcardDecks();
      res.json(decks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch decks" });
    }
  });

  app.get("/api/flashcard-decks/:id", async (req, res) => {
    try {
      const deck = await storage.getFlashcardDeck(req.params.id);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.json(deck);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deck" });
    }
  });

  app.post("/api/flashcard-decks", async (req, res) => {
    try {
      const validatedData = insertFlashcardDeckSchema.parse(req.body);
      const deck = await storage.createFlashcardDeck(validatedData);
      res.status(201).json(deck);
    } catch (error) {
      res.status(400).json({ error: "Invalid deck data" });
    }
  });

  app.patch("/api/flashcard-decks/:id", async (req, res) => {
    try {
      const deck = await storage.updateFlashcardDeck(req.params.id, req.body);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.json(deck);
    } catch (error) {
      res.status(500).json({ error: "Failed to update deck" });
    }
  });

  app.delete("/api/flashcard-decks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFlashcardDeck(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deck" });
    }
  });

  // Flashcards API
  app.get("/api/flashcard-decks/:deckId/flashcards", async (req, res) => {
    try {
      const flashcards = await storage.getFlashcards(req.params.deckId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch flashcards" });
    }
  });

  app.post("/api/flashcard-decks/:deckId/flashcards", async (req, res) => {
    try {
      const validatedData = insertFlashcardSchema.parse({
        ...req.body,
        deckId: req.params.deckId,
      });
      const flashcard = await storage.createFlashcard(validatedData);
      res.status(201).json(flashcard);
    } catch (error) {
      res.status(400).json({ error: "Invalid flashcard data" });
    }
  });

  app.patch("/api/flashcards/:id", async (req, res) => {
    try {
      const flashcard = await storage.updateFlashcard(req.params.id, req.body);
      if (!flashcard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }
      res.json(flashcard);
    } catch (error) {
      res.status(500).json({ error: "Failed to update flashcard" });
    }
  });

  app.delete("/api/flashcards/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFlashcard(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Flashcard not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete flashcard" });
    }
  });

  // Notes API
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const validatedData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNote(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Study Tasks API
  app.get("/api/study-tasks", async (req, res) => {
    try {
      const tasks = await storage.getStudyTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch study tasks" });
    }
  });

  app.get("/api/study-tasks/:id", async (req, res) => {
    try {
      const task = await storage.getStudyTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/study-tasks", async (req, res) => {
    try {
      const validatedData = insertStudyTaskSchema.parse(req.body);
      const task = await storage.createStudyTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.patch("/api/study-tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateStudyTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/study-tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStudyTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Articles API
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/search", async (req, res) => {
    try {
      const { searchTerm, type } = req.query;
      const articles = await storage.searchArticles({
        searchTerm: searchTerm as string,
        type: type as string,
      });
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to search articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // Performance/Stats API
  app.get("/api/performance/stats", async (req, res) => {
    try {
      const tests = await storage.getTests();
      const completedTests = tests.filter(t => t.completedAt);
      
      const stats = {
        totalTests: tests.length,
        completedTests: completedTests.length,
        averageScore: completedTests.length > 0
          ? completedTests.reduce((sum, t) => sum + (t.score || 0), 0) / completedTests.length
          : 0,
        totalQuestions: tests.reduce((sum, t) => sum + t.questionCount, 0),
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch performance stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
