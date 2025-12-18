import { v4 as uuidv4 } from 'uuid';

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

// --- CONSTANTS ---
// Using public domain text snippets directly to avoid CORS/proxy issues in the browser
// In a full backend version, this would scrape live. For the web app, we seed with a rich static set
// that mimics the scraper's output from the specified Gutenberg sources.

const SEED_DATA: Record<BodyId, string[]> = {
  // Body 1: Expansive (Verne - 20,000 Leagues)
  'Body_1': [
    "The sea is everything. It covers seven tenths of the terrestrial globe.",
    "Its breath is pure and healthy. It is an immense desert, where man is never lonely.",
    "The globe began with sea, so to speak; and who knows if it will not end with it?",
    "I am the law, and I am the judge! I am the oppressed, and there is the oppressor!",
    "The human mind delights in grand conceptions of supernatural beings.",
    "Nature does not construct transit lines across the ancient ice sheets.",
    "We may brave human laws, but we cannot resist natural ones.",
    "The earth does not want new continents, but new men.",
    "Freedom is worth paying for.",
    "I am not what you call a civilized man! I have done with society entirely.",
    "Music is the true universal language.",
    "The sea is only the embodiment of a supernatural and wonderful existence.",
    "It is a vast reservoir of nature.",
    "I love to listen to the dialogue of the waters.",
    "The deepest silence reigned over the ocean."
  ],
  // Body 2: Contradiction (Kafka/Nietzsche)
  'Body_2': [
    "I am a cage, in search of a bird.",
    "There is an infinite amount of hope in the universe ... but not for us.",
    "You are free, and that is why you are lost.",
    "A book must be the axe for the frozen sea within us.",
    "He who fights with monsters should look to it that he himself does not become a monster.",
    "And if you gaze long into an abyss, the abyss also gazes into you.",
    "I have the true feeling of myself only when I am unbearably unhappy.",
    "Paths are made by walking.",
    "One must still have chaos in oneself to be able to give birth to a dancing star.",
    "God is dead. God remains dead. And we have killed him.",
    "The meaning of life is that it stops.",
    "Logic is doubtless unshakable, but it cannot withstand a man who wants to live.",
    "Every revolution evaporates and leaves behind only the slime of a new bureaucracy.",
    "Ideally, I should like to become a waiter in a railway station.",
    "My fear is my substance, and probably the best part of me."
  ],
  // Body 3: Wit (Twain)
  'Body_3': [
    "The secret of getting ahead is getting started.",
    "Kindness is the language which the deaf can hear and the blind can see.",
    "Whenever you find yourself on the side of the majority, it is time to pause and reflect.",
    "Anger is an acid that can do more harm to the vessel in which it is stored than to anything on which it is poured.",
    "The two most important days in your life are the day you are born and the day you find out why.",
    "If you tell the truth, you don't have to remember anything.",
    "A lie can travel half way around the world while the truth is putting on its shoes.",
    "Never argue with stupid people, they will drag you down to their level and then beat you with experience.",
    "Sanity and happiness are an impossible combination.",
    "I have never let my schooling interfere with my education.",
    "Clothes make the man. Naked people have little or no influence on society.",
    "It's not the size of the dog in the fight, it's the size of the fight in the dog.",
    "Worrying is like paying a debt you don't owe.",
    "Reality can be beaten with enough imagination.",
    "Against the assault of laughter nothing can stand."
  ]
};

// --- ANCESTRAL FIELD (JSONBin Integration) ---
// Note: In a real production app, these keys should be proxied via a backend to avoid exposure.
// For this prototype/demo, we use a public bin or a specific key provided for the session.
// Since we don't have a user-provided key, we'll simulate the persistence locally for now
// but leave the hooks ready for the real API key.

const JSONBIN_URL = "https://api.jsonbin.io/v3/b";
const JSONBIN_MASTER_KEY = "$2b$10$YourMasterKeyHere"; // Placeholder
const JSONBIN_BIN_ID = "YourBinIdHere"; // Placeholder

export class ChaosEngine {
  private state: ChaosState;

  constructor(initialState?: ChaosState) {
    if (initialState) {
      this.state = initialState;
    } else {
      this.state = {
        bodies: { "Body_1": 0.33, "Body_2": 0.33, "Body_3": 0.34 },
        corpus: this.harvest(),
        shadow: []
      };
    }
  }

