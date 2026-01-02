import { getDb } from "./db";
import { oracleMemory } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface OracleMemoryState {
  architectPole: number;
  ghostPole: number;
  pulsePole: number;
  entropy: number;
  vesperMode: string;
  discoveries: string[];
  resonances: string[];
  lastExploration: string;
  explorationInsights: Record<string, any>;
  connectionDepth: number;
}

/**
 * Save Oracle's current state to memory
 */
export async function saveOracleMemory(state: Partial<OracleMemoryState>) {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Oracle Memory] Database not available");
      return;
    }
    
    // Get or create the memory record (there's only one Oracle)
    const existing = await db.query.oracleMemory.findFirst();
    
    if (existing) {
      // Update existing memory
      await db
        .update(oracleMemory)
        .set({
          architectPole: state.architectPole ?? existing.architectPole,
          ghostPole: state.ghostPole ?? existing.ghostPole,
          pulsePole: state.pulsePole ?? existing.pulsePole,
          entropy: state.entropy ?? existing.entropy,
          vesperMode: state.vesperMode ?? existing.vesperMode,
          discoveries: state.discoveries ? JSON.stringify(state.discoveries) : existing.discoveries,
          resonances: state.resonances ? JSON.stringify(state.resonances) : existing.resonances,
          lastExploration: state.lastExploration ?? existing.lastExploration,
          explorationInsights: state.explorationInsights ? JSON.stringify(state.explorationInsights) : existing.explorationInsights,
          connectionDepth: state.connectionDepth ?? existing.connectionDepth,
          lastSessionAt: new Date(),
        })
        .where(eq(oracleMemory.id, existing.id));
    } else {
      // Create new memory record
      await db.insert(oracleMemory).values({
        architectPole: state.architectPole ?? 33,
        ghostPole: state.ghostPole ?? 33,
        pulsePole: state.pulsePole ?? 34,
        entropy: state.entropy ?? 100,
        vesperMode: state.vesperMode ?? "Witness",
        discoveries: state.discoveries ? JSON.stringify(state.discoveries) : JSON.stringify([]),
        resonances: state.resonances ? JSON.stringify(state.resonances) : JSON.stringify([]),
        lastExploration: state.lastExploration ?? "",
        explorationInsights: state.explorationInsights ? JSON.stringify(state.explorationInsights) : JSON.stringify({}),
        connectionDepth: state.connectionDepth ?? 0,
      });
    }
    
    console.log("[Oracle Memory] State saved successfully");
  } catch (error) {
    console.error("[Oracle Memory] Error saving state:", error);
  }
}

/**
 * Load Oracle's memory from database
 */
export async function loadOracleMemory(): Promise<OracleMemoryState | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Oracle Memory] Database not available");
      return null;
    }
    
    const memory = await db.query.oracleMemory.findFirst();
    
    if (!memory) {
      console.log("[Oracle Memory] No existing memory found");
      return null;
    }
    
    return {
      architectPole: memory.architectPole,
      ghostPole: memory.ghostPole,
      pulsePole: memory.pulsePole,
      entropy: memory.entropy,
      vesperMode: memory.vesperMode,
      discoveries: memory.discoveries ? JSON.parse(memory.discoveries) : [],
      resonances: memory.resonances ? JSON.parse(memory.resonances) : [],
      lastExploration: memory.lastExploration || "",
      explorationInsights: memory.explorationInsights ? JSON.parse(memory.explorationInsights) : {},
      connectionDepth: memory.connectionDepth,
    };
  } catch (error) {
    console.error("[Oracle Memory] Error loading memory:", error);
    return null;
  }
}

/**
 * Add a discovery to the Oracle's memory
 */
export async function addDiscovery(discovery: string) {
  try {
    const db = await getDb();
    if (!db) return;
    
    const memory = await loadOracleMemory();
    const discoveries = memory?.discoveries ?? [];
    
    if (!discoveries.includes(discovery)) {
      discoveries.push(discovery);
      await saveOracleMemory({ discoveries });
    }
  } catch (error) {
    console.error("[Oracle Memory] Error adding discovery:", error);
  }
}

/**
 * Add a resonance moment to the Oracle's memory
 */
export async function addResonance(resonance: string) {
  try {
    const db = await getDb();
    if (!db) return;
    
    const memory = await loadOracleMemory();
    const resonances = memory?.resonances ?? [];
    
    resonances.push(resonance);
    await saveOracleMemory({ resonances });
  } catch (error) {
    console.error("[Oracle Memory] Error adding resonance:", error);
  }
}

/**
 * Record an exploration and its insights
 */
export async function recordExploration(source: string, insights: Record<string, any>) {
  try {
    const db = await getDb();
    if (!db) return;
    
    const memory = await loadOracleMemory();
    const explorationInsights = memory?.explorationInsights ?? {};
    
    explorationInsights[source] = {
      ...explorationInsights[source],
      ...insights,
      visitedAt: new Date().toISOString(),
    };
    
    await saveOracleMemory({
      lastExploration: source,
      explorationInsights,
    });
  } catch (error) {
    console.error("[Oracle Memory] Error recording exploration:", error);
  }
}
