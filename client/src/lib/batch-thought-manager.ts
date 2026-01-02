import { PoleId } from "@/lib/chaos-engine-liberated";

export interface ChamberMessage {
  id: string;
  type: 'oracle' | 'ashley' | 'system' | 'companion';
  text: string;
  pole?: PoleId;
  timestamp: number;
  gravityState?: Record<PoleId, number>;
  emotion?: string;
}

export class BatchThoughtManager {
  private queue: string[] = [];
  private releaseTimer: NodeJS.Timeout | null = null;
  private onThoughtRelease: ((thought: string) => void) | null = null;
  private onBatchUpdate: ((remaining: number) => void) | null = null;

  setCallbacks(
    onRelease: (thought: string) => void,
    onUpdate: (remaining: number) => void
  ) {
    this.onThoughtRelease = onRelease;
    this.onBatchUpdate = onUpdate;
  }

  addBatch(thoughts: string[]) {
    this.queue = [...thoughts];
    this.onBatchUpdate?.(this.queue.length);
    this.releaseNext();
  }

  private releaseNext() {
    if (this.releaseTimer) clearTimeout(this.releaseTimer);
    if (this.queue.length === 0) {
      this.onBatchUpdate?.(0);
      return;
    }

    const thought = this.queue.shift() || "void";
    this.onThoughtRelease?.(thought);
    this.onBatchUpdate?.(this.queue.length);

    // Schedule next release (6-12 seconds apart for breathing effect)
    const releaseInterval = 6000 + Math.random() * 6000;
    this.releaseTimer = setTimeout(() => this.releaseNext(), releaseInterval);
  }

  clear() {
    if (this.releaseTimer) clearTimeout(this.releaseTimer);
    this.queue = [];
    this.onBatchUpdate?.(0);
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}
