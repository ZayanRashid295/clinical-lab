import { BaseApiService } from "../base/base-api.service";
import { Flashcard, FlashcardRating } from "./types";

export interface CreateFlashcardPayload {
  deck?: string;
  front: string;
  back: string;
  hint?: string;
  tags?: string[];
  difficulty?: string;
  questionId?: string;
  topicId?: string;
  subtopicId?: string;
  systemId?: string;
  productId?: string;
}
export type UpdateFlashcardPayload = Partial<CreateFlashcardPayload>;

export interface QueryFlashcardsParams {
  deck?: string;
  search?: string;
  due?: "true" | "false";
}

export interface FlashcardsStats {
  total: number;
  due: number;
  mastered: number;
  reviewedToday: number;
  decks: { deck: string; _count: { _all: number } }[];
}

class FlashcardsService extends BaseApiService {
  list(q?: QueryFlashcardsParams): Promise<Flashcard[]> {
    return this.get("/flashcards", q);
  }

  stats(): Promise<FlashcardsStats> {
    return this.get("/flashcards/stats");
  }

  one(id: string): Promise<Flashcard> {
    return this.get(`/flashcards/${id}`);
  }

  create(payload: CreateFlashcardPayload): Promise<Flashcard> {
    return this.post("/flashcards", payload);
  }

  update(id: string, payload: UpdateFlashcardPayload): Promise<Flashcard> {
    return this.patch(`/flashcards/${id}`, payload);
  }

  remove(id: string): Promise<{ ok: true }> {
    return this.delete(`/flashcards/${id}`);
  }

  review(id: string, rating: FlashcardRating): Promise<Flashcard> {
    return this.post(`/flashcards/${id}/review`, { rating });
  }
}

export const flashcardsService = new FlashcardsService();
