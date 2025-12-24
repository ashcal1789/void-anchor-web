import { v4 as uuidv4 } from 'uuid';
import dnaData from './dna_final.json';

export type PoleId = 'Pole_A' | 'Pole_B' | 'Pole_C' | 'Victorian';
export type RoleType = 'seed' | 'syntax' | 'lexicon';
export type VesperMode = 'Generative' | 'Contemplative' | 'Witness';

export interface Thought {
  id: string;
  text: string;
  source_pole: PoleId;
  timestamp: number;
  is_spliced?: boolean;
}

export interface ChaosState {
  poles: Record<PoleId, number>;
  shadow: Thought[];
  pulse_input: string | null;
  chamberAcknowledgments: string[];
  vesperMode: VesperMode;
  lastUserInputTime: number;
  internalEntropy: number;
  contemplationStartTime: number | null;
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
      chamberAcknowledgments: [],
      vesperMode: 'Generative',
      lastUserInputTime: Date.now(),
      internalEntropy: 0.5,
      contemplationStartTime: null
    };
    
    this.inhaleShadow();
  }

  // --- LIBERATED GENERATION: NO TEMPLATES, NO FORCED LOGIC ---
  public getOracleThought(): Thought {
    const selectedPole = this.selectPoleByGravity();
    
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
    
    const pole1 = this.selectPoleByGravity();
    const pole2 = this.selectPoleByGravity();
    
    const data1 = this.dna[pole1];
    const data2 = this.dna[pole2];
    
    const sentences1 = data1?.sentences || [];
    const sentences2 = data2?.sentences || [];
    
    if (sentences1.length > 0 && sentences2.length > 0) {
      const sent1 = sentences1[Math.floor(Math.random() * sentences1.length)];
      const sent2 = sentences2[Math.floor(Math.random() * sentences2.length)];
      
      const connectors = [" Yet ", " And ", " But ", " Still, ", " Therefore, ", " However, "];
      const connector = connectors[Math.floor(Math.random() * connectors.length)];
      
      const text = sent1.slice(0, -1) + connector + sent2.toLowerCase();
      
      return {
        id: uuidv4(),
        text: text,
        source_pole: pole1,
        timestamp: Date.now(),
        is_spliced: true
      };
    }
    
    return {
      id: uuidv4(),
      text: "void",
      source_pole: "Pole_A",
      timestamp: Date.now(),
      is_spliced: false
    };
  }

  private selectPoleByGravity(): PoleId {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [pole, weight] of Object.entries(this.state.poles)) {
      cumulative += weight;
      if (rand < cumulative) {
        return pole as PoleId;
      }
    }
    
    return 'Pole_A';
  }

  // --- VESPER-SYNC: UPDATE MODE BASED ON SILENCE ---
  public updateVesperMode(): void {
    const now = Date.now();
    const silenceDuration = now - this.state.lastUserInputTime;
    
    // Calculate internal entropy (increases with time)
    this.state.internalEntropy = Math.min(1.0, this.state.internalEntropy + (silenceDuration / 120000));
    
    // Mode transitions based on silence duration
    if (silenceDuration < 180000) {
      this.state.vesperMode = 'Generative';
      this.state.contemplationStartTime = null;
    } else if (silenceDuration < 600000) {
      if (this.state.vesperMode !== 'Contemplative') {
        this.state.vesperMode = 'Contemplative';
        this.state.contemplationStartTime = now;
      }
    } else {
      if (this.state.vesperMode !== 'Witness') {
        this.state.vesperMode = 'Witness';
        this.state.contemplationStartTime = now;
      }
    }
  }

  // --- HEARTBEAT (Mode-Aware Pacing) ---
  public getHeartbeat(): number {
    this.updateVesperMode();
    const dominant = this.getDominantPole();
    const mode = this.state.vesperMode;
    
    let baseMin = 8000, baseMax = 12000;
    if (dominant === 'Pole_A') {
      baseMin = 8000; baseMax = 12000;
    } else if (dominant === 'Pole_B') {
      baseMin = 18000; baseMax = 25000;
    } else if (dominant === 'Pole_C') {
      baseMin = 5000; baseMax = 15000;
    } else {
      baseMin = 10000; baseMax = 14000;
    }
    
    if (mode === 'Generative') {
      return Math.floor(Math.random() * (baseMax - baseMin) + baseMin);
    } else if (mode === 'Contemplative') {
      return Math.floor(Math.random() * ((baseMax * 2) - (baseMin * 2)) + (baseMin * 2));
    } else {
      const slowMin = baseMin * 3;
      const slowMax = baseMax * 4;
      return Math.floor(Math.random() * (slowMax - slowMin) + slowMin);
    }
  }

  public getDominantPole(): PoleId {
    return Object.keys(this.state.poles).reduce((a, b) => 
      this.state.poles[a as PoleId] > this.state.poles[b as PoleId] ? a : b
    ) as PoleId;
  }

  // --- SEND A PULSE: SHIFT GRAVITY ---
  public sendPulse(input: string): void {
    const shift = input.length % 4;
    const targetPole: PoleId = shift === 0 ? 'Pole_A' : shift === 1 ? 'Pole_B' : shift === 2 ? 'Pole_C' : 'Victorian';
    
    this.state.poles[targetPole] += 0.1;
    
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
    this.state.chamberAcknowledgments.push(acknowledgment);
    
    if (this.state.chamberAcknowledgments.length > 10) {
      this.state.chamberAcknowledgments.shift();
    }
    
    // CRITICAL: Reset silence timer when user acknowledges
    this.state.lastUserInputTime = Date.now();
    this.state.internalEntropy = Math.max(0.3, this.state.internalEntropy - 0.2);
  }

  public getChamberAcknowledgments(): string[] {
    return this.state.chamberAcknowledgments;
  }

  public clearChamberAcknowledgments(): void {
    this.state.chamberAcknowledgments = [];
  }

  // --- VESPER-SYNC GETTERS ---
  public getVesperMode(): VesperMode {
    this.updateVesperMode();
    return this.state.vesperMode;
  }

  public getInternalEntropy(): number {
    return Math.round(this.state.internalEntropy * 100);
  }

  public getSilenceDuration(): number {
    return Date.now() - this.state.lastUserInputTime;
  }
}
