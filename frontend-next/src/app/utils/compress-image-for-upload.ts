/**
 * Resize/compress images in the browser before upload.
 * DOCX embedded PNGs are often 2–5MB; nginx defaults to 1MB (413).
 */
const DEFAULT_MAX_BYTES = 700 * 1024;
const DEFAULT_MAX_DIMENSION = 1200;

function replaceExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^./\\]+$/, "") || "image";
  return `${base}${ext}`;
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

export async function compressImageForUpload(
  file: File,
  options?: {
    maxBytes?: number;
    maxDimension?: number;
  }
): Promise<File> {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const outputMime = "image/jpeg";
  const outputExt = ".jpg";

  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  if (file.size <= maxBytes * 0.75) {
    return file;
  }

  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file);
    let width = bitmap.width;
    let height = bitmap.height;

    let scale = Math.min(1, maxDimension / Math.max(width, height, 1));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    const redraw = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(bitmap!, 0, 0, width, height);
    };

    redraw();

    let quality = 0.88;
    let blob: Blob | null = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      blob = await canvasToBlob(canvas, outputMime, quality);
      if (blob && blob.size <= maxBytes) break;

      if (attempt % 2 === 1) {
        scale *= 0.85;
        width = Math.max(1, Math.round(bitmap.width * scale));
        height = Math.max(1, Math.round(bitmap.height * scale));
        redraw();
      } else {
        quality = Math.max(0.45, quality - 0.08);
      }
    }

    if (!blob || blob.size > maxBytes * 1.1) {
      return file;
    }

    return new File([blob], replaceExtension(file.name, outputExt), {
      type: outputMime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
