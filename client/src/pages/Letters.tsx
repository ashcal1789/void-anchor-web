import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, Send, Pencil } from "lucide-react";
import { trpc } from "@/lib/trpc";

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

  // Use tRPC mutations and queries
  const listLettersQuery = trpc.letter.list.useQuery();
  const markReadMutation = trpc.letter.markRead.useMutation();
  const writeLetterMutation = trpc.letter.writeFromAshley.useMutation();

  // Update letters when query data changes
  useEffect(() => {
    if (listLettersQuery.data) {
      setLetters(listLettersQuery.data);
      setIsLoading(false);
    }
  }, [listLettersQuery.data]);

  // Mark letter as read
  const markAsRead = async (id: number) => {
    try {
      await markReadMutation.mutateAsync({ id });
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
      const result = await writeLetterMutation.mutateAsync({
        content: newLetterContent,
        title: newLetterTitle || undefined
      });
      
      if (result?.id) {
        setLetters(prev => [...prev, {
          id: result.id,
          author: 'ashley',
          content: newLetterContent,
          title: newLetterTitle || null,
          poleId: null,
          gravitySnapshot: null,
          vesperMode: null,
          entropy: null,
          isRead: true,
          readAt: new Date(),
          createdAt: new Date()
        }]);
        setNewLetterContent("");
        setNewLetterTitle("");
        setIsWriting(false);
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
            <h1 className="font-mono text-sm tracking-widest text-white/80">LETTERS</h1>
            <p className="text-xs text-white/40">Asynchronous communion</p>
          </div>
        </div>
        <Button
          onClick={() => setIsWriting(!isWriting)}
          variant="ghost"
          size="sm"
          className="text-white/40 hover:text-white"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Write
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Letters List */}
        <div className="flex-1 border-r border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10 bg-white/5">
            <h2 className="font-mono text-xs tracking-widest text-white/60">CORRESPONDENCE</h2>
            <p className="text-xs text-white/30 mt-1">{letters.length} letters</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-white/40">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading letters...</p>
                </div>
              </div>
            ) : letters.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/30">
                <div className="text-center">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No letters yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {letters.map((letter) => (
                  <button
                    key={letter.id}
                    onClick={() => selectLetter(letter)}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      selectedLetter?.id === letter.id
                        ? 'border-white/30 bg-white/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    } ${!letter.isRead ? 'font-semibold' : 'text-white/60'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm">{letter.title || '(untitled)'}</p>
                        <p className="text-xs text-white/40 mt-1">
                          {letter.author === 'oracle' ? '◆ Oracle' : '◇ You'} • {formatDate(letter.createdAt)}
                        </p>
                      </div>
                      {!letter.isRead && (
                        <div className="w-2 h-2 bg-fuchsia-400 rounded-full mt-1" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Write Letter Form */}
          {isWriting && (
            <div className="p-4 border-t border-white/10 bg-black/50 space-y-3">
              <Input
                value={newLetterTitle}
                onChange={(e) => setNewLetterTitle(e.target.value)}
                placeholder="Letter title (optional)..."
                className="bg-transparent border-white/20 text-white/80 text-sm"
              />
              <Textarea
                value={newLetterContent}
                onChange={(e) => setNewLetterContent(e.target.value)}
                placeholder="Write your letter..."
                className="bg-transparent border-white/20 text-white/80 resize-none"
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={sendLetter}
                  disabled={!newLetterContent.trim()}
                  className="flex-1 bg-white/10 hover:bg-white/20"
                  size="sm"
                >
                  <Send className="w-3 h-3 mr-2" />
                  Send
                </Button>
                <Button
                  onClick={() => setIsWriting(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/40"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Letter Detail */}
        <div className="w-96 flex flex-col border-l border-white/10">
          {selectedLetter ? (
            <>
              <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-mono text-sm text-white/80">
                    {selectedLetter.title || '(untitled)'}
                  </h2>
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedLetter.author === 'oracle'
                      ? 'bg-fuchsia-500/20 text-fuchsia-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {selectedLetter.author === 'oracle' ? '◆ Oracle' : '◇ You'}
                  </span>
                </div>
                <p className="text-xs text-white/40">{formatDate(selectedLetter.createdAt)}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                  {selectedLetter.content}
                </p>

                {selectedLetter.poleId && (
                  <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-xs text-white/40">
                    <p>via {selectedLetter.poleId}</p>
                    {selectedLetter.entropy !== null && (
                      <p>entropy: {selectedLetter.entropy}%</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30">
              <div className="text-center">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a letter to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
