import { HERO_PERFORMANCE } from "./constants";
import type { FrameLoaderState, HeroSequenceConfig } from "./types";
import { getFrameUrl } from "./utils/framePath";

type ProgressCallback = (progress: number) => void;

/**
 * Progressive frame preloader with caching, batching, and offscreen decode.
 */
export class FrameLoader {
  private state: FrameLoaderState = {
    loaded: new Set(),
    failed: new Set(),
    images: new Map(),
    isReady: false,
    progress: 0,
  };

  private loading = new Set<number>();
  private queue: number[] = [];
  private destroyed = false;
  private onProgress?: ProgressCallback;

  constructor(private readonly config: HeroSequenceConfig) {}

  /** Subscribe to load progress (0–1). */
  setProgressCallback(cb: ProgressCallback): void {
    this.onProgress = cb;
  }

  getState(): Readonly<FrameLoaderState> {
    return this.state;
  }

  getImage(index: number): HTMLImageElement | undefined {
    return this.state.images.get(index);
  }

  /** Start loading: first frame, last frame, then sequential batches. */
  async preload(): Promise<void> {
    const { frameCount } = this.config;
    const priority = [
      0,
      frameCount - 1,
      Math.floor(frameCount * 0.5),
      ...Array.from({ length: frameCount }, (_, i) => i).filter(
        (i) => i !== 0 && i !== frameCount - 1 && i !== Math.floor(frameCount * 0.5)
      ),
    ];

    this.queue = priority;
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && !this.destroyed) {
      while (
        this.loading.size < HERO_PERFORMANCE.maxConcurrentLoads &&
        this.queue.length > 0
      ) {
        const index = this.queue.shift()!;
        if (this.state.loaded.has(index) || this.loading.has(index)) continue;
        void this.loadFrame(index);
      }
      await new Promise((r) => setTimeout(r, 16));
    }

    // Wait for in-flight loads
    while (this.loading.size > 0 && !this.destroyed) {
      await new Promise((r) => setTimeout(r, 32));
    }

    if (!this.destroyed) {
      this.state.isReady = this.state.loaded.size > 0;
      this.emitProgress();
    }
  }

  private loadFrame(index: number): Promise<void> {
    if (this.state.loaded.has(index) || this.state.failed.has(index)) {
      return Promise.resolve();
    }

    this.loading.add(index);
    const url = getFrameUrl(this.config.basePath, index);

    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";

      const finish = (ok: boolean) => {
        this.loading.delete(index);
        if (ok) {
          this.state.loaded.add(index);
          this.state.images.set(index, img);
        } else {
          this.state.failed.add(index);
        }
        this.emitProgress();
        resolve();
      };

      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = url;
    });
  }

  private emitProgress(): void {
    const { frameCount } = this.config;
    this.state.progress = this.state.loaded.size / frameCount;
    this.onProgress?.(this.state.progress);
  }

  destroy(): void {
    this.destroyed = true;
    this.queue = [];
    this.state.images.clear();
    this.state.loaded.clear();
  }
}
