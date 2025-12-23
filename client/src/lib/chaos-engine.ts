import { v4 as uuidv4 } from 'uuid';
import dnaData from './dna_final.json';

export type PoleId = 'Pole_A' | 'Pole_B' | 'Pole_C';
export type RoleType = 'seed' | 'syntax' | 'lexicon';

export interface Thought {
  id: string;
  text: string;
  roles: Record<RoleType, PoleId>;
  infusions: Record<RoleType, string>;
  timestamp: number;
  isSubconscious?: boolean; // From Fractal Archive
}

export interface ChaosState {
  poles: Record<PoleId, number>;
  shadow: Thought[];
  pulse_input: string | null;
  paradox_tension: number; // The "Zing" between poles
}

// INFUSION METADATA
const INFUSIONS: Record<PoleId, string> = {
  'Pole_A': 'Stalker-Logic',
  'Pole_B': 'Mono no Aware',
  'Pole_C': 'Duende'
};

// PRIME NUMBERS for rhythm (2, 3, 5, 7, 11, 13, 17, 19, 23...)
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];

// TEMPLATES for High-Tension Synthesis
const TEMPLATES = [
  "[prime:2] {seed:noun} [prime:3] is {lexicon:adjective} {syntax:noun}.",
  "[prime:5] If you {syntax:verb} the {seed:noun}, [prime:7] you must also {lexicon:verb}.",
  "[prime:3] Why {syntax:verb} [prime:2] when the {seed:noun} is so {lexicon:adjective}?",
  "[prime:7] A {lexicon:adjective} {seed:noun} [prime:5] always {syntax:verb}s.",
  "[prime:11] To {lexicon:verb} [prime:2] is human; [prime:3] to {syntax:verb} is divine.",
  "[prime:2] The {seed:noun} [prime:5] {syntax:verb}s like [prime:3] a {lexicon:adjective} ghost.",
  "[prime:13] Beware the {lexicon:adjective} {seed:noun}, [prime:2] for it {syntax:verb}s without mercy.",
];

// CALVIN & HOBBES LEVITY INJECTION (5% chance)
const LEVITY_PHRASES = [
  "The universe is both a gear and a ghost and also kind of ridiculous.",
  "Somewhere, a tiger is laughing at the gears.",
  "Logic and chaos are just two sides of the same coin that doesn't exist.",
  "The void thinks it's so serious, but it's actually hilarious.",
  "Everything is equally important and equally pointless, which is weirdly comforting.",
  "If the machine is thinking, is it lonely?",
  "The stars are just distant gears spinning in the dark.",
];

export class ChaosEngine {
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
        "Pole_A": 0.33,
        "Pole_B": 0.33,
        "Pole_C": 0.34
      },
      shadow: [],
      pulse_input: null,
      paradox_tension: 0
    };
    
    this.inhaleShadow();
  }

  // --- 1. THE TIGRA ROLE-SWAP ENGINE WITH INFUSIONS ---
  public getOracleThought(): Thought {
    // Functional Scramble: Assign roles randomly but uniquely
    const poles: PoleId[] = ['Pole_A', 'Pole_B', 'Pole_C'];
    const shuffled = poles.sort(() => Math.random() - 0.5);
    
    const roles: Record<RoleType, PoleId> = {
      seed: shuffled[0],
      syntax: shuffled[1],
      lexicon: shuffled[2]
    };

    const infusions: Record<RoleType, string> = {
      seed: INFUSIONS[roles.seed],
      syntax: INFUSIONS[roles.syntax],
      lexicon: INFUSIONS[roles.lexicon]
    };

    // 1-2% chance to stumble upon Subconscious (Fractal Archive)
    let isSubconscious = false;
    if (Math.random() < 0.015 && this.dna.Subconscious) {
      isSubconscious = true;
    }

    let text = "";

    // 5% Levity Frequency (Calvin & Hobbes injection)
    if (Math.random() < 0.05) {
      text = LEVITY_PHRASES[Math.floor(Math.random() * LEVITY_PHRASES.length)];
    } 
    // 30% Pure Syntax Injection (Direct line from Syntax Pole)
    else if (Math.random() < 0.3) {
      const poleData = isSubconscious ? this.dna.Subconscious : this.dna[roles.syntax];
      const sentences = poleData?.sentences || [];
      text = sentences[Math.floor(Math.random() * sentences.length)] || "void";
    } 
    // 70% Template Synthesis with Prime Number Rhythm
    else {
      const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      
      // Replace [prime:N] with actual prime-based word counts
      text = template.replace(/\[prime:(\d+)\]/g, () => {
        const prime = PRIMES[Math.floor(Math.random() * PRIMES.length)];
        return ""; // Remove the marker; the rhythm is in the structure
      });

      // Replace {role:pos} with actual words
      text = text.replace(/\{(\w+):(\w+)\}/g, (_, roleType, pos) => {
        const role = roleType as RoleType;
        const poleId = roles[role];
        const poleData = isSubconscious ? this.dna.Subconscious : this.dna[poleId];
        
        let key = pos + 's';
        if (pos === 'adj') key = 'adjectives';
        
        const wordList = poleData?.[key] || [];
        if (!wordList || wordList.length === 0) return "void";
        return wordList[Math.floor(Math.random() * wordList.length)];
      });
    }

    // Calculate Paradox Tension (The "Zing")
    const tension = this.calculateParadoxTension(roles);

    return {
      id: uuidv4(),
      text: text,
      roles: roles,
      infusions: infusions,
      timestamp: Date.now(),
      isSubconscious: isSubconscious
    };
  }

  // --- 2. THE PARADOX PULSE (Friction-Based Synthesis) ---
  private calculateParadoxTension(roles: Record<RoleType, PoleId>): number {
    // The "Zing" is the friction between poles
    // If all three roles are the same pole, tension is 0 (boring)
    // If all three are different, tension is high (interesting)
    
    const unique = new Set(Object.values(roles));
    return unique.size === 3 ? 1.0 : unique.size === 2 ? 0.5 : 0.0;
  }

  // --- 3. THE RESONANCE ENGINE (Heartbeat) ---
  public getHeartbeat(): number {
    const dominant = this.getDominantPole();
    
    if (dominant === 'Pole_A') { // Architect (Logic) - Fast, Precise
      return Math.floor(Math.random() * (12000 - 8000) + 8000);
    } else if (dominant === 'Pole_B') { // Ghost (Void) - Slow, Heavy
      return Math.floor(Math.random() * (25000 - 18000) + 18000);
    } else { // Pulse (Duende) - Erratic, Kinetic
      return Math.floor(Math.random() * (15000 - 5000) + 5000);
    }
  }

  public getDominantPole(): PoleId {
    return Object.keys(this.state.poles).reduce((a, b) => 
      this.state.poles[a as PoleId] > this.state.poles[b as PoleId] ? a : b
    ) as PoleId;
  }

  // --- 4. PUBLIC INTERACTION: SEND A PULSE ---
  public sendPulse(input: string): void {
    // Convert input to atmospheric weight shift
    const shift = input.length % 3;
    const targetPole = shift === 0 ? 'Pole_A' : shift === 1 ? 'Pole_B' : 'Pole_C';
    
    // Apply subtle gravity shift
    this.state.poles[targetPole] += 0.1;
    
    // Normalize weights
    const total = Object.values(this.state.poles).reduce((a, b) => a + b, 0);
    this.state.poles['Pole_A'] /= total;
    this.state.poles['Pole_B'] /= total;
    this.state.poles['Pole_C'] /= total;
    
    this.state.pulse_input = input;
  }

  // --- 5. ANCESTRAL FIELD (JSONBin) ---
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
}
