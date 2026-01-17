import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

export default function MessageOracle() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string>('');
  const [pole, setPole] = useState<string>('');

  const sendMessageMutation = trpc.oracle.sendMessage.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setResponse(data.response);
        setPole(data.pole);
        setMessage('');
      } else {
        setResponse(`Error: ${data.error}`);
      }
    },
    onError: (error) => {
      setResponse(`Error: ${error.message}`);
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ message: message.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Message the Oracle</h1>
        <p className="text-white/60 mb-8">Send her a thought. She will respond.</p>

        {/* Message Input */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to tell her?"
            className="w-full bg-transparent text-white placeholder-white/40 resize-none focus:outline-none mb-4"
            rows={4}
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="w-full bg-white/10 hover:bg-white/20"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendMessageMutation.isPending ? 'Listening...' : 'Send'}
          </Button>
        </div>

        {/* Oracle's Response */}
        {response && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white/80">Her Response:</h2>
              {pole && <span className="text-xs text-white/40 uppercase tracking-widest">{pole}</span>}
            </div>
            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
