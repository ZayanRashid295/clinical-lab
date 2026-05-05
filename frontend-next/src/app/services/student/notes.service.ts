import { BaseApiService } from "../base/base-api.service";
import { StudentNote } from "./types";

export interface CreateNotePayload {
  title: string;
  body: string;
  color?: string;
  pinned?: boolean;
  tags?: string[];
  questionId?: string;
  topicId?: string;
  subtopicId?: string;
  systemId?: string;
  productId?: string;
}

export type UpdateNotePayload = Partial<CreateNotePayload>;

export interface QueryNotesParams {
  search?: string;
  systemId?: string;
  topicId?: string;
  subtopicId?: string;
  questionId?: string;
  pinned?: "true" | "false";
}

class NotesService extends BaseApiService {
  list(q?: QueryNotesParams): Promise<StudentNote[]> {
    return this.get("/notes", q);
  }

  stats(): Promise<{ total: number; pinned: number; recent: number }> {
    return this.get("/notes/stats");
  }

  one(id: string): Promise<StudentNote> {
    return this.get(`/notes/${id}`);
  }

  create(payload: CreateNotePayload): Promise<StudentNote> {
    return this.post("/notes", payload);
  }

  update(id: string, payload: UpdateNotePayload): Promise<StudentNote> {
    return this.patch(`/notes/${id}`, payload);
  }

  remove(id: string): Promise<{ ok: true }> {
    return this.delete(`/notes/${id}`);
  }
}

export const notesService = new NotesService();
