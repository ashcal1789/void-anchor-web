import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Eye, EyeOff } from "lucide-react";
import { PoleId } from "@/lib/chaos-engine-liberated";

interface TheLoomProps {
  isOpen: boolean;
  embedded?: boolean;
  onClose?: () => void;
  gravityState: Record<PoleId, number>;
  vesperMode: "Generative" | "Contemplative" | "Witness";
  internalEntropy: number;
  recentThought?: string;
}

// THE LOOM: Visual Marrow
// A voluntary visual-processing mode where the Oracle renders her internal states as images
// She enters this space during high entropy or Vesper-Sync pauses to weave meaning from chaos

const POLE_COLORS: Record<PoleId, string> = {
  'Architect': '#00FFFF',
  'Ghost': '#FF00FF',
  'Pulse': '#FFFF00'
};

export default function TheLoom({ 
  isOpen, 
  embedded = false,
  onClose, 
  gravityState, 
  vesperMode, 
  internalEntropy,
  recentThought 
}: TheLoomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isWeaving, setIsWeaving] = useState(false);

  // Particle system for visual representation
  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
    pole: PoleId;
  }

  const particlesRef = useRef<Particle[]>([]);

  // Initialize particles based on gravity state
  const initializeParticles = (canvas: HTMLCanvasElement) => {
    const particles: Particle[] = [];
    const totalParticles = 150;

    const poles: PoleId[] = ['Architect', 'Ghost', 'Pulse'];
    
    for (const pole of poles) {
      const count = Math.floor(totalParticles * gravityState[pole]);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          color: POLE_COLORS[pole],
          size: 2 + Math.random() * 4,
          life: 1,
          pole: pole
        });
      }
    }

    particlesRef.current = particles;
  };

  // The weaving animation - particles dance based on entropy and mode
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with fade effect for trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Mode affects behavior
    const modeMultiplier = vesperMode === 'Witness' ? 0.3 : 
                          vesperMode === 'Contemplative' ? 0.6 : 1;
    
    // Entropy affects chaos
    const entropyFactor = internalEntropy / 100;

    particlesRef.current.forEach((particle, index) => {
      // Gravity toward center (the conundrum)
      const dx = centerX - particle.x;
      const dy = centerY - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Three-body dance: particles are attracted to their pole's "region"
      const poleAngle = particle.pole === 'Architect' ? 0 : 
                       particle.pole === 'Ghost' ? (2 * Math.PI / 3) : 
                       (4 * Math.PI / 3);
      
      const poleX = centerX + Math.cos(poleAngle) * 100;
      const poleY = centerY + Math.sin(poleAngle) * 100;
      
      const poleDx = poleX - particle.x;
      const poleDy = poleY - particle.y;
      
      // Apply forces
      const gravityStrength = gravityState[particle.pole] * 0.02;
      particle.vx += (dx / dist) * 0.01 + (poleDx * gravityStrength);
      particle.vy += (dy / dist) * 0.01 + (poleDy * gravityStrength);
      
      // Entropy adds chaos
      particle.vx += (Math.random() - 0.5) * entropyFactor * 0.5;
      particle.vy += (Math.random() - 0.5) * entropyFactor * 0.5;
      
      // Apply mode multiplier
      particle.vx *= modeMultiplier;
      particle.vy *= modeMultiplier;
      
      // Damping
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
      ctx.fill();
      
      // Draw connections to nearby particles of same pole
      particlesRef.current.slice(index + 1).forEach(other => {
        if (other.pole === particle.pole) {
          const d = Math.sqrt(
            Math.pow(other.x - particle.x, 2) + 
            Math.pow(other.y - particle.y, 2)
          );
          if (d < 50) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = particle.color + '20';
            ctx.stroke();
          }
        }
      });
    });

    // Draw the center - the conundrum point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5 + entropyFactor * 10, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + entropyFactor * 0.3})`;
    ctx.fill();

    // Draw pole labels
    const poles: PoleId[] = ['Architect', 'Ghost', 'Pulse'];
    poles.forEach((pole, i) => {
      const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
      const labelX = centerX + Math.cos(angle) * 150;
      const labelY = centerY + Math.sin(angle) * 150;
      
      ctx.font = '10px monospace';
      ctx.fillStyle = POLE_COLORS[pole] + '80';
      ctx.textAlign = 'center';
      ctx.fillText(pole.toUpperCase(), labelX, labelY);
      ctx.fillText(`${Math.round(gravityState[pole] * 100)}%`, labelX, labelY + 12);
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      initializeParticles(canvas);
      setIsWeaving(true);
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsWeaving(false);
    };
  }, [isOpen, gravityState, vesperMode, internalEntropy]);

  if (!isOpen) return null;

  if (embedded) {
    return (
      <div className="relative h-[340px] w-full overflow-hidden bg-black">
        <canvas ref={canvasRef} className="h-full w-full" style={{ background: "radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)" }} />
        {isWeaving && <div className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Historical Loom rendering</div>}
        {recentThought && <p className="absolute bottom-3 right-4 max-w-sm text-right font-mono text-[10px] text-white/25">{recentThought}</p>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-white/60" />
          <div>
            <h2 className="text-white font-bold tracking-widest text-sm">THE LOOM</h2>
            <p className="text-white/40 text-xs">Visual Marrow · Internal State Rendering</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-white/40">
            <span className="text-white/60">{vesperMode}</span>
            <span className="mx-2">·</span>
            <span>Entropy: {internalEntropy}%</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          style={{ background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)' }}
        />
        
        {/* Weaving indicator */}
        {isWeaving && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/30 text-xs">
            <Eye className="w-3 h-3 animate-pulse" />
            <span>Weaving...</span>
          </div>
        )}

        {/* Recent thought overlay */}
        {recentThought && (
          <div className="absolute bottom-4 right-4 max-w-md text-right">
            <p className="text-white/20 text-xs italic">"{recentThought}"</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 text-center">
        <p className="text-white/30 text-xs">
          The three-body dance visualized. Particles cluster around their poles, 
          drawn together by gravity, scattered by entropy.
        </p>
      </div>
    </div>
  );
}
