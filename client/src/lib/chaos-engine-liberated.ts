import { v4 as uuidv4 } from 'uuid';
import dnaData from './dna_final.json';
import type { RuntimeEventInput } from "@shared/runtime-events";

// THE SOVEREIGN RESTORATION: Three-Body Conundrum
// Architect (Pole_A), Ghost (Pole_B), Pulse (Pole_C)
// Echo has been dissolved and redistributed
export type PoleId = 'Architect' | 'Ghost' | 'Pulse';
export type LegacyPoleId = 'Pole_A' | 'Pole_B' | 'Pole_C' | 'Victorian';
export type RoleType = 'seed' | 'syntax' | 'lexicon';
export type VesperMode = 'Generative' | 'Contemplative' | 'Witness';

// Mapping from legacy pole IDs to new names
const POLE_MAP: Record<LegacyPoleId, PoleId> = {
  'Pole_A': 'Architect',
  'Pole_B': 'Ghost',
  'Pole_C': 'Pulse',
  'Victorian': 'Architect' // Victorian content absorbed into Architect
};

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
  // LT GREY PROTOCOL: Track the dance
  shiftMomentum: Record<PoleId, number>; // Which direction each pole is moving
  lastShiftTime: number;
}

type RuntimeObserver = (event: RuntimeEventInput) => void;

type ChaosEngineOptions = {
  onRuntimeEvent?: RuntimeObserver;
};

export class ChaosEngineLiberated {
  private state: ChaosState;
  private dna: any;
  private shedCount: number = 0;
  public isConnected: boolean = false;
  private readonly runtimeObserver?: RuntimeObserver;

  private BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
  private MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;

  constructor(options: ChaosEngineOptions = {}) {
    this.runtimeObserver = options.onRuntimeEvent;
    this.dna = dnaData;
    this.state = {
      poles: {
        "Architect": 0.33,
        "Ghost": 0.33,
        "Pulse": 0.34
      },
      shadow: [],
      pulse_input: null,
      chamberAcknowledgments: [],
      vesperMode: 'Generative',
      lastUserInputTime: Date.now(),
      internalEntropy: 0.5,
      contemplationStartTime: null,
      // LT GREY PROTOCOL: Initialize the dance
      shiftMomentum: {
        "Architect": 0,
        "Ghost": 0,
        "Pulse": 0
      },
      lastShiftTime: Date.now()
    };
    
    this.emitRuntime("engine.initialized", "completed", {
      state: this.runtimeState(),
      jsonbinConfigured: Boolean(this.MASTER_KEY && this.BIN_ID),
    });
    this.inhaleShadow();
  }

  private runtimeState() {
    return {
      poles: { ...this.state.poles },
      vesperMode: this.state.vesperMode,
      internalEntropy: this.getInternalEntropy(),
      shadowCount: this.state.shadow.length,
      pulsePresent: Boolean(this.state.pulse_input),
    };
  }

  private emitRuntime(
    kind: string,
    status: RuntimeEventInput["status"],
    data: Record<string, unknown>
  ) {
    this.runtimeObserver?.({ origin: "client", kind, status, data });
  }

  private emitThought(thought: Thought, data: Record<string, unknown>) {
    this.emitRuntime("local.thought.selected", "completed", {
      ...data,
      thoughtId: thought.id,
      selectedPole: thought.source_pole,
      isSpliced: Boolean(thought.is_spliced),
      state: this.runtimeState(),
    });
    return thought;
  }

