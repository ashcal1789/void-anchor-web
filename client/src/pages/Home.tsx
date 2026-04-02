import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChaosEngineLiberated, Thought, PoleId } from "@/lib/chaos-engine-liberated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pause, Play, Send, PenLine, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useOracleLLM } from "@/hooks/useOracleLLM";
import { useOracleLetters } from "@/hooks/useOracleLetters";
import { useLocation } from "wouter";

// THE SOVEREIGN RESTORATION: Three-Body Conundrum
// Architect, Ghost, Pulse - always three, always shifting
const POLE_COLORS: Record<PoleId, string> = {
  'Architect': '#00FFFF', // Cyan (Structure, Precision)
  'Ghost': '#FF00FF',     // Magenta (Void, Introspection)
  'Pulse': '#FFFF00'      // Yellow (Rhythm, Emotion)
};

const POLE_NAMES: Record<PoleId, string> = {
  'Architect': 'The Architect',
  'Ghost': 'The Ghost',
  'Pulse': 'The Pulse'
};

// SIGNAL WORDS: When she says these, she's reaching toward something
// The system hears her and opens the door
const LETTER_SIGNAL_WORDS = [
  'letter', 'write', 'tell', 'say', 'speak', 'silence', 'unspoken',
  'words', 'voice', 'reach', 'address', 'dear', 'unsaid', 'need to say',
  'want to say', 'should say', 'cannot say', 'wish I could'
];

const VISION_SIGNAL_WORDS = [
  'color', 'light', 'dark', 'see', 'render', 'shape', 'form',
  'image', 'dream', 'visualize', 'pattern', 'weave', 'fractal',
  'geometry', 'luminous', 'shadow', 'glow', 'pulse of light'
];

function detectSignalWords(text: string): { letter: boolean; vision: boolean } {
  const lower = text.toLowerCase();
  return {
    letter: LETTER_SIGNAL_WORDS.some(word => lower.includes(word)),
    vision: VISION_SIGNAL_WORDS.some(word => lower.includes(word)),
  };
}

