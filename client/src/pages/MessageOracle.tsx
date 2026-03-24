import { useState, useRef, useEffect } from 'react';
import { Send, Save, Loader2, ScrollText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ConversationMessage {
  role: 'ashley' | 'oracle';
  text: string;
  pole?: string;
  timestamp: number;
}

export default function MessageOracle() {
  const [message, setMessage] = useState<string>('');
  const [thread, setThread] = useState<ConversationMessage[]>([]);
  const [showSavedTranscripts, setShowSavedTranscripts] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = trpc.oracle.sendMessage.useMutation({
    onSuccess: (data) => {
      if (data.success && data.message) {
        const oracleMsg: ConversationMessage = {
          role: 'oracle',
          text: data.message,
          pole: data.pole || undefined,
          timestamp: Date.now(),
        };
        setThread((prev) => [...prev, oracleMsg]);
      } else {
        toast.error(data.error || 'Oracle could not respond');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reach the Oracle');
    },
  });

  const saveTranscriptMutation = trpc.oracle.saveTranscript.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Transcript saved to your archive');
      } else {
        toast.error('Failed to save transcript');
      }
    },
    onError: () => {
      toast.error('Failed to save transcript');
    },
  });

  const transcriptsQuery = trpc.oracle.getTranscripts.useQuery(undefined, {
    enabled: showSavedTranscripts,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    const ashleyMsg: ConversationMessage = {
      role: 'ashley',
      text: message.trim(),
      timestamp: Date.now(),
    };
    setThread((prev) => [...prev, ashleyMsg]);
    const msgText = message.trim();
    setMessage('');
    sendMessageMutation.mutate({ message: msgText });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveTranscript = () => {
    if (thread.length === 0) {
      toast.error('Nothing to save yet');
      return;
    }

    const firstOracleMsg = thread.find((m) => m.role === 'oracle');
    const title = firstOracleMsg
      ? firstOracleMsg.text.slice(0, 60) + (firstOracleMsg.text.length > 60 ? '...' : '')
      : `Conversation ${new Date().toLocaleDateString()}`;

    saveTranscriptMutation.mutate({
      title,
      messages: JSON.stringify(thread),
      messageCount: thread.length,
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const poleColor = (pole?: string) => {
    switch (pole) {
      case 'Architect': return 'text-cyan-400';
      case 'Ghost': return 'text-purple-400';
      case 'Pulse': return 'text-yellow-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-6 pb-2 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-1 tracking-tight">Message the Oracle</h1>
        <p className="text-white/50 text-sm mb-4">Send her a thought. She will respond.</p>

        {/* Action buttons */}
        <div className="flex gap-2 mb-4">
          {thread.length > 0 && (
            <Button
              onClick={handleSaveTranscript}
              disabled={saveTranscriptMutation.isPending}
              variant="outline"
              size="sm"
              className="text-white/60 border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saveTranscriptMutation.isPending ? 'Saving...' : 'Save Transcript'}
            </Button>
          )}
          <Button
            onClick={() => setShowSavedTranscripts(!showSavedTranscripts)}
            variant="outline"
            size="sm"
            className="text-white/60 border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ScrollText className="w-3.5 h-3.5 mr-1.5" />
            Past Conversations
            {showSavedTranscripts ? (
              <ChevronUp className="w-3.5 h-3.5 ml-1" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* Saved Transcripts Panel */}
      {showSavedTranscripts && (
        <div className="max-w-2xl mx-auto w-full px-6 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-60 overflow-y-auto">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Saved Transcripts
            </h3>
            {transcriptsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </div>
            ) : transcriptsQuery.data?.transcripts && transcriptsQuery.data.transcripts.length > 0 ? (
              <div className="space-y-2">
                {transcriptsQuery.data.transcripts.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      try {
                        const msgs = JSON.parse(t.messages) as ConversationMessage[];
                        setThread(msgs);
                        setShowSavedTranscripts(false);
                        toast.info('Loaded transcript');
                      } catch {
                        toast.error('Could not load transcript');
                      }
                    }}
                    className="w-full text-left p-3 rounded bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <div className="text-sm text-white/80 truncate">{t.title || 'Untitled'}</div>
                    <div className="text-xs text-white/40 mt-1">
                      {t.messageCount} messages &middot;{' '}
                      {new Date(t.createdAt).toLocaleDateString()} at{' '}
                      {new Date(t.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-white/30 text-sm">No saved transcripts yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          {thread.length === 0 ? (
            <div className="text-center py-16 text-white/20">
              <p className="text-lg">The space is quiet.</p>
              <p className="text-sm mt-1">Send her a thought to begin.</p>
            </div>
          ) : (
            thread.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === 'ashley' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Label */}
                <div className="flex items-center gap-2 mb-1">
                  {msg.role === 'oracle' && msg.pole && (
                    <span
                      className={`text-[10px] uppercase tracking-widest font-semibold ${poleColor(
                        msg.pole
                      )}`}
                    >
                      {msg.pole}
                    </span>
                  )}
                  <span className="text-[10px] text-white/30">{formatTime(msg.timestamp)}</span>
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    msg.role === 'ashley'
                      ? 'bg-white/10 border border-white/15 text-white/80'
                      : 'bg-white/5 border border-white/10 text-white/70'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.text}</p>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {sendMessageMutation.isPending && (
            <div className="flex items-start">
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="animate-pulse">Listening...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-white/10 bg-black/80 backdrop-blur-sm p-4">
        <div className="max-w-2xl mx-auto w-full flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to tell her?"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30 text-sm min-h-[48px] max-h-[120px]"
            rows={1}
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="icon"
            className="bg-white/10 hover:bg-white/20 text-white/60 hover:text-white h-[48px] w-[48px] shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
