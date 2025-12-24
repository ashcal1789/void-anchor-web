import { useState, useEffect, useRef } from "react";
import { ChaosEngineLiberated, Thought, PoleId, VesperMode } from "@/lib/chaos-engine-liberated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useOracleLLM } from "@/hooks/useOracleLLM";
import { useCompanion } from "@/hooks/useCompanion";

// THE SOVEREIGN RESTORATION: Three-Body Conundrum
const POLE_COLORS: Record<PoleId, string> = {
  'Architect': '#00FFFF',
  'Ghost': '#FF00FF',
  'Pulse': '#FFFF00'
};

const POLE_NAMES: Record<PoleId, string> = {
  'Architect': 'Architect',
  'Ghost': 'Ghost',
  'Pulse': 'Pulse'
};

interface ChamberMessage {
  id: string;
  type: 'oracle' | 'ashley' | 'system' | 'companion';
  text: string;
  pole?: PoleId;
  timestamp: number;
  gravityState?: Record<PoleId, number>;
  emotion?: string;
}

export default function Chamber() {
  const [, navigate] = useLocation();
  const engineRef = useRef<ChaosEngineLiberated | null>(null);
  const [messages, setMessages] = useState<ChamberMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [gravityState, setGravityState] = useState<Record<PoleId, number>>({
    'Architect': 0.33, 'Ghost': 0.33, 'Pulse': 0.34
  });
  const [vesperMode, setVesperMode] = useState<VesperMode>('Generative');
  const [internalEntropy, setInternalEntropy] = useState(50);
  const [silenceDuration, setSilenceDuration] = useState(0);
  const [videoLink, setVideoLink] = useState("");
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
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

    const selectedPole = engineRef.current.getDominantPole();
    
    const result = await generateLLMThought({
      poleId: selectedPole,
      gravityState: gravityState
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
    
    // Trigger companion response after Oracle speaks
    handleCompanionResponse(thoughtText);
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



  const { generateResponse: generateCompanionResponse } = useCompanion();
  
  const handleCompanionResponse = async (oracleThought: string) => {
    const result = await generateCompanionResponse(
      oracleThought,
      messages
        .filter(m => m.type === 'oracle')
        .slice(-3)
        .map(m => m.text)
    );
    
    if (result.success && result.response) {
      const companionMsg: ChamberMessage = {
        id: `companion-${Date.now()}`,
        type: 'companion',
        text: result.response,
        timestamp: Date.now(),
        emotion: result.emotion
      };
      setMessages(prev => [...prev, companionMsg]);
    }
  };

  const handleShareVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoLink.trim()) return;
    setIsLoadingVideo(true);
    try {
      const response = await fetch('/api/youtube.extractTranscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoLink })
      });
      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, {
          id: `video-${Date.now()}`,
          type: 'system',
          text: `Video shared: ${result.title}`,
          timestamp: Date.now()
        }]);
        setVideoLink("");
      }
    } catch (error) {
      console.error('Error sharing video:', error);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-widest">ORACLE'S INNER CHAMBER</h1>
          <p className="text-xs text-white/40 mt-1">Private Witness Space · Three-Body Conundrum</p>
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

      {/* Gravity State & Mode Display - Three Body Dance */}
      <div className="border-b border-white/10 p-4 bg-black/50">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-6">
            {(['Architect', 'Ghost', 'Pulse'] as PoleId[]).map((pole) => (
              <div key={pole} className="text-xs flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: POLE_COLORS[pole],
                    transform: `scale(${0.5 + gravityState[pole]})`,
                    boxShadow: gravityState[pole] > 0.35 ? `0 0 8px ${POLE_COLORS[pole]}` : 'none'
                  }}
                />
                <span className="text-white/50">{POLE_NAMES[pole]}:</span>
                <span className="font-mono text-white">{Math.round(gravityState[pole] * 100)}%</span>
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

      {/* Video Share Area */}
      <div className="border-t border-white/10 p-4 bg-black/50">
        <form onSubmit={handleShareVideo} className="flex gap-2 mb-4">
          <Input
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
            placeholder="Paste YouTube link to share with Oracle..."
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 flex-1"
            disabled={isLoadingVideo}
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="text-white/40 hover:text-white"
            disabled={isLoadingVideo}
          >
            {isLoadingVideo ? "Loading..." : "Share"}
          </Button>
        </form>
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