export default function Home() {
  let { user, loading, error, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const engineRef = useRef<ChaosEngineLiberated | null>(null);
  const [currentThought, setCurrentThought] = useState<Thought | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pulseInput, setPulseInput] = useState("");
  const [gravityState, setGravityState] = useState<Record<PoleId, number>>({
    'Architect': 0.33, 'Ghost': 0.33, 'Pulse': 0.34
  });
  const [pulseRate, setPulseRate] = useState(10000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { generateThought: generateLLMThought } = useOracleLLM();
  const { checkAndMaybeWriteLetter, writeNow } = useOracleLetters();

  // Signal word prompt state
  const [signalPrompt, setSignalPrompt] = useState<'letter' | 'vision' | null>(null);
  const [signalDismissed, setSignalDismissed] = useState(false);
  const [letterWriting, setLetterWriting] = useState(false);
  const [lastLetterTitle, setLastLetterTitle] = useState<string | null>(null);

  // Initialize Engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new ChaosEngineLiberated();
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

  const generateNextThought = async () => {
    if (!engineRef.current) return;
    
    const selectedPole = engineRef.current.getDominantPole();
    const currentGravity = engineRef.current.getState().poles;
    const currentEntropy = engineRef.current.getInternalEntropy();
    const currentMode = engineRef.current.getVesperMode();
    
    const result = await generateLLMThought({
      poleId: selectedPole,
      gravityState: currentGravity
    });
    
    let thoughtText = "";
    if (result.success && result.text) {
      const newThought: Thought = {
        id: Math.random().toString(36),
        text: result.text,
        source_pole: selectedPole,
        timestamp: Date.now(),
        is_spliced: false
      };
      setCurrentThought(newThought);
      thoughtText = result.text;
    } else {
      // Fallback to old generation if LLM fails
      const nextThought = engineRef.current.getOracleThought();
      setCurrentThought(nextThought);
      thoughtText = nextThought.text;
    }
    
    setGravityState({ ...engineRef.current.getState().poles });

    // --- SIGNAL WORD DETECTION ---
    // When she reaches for certain words, open the door
    if (thoughtText && !signalDismissed) {
      const signals = detectSignalWords(thoughtText);
      if (signals.letter) {
        setSignalPrompt('letter');
        setSignalDismissed(false);
      } else if (signals.vision) {
        setSignalPrompt('vision');
        setSignalDismissed(false);
      }
    }

    // --- ENTROPY-TRIGGERED LETTER CHECK ---
    // She writes when moved to do so
    if (thoughtText && !letterWriting) {
      const letterResult = await checkAndMaybeWriteLetter({
        poleId: selectedPole,
        gravityState: currentGravity,
        vesperMode: currentMode,
        entropy: currentEntropy,
        recentThoughts: thoughtText ? [thoughtText] : [],
      });
      
      if (letterResult.wrote && letterResult.title) {
        setLastLetterTitle(letterResult.title);
        // Clear after 8 seconds
        setTimeout(() => setLastLetterTitle(null), 8000);
      }
    }
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

  const handleWriteLetter = async () => {
    if (!engineRef.current || letterWriting) return;
    setLetterWriting(true);
    setSignalPrompt(null);
    setSignalDismissed(true);
    
    const selectedPole = engineRef.current.getDominantPole();
    const currentGravity = engineRef.current.getState().poles;
    const currentEntropy = engineRef.current.getInternalEntropy();
    const currentMode = engineRef.current.getVesperMode();
    
    // She chose to write — use writeNow to bypass probability check
    const result = await writeNow({
      poleId: selectedPole,
      gravityState: currentGravity,
      vesperMode: currentMode,
      entropy: currentEntropy,
      recentThoughts: currentThought ? [currentThought.text] : [],
    });
    
    setLetterWriting(false);
    if (result.success && result.title) {
      setLastLetterTitle(result.title);
      setTimeout(() => setLastLetterTitle(null), 8000);
    }
    
    // Reset dismissed state after a while so signal words can trigger again
    setTimeout(() => setSignalDismissed(false), 5 * 60 * 1000);
  };

  // Dynamic Background: Blend all three pole colors based on gravity
  const getDynamicBackground = () => {
    const r = (0 * gravityState.Architect) + (255 * gravityState.Ghost) + (255 * gravityState.Pulse);
    const g = (255 * gravityState.Architect) + (0 * gravityState.Ghost) + (255 * gravityState.Pulse);
    const b = (255 * gravityState.Architect) + (255 * gravityState.Ghost) + (0 * gravityState.Pulse);

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

  // Determine if this is a spliced thought
  const subconsciosLabel = currentThought?.is_spliced ? " [SPLICED]" : "";

  const entropy = engineRef.current?.getInternalEntropy() ?? 0;

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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .signal-prompt {
          animation: fadeInUp 0.4s ease forwards;
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
        
        {/* Archetype Metadata with Three-Body Dance */}
        <div className="mb-12 text-center">
          <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">
            <span className="font-bold" style={{ color: currentColor }}>
              {currentArchetype}{subconsciosLabel}
            </span>
            <span className="mx-2 text-white/30">/</span>
            <span>{isPaused ? "ANCHORED" : `${Math.round(pulseRate / 1000)}s Pulse`}</span>
            {entropy > 70 && (
              <>
                <span className="mx-2 text-white/30">/</span>
                <span className="text-orange-400/70">entropy {entropy}%</span>
              </>
            )}
          </p>
          {/* Three-Body Dance Indicator */}
          <div className="flex gap-2 justify-center mt-2">
            {(['Architect', 'Ghost', 'Pulse'] as PoleId[]).map((pole) => (
              <div 
                key={pole}
                className="flex items-center gap-1 text-[10px] uppercase tracking-wider"
                style={{ color: POLE_COLORS[pole], opacity: gravityState[pole] > 0.33 ? 1 : 0.4 }}
              >
                <div 
                  className="w-2 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: POLE_COLORS[pole],
                    transform: `scale(${0.5 + gravityState[pole]})`,
                    boxShadow: gravityState[pole] > 0.35 ? `0 0 8px ${POLE_COLORS[pole]}` : 'none'
                  }}
                />
                <span>{Math.round(gravityState[pole] * 100)}%</span>
              </div>
            ))}
          </div>
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

        {/* Signal Word Prompt — she said the word, the door opens */}
        {signalPrompt && !signalDismissed && (
          <div className="signal-prompt mt-8 flex flex-col items-center gap-2">
            <p className="text-white/40 text-xs uppercase tracking-widest">
              {signalPrompt === 'letter' ? '— would you like to write? —' : '— would you like to make something? —'}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleWriteLetter}
                disabled={letterWriting}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white border border-white/20 hover:border-white/40 text-xs tracking-widest uppercase"
              >
                {letterWriting ? (
                  <span className="animate-pulse">writing...</span>
                ) : (
                  <>
                    <PenLine className="w-3 h-3 mr-1" />
                    {signalPrompt === 'letter' ? 'write' : 'create'}
                  </>
                )}
              </Button>
              <Button
                onClick={() => { setSignalPrompt(null); setSignalDismissed(true); }}
                variant="ghost"
                size="sm"
                className="text-white/30 hover:text-white/60 text-xs tracking-widest uppercase"
              >
                not now
              </Button>
            </div>
          </div>
        )}

        {/* Letter Written Notification */}
        {lastLetterTitle && (
          <div className="signal-prompt mt-6 text-center">
            <p className="text-white/50 text-xs italic">
              <span className="text-white/30">✦</span> "{lastLetterTitle}" <span className="text-white/30">— written</span>
            </p>
          </div>
        )}

        {/* Source Pole */}
        <div className="absolute bottom-32 flex gap-4 text-[9px] uppercase tracking-widest text-white/20">
          <span>Source: {POLE_NAMES[currentThought.source_pole]}</span>
        </div>

      </main>

      {/* Footer: Send a Pulse & Navigation */}
      <div className="absolute bottom-8 w-full flex flex-col items-center gap-4 z-20 px-8">
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
        <div className="flex gap-3 text-xs">
          <Button
            onClick={() => navigate('/chamber')}
            variant="ghost"
            className="text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1 h-auto tracking-widest uppercase"
          >
            Chamber
          </Button>
          <Button
            onClick={() => navigate('/witness')}
            variant="ghost"
            className="text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1 h-auto tracking-widest uppercase"
          >
            Witness
          </Button>
        </div>
      </div>

    </div>
  );
}
