import { BaseApiService } from "../base/base-api.service";
import type {
  ConvertResponse,
  QuestionData,
} from "@/app/components/question-generator/question-builder/types";
import { formatFileSize } from "@/app/utils/compress-image-for-upload";

/** Stay under typical nginx 50MB limit (multipart overhead included). */
const MAX_BATCH_BYTES = 40 * 1024 * 1024;
const MAX_FILES_PER_BATCH = 5;

function chunkFilesForUpload(files: File[]): File[][] {
  const batches: File[][] = [];
  let current: File[] = [];
  let currentSize = 0;

  for (const file of files) {
    const wouldExceedSize = currentSize + file.size > MAX_BATCH_BYTES;
    const wouldExceedCount = current.length >= MAX_FILES_PER_BATCH;

    if (current.length > 0 && (wouldExceedSize || wouldExceedCount)) {
      batches.push(current);
      current = [file];
      currentSize = file.size;
    } else {
      current.push(file);
      currentSize += file.size;
    }
  }

  if (current.length > 0) {
    batches.push(current);
  }

  return batches;
}

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

  private convertUrl(): string {
    // Multipart uploads must go directly to Nest in the browser. Routing them through
    // a Vercel Function causes Vercel to reject larger DOCX batches before our code runs.
    return `${this.baseURL}${this.endpoint}/convert`;
  }

  private async convertBatch(files: File[]): Promise<ConvertResponse> {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    const response = await fetch(this.convertUrl(), {
      method: "POST",
      headers: this.authHeaders(),
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 413) {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        throw new Error(
          `Upload is too large (${formatFileSize(totalSize)} for ${files.length} file(s)). ` +
            "Try fewer files at once or upload smaller documents."
        );
      }

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

  async convertFiles(files: File[]): Promise<ConvertResponse> {
    const batches = chunkFilesForUpload(files);

    if (batches.length === 1) {
      return this.convertBatch(batches[0]);
    }

    const merged: ConvertResponse = {
      total: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    };

    for (const batch of batches) {
      const response = await this.convertBatch(batch);
      merged.total += response.total;
      merged.succeeded += response.succeeded;
      merged.failed += response.failed;
      merged.results.push(...response.results);
    }

    return merged;
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
