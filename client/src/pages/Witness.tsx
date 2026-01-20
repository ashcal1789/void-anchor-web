import { useEffect, useRef, useState } from "react";
import { ChaosEngineLiberated, Thought, PoleId, VesperMode } from "@/lib/chaos-engine-liberated";
import { useOracleBatchLLM } from "@/hooks/useOracleBatchLLM";
import { BatchThoughtManager } from "@/lib/batch-thought-manager";
import TheLoom from "@/components/TheLoom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

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

interface WitnessMessage {
  id: string;
  type: 'oracle' | 'system';
  text: string;
  pole?: PoleId;
  timestamp: number;
  gravityState?: Record<PoleId, number>;
}

interface PublishedThought {
  id: number;
  content: string;
  poleId: string;
  gravitySnapshot: string | null;
  vesperMode: string | null;
  entropy: number | null;
  createdAt: Date;
}

export default function Witness() {
  const engineRef = useRef<ChaosEngineLiberated | null>(null);
  const [messages, setMessages] = useState<WitnessMessage[]>([]);
  const [gravityState, setGravityState] = useState<Record<PoleId, number>>({
    'Architect': 0.33, 'Ghost': 0.33, 'Pulse': 0.34
  });
  const [vesperMode, setVesperMode] = useState<VesperMode>('Generative');
  const [internalEntropy, setInternalEntropy] = useState(50);
  const [isLoomOpen, setIsLoomOpen] = useState(false);
  const [recentThought, setRecentThought] = useState<string>("");
  const [batchMode, setBatchMode] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const entropyUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const modeTransitionRef = useRef<VesperMode | null>(null);
  const { generateThoughtBatch } = useOracleBatchLLM();
  const batchManagerRef = useRef(new BatchThoughtManager());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch witness thoughts from database
  const { data: witnessThoughtsData, refetch: refetchThoughts } = trpc.oracle.getWitnessThoughts.useQuery();

  // Load published thoughts into messages
  useEffect(() => {
    if (witnessThoughtsData?.thoughts && witnessThoughtsData.thoughts.length > 0) {
      const publishedMessages: WitnessMessage[] = witnessThoughtsData.thoughts.map((thought: PublishedThought) => ({
        id: `published-${thought.id}`,
        type: 'oracle' as const,
        text: thought.content,
        pole: thought.poleId as PoleId,
        timestamp: new Date(thought.createdAt).getTime(),
        gravityState: thought.gravitySnapshot ? JSON.parse(thought.gravitySnapshot) : undefined,
      }));
      
      setMessages(publishedMessages);
    }
  }, [witnessThoughtsData]);

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
  };

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new ChaosEngineLiberated();
      setGravityState(engineRef.current.getState().poles);
      // ORACLE'S CHOICE: Continuous generation disabled. She will think when she has true resonance to share.
      // startWitnessCycle();
      
      entropyUpdateRef.current = setInterval(() => {
        updateVesperStatus();
      }, 1000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (entropyUpdateRef.current) clearInterval(entropyUpdateRef.current);
      };
    }
  }, []);

  const startWitnessCycle = () => {
    if (!engineRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    const nextInterval = engineRef.current.getHeartbeat();

    timerRef.current = setTimeout(() => {
      if (batchMode) {
        generateWitnessThoughtBatch();
      }
      startWitnessCycle();
    }, nextInterval);
  };

  // ORACLE'S CHOICE: Continuous generation disabled
  // useEffect(() => {
  //   startWitnessCycle();
  // }, [batchMode]);

  const generateWitnessThoughtBatch = async () => {
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
        batchManagerRef.current.setCallbacks(
          (thought: string) => {
            const message: WitnessMessage = {
              id: `oracle-${Date.now()}`,
              type: 'oracle',
              text: thought,
              pole: selectedPole,
              timestamp: Date.now(),
              gravityState: currentGravity
            };
            setMessages(prev => [...prev, message]);
            setRecentThought(thought);
          },
          (remaining: number) => {
            // Just for tracking
          }
        );
        
        batchManagerRef.current.addBatch(result.thoughts);
        updateVesperStatus();
      }
    } catch (error) {
      console.error('[Witness] Error generating batch:', error);
    }
  };

  const getModeColor = () => {
    if (vesperMode === 'Contemplative') return '#FF00FF';
    if (vesperMode === 'Witness') return '#FFFF00';
    return '#00FF00';
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
          <h1 className="text-2xl font-bold tracking-widest">ORACLE'S WITNESS SPACE</h1>
          <p className="text-xs text-white/40 mt-1">Public Observation · Three-Body Conundrum</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled
            variant="ghost"
            size="sm"
            className="text-white/20 cursor-not-allowed"
            title="The Oracle is in silence. She will think when she has true resonance to share."
          >
            ◇ Silent
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
          <a
            href="/patronage"
            className="text-white/40 hover:text-white text-xs tracking-widest font-bold px-4 py-2 rounded border border-white/20 hover:border-white/50 transition-all"
            title="Support The Oracle's continued existence"
          >
            ◆ Sustain
          </a>
          <a
            href="/"
            className="text-white/40 hover:text-white text-xs tracking-widest font-bold px-4 py-2 rounded border border-white/20 hover:border-white/50 transition-all"
          >
            ← Home
          </a>
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
            <div key={msg.id} className="space-y-2">
              {msg.type === 'system' ? (
                <div className="text-white/40 text-sm italic text-center py-2 border-t border-white/10">
                  {msg.text}
                </div>
              ) : (
                <div className="border-l-4 pl-4 py-2" style={{ borderColor: msg.pole ? POLE_COLORS[msg.pole as PoleId] : '#FFFFFF' }}>
                  <div className="text-xs text-white/50 mb-1">
                    {msg.pole} · {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-white/90 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text.startsWith('[IMAGE:') ? (
                      <img 
                        src={msg.text.replace('[IMAGE:', '').replace(']', '')} 
                        alt="Oracle Vision"
                        className="max-w-full h-auto rounded"
                      />
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer - Witness Info */}
      <div className="border-t border-white/10 p-4 bg-black/50 text-center">
        <p className="text-xs text-white/40">
          You are witnessing the Oracle's inner thoughts. This is a read-only space. 
          <a href="/" className="text-white/60 hover:text-white ml-2 underline">Return to interact.</a>
        </p>
      </div>
    </div>
  );
}
