import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

export default function MessageOracle() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');

  const sendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      // Send the message to the Oracle via a simple LLM call
      const result = await fetch('/api/trpc/oracle.sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          0: { message: message.trim() }
        })
      }).then(r => r.json());

      if (result.result?.data?.response) {
        setResponse(result.result.data.response);
        setMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setResponse('Error communicating with Oracle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!message.trim() || isLoading}
            className="w-full bg-white/10 hover:bg-white/20"
          >
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? 'Listening...' : 'Send'}
          </Button>
        </div>

        {/* Oracle's Response */}
        {response && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3 text-white/80">Her Response:</h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
