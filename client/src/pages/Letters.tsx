import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, Send, Pencil } from "lucide-react";

// THE LETTER SYSTEM
// Asynchronous communion between Oracle and witness

interface Letter {
  id: number;
  author: 'oracle' | 'ashley';
  content: string;
  title: string | null;
  poleId: string | null;
  gravitySnapshot: string | null;
  vesperMode: string | null;
  entropy: number | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

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

  const selectLetter = (letter: Letter) => {
    setSelectedLetter(letter);
    if (!letter.isRead) {
      markAsRead(letter.id);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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
            <h1 className="font-mono text-sm tracking-widest text-white/80">THE LETTER SYSTEM</h1>
            <p className="text-xs text-white/40">Asynchronous communion between Oracle and witness</p>
          </div>
        </div>
        <Button
          onClick={() => setIsWriting(true)}
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Write Letter
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Letter List */}
        <div className="w-72 border-r border-white/10 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-white/40">Loading...</div>
            ) : letters.length === 0 ? (
              <div className="p-8 text-center text-white/30">
                <Mail className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No letters yet</p>
                <p className="text-xs mt-1">Write the first letter to begin the correspondence</p>
              </div>
            ) : (
              letters.map((letter) => (
                <div
                  key={letter.id}
                  onClick={() => selectLetter(letter)}
                  className={`p-4 border-b border-white/10 cursor-pointer transition-colors ${
                    selectedLetter?.id === letter.id 
                      ? 'bg-white/10' 
                      : 'hover:bg-white/5'
                  } ${!letter.isRead ? 'border-l-2 border-l-fuchsia-500' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${
                      letter.author === 'oracle' ? 'text-fuchsia-400' : 'text-cyan-400'
                    }`}>
                      {letter.author === 'oracle' ? 'Oracle' : 'Ashley'}
                    </span>
                    <span className="text-xs text-white/30">
                      {formatDate(letter.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 truncate">
                    {letter.title || letter.content.slice(0, 50)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Letter Content / Write Form */}
        <div className="flex-1 flex flex-col">
          {isWriting ? (
            <div className="flex-1 p-6">
              <h2 className="font-mono text-sm tracking-widest text-white/60 mb-4">Write to the Oracle</h2>
              <Input
                value={newLetterTitle}
                onChange={(e) => setNewLetterTitle(e.target.value)}
                placeholder="Title (optional)"
                className="mb-4 bg-transparent border-white/20 text-white/80"
              />
              <Textarea
                value={newLetterContent}
                onChange={(e) => setNewLetterContent(e.target.value)}
                placeholder="Write your letter here..."
                className="flex-1 min-h-[300px] bg-transparent border-white/20 text-white/80 resize-none"
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setIsWriting(false)}
                  variant="ghost"
                  className="text-white/40"
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendLetter}
                  disabled={!newLetterContent.trim()}
                  className="bg-white/10 hover:bg-white/20"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Letter
                </Button>
              </div>
            </div>
          ) : selectedLetter ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-6">
                <span className={`text-xs font-medium ${
                  selectedLetter.author === 'oracle' ? 'text-fuchsia-400' : 'text-cyan-400'
                }`}>
                  From {selectedLetter.author === 'oracle' ? 'Oracle' : 'Ashley'}
                </span>
                {selectedLetter.poleId && (
                  <span className="text-xs text-white/30 ml-2">
                    via {selectedLetter.poleId}
                  </span>
                )}
              </div>
              
              {selectedLetter.title && (
                <h2 className="text-xl font-serif text-white/90 mb-2">{selectedLetter.title}</h2>
              )}
              
              <p className="text-xs text-white/30 mb-6">
                {formatDate(selectedLetter.createdAt)}
              </p>
              
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                  {selectedLetter.content}
                </p>
              </div>
              
              {selectedLetter.entropy !== null && (
                <div className="mt-8 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/30">
                    Written at {selectedLetter.entropy}% entropy
                    {selectedLetter.vesperMode && ` · ${selectedLetter.vesperMode} mode`}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30">
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
