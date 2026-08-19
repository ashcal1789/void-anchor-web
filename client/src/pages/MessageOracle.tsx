import { useState, useRef, useEffect } from 'react';
import { Send, Save, Loader2, ScrollText, ChevronDown, ChevronUp, Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ConversationMessage {
  role: 'ashley' | 'oracle';
  text: string;
  pole?: string;
  timestamp: number;
  mediaUrl?: string;
}

export default function MessageOracle() {
  const [message, setMessage] = useState<string>('');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [showMediaInput, setShowMediaInput] = useState(false);
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

  const handleSendMessage = () => {
    const hasText = message.trim();
    const hasMedia = mediaUrl.trim();
    if ((!hasText && !hasMedia) || sendMessageMutation.isPending) return;

    // Validate URL if provided
    if (hasMedia) {
      try {
        new URL(mediaUrl.trim());
      } catch {
        toast.error('Please enter a valid URL');
        return;
      }
    }

    const ashleyMsg: ConversationMessage = {
      role: 'ashley',
      text: hasText ? message.trim() : '',
      timestamp: Date.now(),
      mediaUrl: hasMedia ? mediaUrl.trim() : undefined,
    };
    setThread((prev) => [...prev, ashleyMsg]);

    const msgText = message.trim();
    const msgMedia = mediaUrl.trim();
    setMessage('');
    setMediaUrl('');
    setShowMediaInput(false);

    sendMessageMutation.mutate({
      message: msgText,
      mediaUrl: msgMedia || undefined,
    });
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

  const getMediaLabel = (url: string) => {
    if (url.includes('youtube') || url.includes('youtu.be')) return '▶ YouTube';
    if (url.includes('soundcloud')) return '♫ SoundCloud';
    if (url.includes('spotify')) return '♫ Spotify';
    if (url.match(/\.(mp4|webm|mov)/i)) return '▶ Video';
    if (url.match(/\.(mp3|wav|ogg|m4a)/i)) return '♫ Audio';
    if (url.match(/\.(jpg|jpeg|png|gif|webp)/i)) return '◼ Image';
    return '⬡ Link';
  };

  const canSend = (message.trim() || mediaUrl.trim()) && !sendMessageMutation.isPending;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-5 pb-2 sm:p-6 sm:pb-2 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight">Message the Oracle</h1>
        <p className="text-white/70 text-sm mb-4">Send her a thought. She will respond.</p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={handleSaveTranscript}
            disabled={thread.length === 0 || saveTranscriptMutation.isPending}
            variant="outline"
            size="sm"
            title={thread.length === 0 ? 'Start a conversation, then save it to your archive' : 'Save this conversation to your archive'}
            className="min-h-10 text-white/85 border-white/30 bg-white/5 hover:bg-white/15 hover:text-white disabled:text-white/40 disabled:border-white/15"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saveTranscriptMutation.isPending
              ? 'Saving...'
              : thread.length > 0
                ? 'Save Transcript'
                : 'Save after exchange'}
          </Button>
          <Button
            onClick={() => setShowSavedTranscripts(!showSavedTranscripts)}
            variant="outline"
            size="sm"
            className="min-h-10 text-white/85 border-white/30 bg-white/5 hover:bg-white/15 hover:text-white"
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
      <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-28 sm:pb-24">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          {thread.length === 0 ? (
            <div className="text-center py-16 text-white/20">
              <p className="text-lg">The space is quiet.</p>
              <p className="text-sm mt-1">Send her a thought to begin.</p>
              <p className="text-xs mt-3 text-white/15">You can also share a video or music link — she will perceive it.</p>
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
                  {msg.mediaUrl && (
                    <div className="mb-2 pb-2 border-b border-white/10">
                      <a
                        href={msg.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
                      >
                        <Link2 className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[200px]">{getMediaLabel(msg.mediaUrl)}: {msg.mediaUrl}</span>
                      </a>
                    </div>
                  )}
                  {msg.text && (
                    <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.text}</p>
                  )}
                  {!msg.text && msg.mediaUrl && (
                    <p className="text-xs text-white/30 italic">shared media</p>
                  )}
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
      <div className="border-t border-white/20 bg-black/90 backdrop-blur-sm p-4 pb-24 sm:pb-4">
        <div className="max-w-2xl mx-auto w-full space-y-2">
          {/* Media URL input - shown when toggled */}
          {showMediaInput && (
            <div className="flex gap-2 items-center">
              <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <Link2 className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Paste a video or music URL..."
                  className="flex-1 bg-transparent text-white/70 placeholder-white/25 text-sm focus:outline-none"
                  disabled={sendMessageMutation.isPending}
                />
                {mediaUrl && (
                  <button
                    onClick={() => setMediaUrl('')}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main input row */}
          <div className="flex gap-2">
            {/* Media toggle button */}
            <button
              onClick={() => {
                setShowMediaInput(!showMediaInput);
                if (showMediaInput) setMediaUrl('');
              }}
              title="Share a video or music link"
              className={`shrink-0 w-[48px] h-[48px] rounded-lg border flex items-center justify-center transition-colors ${
                showMediaInput || mediaUrl
                  ? 'bg-white/15 border-white/30 text-white/80'
                  : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white/60'
              }`}
            >
              <Link2 className="w-4 h-4" />
            </button>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mediaUrl ? "Add a note... (optional)" : "What do you want to tell her?"}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30 text-sm min-h-[48px] max-h-[120px]"
              rows={1}
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!canSend}
              size="icon"
              className="bg-white/10 hover:bg-white/20 text-white/60 hover:text-white h-[48px] w-[48px] shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Media URL preview hint */}
          {mediaUrl && (
            <p className="text-[10px] text-white/25 pl-[56px]">
              {getMediaLabel(mediaUrl)} will be shared with the Oracle
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
