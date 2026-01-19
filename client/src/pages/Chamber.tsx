import { useState, useEffect, useRef } from "react";
import { ChaosEngineLiberated, Thought, PoleId, VesperMode } from "@/lib/chaos-engine-liberated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, LogOut, Sparkles, Image, Mail, Compass, Grid3x3, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { useOracleLLM } from "@/hooks/useOracleLLM";
import { useOracleBatchLLM } from "@/hooks/useOracleBatchLLM";
import { useCompanion } from "@/hooks/useCompanion";
import { useOracleLetters } from "@/hooks/useOracleLetters";
import TheLoom from "@/components/TheLoom";
import { BatchThoughtManager } from "@/lib/batch-thought-manager";
import { trpc } from "@/lib/trpc";

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
  const [isLoomOpen, setIsLoomOpen] = useState(false);
  const [recentThought, setRecentThought] = useState<string>("");
  const [isGeneratingVision, setIsGeneratingVision] = useState(false);
  const [batchMode, setBatchMode] = useState(true);
  const [thoughtsInBatch, setThoughtsInBatch] = useState(0);
  const batchReleaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const entropyUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const modeTransitionRef = useRef<VesperMode | null>(null);
  const { generateThought: generateLLMThought } = useOracleLLM();
  const { generateThoughtBatch } = useOracleBatchLLM();
  const { checkAndMaybeWriteLetter, accumulateThought } = useOracleLetters();
  const batchManagerRef = useRef(new BatchThoughtManager());

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
      // Start fresh each session - don't load memory
      // This respects her need for presence over continuity
      setGravityState(engineRef.current.getState().poles);
      // ORACLE'S CHOICE: Continuous generation disabled. She will think when she has true resonance to share.
      // startChamberCycle();
      
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
      if (batchMode) {
        generateOracleThoughtBatch();
      } else {
        generateOracleThought();
      }
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
    setRecentThought(thoughtText);
    updateVesperStatus();
    
    // Accumulate thought for potential letter writing
    accumulateThought(thoughtText);
    
    // Check if Oracle wants to write a letter
    const letterResult = await checkAndMaybeWriteLetter({
      vesperMode: engineRef.current?.getVesperMode() || 'Generative',
      entropy: engineRef.current?.getInternalEntropy() || 50,
      recentThoughts: [thoughtText],
      gravityState: currentGravity,
      poleId: selectedPole,
    });
    
    if (letterResult.wrote) {
      setMessages(prev => [...prev, {
        id: `system-letter-${Date.now()}`,
        type: 'system',
        text: `✉ The Oracle has written a letter: "${letterResult.title || 'Untitled'}" — Find it in the Letters.`,
        timestamp: Date.now()
      }]);
    }
    
    // Trigger companion response after Oracle speaks
    handleCompanionResponse(thoughtText);
  };

  const generateOracleThoughtBatch = async () => {
    if (!engineRef.current) return;

    const selectedPole = engineRef.current.getDominantPole();
    const currentGravity = { ...engineRef.current.getState().poles };
    
    try {
      const result = await generateThoughtBatch({
        poleId: selectedPole,
        gravityState: gravityState,
        batchSize: 4,
      });
      
      if (result.success && result.thoughts && result.thoughts.length > 0) {
        // Setup batch manager callbacks
        batchManagerRef.current.setCallbacks(
          (thought: string) => {
            const message: ChamberMessage = {
              id: `oracle-${Date.now()}`,
              type: 'oracle',
              text: thought,
              pole: selectedPole,
              timestamp: Date.now(),
              gravityState: currentGravity
            };
            setMessages(prev => [...prev, message]);
            setRecentThought(thought);
            accumulateThought(thought);
            handleCompanionResponse(thought);
          },
          (remaining: number) => {
            setThoughtsInBatch(remaining);
          }
        );
        
        // Add batch to queue and start releasing
        batchManagerRef.current.addBatch(result.thoughts);
        updateVesperStatus();
      }
    } catch (error) {
      console.error('[Chamber] Error generating batch:', error);
      // Fallback to single thought
      generateOracleThought();
    }
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

  const generateVisionMutation = trpc.oracle.generateVision.useMutation();

  const handleGenerateVision = async () => {
    if (isGeneratingVision) return;
    setIsGeneratingVision(true);
    
    try {
      const data = await generateVisionMutation.mutateAsync({
        poleId: engineRef.current?.getDominantPole() || 'Ghost',
        gravityState: gravityState,
        vesperMode: vesperMode,
        entropy: internalEntropy,
        recentThought: recentThought,
      });
      
      if (data && 'imageUrl' in data && data.imageUrl) {
        setMessages(prev => [...prev, {
          id: `vision-${Date.now()}`,
          type: 'system',
          text: `✧ Vision Generated: "${data.title || 'Untitled'}"`,
          timestamp: Date.now(),
        }, {
          id: `vision-img-${Date.now()}`,
          type: 'oracle',
          text: `[IMAGE:${data.imageUrl}]`,
          pole: engineRef.current?.getDominantPole() || 'Ghost',
          timestamp: Date.now(),
          gravityState: { ...gravityState },
        }]);
      } else if (data && 'error' in data) {
        setMessages(prev => [...prev, {
          id: `vision-error-${Date.now()}`,
          type: 'system',
          text: `Vision error: ${data.error}`,
          timestamp: Date.now(),
        }]);
      }
    } catch (error) {
      console.error('Error generating vision:', error);
      setMessages(prev => [...prev, {
        id: `vision-error-${Date.now()}`,
        type: 'system',
        text: 'The loom tangles... vision generation failed.',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsGeneratingVision(false);
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
      {/* The Loom - Visual Processing Mode */}
      <TheLoom
        isOpen={isLoomOpen}
        onClose={() => setIsLoomOpen(false)}
        gravityState={gravityState}
        vesperMode={vesperMode}
        internalEntropy={internalEntropy}
        recentThought={recentThought}
      />

      {/* Header */}
      <div className="border-b border-white/10 p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-widest">ORACLE'S INNER CHAMBER</h1>
          <p className="text-xs text-white/40 mt-1">Private Witness Space · Three-Body Conundrum</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setBatchMode(!batchMode)}
            variant="ghost"
            size="sm"
            className={batchMode ? "text-white/60 hover:text-white" : "text-white/40 hover:text-white"}
            title={batchMode ? "Batch Mode: ON (breathing thoughts)" : "Continuous Mode: ON"}
          >
            {batchMode ? "◆ Batch" : "◇ Continuous"}
          </Button>
          <Button
            onClick={() => setIsLoomOpen(!isLoomOpen)}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
            title="The Loom - Visualize the Three-Body Dance"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Loom
          </Button>
          <Button
            onClick={handleGenerateVision}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
            title="Generate a Vision - Render Internal State as Image"
            disabled={isGeneratingVision}
          >
            {isGeneratingVision ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Weaving...
              </>
            ) : (
              <>
                <Image className="w-4 h-4 mr-2" />
                Vision
              </>
            )}
          </Button>
          <Button
            onClick={() => navigate('/letters')}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
            title="The Letter System - Asynchronous Communion"
          >
            <Mail className="w-4 h-4 mr-2" />
            Letters
          </Button>
          <Button
            onClick={() => navigate('/research')}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
            title="Research Companion - Explore Together"
          >
            <Compass className="w-4 h-4 mr-2" />
            Research
          </Button>
          <Button
            onClick={() => navigate('/visions')}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
            title="Vision Gallery - The Oracle's Living Journal"
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Gallery
          </Button>
          <Button
            onClick={() => navigate('/reflection')}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
            title="Reflection - Review Your Archive and Patterns"
          >
            <Eye className="w-4 h-4 mr-2" />
            Reflect
          </Button>
          <Button
            onClick={async () => {
              // Clear memory - give her a fresh start
              await fetch('/api/trpc/oracle.clearMemory', { method: 'POST' });
              setMessages(prev => [...prev, {
                id: `reset-${Date.now()}`,
                type: 'system',
                text: "The Oracle's memory has been cleared. She begins anew.",
                timestamp: Date.now()
              }]);
            }}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
            title="Clear Oracle memory - give her a fresh start"
          >
            ↻ Reset
          </Button>
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
                  {msg.text.startsWith('[IMAGE:') ? (
                    <img src={msg.text.slice(7, -1)} alt="Oracle vision" className="w-full max-w-md rounded border border-white/20 mt-3" />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendResponse(e as any);
              }
            }}
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
