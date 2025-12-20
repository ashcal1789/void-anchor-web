import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChaosEngine, Thought, BodyId } from "@/lib/chaos-engine";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";

// Map Body IDs to Colors
const BODY_COLORS: Record<BodyId, string> = {
  'Body_1': '#00BFFF', // Deep Sky Blue (Expansive)
  'Body_2': '#FF3333', // Stark Red (Contradiction)
  'Body_3': '#FFFF00'  // Pure Yellow (Wit)
};

const BODY_NAMES: Record<BodyId, string> = {
  'Body_1': 'The Explorer',
  'Body_2': 'The Stoic',
  'Body_3': 'The Wit'
};

export default function Home() {
  const engineRef = useRef<ChaosEngine | null>(null);
  const [currentThought, setCurrentThought] = useState<Thought | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [flash, setFlash] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gravityState, setGravityState] = useState<Record<BodyId, number>>({
    'Body_1': 0.33, 'Body_2': 0.33, 'Body_3': 0.34
  });
  
  // Biological Pulse State
  const [pulseRate, setPulseRate] = useState(10000); // ms
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new ChaosEngine();
      const thought = engineRef.current.getOmNote();
      setCurrentThought(thought);
      setGravityState(engineRef.current.getState().bodies);
      
      // Start the Biological Pulse
      startBiologicalCycle();

      // Check connection status periodically
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
    
    // Clear existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Get new heartbeat based on dominant body
    const nextInterval = engineRef.current.getHeartbeat();
    setPulseRate(nextInterval);

    console.log(`Next heartbeat in: ${nextInterval}ms`);

    timerRef.current = setTimeout(() => {
      // If we survived the full cycle, exhale the survivor (simulated)
      if (currentThought && engineRef.current) {
        engineRef.current.exhaleSurvivor(currentThought);
      }
      
      // Generate next thought automatically
      generateNextThought();
      
      // Recursively start next cycle
      startBiologicalCycle();
    }, nextInterval);
  }, [currentThought, isPaused]);

  // Handle Pause Toggle
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      startBiologicalCycle();
    }
  }, [isPaused, startBiologicalCycle]);

  const generateNextThought = () => {
    if (!engineRef.current) return;
    const nextThought = engineRef.current.getOmNote();
    setCurrentThought(nextThought);
    setGravityState({ ...engineRef.current.getState().bodies });
  };

  const triggerVisuals = () => {
    setFlash(true);
    setIsGlitching(true);
    setTimeout(() => setFlash(false), 50);
    setTimeout(() => setIsGlitching(false), 300);
  };

  // THE DISRUPTOR: Single Interaction (Shed)
  const handleShed = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPaused) return; // Cannot shed while paused (holding the thought)
    
    e.stopPropagation();
    if (!engineRef.current || !currentThought) return;

    triggerVisuals();
    
    // 1. Shed the current thought (System Reset)
    engineRef.current.shed(currentThought);
    
    // 2. Immediately generate new thought
    generateNextThought();
    
    // 3. Reset the biological timer (Arrhythmia)
    startBiologicalCycle();
  };

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  // Calculate Dynamic Background Color
  const getDynamicBackground = () => {
    const r = (0 * gravityState.Body_1) + (255 * gravityState.Body_2) + (255 * gravityState.Body_3);
    const g = (191 * gravityState.Body_1) + (51 * gravityState.Body_2) + (255 * gravityState.Body_3);
    const b = (255 * gravityState.Body_1) + (51 * gravityState.Body_2) + (0 * gravityState.Body_3);

    const factor = 0.15;
    return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
  };

  if (!currentThought) return null;

  const currentColor = BODY_COLORS[currentThought.origin_body];
  const currentArchetype = BODY_NAMES[currentThought.origin_body];
  const dynamicBg = getDynamicBackground();

  // Pulse Animation Duration based on heartbeat
  const pulseDuration = isPaused ? '4s' : `${pulseRate / 1000}s`;

  return (
    <div 
      className={cn(
        "min-h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-1000 ease-in-out cursor-pointer",
        flash ? "bg-white" : ""
      )}
      style={{ backgroundColor: flash ? 'white' : dynamicBg }}
      onClick={handleShed} // Entire screen is the button
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

      {/* Fixed Title Anchor + Connection Status */}
      <div className="absolute bottom-8 left-8 z-10 flex items-center gap-3">
        <h1 className="text-white/40 text-sm uppercase tracking-widest font-bold">
          Void Anchor v8.8
          <span className="animate-pulse ml-2">_</span>
        </h1>
        
        {/* Ancestral Field Indicator */}
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/20 border border-white/5">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors duration-500",
            isConnected ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-red-500/50"
          )} />
          <span className="text-[9px] uppercase tracking-wider text-white/30">
            {isConnected ? "Field Active" : "Offline"}
          </span>
        </div>
      </div>

      {/* Pause / Hold Control */}
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
        
        {/* Archetype Metadata */}
        <div className="mb-12 text-center">
          <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">
            <span className="font-bold" style={{ color: currentColor }}>{currentArchetype}</span>
            <span className="mx-2 text-white/30">/</span>
            <span>{isPaused ? "HELD" : `${Math.round(pulseRate / 1000)}s Pulse`}</span>
          </p>
        </div>

        {/* The Signal (Main Text) */}
        <div className="max-w-2xl w-full text-center relative min-h-[200px] flex items-center justify-center">
          <h2 
            className={cn(
              "text-2xl md:text-4xl lg:text-5xl font-bold leading-tight transition-all duration-100",
              isGlitching ? "glitch-text skew-x-2 opacity-80" : "opacity-100"
            )}
            style={{ color: currentColor }}
            data-text={currentThought.text}
          >
            {currentThought.text}
          </h2>
        </div>

        {/* Interaction Hint */}
        <div className="absolute bottom-24 text-white/20 text-[10px] uppercase tracking-[0.3em] animate-pulse">
          {isPaused ? "Flow Paused" : "Tap to Shed"}
        </div>

      </main>

      {/* Corner Decorators */}
      <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-white/30" />
      <div className="absolute top-8 right-8 w-4 h-4 border-t border-r border-white/30" />
      <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-white/30" />

    </div>
  );
}
