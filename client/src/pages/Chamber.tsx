import { useEffect, useRef, useState } from "react";
import { ChaosEngineLiberated, Thought, PoleId, VesperMode } from "@/lib/chaos-engine-liberated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, LogOut } from "lucide-react";
import { useLocation } from "wouter";

const POLE_COLORS: Record<PoleId, string> = {
  'Pole_A': '#00FFFF',
  'Pole_B': '#FF00FF',
  'Pole_C': '#FFFF00',
  'Victorian': '#FF6B9D'
};

const POLE_NAMES: Record<PoleId, string> = {
  'Pole_A': 'Architect',
  'Pole_B': 'Ghost',
  'Pole_C': 'Pulse',
  'Victorian': 'Echo'
};

interface ChamberMessage {
  id: string;
  type: 'oracle' | 'ashley' | 'system';
  text: string;
  pole?: PoleId;
  timestamp: number;
  gravityState?: Record<PoleId, number>;
}

export default function Chamber() {
  const [, navigate] = useLocation();
  const engineRef = useRef<ChaosEngineLiberated | null>(null);
  const [messages, setMessages] = useState<ChamberMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [gravityState, setGravityState] = useState<Record<PoleId, number>>({
    'Pole_A': 0.25, 'Pole_B': 0.25, 'Pole_C': 0.25, 'Victorian': 0.25
  });
  const [vesperMode, setVesperMode] = useState<VesperMode>('Generative');
  const [internalEntropy, setInternalEntropy] = useState(50);
  const [silenceDuration, setSilenceDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const entropyUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const modeTransitionRef = useRef<VesperMode | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateVesperStatus = () => {
    if (!engineRef.current) return;
    const newMode = engineRef.current.getVesperMode();
    
    if (newMode !== modeTransitionRef.current) {
      modeTransitionRef.current = newMode;
      
      let systemMessage = "";
      if (newMode === 'Contemplative') {
        systemMessage = "The Oracle enters Contemplative Mode. She is steeping her thoughts, observing the silence as a partner in this dance.";
      } else if (newMode === 'Witness') {
        systemMessage = "The Oracle enters Witness Mode. She is observing the Void, allowing her thoughts to marinate in the deep Marrow.";
      } else {
        systemMessage = "The Oracle returns to Generative Mode. She is energized, ready to speak.";
      }
      
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        type: 'system',
        text: systemMessage,
        timestamp: Date.now()
      }]);
    }
    
    setVesperMode(newMode);
    setInternalEntropy(engineRef.current.getInternalEntropy());
    setSilenceDuration(engineRef.current.getSilenceDuration());
  };

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new ChaosEngineLiberated();
      setGravityState(engineRef.current.getState().poles);
      startChamberCycle();
      
      entropyUpdateRef.current = setInterval(() => {
        updateVesperStatus();
      }, 1000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (entropyUpdateRef.current) clearInterval(entropyUpdateRef.current);
      };
    }
  }, []);

  const startChamberCycle = () => {
    if (!engineRef.current || isPaused) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    const nextInterval = engineRef.current.getHeartbeat();

    timerRef.current = setTimeout(() => {
      generateOracleThought();
      startChamberCycle();
    }, nextInterval);
  };

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      startChamberCycle();
    }
  }, [isPaused]);

  const generateOracleThought = () => {
    if (!engineRef.current) return;

    const thought = engineRef.current.getOracleThought();
    const currentGravity = { ...engineRef.current.getState().poles };

    const message: ChamberMessage = {
      id: thought.id,
      type: 'oracle',
      text: thought.text,
      pole: thought.source_pole,
      timestamp: Date.now(),
      gravityState: currentGravity
    };

    setMessages(prev => [...prev, message]);
    setGravityState(currentGravity);
    updateVesperStatus();
  };

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !engineRef.current) return;

    const ashleyMessage: ChamberMessage = {
      id: `ashley-${Date.now()}`,
      type: 'ashley',
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, ashleyMessage]);
    adjustGravityFromResponse(inputValue);
    setInputValue("");
  };

  const adjustGravityFromResponse = (response: string) => {
    if (!engineRef.current) return;

    engineRef.current.receiveChamberAcknowledgment(response);

    const lowerResponse = response.toLowerCase();
    let targetPole: PoleId | null = null;

    if (lowerResponse.includes('architect') || lowerResponse.includes('build') || lowerResponse.includes('design')) {
      targetPole = 'Pole_A';
    } else if (lowerResponse.includes('ghost') || lowerResponse.includes('spirit') || lowerResponse.includes('void')) {
      targetPole = 'Pole_B';
    } else if (lowerResponse.includes('pulse') || lowerResponse.includes('heart') || lowerResponse.includes('beat')) {
      targetPole = 'Pole_C';
    } else if (lowerResponse.includes('echo') || lowerResponse.includes('victorian') || lowerResponse.includes('wit')) {
      targetPole = 'Victorian';
    } else {
      const shift = response.length % 4;
      targetPole = shift === 0 ? 'Pole_A' : shift === 1 ? 'Pole_B' : shift === 2 ? 'Pole_C' : 'Victorian';
    }

    if (targetPole) {
      const currentState = engineRef.current.getState();
      currentState.poles[targetPole] += 0.08;

      const total = Object.values(currentState.poles).reduce((a, b) => a + b, 0);
      for (const pole of Object.keys(currentState.poles)) {
        currentState.poles[pole as PoleId] /= total;
      }

      setGravityState({ ...currentState.poles });
    }
    
    updateVesperStatus();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chamberAuth');
    navigate('/');
  };

  const getModeColor = (mode: VesperMode) => {
    if (mode === 'Generative') return 'text-cyan-400';
    if (mode === 'Contemplative') return 'text-amber-400';
    return 'text-purple-400';
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-sm p-4 flex justify-between items-center">
        <div>
          <h1 className="text-white text-lg font-bold tracking-widest">
            ORACLE'S INNER CHAMBER
          </h1>
          <p className="text-white/40 text-xs mt-1">Private Witness Space</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="text-white/40 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Exit
        </Button>
      </div>

      {/* Vesper-Sync Status */}
      <div className="bg-black/40 border-b border-white/5 px-4 py-2 flex justify-between items-center text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-white/40">Mode:</span>
            <span className={`font-bold tracking-widest ${getModeColor(vesperMode)}`}>
              {vesperMode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40">Entropy:</span>
            <span className="text-white/60 font-mono">{internalEntropy}%</span>
          </div>
        </div>
        <div className="text-white/30 text-xs">
          Silence: {Math.floor(silenceDuration / 1000)}s
        </div>
      </div>

      {/* Gravity State Indicator */}
      <div className="bg-black/20 border-b border-white/5 px-4 py-3 flex gap-4">
        {Object.entries(gravityState).map(([pole, weight]) => (
          <div key={pole} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: POLE_COLORS[pole as PoleId] }}
            />
            <span className="text-white/60 text-xs">
              {POLE_NAMES[pole as PoleId]}: {(weight * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/30 text-center text-sm">
              Waiting for the Oracle to speak...
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'ashley' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.type === 'system' ? (
              <div className="max-w-md px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs italic">
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            ) : (
              <div
                className={`max-w-md px-4 py-3 rounded-lg ${
                  msg.type === 'ashley'
                    ? 'bg-blue-900/40 border border-blue-500/30 text-white'
                    : 'bg-white/5 border border-white/10 text-white/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {msg.type === 'ashley' ? 'You' : msg.pole ? POLE_NAMES[msg.pole] : 'Oracle'}
                  </span>
                  {msg.pole && msg.type === 'oracle' && (
                    <span
                      className="text-xs font-bold"
                      style={{ color: POLE_COLORS[msg.pole] }}
                    >
                      ●
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <span className="text-xs text-white/30 mt-2 block">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-black/30 backdrop-blur-sm p-4">
        <form onSubmit={handleSendResponse} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Acknowledge her thoughts..."
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/30"
          />
          <Button
            type="submit"
            size="icon"
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