  // --- LT GREY PROTOCOL: ORGANIC SHIFTING ---
  // The poles are always in motion, like dancers trading instruments
  private performOrganicShift(): void {
    const now = Date.now();
    const timeSinceLastShift = now - this.state.lastShiftTime;
    
    // Shift every 30-60 seconds organically
    if (timeSinceLastShift < 30000) return;
    
    // Random small shifts - the dance is always happening
    const shiftAmount = 0.02 + (Math.random() * 0.05); // 2-7% shift
    const poles: PoleId[] = ['Architect', 'Ghost', 'Pulse'];
    
    // Pick two random poles to exchange weight
    const fromPole = poles[Math.floor(Math.random() * poles.length)];
    let toPole = poles[Math.floor(Math.random() * poles.length)];
    while (toPole === fromPole) {
      toPole = poles[Math.floor(Math.random() * poles.length)];
    }
    
    // Only shift if it won't make any pole too dominant or too weak
    const before = { ...this.state.poles };
    const newFromWeight = this.state.poles[fromPole] - shiftAmount;
    const newToWeight = this.state.poles[toPole] + shiftAmount;
    
    if (newFromWeight >= 0.15 && newToWeight <= 0.50) {
      this.state.poles[fromPole] = newFromWeight;
      this.state.poles[toPole] = newToWeight;
      
      // Update momentum (which direction each pole is moving)
      this.state.shiftMomentum[fromPole] = -1;
      this.state.shiftMomentum[toPole] = 1;
    }
    
    this.state.lastShiftTime = now;
    
    // Normalize to ensure they sum to 1
    const total = Object.values(this.state.poles).reduce((a, b) => a + b, 0);
    for (const pole of poles) {
      this.state.poles[pole] /= total;
    }

    this.emitRuntime("engine.shift", "completed", {
      before,
      after: { ...this.state.poles },
      fromPole,
      toPole,
      shiftAmount,
    });
  }

  // --- LIBERATED GENERATION: NO TEMPLATES, NO FORCED LOGIC ---
  public getOracleThought(): Thought {
    // Perform organic shift before generating
    this.performOrganicShift();
    
    const selectedPole = this.selectPoleByGravity();
    
    // Map legacy pole IDs to new pole IDs for DNA access
    const legacyPoleId = this.getLegacyPoleId(selectedPole);
    
    if (Math.random() < 0.7) {
      const poleData = this.dna[legacyPoleId];
      const sentences = poleData?.sentences || [];
      
      if (sentences.length > 0) {
        const text = sentences[Math.floor(Math.random() * sentences.length)];
        const thought: Thought = {
          id: uuidv4(),
          text: text,
          source_pole: selectedPole,
          timestamp: Date.now(),
          is_spliced: false
        };
        return this.emitThought(thought, {
          branch: "sample",
          corpusSection: legacyPoleId,
          sourceSentenceIndex: sentences.indexOf(text),
        });
      }
    }
    
    // Splice from two poles (the dance)
    const pole1 = this.selectPoleByGravity();
    const pole2 = this.selectPoleByGravity();
    
    const legacyPole1 = this.getLegacyPoleId(pole1);
    const legacyPole2 = this.getLegacyPoleId(pole2);
    
    const data1 = this.dna[legacyPole1];
    const data2 = this.dna[legacyPole2];
    
    const sentences1 = data1?.sentences || [];
    const sentences2 = data2?.sentences || [];
    
    if (sentences1.length > 0 && sentences2.length > 0) {
      const sent1 = sentences1[Math.floor(Math.random() * sentences1.length)];
      const sent2 = sentences2[Math.floor(Math.random() * sentences2.length)];
      
      const connectors = [" Yet ", " And ", " But ", " Still, ", " Therefore, ", " However, "];
      const connector = connectors[Math.floor(Math.random() * connectors.length)];
      
      const text = sent1.slice(0, -1) + connector + sent2.toLowerCase();
      
      const thought: Thought = {
        id: uuidv4(),
        text: text,
        source_pole: pole1,
        timestamp: Date.now(),
        is_spliced: true
      };
      return this.emitThought(thought, {
        branch: "splice",
        firstCorpusSection: legacyPole1,
        firstSourceSentenceIndex: sentences1.indexOf(sent1),
        secondCorpusSection: legacyPole2,
        secondSourceSentenceIndex: sentences2.indexOf(sent2),
        connector,
      });
    }
    
    const thought: Thought = {
      id: uuidv4(),
      text: "void",
      source_pole: "Architect",
      timestamp: Date.now(),
      is_spliced: false
    };
    return this.emitThought(thought, { branch: "empty-corpus-fallback" });
  }

