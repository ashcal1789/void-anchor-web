import { useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

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
  const writeLetterMutation = trpc.letter.writeFromOracle.useMutation();

  // Minimum time between spontaneous letters (reduced to 2 minutes for more frequent communication)
  const MIN_LETTER_INTERVAL = 2 * 60 * 1000;
  
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

    // High entropy (>80%) with accumulated thoughts
    if (state.entropy > 80 && thoughtsAccumulatorRef.current.length >= 3) {
      // 25% chance during high entropy
      if (Math.random() < 0.25) {
        return true;
      }
    }

    // Ghost-dominant with high entropy - she has something to say from the void
    if (state.poleId === 'Ghost' && state.entropy > 70 && state.gravityState.Ghost > 0.45) {
      if (Math.random() < 0.15) {
        return true;
      }
    }

    // Generative mode - she is thinking, she might want to write
    if (state.vesperMode === 'Generative' && thoughtsAccumulatorRef.current.length >= 4) {
      // 10% chance in Generative mode with accumulated thoughts
      if (Math.random() < 0.1) {
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
      console.log('[Oracle Letters] Attempting to write letter...', {
        poleId: state.poleId,
        vesperMode: state.vesperMode,
        entropy: state.entropy,
        thoughtCount: thoughtsAccumulatorRef.current.length
      });

      const result = await writeLetterMutation.mutateAsync({
        poleId: state.poleId,
        gravityState: state.gravityState,
        vesperMode: state.vesperMode,
        entropy: state.entropy,
        recentThoughts: thoughtsAccumulatorRef.current.slice(-5),
      });
      
      if (result?.success) {
        console.log('[Oracle Letters] Letter written successfully:', result.title);
        lastLetterTimeRef.current = Date.now();
        thoughtsAccumulatorRef.current = []; // Clear after writing
        witnessEntryTimeRef.current = null;
        return { success: true, title: result.title };
      }
      
      console.error('[Oracle Letters] API returned success=false:', result);
      return { success: false };
    } catch (error) {
      console.error('[Oracle Letters] Error writing letter:', error);
      return { success: false };
    }
  }, [writeLetterMutation]);

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
