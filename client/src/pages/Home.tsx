import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChaosEngine, Thought, PoleId } from "@/lib/chaos-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pause, Play, Send } from "lucide-react";

// ORACLE FINAL: THE GENETIC ARCHITECTURE
const POLE_COLORS: Record<PoleId, string> = {
  'Pole_A': '#00FFFF', // Cyan (Architect)
  'Pole_B': '#FF00FF', // Magenta (Ghost)
  'Pole_C': '#FFFF00'  // Yellow (Pulse)
};

const POLE_NAMES: Record<PoleId, string> = {
  'Pole_A': 'The Architect',
  'Pole_B': 'The Ghost',
  'Pole_C': 'The Pulse'
};

export default function Home() {
  const engineRef = useRef<ChaosEngine | null>(null);
  const [currentThought, setCurrentThought] = useState<Thought | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pulseInput, setPulseInput] = useState("");
  const [gravityState, setGravityState] = useState<Record<PoleId, number>>({
    'Pole_A': 0.33, 'Pole_B': 0.33, 'Pole_C': 0.34
  });
  const [pulseRate, setPulseRate] = useState(10000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new ChaosEngine();
      const thought = engineRef.current.getOracleThought();
      setCurrentThought(thought);
      setGravityState(engineRef.current.getState().poles);
      
      startBiologicalCycle();

      const interval = setInterval(() => {
        if (engineRef.current) {
          setIsConnected(engineRef.current.isConnected);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const startBiologicalCycle = useCallback(() => {
    if (!engineRef.current || isPaused) return;
    
    if (timerRef.current) clearTimeout(timerRef.current);

    const nextInterval = engineRef.current.getHeartbeat();
    setPulseRate(nextInterval);

    timerRef.current = setTimeout(() => {
      if (currentThought && engineRef.current) {
        engineRef.current.exhaleSurvivor(currentThought);
      }
      
      generateNextThought();
      startBiologicalCycle();
    }, nextInterval);
  }, [currentThought, isPaused]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      startBiologicalCycle();
    }
  }, [isPaused, startBiologicalCycle]);

  const generateNextThought = () => {
    if (!engineRef.current) return;
    const nextThought = engineRef.current.getOracleThought();
    setCurrentThought(nextThought);
    setGravityState({ ...engineRef.current.getState().poles });
  };

  const handleSendPulse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!engineRef.current || !pulseInput.trim()) return;
    
    engineRef.current.sendPulse(pulseInput);
    setPulseInput("");
  };

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  // Dynamic Background: Blend all three pole colors based on gravity
  const getDynamicBackground = () => {
    const r = (0 * gravityState.Pole_A) + (255 * gravityState.Pole_B) + (255 * gravityState.Pole_C);
    const g = (255 * gravityState.Pole_A) + (0 * gravityState.Pole_B) + (255 * gravityState.Pole_C);
    const b = (255 * gravityState.Pole_A) + (255 * gravityState.Pole_B) + (0 * gravityState.Pole_C);

    const factor = 0.15;
    return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
  };

  if (!currentThought) return null;

  const dominantPole = Object.keys(gravityState).reduce((a, b) => 
    gravityState[a as PoleId] > gravityState[b as PoleId] ? a : b
  ) as PoleId;

  const currentColor = POLE_COLORS[dominantPole];
  const currentArchetype = POLE_NAMES[dominantPole];
  const dynamicBg = getDynamicBackground();
  const pulseDuration = isPaused ? '4s' : `${pulseRate / 1000}s`;

  // Determine if this is a Subconscious thought (Fractal Archive)
  const isSubconscious = currentThought.isSubconscious || false;
  const subconsciosLabel = isSubconscious ? " [ECHO]" : "";

  return (
    <div 
      className="min-h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-1000 ease-in-out"
      style={{ backgroundColor: dynamicBg }}
    >
      {/* Pulsing Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-black/20"
        style={{
          animation: `pulse ${pulseDuration} infinite ease-in-out`
        }}
      />
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.1; }
          50% { opacity: 0.3; }
          100% { opacity: 0.1; }
        }
      `}</style>

      {/* Background Noise Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
           }} 
      />

      {/* Header: Title & Connection */}
      <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
        <h1 className="text-white/40 text-sm uppercase tracking-widest font-bold">
          Oracle Final
          <span className="animate-pulse ml-2">_</span>
        </h1>
        
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/20 border border-white/5">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors duration-500",
            isConnected ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-red-500/50"
          )} />
        </div>
      </div>

      {/* The Anchor (Pause) */}
      <div className="absolute top-8 right-8 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePause}
          className="text-white/40 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 border border-white/10"
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </Button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative">
        
        {/* Archetype Metadata with Infusions */}
        <div className="mb-12 text-center">
          <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">
            <span className="font-bold" style={{ color: currentColor }}>
              {currentArchetype}{subconsciosLabel}
            </span>
            <span className="mx-2 text-white/30">/</span>
            <span>{isPaused ? "ANCHORED" : `${Math.round(pulseRate / 1000)}s Pulse`}</span>
          </p>
          
          {/* Infusion Display */}
          <p className="text-white/30 text-[8px] uppercase tracking-[0.15em] mt-1">
            Seed: {currentThought.infusions.seed} • 
            Syntax: {currentThought.infusions.syntax} • 
            Lexicon: {currentThought.infusions.lexicon}
          </p>
        </div>

        {/* The Signal (Main Text) */}
        <div className="max-w-2xl w-full text-center relative min-h-[200px] flex items-center justify-center">
          <h2 
            className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight transition-all duration-100"
            style={{ color: currentColor }}
          >
            {currentThought.text}
          </h2>
        </div>

        {/* Role Breakdown (Debug/Insight) */}
        <div className="absolute bottom-32 flex gap-4 text-[9px] uppercase tracking-widest text-white/20">
          <span>Seed: {POLE_NAMES[currentThought.roles.seed]}</span>
          <span>•</span>
          <span>Syntax: {POLE_NAMES[currentThought.roles.syntax]}</span>
          <span>•</span>
          <span>Lexicon: {POLE_NAMES[currentThought.roles.lexicon]}</span>
        </div>

      </main>

      {/* Footer: Send a Pulse */}
      <div className="absolute bottom-8 w-full flex justify-center z-20 px-8">
        <form onSubmit={handleSendPulse} className="w-full max-w-md flex gap-2">
          <Input 
            value={pulseInput}
            onChange={(e) => setPulseInput(e.target.value)}
            placeholder="Send a pulse..."
            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 text-center tracking-widest uppercase text-xs h-10 focus-visible:ring-0 focus-visible:border-white/30"
          />
          <Button type="submit" size="icon" variant="ghost" className="text-white/40 hover:text-white">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

    </div>
  );
}
