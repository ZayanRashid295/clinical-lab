import { BaseApiService } from "../base/base-api.service";
import { Bookmark, BookmarkType } from "./types";

export interface CreateBookmarkPayload {
  resourceType: BookmarkType;
  resourceId: string;
  note?: string;
}

class BookmarksService extends BaseApiService {
  list(resourceType?: BookmarkType): Promise<Bookmark[]> {
    return this.get("/bookmarks", resourceType ? { resourceType } : undefined);
  }

  create(payload: CreateBookmarkPayload): Promise<Bookmark> {
    return this.post("/bookmarks", payload);
  }

  toggle(payload: CreateBookmarkPayload): Promise<{ bookmarked: boolean }> {
    return this.post("/bookmarks/toggle", payload);
  }

  remove(id: string): Promise<{ ok: true }> {
    return this.delete(`/bookmarks/${id}`);
  }
}

export const bookmarksService = new BookmarksService();
