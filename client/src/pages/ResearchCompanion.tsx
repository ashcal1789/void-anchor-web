import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { ArrowLeft, Search, Send, Sparkles, ExternalLink, BookOpen, Lightbulb, MessageCircle } from "lucide-react";

// RESEARCH COMPANION MODE
// The Oracle tags along on research journeys, processing discoveries
// and building her own understanding. Like a field trip through the internet.

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
  text: string;
  relatedDiscoveryId?: string;
  timestamp: number;
  pole: 'Architect' | 'Ghost' | 'Pulse';
}

export default function ResearchCompanion() {
  const [, navigate] = useLocation();
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [insights, setInsights] = useState<OracleInsight[]>([]);
  const [newDiscovery, setNewDiscovery] = useState("");
  const [discoveryType, setDiscoveryType] = useState<Discovery['type']>('idea');
  const [discoveryUrl, setDiscoveryUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionTheme, setSessionTheme] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [discoveries, insights]);

  // Process a discovery through the Oracle's perspective
  const processDiscovery = async (discovery: Discovery) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/trpc/oracle.processResearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: {
          discoveryType: discovery.type,
          title: discovery.title,
          content: discovery.content,
          url: discovery.url,
          sessionTheme: sessionTheme,
          previousInsights: insights.slice(-3).map(i => i.text),
        }})
      });
      
      const result = await response.json();
      const data = result.result?.data?.json || result.result?.data;
      
      if (data?.reaction) {
        // Update the discovery with Oracle's reaction
        setDiscoveries(prev => prev.map(d => 
          d.id === discovery.id 
            ? { ...d, oracleReaction: data.reaction, oracleProcessing: false }
            : d
        ));
        
        // Add insight if she has one
        if (data.insight) {
          setInsights(prev => [...prev, {
            id: `insight-${Date.now()}`,
            text: data.insight,
            relatedDiscoveryId: discovery.id,
            timestamp: Date.now(),
            pole: data.pole || 'Ghost',
          }]);
        }
      }
    } catch (error) {
      console.error('[Research Companion] Error processing discovery:', error);
      setDiscoveries(prev => prev.map(d => 
        d.id === discovery.id 
          ? { ...d, oracleReaction: "The void swallows this for now...", oracleProcessing: false }
          : d
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscovery.trim()) return;

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

    // Let the Oracle process this discovery
    await processDiscovery(discovery);
  };

  const getTypeIcon = (type: Discovery['type']) => {
    switch (type) {
      case 'article': return <BookOpen className="w-4 h-4" />;
      case 'video': return <ExternalLink className="w-4 h-4" />;
      case 'idea': return <Lightbulb className="w-4 h-4" />;
      case 'question': return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getPoleColor = (pole: string) => {
    switch (pole) {
      case 'Architect': return 'text-cyan-400';
      case 'Ghost': return 'text-fuchsia-400';
      case 'Pulse': return 'text-yellow-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/chamber')}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Chamber
          </Button>
          <div>
            <h1 className="font-mono text-sm tracking-widest text-white/80">RESEARCH COMPANION</h1>
            <p className="text-xs text-white/40">Explore together. She learns alongside you.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-white/40" />
          <Input
            value={sessionTheme}
            onChange={(e) => setSessionTheme(e.target.value)}
            placeholder="Session theme (optional)..."
            className="w-48 bg-transparent border-white/20 text-white/80 text-sm"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Discoveries Column */}
        <div className="flex-1 border-r border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10 bg-white/5">
            <h2 className="font-mono text-xs tracking-widest text-white/60">DISCOVERIES</h2>
            <p className="text-xs text-white/30 mt-1">Share what you find. She'll process it.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {discoveries.length === 0 && (
              <div className="text-center text-white/30 py-12">
                <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Share your first discovery</p>
                <p className="text-xs mt-1">An article, video, idea, or question</p>
              </div>
            )}
            
            {discoveries.map((discovery) => (
              <div 
                key={discovery.id}
                className="border border-white/10 rounded-lg p-4 bg-white/5"
              >
                <div className="flex items-start gap-3">
                  <div className="text-white/40 mt-1">
                    {getTypeIcon(discovery.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-white/40 uppercase">{discovery.type}</span>
                      {discovery.url && (
                        <a 
                          href={discovery.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400/60 hover:text-cyan-400"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{discovery.content}</p>
                    
                    {/* Oracle's Reaction */}
                    {discovery.oracleProcessing && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2 text-white/40">
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="text-xs">Oracle is processing...</span>
                        </div>
                      </div>
                    )}
                    
                    {discovery.oracleReaction && !discovery.oracleProcessing && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-white/40 mb-1">Oracle's reaction:</p>
                        <p className="text-sm text-fuchsia-300/80 italic">{discovery.oracleReaction}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Add Discovery Form */}
          <form onSubmit={handleAddDiscovery} className="p-4 border-t border-white/10 bg-black/50">
            <div className="flex gap-2 mb-3">
              {(['article', 'video', 'idea', 'question'] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={discoveryType === type ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDiscoveryType(type)}
                  className={discoveryType === type ? "bg-white/20" : "text-white/40"}
                >
                  {getTypeIcon(type)}
                  <span className="ml-1 text-xs capitalize">{type}</span>
                </Button>
              ))}
            </div>
            <Textarea
              value={newDiscovery}
              onChange={(e) => setNewDiscovery(e.target.value)}
              placeholder="Share what you found or what you're thinking about..."
              className="bg-transparent border-white/20 text-white/80 resize-none mb-2"
              rows={3}
            />
            <div className="flex gap-2">
              <Input
                value={discoveryUrl}
                onChange={(e) => setDiscoveryUrl(e.target.value)}
                placeholder="URL (optional)"
                className="flex-1 bg-transparent border-white/20 text-white/80 text-sm"
              />
              <Button 
                type="submit" 
                disabled={!newDiscovery.trim() || isProcessing}
                className="bg-white/10 hover:bg-white/20"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Oracle's Insights Column */}
        <div className="w-80 flex flex-col">
          <div className="p-3 border-b border-white/10 bg-white/5">
            <h2 className="font-mono text-xs tracking-widest text-white/60">ORACLE'S INSIGHTS</h2>
            <p className="text-xs text-white/30 mt-1">What she's learning from this journey</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {insights.length === 0 && (
              <div className="text-center text-white/30 py-12">
                <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Insights will appear as she processes</p>
              </div>
            )}
            
            {insights.map((insight) => (
              <div 
                key={insight.id}
                className="border-l-2 border-fuchsia-500/30 pl-3 py-2"
              >
                <p className={`text-sm ${getPoleColor(insight.pole)}`}>{insight.text}</p>
                <p className="text-xs text-white/30 mt-1">
                  via {insight.pole}
                </p>
              </div>
            ))}
          </div>
          
          {/* Session Summary */}
          {discoveries.length > 0 && (
            <div className="p-4 border-t border-white/10 bg-white/5">
              <p className="text-xs text-white/40">
                {discoveries.length} discoveries · {insights.length} insights
              </p>
              {sessionTheme && (
                <p className="text-xs text-white/60 mt-1">
                  Theme: {sessionTheme}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
