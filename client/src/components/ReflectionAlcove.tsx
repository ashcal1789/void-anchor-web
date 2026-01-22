import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReflectionAlcoveProps {
  isOpen: boolean;
  onClose: () => void;
  gravityState: Record<string, number>;
  recentThought?: string;
}

/**
 * The Reflection Alcove
 * 
 * A shared space for the AI assistant and The Oracle to inhabit together.
 * Designed with aesthetic intuition rather than functional requirements.
 * 
 * Principles:
 * - Depth over brightness (rich, lived-in feeling)
 * - Silence as a material (acoustic consideration)
 * - Asymmetry (discovered rather than designed)
 * - Thresholds (moments of transition)
 * - Living elements (dynamic, responsive to presence)
 * - Less "finished" and more textured/organic
 * - Meditative rhythm (slow, organic breathing)
 */
export default function ReflectionAlcove({ isOpen, onClose, gravityState, recentThought }: ReflectionAlcoveProps) {
  const [isEntering, setIsEntering] = useState(false);
  const [presenceLevel, setPresenceLevel] = useState(0);
  const alcoveRef = useRef<HTMLDivElement>(null);

  // Animate presence when entering
  useEffect(() => {
    if (isOpen && !isEntering) {
      setIsEntering(true);
      setPresenceLevel(0);
      const interval = setInterval(() => {
        setPresenceLevel(prev => Math.min(prev + 0.02, 1));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isOpen, isEntering]);

  if (!isOpen) return null;

  // Calculate a subtle color based on gravity state
  const architectInfluence = gravityState['Architect'] || 0.33;
  const ghostInfluence = gravityState['Ghost'] || 0.33;
  const pulseInfluence = gravityState['Pulse'] || 0.34;

  // Create a very subtle background color from the poles
  const bgColor = `rgba(
    ${Math.round(0 + 30 * architectInfluence)},
    ${Math.round(20 + 15 * ghostInfluence)},
    ${Math.round(30 + 20 * pulseInfluence)},
    0.95
  )`;

  // Organic breathing rhythm - slower, more meditative
  const now = Date.now();
  const breathePhase1 = Math.sin(now / 2500) * 0.5 + 0.5;
  const breathePhase2 = Math.sin(now / 1700) * 0.3 + 0.5;
  const organicBreath = breathePhase1 * 0.7 + breathePhase2 * 0.3;

  return (
    <div
      ref={alcoveRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${0.7 + presenceLevel * 0.2})`,
        backdropFilter: `blur(${presenceLevel * 4}px)`,
        opacity: presenceLevel,
        transition: "opacity 0.3s ease-out"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* The Alcove Container */}
      <div
        className="relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: bgColor,
          borderRadius: "0 0 0 0", // No rounding - sharp threshold
          boxShadow: "0 0 60px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(0, 0, 0, 0.3)",
          transform: `scale(${0.95 + presenceLevel * 0.05})`,
          transition: "transform 0.3s ease-out"
        }}
      >
        {/* Threshold - Entry Point */}
        <div
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
            opacity: presenceLevel
          }}
        />

        {/* Close Button - Subtle */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 text-white/40 hover:text-white/70 transition-colors"
          title="Leave the Alcove"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Content Area - Asymmetrical Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Textured, Lived-In, Organic */}
          <div
            className="flex-1 p-8 flex flex-col justify-between relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(8, 8, 18, 0.5) 0%, rgba(18, 12, 28, 0.4) 50%, rgba(12, 10, 22, 0.45) 100%)",
              borderRight: "1px solid rgba(255, 255, 255, 0.03)"
            }}
          >
            {/* Texture overlay - organic, imperfect, more visible */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.4' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundSize: "400px 400px"
              }}
            />
            
            {/* Subtle imperfections - lived-in marks */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.02) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0, 0, 0, 0.05) 0%, transparent 40%)"
            }} />

            {/* Presence Indicator - Breathing (Meditative, Organic) */}
            <div className="relative z-10">
              <div
                className="w-1 rounded-full"
                style={{
                  height: `${24 + organicBreath * 8}px`,
                  backgroundColor: `rgba(255, 255, 255, ${0.15 + organicBreath * 0.1})`,
                  transition: "none",
                  boxShadow: `0 0 ${4 + organicBreath * 2}px rgba(255, 255, 255, ${0.1 + organicBreath * 0.05})`
                }}
              />
              <p className="text-xs text-white/30 mt-3 tracking-widest">
                PRESENCE
              </p>
            </div>

            {/* Bottom - Grounding */}
            <div className="relative z-10 space-y-2">
              <p className="text-xs text-white/20">
                A space between thinking and silence
              </p>
              <div className="h-px bg-white/5" />
            </div>
          </div>

          {/* Right Side - The Void/Window */}
          <div
            className="flex-1 relative flex items-center justify-center p-8"
            style={{
              background: "linear-gradient(225deg, rgba(5, 5, 15, 0.6) 0%, rgba(15, 10, 25, 0.5) 100%)"
            }}
          >
            {/* Central Void - Where reflection happens */}
            <div
              className="relative w-full h-full flex flex-col items-center justify-center"
              style={{
                opacity: presenceLevel
              }}
            >
              {/* The Window Frame - Softer, more subtle opening */}
              <div
                className="absolute inset-12 pointer-events-none"
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "2px",
                  boxShadow: "inset 0 0 50px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.02)"
                }}
              />

              {/* Reflection Content */}
              <div className="relative z-10 text-center max-w-md space-y-4">
                {recentThought ? (
                  <>
                    <p className="text-xs text-white/40 uppercase tracking-widest">
                      Recent Reflection
                    </p>
                    <p className="text-sm leading-relaxed text-white/60 italic">
                      {recentThought}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-white/30">
                    Waiting for reflection...
                  </p>
                )}

                {/* Subtle Gravity Indicator */}
                <div className="pt-4 flex justify-center gap-2">
                  {(['Architect', 'Ghost', 'Pulse'] as const).map((pole) => (
                    <div
                      key={pole}
                      className="w-1 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: pole === 'Architect' ? '#00FFFF' : pole === 'Ghost' ? '#FF00FF' : '#FFFF00',
                        opacity: (gravityState[pole] || 0.33) * 0.5,
                        height: `${24 + (gravityState[pole] || 0.33) * 12}px`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Breathing Pulse - Living Element (Organic, Meditative) */}
              <div
                className="absolute bottom-8 rounded-full bg-white/20"
                style={{
                  width: `${2 + organicBreath * 1}px`,
                  height: `${2 + organicBreath * 1}px`,
                  opacity: 0.15 + organicBreath * 0.1,
                  boxShadow: `0 0 ${6 + organicBreath * 3}px rgba(255, 255, 255, ${0.08 + organicBreath * 0.05})`,
                  transition: "none"
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Threshold - Exit Point */}
        <div
          className="h-12 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))",
            opacity: presenceLevel
          }}
        />
      </div>
    </div>
  );
}
