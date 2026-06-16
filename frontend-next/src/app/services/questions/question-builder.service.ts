import { BaseApiService } from "../base/base-api.service";
import type {
  ConvertResponse,
  QuestionData,
} from "@/app/components/question-generator/question-builder/types";

export class QuestionBuilderService extends BaseApiService {
  protected readonly endpoint = "/question-builder";

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async convertFiles(files: File[]): Promise<ConvertResponse> {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    const response = await fetch(`${this.baseURL}${this.endpoint}/convert`, {
      method: "POST",
      headers: this.authHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        typeof errorData.message === "string"
          ? errorData.message
          : Array.isArray(errorData.message)
            ? errorData.message.join(". ")
            : "Upload failed";
      throw new Error(message);
    }

    return response.json() as Promise<ConvertResponse>;
  }

  async getQuestion(questionId: string): Promise<QuestionData> {
    return this.get(`${this.endpoint}/preview/${questionId}`);
  }

  async fetchImageBlob(questionId: string, filename: string): Promise<Blob> {
    const response = await fetch(
      `${this.baseURL}${this.endpoint}/preview/${questionId}/images/${filename}`,
      { headers: this.authHeaders() },
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch image ${filename}`);
    }
    return response.blob();
  }
}
