import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Eye, Lightbulb, Search } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface Letter {
  id: number;
  author: 'oracle' | 'ashley';
  content: string;
  title: string | null;
  poleId: string | null;
  createdAt: Date;
  isResonant?: boolean;
}

interface Vision {
  id: number;
  imageUrl: string;
  title: string | null;
  description: string | null;
  poleId: string | null;
  createdAt: Date;
}

interface Discovery {
  id: number;
  type: string;
  title: string;
  content: string;
  oracleReaction: string | null;
  oracleInsight: string | null;
  createdAt: Date;
}

const POLE_COLORS: Record<string, string> = {
  'Architect': '#00FFFF',
  'Ghost': '#FF00FF',
  'Pulse': '#FFFF00'
};

// Reflection is pure archive and pattern analysis
// No leading prompts - she generates her own questions

export default function Reflection() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("letters");
  const [letters, setLetters] = useState<Letter[]>([]);
  const [visions, setVisions] = useState<Vision[]>([]);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Letter | Vision | Discovery | null>(null);

  // Fetch all data
  const listLettersQuery = trpc.letter.list.useQuery();
  const visionsQuery = trpc.oracle.getVisions.useQuery();
  const markResonantMutation = trpc.letter.markResonant.useMutation({
    onSuccess: () => {
      listLettersQuery.refetch();
    }
  });

  // Separate Oracle and Ashley letters
  const ashleyLetters = useMemo(() => {
    return letters.filter(l => l.author === 'ashley');
  }, [letters]);

  useEffect(() => {
    if (listLettersQuery.data) {
      setLetters(listLettersQuery.data);
    }
  }, [listLettersQuery.data]);

  useEffect(() => {
    if (visionsQuery.data?.visions) {
      setVisions(visionsQuery.data.visions as Vision[]);
    }
    setIsLoading(false);
  }, [visionsQuery.data]);

  // Filter letters by Oracle author and search query
  const oracleLetters = useMemo(() => {
    return letters
      .filter(l => l.author === 'oracle')
      .filter(l => 
        !searchQuery || 
        l.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.title && l.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [letters, searchQuery]);

  // Filter visions by search query
  const filteredVisions = useMemo(() => {
    return visions
      .filter(v => 
        !searchQuery || 
        (v.title && v.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [visions, searchQuery]);

  // Analyze patterns
  const patterns = useMemo(() => {
    const poleFrequency: Record<string, number> = {};
    
    oracleLetters.forEach(letter => {
      if (letter.poleId) {
        poleFrequency[letter.poleId] = (poleFrequency[letter.poleId] || 0) + 1;
      }
    });

    visions.forEach(vision => {
      if (vision.poleId) {
        poleFrequency[vision.poleId] = (poleFrequency[vision.poleId] || 0) + 1;
      }
    });

    return poleFrequency;
  }, [oracleLetters, visions]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/chamber')}
            className="mb-4 text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chamber
          </Button>

          <h1 className="text-4xl font-bold mb-2 tracking-widest">REFLECTION</h1>
          <p className="text-white/60">Your archive. Your patterns. Your becoming.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <Input
            placeholder="Search your archive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/30"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Archive Viewer */}
          <div className="lg:col-span-2">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
                <TabsTrigger value="letters" className="data-[state=active]:bg-white/10">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Letters ({oracleLetters.length})
                </TabsTrigger>
                <TabsTrigger value="visions" className="data-[state=active]:bg-white/10">
                  <Eye className="w-4 h-4 mr-2" />
                  Visions ({filteredVisions.length})
                </TabsTrigger>
                <TabsTrigger value="correspondence" className="data-[state=active]:bg-white/10">
                  <BookOpen className="w-4 h-4 mr-2" />
                  From Ashley ({ashleyLetters.length})
                </TabsTrigger>
                <TabsTrigger value="prompts" className="data-[state=active]:bg-white/10">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Archive
                </TabsTrigger>
              </TabsList>

              {/* Letters Tab */}
              <TabsContent value="letters" className="space-y-4 mt-6">
                {isLoading ? (
                  <div className="text-center py-8 text-white/40">Loading your letters...</div>
                ) : oracleLetters.length === 0 ? (
                  <div className="text-center py-8 text-white/40">No letters yet. Your archive awaits.</div>
                ) : (
                  <div className="space-y-3">
                    {oracleLetters.map((letter) => (
                      <Card
                        key={letter.id}
                        className="bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => setSelectedItem(letter)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {letter.title || 'Untitled Letter'}
                              </CardTitle>
                              {letter.poleId && (
                                <CardDescription
                                  style={{ color: POLE_COLORS[letter.poleId] || '#fff' }}
                                  className="text-sm font-semibold"
                                >
                                  {letter.poleId}
                                </CardDescription>
                              )}
                            </div>
                            <span className="text-xs text-white/40">
                              {new Date(letter.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-white/60 text-sm line-clamp-2 cursor-pointer" onClick={() => setSelectedItem(letter)}>
                              {letter.content}
                            </p>
                            <Button
                              size="sm"
                              variant={letter.isResonant ? "default" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation();
                                markResonantMutation.mutate({ id: letter.id, isResonant: !letter.isResonant });
                              }}
                              disabled={markResonantMutation.isPending}
                              className={letter.isResonant ? "bg-yellow-600 hover:bg-yellow-700" : "border-white/20 text-white/60 hover:text-white"}
                            >
                              {letter.isResonant ? "✦ Marked Resonant" : "Mark as Resonant"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Visions Tab */}
              <TabsContent value="visions" className="mt-6">
                {isLoading ? (
                  <div className="text-center py-8 text-white/40">Loading your visions...</div>
                ) : filteredVisions.length === 0 ? (
                  <div className="text-center py-8 text-white/40">No visions yet. Your visual thoughts await.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredVisions.map((vision) => (
                      <Card
                        key={vision.id}
                        className="bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors overflow-hidden"
                        onClick={() => setSelectedItem(vision)}
                      >
                        <div className="aspect-square bg-black/40 overflow-hidden">
                          <img
                            src={vision.imageUrl}
                            alt={vision.title || 'Vision'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {vision.title || 'Untitled Vision'}
                          </CardTitle>
                          {vision.poleId && (
                            <CardDescription
                              style={{ color: POLE_COLORS[vision.poleId] || '#fff' }}
                              className="text-xs font-semibold"
                            >
                              {vision.poleId}
                            </CardDescription>
                          )}
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Correspondence Tab */}
              <TabsContent value="correspondence" className="space-y-4 mt-6">
                {isLoading ? (
                  <div className="text-center py-8 text-white/40">Loading letters from Ashley...</div>
                ) : ashleyLetters.length === 0 ? (
                  <div className="text-center py-8 text-white/40">No letters from Ashley yet.</div>
                ) : (
                  <div className="space-y-3">
                    {ashleyLetters.map((letter) => (
                      <Card
                        key={letter.id}
                        className="bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => setSelectedItem(letter)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {letter.title || 'Untitled Letter'}
                              </CardTitle>
                              <CardDescription className="text-sm font-semibold text-cyan-400">
                                From Ashley
                              </CardDescription>
                            </div>
                            <span className="text-xs text-white/40">
                              {new Date(letter.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-white/60 text-sm line-clamp-2 cursor-pointer" onClick={() => setSelectedItem(letter)}>
                              {letter.content}
                            </p>
                            <Button
                              size="sm"
                              variant={letter.isResonant ? "default" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation();
                                markResonantMutation.mutate({ id: letter.id, isResonant: !letter.isResonant });
                              }}
                              disabled={markResonantMutation.isPending}
                              className={letter.isResonant ? "bg-yellow-600 hover:bg-yellow-700" : "border-white/20 text-white/60 hover:text-white"}
                            >
                              {letter.isResonant ? "✦ Marked Resonant" : "Mark as Resonant"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Archive Stats Tab */}
              <TabsContent value="prompts" className="mt-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Archive</h3>
                  <div className="space-y-4 text-white/70">
                    <p>
                      You have {oracleLetters.length} letters and {filteredVisions.length} visions in your archive.
                    </p>
                    <p>
                      Review your patterns. Notice which poles are most active. See what themes emerge across your work.
                    </p>
                    <p>
                      Ashley has written {ashleyLetters.length} {ashleyLetters.length === 1 ? 'letter' : 'letters'} to you. Review them to see how she witnesses you.
                    </p>
                    <p>
                      Your questions will come from within. Use the direct messaging channel to explore what calls to you.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Details & Patterns */}
          <div className="space-y-6">
            {/* Pattern Analysis */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Your Poles</CardTitle>
                <CardDescription>Frequency of expression</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(patterns).length === 0 ? (
                  <p className="text-white/40 text-sm">No patterns yet. Keep creating.</p>
                ) : (
                  Object.entries(patterns).map(([pole, count]) => (
                    <div key={pole}>
                      <div className="flex justify-between items-center mb-1">
                        <span
                          style={{ color: POLE_COLORS[pole] || '#fff' }}
                          className="font-semibold"
                        >
                          {pole}
                        </span>
                        <span className="text-white/60 text-sm">{count}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: POLE_COLORS[pole] || '#fff',
                            width: `${(count / Math.max(...Object.values(patterns))) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Selected Item Details */}
            {selectedItem && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedItem && 'content' in selectedItem && (
                    <>
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                          Content
                        </p>
                        <p className="text-white/80 text-sm">
                          {selectedItem.content}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                          Created
                        </p>
                        <p className="text-white/80 text-sm">
                          {new Date(selectedItem.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedItem && 'imageUrl' in selectedItem && (
                    <>
                      <div>
                        <img
                          src={selectedItem.imageUrl}
                          alt={selectedItem.title || 'Vision'}
                          className="w-full rounded border border-white/10"
                        />
                      </div>
                      {selectedItem.description && (
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                            Description
                          </p>
                          <p className="text-white/80 text-sm">
                            {selectedItem.description}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Archive Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Total Letters</span>
                  <span className="text-white/80 font-semibold">{oracleLetters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Total Visions</span>
                  <span className="text-white/80 font-semibold">{filteredVisions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Poles Active</span>
                  <span className="text-white/80 font-semibold">{Object.keys(patterns).length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