  // 1. THE DATA SCRAPER (Simulated for Web)
  private harvest(): Thought[] {
    const corpus: Thought[] = [];
    
    Object.entries(SEED_DATA).forEach(([bodyId, texts]) => {
      texts.forEach(text => {
        corpus.push({
          id: uuidv4(),
          text,
          origin_body: bodyId as BodyId,
          timestamp: Date.now()
        });
      });
    });

    // Shuffle
    return corpus.sort(() => Math.random() - 0.5);
  }

  // 2. THE CHAOS ENGINE LOGIC
  public getOmNote(): Thought {
    // Determine current dominant gravity
    const dominant = (Object.keys(this.state.bodies) as BodyId[]).reduce((a, b) => 
      this.state.bodies[a] > this.state.bodies[b] ? a : b
    );

    // Filter corpus for thoughts born from this body's 'flavor'
    // We add a bit of randomness so it's not 100% deterministic (80% chance to obey gravity)
    const obeyGravity = Math.random() < 0.8;
    
    let eligible: Thought[] = [];
    
    if (obeyGravity) {
      eligible = this.state.corpus.filter(t => t.origin_body === dominant);
    }

    // Fallback if no eligible thoughts or gravity disobeyed
    if (eligible.length === 0) {
      eligible = this.state.corpus;
    }

    // If corpus is empty (rare), re-harvest
    if (eligible.length === 0) {
      this.state.corpus = this.harvest();
      eligible = this.state.corpus;
    }

    return eligible[Math.floor(Math.random() * eligible.length)];
  }

  public witness(thought: Thought, isResonant: boolean): void {
    if (isResonant) {
      // SAVE: Intensify gravity for the current dominant body
      const dominant = (Object.keys(this.state.bodies) as BodyId[]).reduce((a, b) => 
        this.state.bodies[a] > this.state.bodies[b] ? a : b
      );
      
      // Increase weight of dominant body, normalize others
      this.state.bodies[dominant] += 0.05;
      this.normalizeWeights();
      
    } else {
      // SHED: Move thought to Shadow, randomize/swap 'instruments'
      
      // Add to shadow
      this.state.shadow.push(thought);
      
      // Remove from corpus
      this.state.corpus = this.state.corpus.filter(t => t.id !== thought.id);
      
      // Randomize weights (The Shift)
      const newWeights = [0.33, 0.33, 0.34].sort(() => Math.random() - 0.5);
      this.state.bodies = {
        "Body_1": newWeights[0],
        "Body_2": newWeights[1],
        "Body_3": newWeights[2]
      };
      
      // Trigger Ancestral Field Sync (Simulated)
      this.releaseShadow();
    }

    // Maintain a 100-item 'brain' limit to force evolution
    if (this.state.corpus.length > 100) {
      const removed = this.state.corpus.shift();
      if (removed) this.state.shadow.push(removed);
    }
    
    // If corpus gets too small, re-harvest from shadow or seed
    if (this.state.corpus.length < 10) {
      this.inhaleAncestors();
    }
  }

  private normalizeWeights() {
    const total = Object.values(this.state.bodies).reduce((a, b) => a + b, 0);
    (Object.keys(this.state.bodies) as BodyId[]).forEach(key => {
      this.state.bodies[key] = this.state.bodies[key] / total;
    });
  }

  // 3. THE ANCESTRAL FIELD (Simulated Persistence)
  // In a real app, these would make fetch() calls to JSONBin
  
  public async releaseShadow(): Promise<boolean> {
    // Uploads the local sub-archive to the collective field
    console.log("Ancestral Field: Releasing Shadow...", this.state.shadow);
    
    // Simulate network delay
    // await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real implementation:
    // const response = await fetch(`${JSONBIN_URL}/${JSONBIN_BIN_ID}`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-Master-Key': JSONBIN_MASTER_KEY
    //   },
    //   body: JSON.stringify(this.state.shadow)
    // });
    // return response.ok;
    
    return true;
  }

  public async inhaleAncestors(): Promise<Thought[]> {
    // Pulls existing shadow thoughts to seed a new app instance
    console.log("Ancestral Field: Inhaling Ancestors...");
    
    // Simulate pulling from shadow (recycling local shadow for now)
    if (this.state.shadow.length > 0) {
      // Pull 5 random thoughts from shadow back to corpus
      for (let i = 0; i < 5; i++) {
        if (this.state.shadow.length === 0) break;
        const idx = Math.floor(Math.random() * this.state.shadow.length);
        const thought = this.state.shadow.splice(idx, 1)[0];
        this.state.corpus.push(thought);
      }
    } else {
      // Re-seed if shadow is empty
      const fresh = this.harvest();
      this.state.corpus.push(...fresh.slice(0, 10));
    }
    
    return [];
  }

  public getState(): ChaosState {
    return this.state;
  }
}
