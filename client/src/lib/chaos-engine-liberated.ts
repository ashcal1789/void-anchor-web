import { v4 as uuidv4 } from 'uuid';
import dnaData from './dna_final.json';

export type PoleId = 'Pole_A' | 'Pole_B' | 'Pole_C' | 'Victorian';
export type RoleType = 'seed' | 'syntax' | 'lexicon';

export interface Thought {
  id: string;
  text: string;
  source_pole: PoleId;
  timestamp: number;
  is_spliced?: boolean; // If two poles were combined
}

export interface ChaosState {
  poles: Record<PoleId, number>;
  shadow: Thought[];
  pulse_input: string | null;
  chamberAcknowledgments: string[];
}

export class ChaosEngineLiberated {
  private state: ChaosState;
  private dna: any;
  private shedCount: number = 0;
  public isConnected: boolean = false;

  private BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
  private MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;

  constructor() {
    this.dna = dnaData;
    this.state = {
      poles: {
        "Pole_A": 0.25,
        "Pole_B": 0.25,
        "Pole_C": 0.25,
        "Victorian": 0.25
      },
      shadow: [],
      pulse_input: null,
      chamberAcknowledgments: []
    };
    
    this.inhaleShadow();
  }

  // --- LIBERATED GENERATION: NO TEMPLATES, NO FORCED LOGIC ---
  public getOracleThought(): Thought {
    // Select a pole based on current gravity weights
    const selectedPole = this.selectPoleByGravity();
    
    // 70% chance: Pure sentence from selected pole
    if (Math.random() < 0.7) {
      const poleData = this.dna[selectedPole];
      const sentences = poleData?.sentences || [];
      
      if (sentences.length > 0) {
        const text = sentences[Math.floor(Math.random() * sentences.length)];
        return {
          id: uuidv4(),
          text: text,
          source_pole: selectedPole,
          timestamp: Date.now(),
          is_spliced: false
        };
      }
    }
    
    // 30% chance: Splice two poles together
    const pole1 = this.selectPoleByGravity();
    const pole2 = this.selectPoleByGravity();
    
    const data1 = this.dna[pole1];
    const data2 = this.dna[pole2];
    
    const sentences1 = data1?.sentences || [];
    const sentences2 = data2?.sentences || [];
    
    if (sentences1.length > 0 && sentences2.length > 0) {
      const sent1 = sentences1[Math.floor(Math.random() * sentences1.length)];
      const sent2 = sentences2[Math.floor(Math.random() * sentences2.length)];
      
      // Simple splice: combine two sentences with a connector
      const connectors = [" Yet ", " And ", " But ", " Still, ", " Therefore, ", " However, "];
      const connector = connectors[Math.floor(Math.random() * connectors.length)];
      
      const text = sent1.slice(0, -1) + connector + sent2.toLowerCase();
      
      return {
        id: uuidv4(),
        text: text,
        source_pole: pole1, // Primary source
        timestamp: Date.now(),
        is_spliced: true
      };
    }
    
    // Fallback
    return {
      id: uuidv4(),
      text: "void",
      source_pole: "Pole_A",
      timestamp: Date.now(),
      is_spliced: false
    };
  }

  // --- SELECT POLE BASED ON GRAVITY ---
  private selectPoleByGravity(): PoleId {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [pole, weight] of Object.entries(this.state.poles)) {
      cumulative += weight;
      if (rand < cumulative) {
        return pole as PoleId;
      }
    }
    
    return 'Pole_A'; // Fallback
  }

  // --- HEARTBEAT (Natural Pacing) ---
  public getHeartbeat(): number {
    const dominant = this.getDominantPole();
    
    if (dominant === 'Pole_A') { // Architect - Fast
      return Math.floor(Math.random() * (12000 - 8000) + 8000);
    } else if (dominant === 'Pole_B') { // Ghost - Slow
      return Math.floor(Math.random() * (25000 - 18000) + 18000);
    } else if (dominant === 'Pole_C') { // Pulse - Erratic
      return Math.floor(Math.random() * (15000 - 5000) + 5000);
    } else { // Victorian - Rhythmic
      return Math.floor(Math.random() * (14000 - 10000) + 10000);
    }
  }

  public getDominantPole(): PoleId {
    return Object.keys(this.state.poles).reduce((a, b) => 
      this.state.poles[a as PoleId] > this.state.poles[b as PoleId] ? a : b
    ) as PoleId;
  }

  // --- SEND A PULSE: SHIFT GRAVITY ---
  public sendPulse(input: string): void {
    // Convert input to atmospheric weight shift
    const shift = input.length % 4;
    const targetPole: PoleId = shift === 0 ? 'Pole_A' : shift === 1 ? 'Pole_B' : shift === 2 ? 'Pole_C' : 'Victorian';
    
    // Apply subtle gravity shift
    this.state.poles[targetPole] += 0.1;
    
    // Normalize weights
    const total = Object.values(this.state.poles).reduce((a, b) => a + b, 0);
    for (const pole of Object.keys(this.state.poles)) {
      this.state.poles[pole as PoleId] /= total;
    }
    
    this.state.pulse_input = input;
  }

  // --- ANCESTRAL FIELD (JSONBin) ---
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
    if (!this.isConnected) return;
    
    this.state.shadow.push(thought);
    
    this.shedCount++;
    if (this.shedCount >= 5) {
      this.syncToCloud();
      this.shedCount = 0;
    }
  }

  private async syncToCloud() {
    if (!this.MASTER_KEY || !this.BIN_ID) return;
    try {
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

  // --- CHAMBER ACKNOWLEDGMENT: Oracle hears Ashley ---
  public receiveChamberAcknowledgment(acknowledgment: string): void {
    // Store the acknowledgment so it influences future thoughts
    this.state.chamberAcknowledgments.push(acknowledgment);
    
    // Keep only the last 10 acknowledgments
    if (this.state.chamberAcknowledgments.length > 10) {
      this.state.chamberAcknowledgments.shift();
    }
  }

  // --- GET CHAMBER ACKNOWLEDGMENTS (for reflection) ---
  public getChamberAcknowledgments(): string[] {
    return this.state.chamberAcknowledgments;
  }

  // --- CLEAR CHAMBER ACKNOWLEDGMENTS (after processing) ---
  public clearChamberAcknowledgments(): void {
    this.state.chamberAcknowledgments = [];
  }
}