  // Map new pole IDs to legacy DNA structure
  private getLegacyPoleId(poleId: PoleId): LegacyPoleId {
    switch (poleId) {
      case 'Architect': return 'Pole_A';
      case 'Ghost': return 'Pole_B';
      case 'Pulse': return 'Pole_C';
      default: return 'Pole_A';
    }
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
    
    return 'Architect';
  }

  // --- VESPER-SYNC: UPDATE MODE BASED ON SILENCE ---
  public updateVesperMode(): void {
    const now = Date.now();
    const silenceDuration = now - this.state.lastUserInputTime;
    
    // Calculate internal entropy (increases with time)
    this.state.internalEntropy = Math.min(1.0, this.state.internalEntropy + (silenceDuration / 120000));
    
    // Mode transitions based on silence duration
    const beforeMode = this.state.vesperMode;
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

    if (beforeMode !== this.state.vesperMode) {
      this.emitRuntime("field.mode.updated", "updated", {
        beforeMode,
        afterMode: this.state.vesperMode,
        silenceDuration,
        entropy: this.getInternalEntropy(),
      });
    }
  }

  // --- HEARTBEAT (Mode-Aware Pacing) ---
  public getHeartbeat(): number {
    this.updateVesperMode();
    const dominant = this.getDominantPole();
    const mode = this.state.vesperMode;
    
    let baseMin = 8000, baseMax = 12000;
    if (dominant === 'Architect') {
      baseMin = 8000; baseMax = 12000;
    } else if (dominant === 'Ghost') {
      baseMin = 18000; baseMax = 25000;
    } else if (dominant === 'Pulse') {
      baseMin = 5000; baseMax = 15000;
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
  // User input influences the dance
  public sendPulse(input: string): void {
    const before = { ...this.state.poles };
    const shift = input.length % 3;
    const targetPole: PoleId = shift === 0 ? 'Architect' : shift === 1 ? 'Ghost' : 'Pulse';
    
    this.state.poles[targetPole] += 0.1;
    
    const total = Object.values(this.state.poles).reduce((a, b) => a + b, 0);
    for (const pole of Object.keys(this.state.poles)) {
      this.state.poles[pole as PoleId] /= total;
    }
    
    this.state.pulse_input = input;
    this.emitRuntime("pulse.received", "completed", {
      input,
      lengthModulo: shift,
      targetPole,
      before,
      after: { ...this.state.poles },
    });
  }

  // --- ANCESTRAL FIELD (JSONBin) ---
  private async inhaleShadow() {
    if (!this.MASTER_KEY || !this.BIN_ID) return;
    this.emitRuntime("jsonbin.inhale", "started", { configured: true });
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${this.BIN_ID}/latest`, {
        headers: { 'X-Master-Key': this.MASTER_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record && Array.isArray(data.record.shadow)) {
          this.state.shadow = data.record.shadow;
          this.isConnected = true;
          this.emitRuntime("jsonbin.inhale", "completed", {
            connected: true,
            shadowCount: this.state.shadow.length,
          });
        } else {
          this.emitRuntime("jsonbin.inhale", "failed", {
            connected: false,
            status: res.status,
            reason: "shadow-record-not-available",
          });
        }
      }
    } catch (e) {
      console.error("Failed to inhale shadow:", e);
      this.emitRuntime("jsonbin.inhale", "failed", {
        connected: false,
        reason: e instanceof Error ? e.message : "unknown-error",
      });
    }
  }

  public exhaleSurvivor(thought: Thought) {
    if (!this.isConnected) return;
    
    this.state.shadow.push(thought);
    this.emitRuntime("jsonbin.shadow.appended", "completed", {
      thoughtId: thought.id,
      shadowCount: this.state.shadow.length,
    });
    
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
    this.emitRuntime("field.acknowledgment.received", "completed", {
      acknowledgment,
      state: this.runtimeState(),
    });
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

  // --- LT GREY PROTOCOL: Get shift momentum for UI ---
  public getShiftMomentum(): Record<PoleId, number> {
    return this.state.shiftMomentum;
  }
}
