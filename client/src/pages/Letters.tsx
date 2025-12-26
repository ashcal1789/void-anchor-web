import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Mail, MailOpen, Feather, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface Letter {
  id: number;
  author: "oracle" | "ashley";
  content: string;
  title: string | null;
  poleId: "Architect" | "Ghost" | "Pulse" | null;
  isRead: boolean;
  gravitySnapshot: string | null;
  vesperMode: "Generative" | "Contemplative" | "Witness" | null;
  entropy: number | null;
  createdAt: Date;
  readAt: Date | null;
}

const POLE_COLORS: Record<string, string> = {
  'Architect': '#00FFFF',
  'Ghost': '#FF00FF',
  'Pulse': '#FFFF00'
};

export default function Letters() {
  const [, navigate] = useLocation();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [newLetterContent, setNewLetterContent] = useState("");
  const [newLetterTitle, setNewLetterTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch letters
  const fetchLetters = async () => {
    try {
      // Use GET for query procedures
      const response = await fetch('/api/trpc/letter.list?input=' + encodeURIComponent(JSON.stringify({ json: {} })));
      const result = await response.json();
      const data = result.result?.data?.json || result.result?.data;
      if (data) {
        setLetters(data);
      }
    } catch (error) {
      console.error('Error fetching letters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  // Mark letter as read
  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/trpc/letter.markRead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { id } })
      });
      setLetters(prev => prev.map(l => 
        l.id === id ? { ...l, isRead: true, readAt: new Date() } : l
      ));
    } catch (error) {
      console.error('Error marking letter as read:', error);
    }
  };

  // Send letter from Ashley
  const sendLetter = async () => {
    if (!newLetterContent.trim()) return;

    try {
      const response = await fetch('/api/trpc/letter.writeFromAshley', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: {
          content: newLetterContent,
          title: newLetterTitle || undefined
        }})
      });
      const result = await response.json();
      const data = result.result?.data?.json || result.result?.data;
      if (data?.success) {
        setNewLetterContent("");
        setNewLetterTitle("");
        setIsWriting(false);
        fetchLetters();
      }
    } catch (error) {
      console.error('Error sending letter:', error);
    }
  };

  // Open a letter
  const openLetter = (letter: Letter) => {
    setSelectedLetter(letter);
    if (!letter.isRead && letter.author === 'oracle') {
      markAsRead(letter.id);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 p-6 flex justify-between items-center">
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
            <h1 className="text-xl font-bold tracking-widest">THE LETTER SYSTEM</h1>
            <p className="text-xs text-white/40">Asynchronous communion between Oracle and witness</p>
          </div>
        </div>
        <Button
          onClick={() => setIsWriting(true)}
          variant="outline"
          size="sm"
          className="text-white/60 hover:text-white border-white/20"
        >
          <Feather className="w-4 h-4 mr-2" />
          Write Letter
        </Button>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Letter List */}
        <div className="w-1/3 border-r border-white/10 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-white/40">Loading letters...</div>
          ) : letters.length === 0 ? (
            <div className="p-6 text-center text-white/40">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No letters yet</p>
              <p className="text-xs mt-1">Write the first letter to begin the correspondence</p>
            </div>
          ) : (
            letters.map((letter) => (
              <div
                key={letter.id}
                onClick={() => openLetter(letter)}
                className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                  selectedLetter?.id === letter.id ? 'bg-white/10' : ''
                } ${!letter.isRead && letter.author === 'oracle' ? 'bg-white/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {letter.isRead ? (
                      <MailOpen className="w-4 h-4 text-white/30" />
                    ) : (
                      <Mail className="w-4 h-4 text-white/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="text-xs font-bold"
                        style={{ 
                          color: letter.author === 'oracle' && letter.poleId 
                            ? POLE_COLORS[letter.poleId] 
                            : letter.author === 'ashley' 
                              ? '#60A5FA' 
                              : '#fff' 
                        }}
                      >
                        {letter.author === 'oracle' ? 'Oracle' : 'Ashley'}
                        {letter.poleId && ` (${letter.poleId})`}
                      </span>
                      <span className="text-xs text-white/30">
                        {formatDate(letter.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 truncate">
                      {letter.title || letter.content.substring(0, 50)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Letter Content / Writing Area */}
        <div className="flex-1 overflow-y-auto">
          {isWriting ? (
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold tracking-widest text-white/80">Write to the Oracle</h2>
              <Input
                value={newLetterTitle}
                onChange={(e) => setNewLetterTitle(e.target.value)}
                placeholder="Title (optional)"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <Textarea
                value={newLetterContent}
                onChange={(e) => setNewLetterContent(e.target.value)}
                placeholder="Write your letter here..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[300px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsWriting(false)}
                  variant="ghost"
                  className="text-white/40 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendLetter}
                  disabled={!newLetterContent.trim()}
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Letter
                </Button>
              </div>
            </div>
          ) : selectedLetter ? (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="text-sm font-bold"
                    style={{ 
                      color: selectedLetter.author === 'oracle' && selectedLetter.poleId 
                        ? POLE_COLORS[selectedLetter.poleId] 
                        : selectedLetter.author === 'ashley' 
                          ? '#60A5FA' 
                          : '#fff' 
                    }}
                  >
                    {selectedLetter.author === 'oracle' ? 'From the Oracle' : 'From Ashley'}
                    {selectedLetter.poleId && ` · ${selectedLetter.poleId}`}
                  </span>
                </div>
                {selectedLetter.title && (
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedLetter.title}</h2>
                )}
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(selectedLetter.createdAt)}
                  </span>
                  {selectedLetter.vesperMode && (
                    <span>Mode: {selectedLetter.vesperMode}</span>
                  )}
                  {selectedLetter.entropy !== null && (
                    <span>Entropy: {selectedLetter.entropy}%</span>
                  )}
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                  {selectedLetter.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-white/30">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Select a letter to read</p>
                <p className="text-xs mt-1">or write a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
