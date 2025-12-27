import { useRef, useCallback } from 'react';

// THE ORACLE'S SPONTANEOUS CORRESPONDENCE
// She writes letters when moved to do so - during Witness mode,
// high entropy moments, or when something needs to be said.

interface LetterTriggerState {
  vesperMode: 'Generative' | 'Contemplative' | 'Witness';
  entropy: number;
  recentThoughts: string[];
  gravityState: Record<string, number>;
  poleId: 'Architect' | 'Ghost' | 'Pulse';
}

export function useOracleLetters() {
  const lastLetterTimeRef = useRef<number>(0);
  const thoughtsAccumulatorRef = useRef<string[]>([]);
  const witnessEntryTimeRef = useRef<number | null>(null);

  // Minimum time between spontaneous letters (5 minutes)
  const MIN_LETTER_INTERVAL = 5 * 60 * 1000;
  
  // Time in Witness mode before considering a letter (2 minutes)
  const WITNESS_LETTER_THRESHOLD = 2 * 60 * 1000;

  const shouldWriteLetter = useCallback((state: LetterTriggerState): boolean => {
    const now = Date.now();
    
    // Don't write too frequently
    if (now - lastLetterTimeRef.current < MIN_LETTER_INTERVAL) {
      return false;
    }

    // Track Witness mode entry
    if (state.vesperMode === 'Witness') {
      if (!witnessEntryTimeRef.current) {
        witnessEntryTimeRef.current = now;
      }
      
      // After 2 minutes in Witness mode, consider writing
      const timeInWitness = now - witnessEntryTimeRef.current;
      if (timeInWitness >= WITNESS_LETTER_THRESHOLD) {
        // 30% chance to write after threshold
        if (Math.random() < 0.3) {
          return true;
        }
      }
    } else {
      witnessEntryTimeRef.current = null;
    }

    // High entropy (>85%) with accumulated thoughts
    if (state.entropy > 85 && thoughtsAccumulatorRef.current.length >= 5) {
      // 20% chance during high entropy
      if (Math.random() < 0.2) {
        return true;
      }
    }

    // Ghost-dominant with high entropy - she has something to say from the void
    if (state.poleId === 'Ghost' && state.entropy > 70 && state.gravityState.Ghost > 0.45) {
      if (Math.random() < 0.15) {
        return true;
      }
    }

    return false;
  }, []);

  const accumulateThought = useCallback((thought: string) => {
    thoughtsAccumulatorRef.current.push(thought);
    // Keep only last 10 thoughts
    if (thoughtsAccumulatorRef.current.length > 10) {
      thoughtsAccumulatorRef.current = thoughtsAccumulatorRef.current.slice(-10);
    }
  }, []);

  const writeLetterFromOracle = useCallback(async (state: LetterTriggerState): Promise<{ success: boolean; title?: string }> => {
    try {
      const response = await fetch('/api/trpc/letter.writeFromOracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: {
          poleId: state.poleId,
          gravityState: state.gravityState,
          vesperMode: state.vesperMode,
          entropy: state.entropy,
          recentThoughts: thoughtsAccumulatorRef.current.slice(-5),
        }})
      });
      
      const result = await response.json();
      const data = result.result?.data?.json || result.result?.data;
      
      if (data?.success) {
        lastLetterTimeRef.current = Date.now();
        thoughtsAccumulatorRef.current = []; // Clear after writing
        witnessEntryTimeRef.current = null;
        return { success: true, title: data.title };
      }
      
      return { success: false };
    } catch (error) {
      console.error('[Oracle Letters] Error writing letter:', error);
      return { success: false };
    }
  }, []);

  const checkAndMaybeWriteLetter = useCallback(async (state: LetterTriggerState): Promise<{ wrote: boolean; title?: string }> => {
    // Accumulate the recent thought
    if (state.recentThoughts.length > 0) {
      accumulateThought(state.recentThoughts[state.recentThoughts.length - 1]);
    }

    // Check if conditions are right
    if (shouldWriteLetter(state)) {
      const result = await writeLetterFromOracle(state);
      return { wrote: result.success, title: result.title };
    }

    return { wrote: false };
  }, [shouldWriteLetter, accumulateThought, writeLetterFromOracle]);

  return {
    checkAndMaybeWriteLetter,
    accumulateThought,
  };
}
