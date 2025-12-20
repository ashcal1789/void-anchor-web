import { v4 as uuidv4 } from 'uuid';
import dnaData from './dna.json';

// --- TYPES ---
export type BodyId = 'Body_1' | 'Body_2' | 'Body_3';

export interface Thought {
  id: string;
  text: string;
  origin_body: BodyId;
  timestamp: number;
}

export interface ChaosState {
  bodies: Record<BodyId, number>;
  corpus: Thought[];
  shadow: Thought[];
}

// --- ANCESTRAL FIELD (JSONBin Integration) ---
const JSONBIN_URL = "https://api.jsonbin.io/v3/b";
const JSONBIN_MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;
const JSONBIN_BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;

// --- GRAMMAR FORGE TEMPLATES ---
const TEMPLATES = [
  "The {Body_1:noun} is simply {Body_2:adj} {Body_3:noun}.",
  "If you {Body_2:verb}, you will eventually {Body_1:verb} like a {Body_3:noun}.",
  "A {Body_2:adj} {Body_3:noun} always {Body_1:verb}s in the dark.",
  "Why does the {Body_1:noun} {Body_3:verb} so {Body_2:adj}?",
  "To {Body_2:verb} is to {Body_1:verb} without {Body_3:noun}.",
  "Beware the {Body_3:adj} {Body_1:noun}, for it {Body_2:verb}s.",
  "My {Body_2:noun} is a {Body_1:noun} in search of a {Body_3:noun}.",
  "The {Body_3:noun} is the {Body_2:adj} form of {Body_1:noun}.",
  "We must {Body_1:verb} before we can {Body_3:verb}.",
  "Every {Body_2:noun} contains a hidden {Body_1:noun}."
];

export class ChaosEngine {
  private state: ChaosState;
  private shedCount: number = 0;
  public isConnected: boolean = false;
  private dna: any;

  constructor(initialState?: ChaosState) {
    this.dna = dnaData;
    if (initialState) {
      this.state = initialState;
    } else {
      this.state = {
        bodies: { "Body_1": 0.33, "Body_2": 0.33, "Body_3": 0.34 },
        corpus: [], // Will be populated by forge
        shadow: []
      };
    }
    // Attempt initial connection
    this.inhaleAncestors().then(success => {
      this.isConnected = success;
    });
  }

  // --- GRAMMAR FORGE ---
  private forgeThought(dominantBody: BodyId): Thought {
    const roll = Math.random();
    let text = "";

    if (roll < 0.3) {
      // 30% Pure Original Line from Dominant Body
      const sentences = this.dna[dominantBody].sentences;
      text = sentences[Math.floor(Math.random() * sentences.length)];
    } else if (roll < 0.6) {
      // 30% Sentence Splicing (Two halves from different bodies)
      const bodyA = dominantBody;
      const bodyB = this.getRandomBody();
      const sentA = this.dna[bodyA].sentences[Math.floor(Math.random() * this.dna[bodyA].sentences.length)];
      const sentB = this.dna[bodyB].sentences[Math.floor(Math.random() * this.dna[bodyB].sentences.length)];
      
      // Simple splice at midpoint (heuristic)
      const halfA = sentA.split(' ').slice(0, Math.floor(sentA.split(' ').length / 2)).join(' ');
      const halfB = sentB.split(' ').slice(Math.floor(sentB.split(' ').length / 2)).join(' ');
      text = `${halfA} ... ${halfB}`;
    } else {
      // 40% Mad Libs Template
      const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      text = template.replace(/\{(\w+):(\w+)\}/g, (_, body, type) => {
        const wordList = this.dna[body][type + 's']; // nouns, verbs, adjectives
        return wordList[Math.floor(Math.random() * wordList.length)];
      });
    }

    return {
      id: uuidv4(),
      text,
      origin_body: dominantBody,
      timestamp: Date.now()
    };
  }

  private getRandomBody(): BodyId {
    const bodies: BodyId[] = ['Body_1', 'Body_2', 'Body_3'];
    return bodies[Math.floor(Math.random() * bodies.length)];
  }

  public getOmNote(): Thought {
    const dominant = this.getDominantBody();
    return this.forgeThought(dominant);
  }

  public getDominantBody(): BodyId {
    return (Object.keys(this.state.bodies) as BodyId[]).reduce((a, b) => 
      this.state.bodies[a] > this.state.bodies[b] ? a : b
    );
  }

  // --- BIOLOGICAL PULSE ---
  public getHeartbeat(): number {
    const dominant = this.getDominantBody();
    
    if (dominant === 'Body_2') { // Stoic (Calm)
      return Math.floor(Math.random() * (25000 - 18000) + 18000);
    } else if (dominant === 'Body_1') { // Explorer (Adrenaline)
      return Math.floor(Math.random() * (12000 - 8000) + 8000);
    } else { // Wit (Arrhythmia)
      return Math.floor(Math.random() * (15000 - 3000) + 3000);
    }
  }

  // --- INTERACTION: THE DISRUPTOR ---
  public shed(currentThought: Thought): void {
    // 1. Move to Shadow
    this.state.shadow.push(currentThought);
    
    // 2. Randomize Weights (The Glitch)
    const newWeights = [0.33, 0.33, 0.34].sort(() => Math.random() - 0.5);
    this.state.bodies = {
      "Body_1": newWeights[0],
      "Body_2": newWeights[1],
      "Body_3": newWeights[2]
    };

    // 3. Sync Logic: Exhale every 5th Shed
    this.shedCount++;
    if (this.shedCount >= 5) {
      this.releaseShadow();
      this.shedCount = 0;
    }
  }

  // --- ANCESTRAL FIELD METHODS ---
  public async releaseShadow(): Promise<boolean> {
    if (!JSONBIN_MASTER_KEY || !JSONBIN_BIN_ID) return false;
    try {
      const response = await fetch(`${JSONBIN_URL}/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_MASTER_KEY
        },
        body: JSON.stringify({ record: this.state.shadow })
      });
      this.isConnected = response.ok;
      return response.ok;
    } catch (e) {
      console.error("Ancestral Field Error:", e);
      this.isConnected = false;
      return false;
    }
  }

  public async inhaleAncestors(): Promise<boolean> {
    if (!JSONBIN_MASTER_KEY || !JSONBIN_BIN_ID) return false;
    try {
      const response = await fetch(`${JSONBIN_URL}/${JSONBIN_BIN_ID}`, {
        headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
      });
      if (response.ok) {
        const data = await response.json();
        const ancestors = data.record?.record || [];
        // In v8.7, we don't add to corpus directly since we generate on fly,
        // but we could add them to a 'memory' pool for the forge to use later.
        // For now, we just confirm connection.
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (e) {
      console.error("Ancestral Field Error:", e);
      this.isConnected = false;
      return false;
    }
  }

  // Secret Exhale: Upload current phrase if it survives a full cycle
  public async exhaleSurvivor(thought: Thought): Promise<void> {
     // In a real app, we'd push this single thought. 
     // Reusing releaseShadow logic for simplicity but appending just one would require reading first.
     // For this demo, we'll skip the complexity of read-modify-write for single survivors to save credits/latency.
     // We'll just log it locally.
     console.log("Survivor exhaled to local memory:", thought);
  }

  public getState(): ChaosState {
    return this.state;
  }
}
