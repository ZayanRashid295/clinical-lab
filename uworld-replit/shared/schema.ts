import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Questions Schema
export const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string(),
  subject: z.string(),
  system: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  imageUrl: z.string().optional(),
  status: z.enum(["correct", "incorrect", "unseen"]).optional(),
  yourAnswer: z.string().optional(),
});

export type Question = z.infer<typeof questionSchema>;

export const insertQuestionSchema = questionSchema.omit({ id: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

// Tests Schema
export const testSchema = z.object({
  id: z.string(),
  name: z.string(),
  mode: z.enum(["tutor", "timed"]),
  isTimed: z.boolean(),
  questionPool: z.string(),
  subjects: z.array(z.string()),
  systems: z.array(z.string()),
  questionCount: z.number(),
  duration: z.number().optional(),
  questions: z.array(z.string()).default([]), // question IDs
  answers: z.record(z.string()).default({}), // questionId -> answer
  markedQuestions: z.array(z.string()).default([]),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  score: z.number().optional(),
  status: z.enum(["in-progress", "completed"]).optional(),
});

export type Test = z.infer<typeof testSchema>;

export const insertTestSchema = testSchema.omit({ id: true, createdAt: true });
export type InsertTest = z.infer<typeof insertTestSchema>;

// Flashcard Decks Schema
export const flashcardDeckSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
});

export type FlashcardDeck = z.infer<typeof flashcardDeckSchema>;

export const insertFlashcardDeckSchema = flashcardDeckSchema.omit({ id: true, createdAt: true });
export type InsertFlashcardDeck = z.infer<typeof insertFlashcardDeckSchema>;

// Flashcards Schema
export const flashcardSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  front: z.string(),
  back: z.string(),
  easinessFactor: z.number().default(2.5),
  interval: z.number().default(0),
  repetitions: z.number().default(0),
  nextReview: z.string().optional(),
  lastReviewed: z.string().optional(),
});

export type Flashcard = z.infer<typeof flashcardSchema>;

export const insertFlashcardSchema = flashcardSchema.omit({ id: true });
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;

// Notes Schema
export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  questionId: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Note = z.infer<typeof noteSchema>;

export const insertNoteSchema = noteSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;

// Study Tasks Schema
export const studyTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  duration: z.string(),
  status: z.enum(["upcoming", "overdue", "completed"]),
  dueDate: z.string(),
  completedAt: z.string().optional(),
});

export type StudyTask = z.infer<typeof studyTaskSchema>;

export const insertStudyTaskSchema = studyTaskSchema.omit({ id: true });
export type InsertStudyTask = z.infer<typeof insertStudyTaskSchema>;

// Article Schema (for Medical Library)
export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  type: z.enum(["article", "video", "reference"]),
  description: z.string(),
  readTime: z.string().optional(),
  videoLength: z.string().optional(),
  content: z.string().optional(),
});

export type Article = z.infer<typeof articleSchema>;

export const insertArticleSchema = articleSchema.omit({ id: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
