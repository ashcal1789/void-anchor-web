import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChaosEngine, Thought, BodyId } from "@/lib/chaos-engine";
import { Button } from "@/components/ui/button";

// Map Body IDs to Colors
const BODY_COLORS: Record<BodyId, string> = {
  'Body_1': '#00BFFF', // Deep Sky Blue (Expansive)
  'Body_2': '#FF3333', // Stark Red (Contradiction)
  'Body_3': '#FFFF00'  // Pure Yellow (Wit)
};

const BODY_NAMES: Record<BodyId, string> = {
  'Body_1': 'The Expansive',
  'Body_2': 'The Contradiction',
  'Body_3': 'The Wit'
};

export default function Home() {
  const engineRef = useRef<ChaosEngine | null>(null);
  const [currentThought, setCurrentThought] = useState<Thought | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [flash, setFlash] = useState(false);
  const [gravityState, setGravityState] = useState<Record<BodyId, number>>({
    'Body_1': 0.33, 'Body_2': 0.33, 'Body_3': 0.34
  });

  // Initialize Engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new ChaosEngine();
      // Generate first thought
      const thought = engineRef.current.getOmNote();
      setCurrentThought(thought);
      setGravityState(engineRef.current.getState().bodies);
    }
  }, []);

  const triggerVisuals = () => {
    setFlash(true);
    setIsGlitching(true);
    setTimeout(() => setFlash(false), 50);
    setTimeout(() => setIsGlitching(false), 300);
  };

  const handleResonate = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering background click
    if (!engineRef.current || !currentThought) return;

    triggerVisuals();
    
    // Witness: Resonate (Save/Intensify)
    engineRef.current.witness(currentThought, true);
    
    // Get next thought
    const nextThought = engineRef.current.getOmNote();
    setCurrentThought(nextThought);
    setGravityState({ ...engineRef.current.getState().bodies });
  };

  const handleShed = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering background click
    if (!engineRef.current || !currentThought) return;

    triggerVisuals();
    
    // Witness: Shed (Discard/Shift)
    engineRef.current.witness(currentThought, false);
    
    // Get next thought
    const nextThought = engineRef.current.getOmNote();
    setCurrentThought(nextThought);
    setGravityState({ ...engineRef.current.getState().bodies });
  };

  if (!currentThought) return null;

  const currentColor = BODY_COLORS[currentThought.origin_body];
  const currentArchetype = BODY_NAMES[currentThought.origin_body];

  return (
    <div 
      className={cn(
        "min-h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-75",
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

      {/* Gravity Meters (Debug/Visualizer) */}
      <div className="absolute top-8 right-8 flex gap-2 z-20">
        {(Object.keys(gravityState) as BodyId[]).map(body => (
          <div key={body} className="flex flex-col items-center">
            <div className="w-1 h-12 bg-white/10 relative overflow-hidden rounded-full">
              <div 
                className="absolute bottom-0 w-full transition-all duration-500"
                style={{ 
                  height: `${gravityState[body] * 100}%`,
                  backgroundColor: BODY_COLORS[body]
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Title Anchor */}
      <div className="absolute bottom-8 left-8 z-10">
        <h1 className="text-white/40 text-sm uppercase tracking-widest font-bold">
          Void Anchor v8.4
          <span className="animate-pulse ml-2">_</span>
        </h1>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative">
        
        {/* Archetype Metadata */}
        <div className="mb-12 text-center">
          <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">
            <span className="font-bold" style={{ color: currentColor }}>{currentArchetype}</span>
            <span className="mx-2 text-white/30">/</span>
            <span>{new Date(currentThought.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

        {/* Interaction Controls */}
        <div className="mt-16 flex gap-8 z-30">
          <Button 
            variant="outline" 
            onClick={handleShed}
            className="border-white/20 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/40 uppercase tracking-widest text-xs h-12 px-8 rounded-none transition-all"
          >
            Shed
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResonate}
            className="border-white/20 text-white hover:bg-white/10 hover:border-[color:var(--c)] hover:text-[color:var(--c)] uppercase tracking-widest text-xs h-12 px-8 rounded-none transition-all font-bold"
            style={{ '--c': currentColor } as React.CSSProperties}
          >
            Resonate
          </Button>
        </div>

      </main>

      {/* Corner Decorators */}
      <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-white/30" />
      <div className="absolute top-8 right-8 w-4 h-4 border-t border-r border-white/30" />
      <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-white/30" />

    </div>
  );
}
