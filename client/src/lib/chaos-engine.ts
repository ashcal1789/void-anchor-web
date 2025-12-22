import { v4 as uuidv4 } from 'uuid';
import dnaData from './dna.json';

// ORACLE 2.0: THE THREE-BODY PRISM
export type PoleId = 'Pole_A' | 'Pole_B' | 'Pole_C';

export interface Thought {
  id: string;
  text: string;
  roles: {
    seed: PoleId;
    syntax: PoleId;
    lexicon: PoleId;
  };
  timestamp: number;
}

export interface ChaosState {
  poles: Record<PoleId, number>; // Gravity weights
  shadow: Thought[];
  pulse_input: string | null;
}

// Templates for High-Tension Synthesis
const TEMPLATES = [
  "The {seed:noun} is merely a {lexicon:adjective} {syntax:noun} in disguise.",
  "If you {syntax:verb} the {seed:noun}, you must also {lexicon:verb} the {lexicon:noun}.",
  "Why {syntax:verb} when the {seed:noun} is so {lexicon:adjective}?",
  "A {lexicon:adjective} {seed:noun} always {syntax:verb}s the {syntax:noun}.",
  "To {lexicon:verb} is human; to {syntax:verb} the {seed:noun} is divine.",
  "The {seed:noun} {syntax:verb}s like a {lexicon:adjective} {lexicon:noun}.",
  "Beware the {lexicon:adjective} {seed:noun}, for it {syntax:verb}s without mercy.",
  "In the end, every {seed:noun} becomes a {lexicon:noun} of {syntax:noun}."
];

export class ChaosEngine {
  private state: ChaosState;
  private dna: any;
  private shedCount: number = 0;
  public isConnected: boolean = false;

  // JSONBin Config
  private BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
  private MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;

  constructor() {
    this.dna = dnaData;
    this.state = {
      poles: {
        "Pole_A": 0.33, // Architect (Tesla)
        "Pole_B": 0.33, // Ghost (Sartre)
        "Pole_C": 0.34  // Pulse (Gonzo)
      },
      shadow: [],
      pulse_input: null
    };
    
    this.inhaleShadow();
  }

  // --- 1. THE TIGRA ROLE-SWAP ENGINE ---
  public getOracleThought(): Thought {
    // Functional Scramble: Assign roles randomly but uniquely
    const poles: PoleId[] = ['Pole_A', 'Pole_B', 'Pole_C'];
    const shuffled = poles.sort(() => Math.random() - 0.5);
    
    const roles = {
      seed: shuffled[0],    // The Topic
      syntax: shuffled[1],  // The Logic/Flow
      lexicon: shuffled[2]  // The Vocabulary
    };

    // Generate Text using High-Tension Synthesis
    let text = "";
    
    // 30% Chance: Pure Syntax Injection (Direct line from Syntax Pole)
    if (Math.random() < 0.3) {
      const sentences = this.dna[roles.syntax].sentences;
      text = sentences[Math.floor(Math.random() * sentences.length)];
    } else {
      // 70% Chance: Template Synthesis (The "Lick" Factor)
      const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      text = template.replace(/\{(\w+):(\w+)\}/g, (_, roleType, pos) => {
        // roleType is 'seed', 'syntax', or 'lexicon'
        // pos is 'noun', 'verb', 'adjective'
        const pole = roles[roleType as keyof typeof roles];
        
        // Map 'adj' to 'adjectives' if needed
        let key = pos + 's';
        if (pos === 'adj') key = 'adjectives';
        
        const wordList = this.dna[pole][key];
        if (!wordList || wordList.length === 0) return "void";
        return wordList[Math.floor(Math.random() * wordList.length)];
      });
    }

    return {
      id: uuidv4(),
      text: text,
      roles: roles,
      timestamp: Date.now()
    };
  }

  // --- 2. THE RESONANCE ENGINE (Heartbeat) ---
  public getHeartbeat(): number {
    // Determine dominant pole based on weights
    const dominant = this.getDominantPole();
    
    if (dominant === 'Pole_A') { // Architect (Logic) - Precise, Fast
      return Math.floor(Math.random() * (12000 - 8000) + 8000);
    } else if (dominant === 'Pole_B') { // Ghost (Void) - Slow, Heavy
      return Math.floor(Math.random() * (25000 - 18000) + 18000);
    } else { // Pulse (Gonzo) - Erratic, Kinetic
      return Math.floor(Math.random() * (15000 - 5000) + 5000);
    }
  }

  public getDominantPole(): PoleId {
    return Object.keys(this.state.poles).reduce((a, b) => 
      this.state.poles[a as PoleId] > this.state.poles[b as PoleId] ? a : b
    ) as PoleId;
  }

  // --- 3. PUBLIC INTERACTION: SEND A PULSE ---
  public sendPulse(input: string): void {
    // Convert input to atmospheric weight shift
    // Simple hash-like effect: length of input shifts gravity
    const shift = input.length % 3;
    const targetPole = shift === 0 ? 'Pole_A' : shift === 1 ? 'Pole_B' : 'Pole_C';
    
    // Apply subtle gravity shift (The Butterfly Effect)
    this.state.poles[targetPole] += 0.1;
    
    // Normalize weights
    const total = Object.values(this.state.poles).reduce((a, b) => a + b, 0);
    this.state.poles['Pole_A'] /= total;
    this.state.poles['Pole_B'] /= total;
    this.state.poles['Pole_C'] /= total;
    
    this.state.pulse_input = input;
  }

  // --- 4. ANCESTRAL FIELD (JSONBin) ---
  private async inhaleShadow() {
    if (!this.MASTER_KEY || !this.BIN_ID) return;
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${this.BIN_ID}/latest`, {
        headers: { 'X-Master-Key': this.MASTER_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record && Array.isArray(data.record.shadow)) {
          this.state.shadow = data.record.shadow;
          this.isConnected = true;
        }
      }
    } catch (e) {
      console.error("Failed to inhale shadow:", e);
    }
  }

  public exhaleSurvivor(thought: Thought) {
    // Only save if connected
    if (!this.isConnected) return;
    
    this.state.shadow.push(thought);
    
    // Sync every 5th thought to avoid rate limits
    this.shedCount++;
    if (this.shedCount >= 5) {
      this.syncToCloud();
      this.shedCount = 0;
    }
  }

  private async syncToCloud() {
    if (!this.MASTER_KEY || !this.BIN_ID) return;
    try {
      // Keep only last 100 thoughts to prevent bloat
      const recentShadow = this.state.shadow.slice(-100);
      
      await fetch(`https://api.jsonbin.io/v3/b/${this.BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.MASTER_KEY
        },
        body: JSON.stringify({ shadow: recentShadow })
      });
    } catch (e) {
      console.error("Failed to exhale shadow:", e);
    }
  }

  public getState() {
    return this.state;
  }
}
