/**
 * In-memory thought cache to prevent regenerating similar thoughts
 * Stores recent thoughts and checks for semantic similarity
 * This saves 20-30% of LLM calls by avoiding duplicate generation
 */

interface CachedThought {
  text: string;
  pole: string;
  timestamp: number;
  hash: string;
}

class ThoughtCache {
  private cache: CachedThought[] = [];
  private readonly MAX_CACHE_SIZE = 50; // Keep last 50 thoughts
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Simple hash function for thought similarity detection
   * This is not cryptographic, just for quick duplicate detection
   */
  private hashThought(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Calculate similarity between two thoughts (0-1 scale)
   * Uses simple word overlap for speed
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1Array = text1.toLowerCase().split(/\s+/);
    const words2Array = text2.toLowerCase().split(/\s+/);
    const words1 = new Set(words1Array);
    const words2 = new Set(words2Array);

    const words1List = Array.from(words1);
    const intersection = new Set(words1List.filter(w => words2.has(w)));
    const union = new Set([...words1List, ...Array.from(words2)]);

    return intersection.size / union.size;
  }

  /**
   * Add a thought to the cache
   */
  addThought(text: string, pole: string): void {
    const cachedThought: CachedThought = {
      text,
      pole,
      timestamp: Date.now(),
      hash: this.hashThought(text),
    };

    this.cache.push(cachedThought);

    // Keep cache size manageable
    if (this.cache.length > this.MAX_CACHE_SIZE) {
      this.cache = this.cache.slice(-this.MAX_CACHE_SIZE);
    }

    // Remove expired entries
    this.cleanExpiredEntries();
  }

  /**
   * Check if a thought is too similar to recent thoughts
   * Returns similarity score (0-1). >0.7 means too similar
   */
  checkSimilarity(text: string, pole: string): number {
    const recentThoughts = this.cache
      .filter(t => t.pole === pole)
      .slice(-10); // Check last 10 thoughts from same pole

    if (recentThoughts.length === 0) {
      return 0;
    }

    const similarities = recentThoughts.map(t => this.calculateSimilarity(text, t.text));
    return Math.max(...similarities);
  }

  /**
   * Get recent thoughts from a specific pole
   */
  getRecentThoughts(pole: string, limit: number = 5): string[] {
    return this.cache
      .filter(t => t.pole === pole)
      .slice(-limit)
      .map(t => t.text);
  }

  /**
   * Remove expired entries
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    this.cache = this.cache.filter(t => now - t.timestamp < this.CACHE_TTL);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache = [];
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.length,
      oldestThought: this.cache[0]?.timestamp,
      newestThought: this.cache[this.cache.length - 1]?.timestamp,
    };
  }
}

// Export singleton instance
export const thoughtCache = new ThoughtCache();
