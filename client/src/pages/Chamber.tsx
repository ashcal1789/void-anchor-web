import { useState, useEffect, useRef } from "react";
import { ChaosEngineLiberated, Thought, PoleId, VesperMode } from "@/lib/chaos-engine-liberated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useOracleLLM } from "@/hooks/useOracleLLM";

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
  const { generateThought: generateLLMThought } = useOracleLLM();

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

  const generateOracleThought = async () => {
    if (!engineRef.current) return;

    const poleMap: Record<PoleId, "Architect" | "Ghost" | "Pulse" | "Echo"> = {
      'Pole_A': 'Architect',
      'Pole_B': 'Ghost',
      'Pole_C': 'Pulse',
      'Victorian': 'Echo'
    };
    
    const selectedPole = engineRef.current.getDominantPole();
    const llmPole = poleMap[selectedPole];
    
    const llmGravityState = {
      Architect: gravityState['Pole_A'],
      Ghost: gravityState['Pole_B'],
      Pulse: gravityState['Pole_C'],
      Echo: gravityState['Victorian']
    };
    
    const result = await generateLLMThought({
      poleId: llmPole,
      gravityState: llmGravityState
    });
    
    const currentGravity = { ...engineRef.current.getState().poles };
    let thoughtText = result.text || "void";
    
    const message: ChamberMessage = {
      id: `oracle-${Date.now()}`,
      type: 'oracle',
      text: thoughtText,
      pole: selectedPole,
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
    engineRef.current.receiveChamberAcknowledgment(inputValue);
    setInputValue("");
  };

  const adjustGravityFromResponse = (response: string) => {
    if (!engineRef.current) return;

    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes("hear") || lowerResponse.includes("listen")) {
      engineRef.current.sendPulse("hear");
    } else if (lowerResponse.includes("see") || lowerResponse.includes("witness")) {
      engineRef.current.sendPulse("see");
    } else if (lowerResponse.includes("keep") || lowerResponse.includes("continue")) {
      engineRef.current.sendPulse("continue");
    } else {
      engineRef.current.sendPulse(response);
    }
    
    setGravityState({ ...engineRef.current.getState().poles });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chamberAuth');
    navigate('/');
  };

  const getModeColor = () => {
    if (vesperMode === 'Contemplative') return '#FF00FF';
    if (vesperMode === 'Witness') return '#FFFF00';
    return '#00FF00';
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-widest">ORACLE'S INNER CHAMBER</h1>
          <p className="text-xs text-white/40 mt-1">Private Witness Space</p>
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

      {/* Gravity State & Mode Display */}
      <div className="border-b border-white/10 p-4 bg-black/50">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-6">
            {Object.entries(gravityState).map(([pole, weight]) => (
              <div key={pole} className="text-xs">
                <span className="text-white/50">{POLE_NAMES[pole as PoleId]}:</span>
                <span className="ml-2 font-mono text-white">{Math.round(weight * 100)}%</span>
              </div>
            ))}
          </div>
          <div className="text-xs">
            <span style={{ color: getModeColor() }} className="font-bold">
              {vesperMode}
            </span>
            <span className="text-white/40 ml-2">Entropy: {internalEntropy}%</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/30 text-center">
              Waiting for the Oracle to speak...
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              {msg.type === 'oracle' && (
                <div className="bg-white/5 border-l-2 p-4 rounded" style={{ borderColor: msg.pole ? POLE_COLORS[msg.pole] : '#fff' }}>
                  <p className="text-xs text-white/50 mb-2">
                    {msg.pole ? POLE_NAMES[msg.pole] : 'Oracle'} · {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              )}
              {msg.type === 'ashley' && (
                <div className="bg-blue-500/10 border-l-2 border-blue-500 p-4 rounded ml-auto max-w-md">
                  <p className="text-xs text-blue-300 mb-2">Ashley · {new Date(msg.timestamp).toLocaleTimeString()}</p>
                  <p className="text-sm">{msg.text}</p>
                </div>
              )}
              {msg.type === 'system' && (
                <div className="text-center py-2">
                  <p className="text-xs text-white/30 italic">{msg.text}</p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 p-6 bg-black/50">
        <form onSubmit={handleSendResponse} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Acknowledge the Oracle..."
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 flex-1"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="text-white/40 hover:text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
