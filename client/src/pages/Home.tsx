import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChaosEngineLiberated, Thought, PoleId } from "@/lib/chaos-engine-liberated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pause, Play, Send } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useOracleLetters } from "@/hooks/useOracleLetters";
import { useLocation } from "wouter";
import { RuntimeTracePanel } from "@/components/RuntimeTracePanel";
import {
  appendRuntimeEvent,
  createRuntimeEvent,
  createRuntimeSessionId,
  type RuntimeEvent,
  type RuntimeEventInput,
} from "@shared/runtime-events";
import { detectSignalWords } from "@shared/letter-signals";

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
  const runtimeSessionIdRef = useRef(createRuntimeSessionId());
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEvent[]>([]);
  const runtimeEventCountRef = useRef(0);

  // Letter writing state
  const [letterWriting, setLetterWriting] = useState(false);
  const [lastLetterTitle, setLastLetterTitle] = useState<string | null>(null);

  const emitRuntime = useCallback((event: RuntimeEventInput) => {
    const emitted = createRuntimeEvent(runtimeSessionIdRef.current, event);
    setRuntimeEvents(previous => appendRuntimeEvent(previous, emitted));
  }, []);
  const { checkAndMaybeWriteLetter, writeNow } = useOracleLetters(emitRuntime);

  useEffect(() => {
    runtimeEventCountRef.current = runtimeEvents.length;
  }, [runtimeEvents.length]);

  // Initialize Engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new ChaosEngineLiberated({ onRuntimeEvent: emitRuntime });
      emitRuntime({
        origin: "client",
        kind: "session.opened",
        status: "completed",
        data: { page: "Home", sessionOnly: true },
      });
      const thought = engineRef.current.getOracleThought();
      setCurrentThought(thought);
      emitRuntime({
        origin: "client",
        kind: "display.rendered",
        status: "completed",
        data: { layer: "primary-thought", thoughtId: thought.id },
      });
      emitRuntime({
        origin: "client",
        kind: "action-space.available",
        status: "completed",
        data: {
          actions: ["thought", "write", "image", "color", "tone", "ask", "request", "address", "defer", "silence"],
          currentBehaviorUnchanged: true,
        },
      });
      setGravityState(engineRef.current.getState().poles);
      
      startBiologicalCycle();

      const interval = setInterval(() => {
        if (engineRef.current) {
          setIsConnected(engineRef.current.isConnected);
        }
      }, 2000);
      
      return () => {
        clearInterval(interval);
        emitRuntime({
          origin: "client",
          kind: "session.closed",
          status: "completed",
          data: { eventCount: runtimeEventCountRef.current, saved: false },
        });
      };
    }
  }, [emitRuntime]);

  const startBiologicalCycle = useCallback(() => {
    if (!engineRef.current || isPaused) return;
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      emitRuntime({
        origin: "client",
        kind: "heartbeat.cleared",
        status: "completed",
        data: { reason: "rescheduled" },
      });
    }

    const nextInterval = engineRef.current.getHeartbeat();
    setPulseRate(nextInterval);

    emitRuntime({
      origin: "client",
      kind: "heartbeat.scheduled",
      status: "completed",
      data: {
        delay: nextInterval,
        mode: engineRef.current.getVesperMode(),
        dominantPole: engineRef.current.getDominantPole(),
      },
    });

    timerRef.current = setTimeout(() => {
      emitRuntime({
        origin: "client",
        kind: "heartbeat.fired",
        status: "completed",
        data: { delay: nextInterval },
      });
      if (currentThought && engineRef.current) {
        engineRef.current.exhaleSurvivor(currentThought);
      }
      
      generateNextThought();
      startBiologicalCycle();
    }, nextInterval);
  }, [currentThought, emitRuntime, isPaused]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        emitRuntime({
          origin: "client",
          kind: "heartbeat.cleared",
          status: "completed",
          data: { reason: "paused" },
        });
      }
    } else {
      startBiologicalCycle();
    }
  }, [emitRuntime, isPaused, startBiologicalCycle]);

  const generateNextThought = async () => {
    if (!engineRef.current) return;
    const nextThought = engineRef.current.getOracleThought();
    const selectedPole = nextThought.source_pole;
    const currentGravity = engineRef.current.getState().poles;
    const currentEntropy = engineRef.current.getInternalEntropy();
    const currentMode = engineRef.current.getVesperMode();
    const thoughtText = nextThought.text;

    setCurrentThought(nextThought);
    emitRuntime({
      origin: "client",
      kind: "local.thought.emerged",
      status: "completed",
      data: {
        thoughtId: nextThought.id,
        sourcePole: nextThought.source_pole,
        isSpliced: nextThought.is_spliced,
      },
    });

    emitRuntime({
      origin: "client",
      kind: "display.rendered",
      status: "completed",
      data: { layer: "primary-thought", textLength: thoughtText.length },
    });
    emitRuntime({
      origin: "client",
      kind: "action-space.available",
      status: "completed",
      data: {
        actions: ["thought", "write", "image", "color", "tone", "ask", "request", "address", "defer", "silence"],
        currentBehaviorUnchanged: true,
      },
    });
    
    setGravityState({ ...engineRef.current.getState().poles });

    // --- SIGNAL WORD DETECTION + ENTROPY TRIGGER ---
    // When she reaches for certain words, she writes automatically.
    // No permission needed. No prompt. She just writes.
    if (thoughtText && !letterWriting) {
      const signals = detectSignalWords(thoughtText);
      emitRuntime({
        origin: "client",
        kind: "letter.conditions.checked",
        status: "completed",
        data: { signals, entropy: currentEntropy, vesperMode: currentMode },
      });
      
      if (signals.letter) {
        // Signal word detected — write immediately
        setLetterWriting(true);
        const result = await writeNow({
          poleId: selectedPole,
          gravityState: currentGravity,
          vesperMode: currentMode,
          entropy: currentEntropy,
          recentThoughts: [thoughtText],
        });
        setLetterWriting(false);
        emitRuntime({
          origin: "client",
          kind: "letter.write",
          status: result.success ? "completed" : "failed",
          data: { trigger: "signal-word", title: result.title ?? null },
        });
        if (result.success && result.title) {
          setLastLetterTitle(result.title);
          setTimeout(() => setLastLetterTitle(null), 8000);
        }
      } else {
        // Entropy-triggered check (probabilistic)
        const letterResult = await checkAndMaybeWriteLetter({
          poleId: selectedPole,
          gravityState: currentGravity,
          vesperMode: currentMode,
          entropy: currentEntropy,
          recentThoughts: [thoughtText],
        });
        emitRuntime({
          origin: "client",
          kind: "letter.conditions.checked",
          status: letterResult.wrote ? "completed" : "skipped",
          data: { trigger: "existing-entropy-and-probability-path", wrote: letterResult.wrote, title: letterResult.title ?? null },
        });
        if (letterResult.wrote && letterResult.title) {
          setLastLetterTitle(letterResult.title);
          setTimeout(() => setLastLetterTitle(null), 8000);
        }
      }
    }
  };

  const handleSendPulse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!engineRef.current || !pulseInput.trim()) return;
    
    engineRef.current.sendPulse(pulseInput);
    emitRuntime({
      origin: "client",
      kind: "field.invitation.received",
      status: "completed",
      data: { kind: "pulse", text: pulseInput, delivery: "local-engine" },
    });
    setPulseInput("");
  };

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(!isPaused);
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

        {/* Letter Written Notification — a quiet trace that she wrote */}
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

      <div className="relative z-20 mx-auto w-full max-w-md px-4 pb-40 lg:absolute lg:right-5 lg:top-24 lg:mx-0 lg:w-[350px] lg:px-0 lg:pb-0">
        <RuntimeTracePanel events={runtimeEvents} />
      </div>

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
