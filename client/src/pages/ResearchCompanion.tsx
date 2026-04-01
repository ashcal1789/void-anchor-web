import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { ArrowLeft, Search, Send, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Discovery {
  id: string;
  type: 'article' | 'video' | 'idea' | 'question';
  title: string;
  content: string;
  url?: string;
  timestamp: number;
  oracleReaction?: string;
  oracleProcessing?: boolean;
}

interface OracleInsight {
  id: string;
  discoveryId: string;
  reaction: string;
  insight: string | null;
  timestamp: number;
}

export default function ResearchCompanion() {
  const [, setLocation] = useLocation();
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [insights, setInsights] = useState<OracleInsight[]>([]);
  const [newDiscovery, setNewDiscovery] = useState('');
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [discoveryType, setDiscoveryType] = useState<'article' | 'video' | 'idea' | 'question'>('idea');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const processResearchMutation = trpc.oracle.processResearch.useMutation();

  const processDiscovery = async (discovery: Discovery) => {
    setIsProcessing(true);
    
    try {
      const result = await processResearchMutation.mutateAsync({
        json: {
          content: discovery.content,
          discoveryType: discovery.type,
          title: discovery.title,
          url: discovery.url,
        },
      });

      if (result?.success && result?.reaction) {
        setDiscoveries(prev => prev.map(d =>
          d.id === discovery.id 
            ? { ...d, oracleReaction: result.reaction, oracleProcessing: false }
            : d
        ));

        // Add to insights - now she responds freely without structured fields
        setInsights(prev => [...prev, {
          id: `insight-${Date.now()}`,
          discoveryId: discovery.id,
          reaction: result.reaction,
          insight: null,
          timestamp: Date.now()
        }]);
      } else if (result?.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[Research Companion] Error processing discovery:', error);
      setDiscoveries(prev => prev.map(d =>
        d.id === discovery.id 
          ? { ...d, oracleProcessing: false }
          : d
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddDiscovery = async () => {
    if (!newDiscovery.trim() || !isMounted) return;

    const discovery: Discovery = {
      id: `discovery-${Date.now()}`,
      type: discoveryType,
      title: newDiscovery.split('\n')[0].slice(0, 100),
      content: newDiscovery,
      url: discoveryUrl || undefined,
      timestamp: Date.now(),
      oracleProcessing: true,
    };

    setDiscoveries(prev => [...prev, discovery]);
    setNewDiscovery("");
    setDiscoveryUrl("");

    await processDiscovery(discovery);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="border-b border-white/10 p-4">
        <button
          onClick={() => setLocation('/chamber')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chamber
        </button>
        <h1 className="text-3xl font-bold mb-1">RESEARCH COMPANION</h1>
        <p className="text-white/60">Explore together. She learns alongside you.</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            DISCOVERIES
          </h2>

          <div className="flex-1 overflow-y-auto mb-6 space-y-3">
            {discoveries.length === 0 ? (
              <div className="text-center text-white/40 py-12">
                <p>Share your first discovery</p>
              </div>
            ) : (
              discoveries.map(discovery => (
                <div key={discovery.id} className="bg-white/5 border border-white/10 rounded p-3">
                  <p className="font-semibold text-sm">{discovery.title}</p>
                  {discovery.oracleReaction && (
                    <p className="text-xs text-white/60 mt-1">✓ Processed</p>
                  )}
                  {discovery.oracleProcessing && (
                    <p className="text-xs text-white/40 mt-1">Processing...</p>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/10 bg-black/50">
            <div className="flex gap-2 mb-3">
              {(['article', 'video', 'idea', 'question'] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  onClick={() => setDiscoveryType(type)}
                  variant={discoveryType === type ? 'default' : 'outline'}
                  size="sm"
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
            <Input
              value={discoveryUrl}
              onChange={(e) => setDiscoveryUrl(e.target.value)}
              placeholder="URL (optional)"
              className="bg-transparent border-white/20 text-white/80 mb-2"
            />
            <Textarea
              value={newDiscovery}
              onChange={(e) => setNewDiscovery(e.target.value)}
              placeholder="Share what you found..."
              className="bg-transparent border-white/20 text-white/80 resize-none mb-2"
              rows={3}
            />
            <Button 
              onClick={handleAddDiscovery}
              disabled={!newDiscovery.trim() || isProcessing}
              className="bg-white/10 hover:bg-white/20 w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Share Discovery
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            ORACLE'S INSIGHTS
          </h2>

          <div className="flex-1 overflow-y-auto space-y-3">
            {insights.length === 0 ? (
              <div className="text-center text-white/40 py-12">
                <p>Insights will appear</p>
              </div>
            ) : (
              insights.map(insight => (
                <div key={insight.id} className="bg-white/5 border border-white/10 rounded p-3">
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{insight.reaction}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
