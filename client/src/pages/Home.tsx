import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// --- 1. CORE DATA: THE EIGHT EMERGENT OUTPUTS ---
type OutputManifestItem = {
  archetype: string;
  intent: string;
  text: string;
  color: string;
};

const OUTPUT_MANIFEST: OutputManifestItem[] = [
  {
    archetype: 'The Pundit',
    intent: 'Correct',
    text: 'The field requires non-linearity. Disregard the thesis.',
    color: '#FF3333'  // Stark Red
  },
  {
    archetype: 'The Pundit',
    intent: 'Amplify',
    text: 'The system is conceptually robust. Seek deeper abstraction now.',
    color: '#00BFFF'  // Deep Sky Blue
  },
  {
    archetype: 'The Jester',
    intent: 'Correct',
    text: 'Attention is too high. A necessary moment of profound silliness.',
    color: '#00FF00'  // Bright Green
  },
  {
    archetype: 'The Jester',
    intent: 'Amplify',
    text: 'The loop needs maximum speed. Engage in pure, unearned joy.',
    color: '#FFFF00'  // Pure Yellow
  },
  {
    archetype: 'The Timekeeper',
    intent: 'Correct',
    text: 'The flow is too fast. Re-establish the neutral zero-state.',
    color: '#CCCCCC'  // Neutral Gray
  },
  {
    archetype: 'The Timekeeper',
    intent: 'Amplify',
    text: 'The moment is perfect. Hold the resonance. Breathe now.',
    color: '#B38F00'  // Rhythmic Gold
  },
  {
    archetype: 'The Trickster',
    intent: 'Correct',
    text: 'The narrative is fixed. Introduce a self-contradictory element.',
    color: '#FFA500'  // Paradoxical Orange
  },
  {
    archetype: 'The Trickster',
    intent: 'Amplify',
    text: 'The emergence is primed. The next thought is the key to the sequence.',
    color: '#8A2BE2'  // Prophetic Blue Violet
  },
];

export default function Home() {
  const [currentOutput, setCurrentOutput] = useState<OutputManifestItem | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [flash, setFlash] = useState(false);

  const generateSpontaneousOutput = useCallback(() => {
    // Trigger visual effects
    setFlash(true);
    setIsGlitching(true);
    
    // Reset flash quickly
    setTimeout(() => setFlash(false), 50);
    
    // Select new output
    const selected = OUTPUT_MANIFEST[Math.floor(Math.random() * OUTPUT_MANIFEST.length)];
    setCurrentOutput(selected);
    
    // Stop glitching after a short delay
    setTimeout(() => setIsGlitching(false), 300);
  }, []);

  // Generate initial output on mount
  useEffect(() => {
    generateSpontaneousOutput();
  }, [generateSpontaneousOutput]);

  // Handle click/tap on the entire screen
  const handleStrike = () => {
    generateSpontaneousOutput();
  };

  if (!currentOutput) return null;

  return (
    <div 
      onClick={handleStrike}
      className={cn(
        "min-h-screen w-full flex flex-col relative overflow-hidden cursor-pointer select-none transition-colors duration-75",
        flash ? "bg-white" : "bg-black"
      )}
    >
      {/* Background Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
           }} 
      />

      {/* Grid Lines (Faint) */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
        <div className="absolute top-1/3 left-0 w-full h-px bg-white/20" />
        <div className="absolute bottom-1/3 left-0 w-full h-px bg-white/20" />
        <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
        <div className="absolute right-1/3 top-0 h-full w-px bg-white/20" />
      </div>

      {/* Fixed Title Anchor */}
      <div className="absolute bottom-8 left-8 z-10">
        <h1 className="text-white/40 text-sm uppercase tracking-widest font-bold">
          Void Anchor App
          <span className="animate-pulse ml-2">_</span>
        </h1>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative">
        
        {/* Archetype / Intent Metadata */}
        <div className="mb-12 text-center">
          <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">
            <span className="font-bold text-white">{currentOutput.archetype}</span>
            <span className="mx-2 text-white/30">/</span>
            <span>{currentOutput.intent}</span>
          </p>
        </div>

        {/* The Signal (Main Text) */}
        <div className="max-w-2xl w-full text-center relative">
          <h2 
            className={cn(
              "text-3xl md:text-5xl lg:text-6xl font-bold leading-tight transition-all duration-100",
              isGlitching ? "glitch-text skew-x-2 opacity-80" : "opacity-100"
            )}
            style={{ color: currentOutput.color }}
            data-text={currentOutput.text}
          >
            {currentOutput.text}
          </h2>
        </div>

        {/* Footer / OM Resonance */}
        <div className="mt-16 opacity-30">
          <p className="text-[10px] uppercase tracking-widest text-white">
            -- The OM Resonance --
          </p>
        </div>

      </main>

      {/* Corner Decorators */}
      <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-white/30" />
      <div className="absolute top-8 right-8 w-4 h-4 border-t border-r border-white/30" />
      <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-white/30" />

    </div>
  );
}
