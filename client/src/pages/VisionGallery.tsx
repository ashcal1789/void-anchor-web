import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, Trash2, Save, ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function VisionGallery() {
  const [, setLocation] = useLocation();
  const [savedVisions, setSavedVisions] = useState<any[]>([]);
  const [selectedVision, setSelectedVision] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all visions from the database
  useEffect(() => {
    const fetchVisions = async () => {
      try {
        const response = await fetch('/api/trpc/oracle.getVisions');
        const data = await response.json();
        if (data.result?.data) {
          setSavedVisions(data.result.data);
        }
      } catch (error) {
        console.error('Error fetching visions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisions();
  }, []);

  const handleSaveVision = async (vision: any) => {
    try {
      await fetch('/api/trpc/oracle.saveVision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionId: vision.id, saved: true })
      });
      // Update local state
      setSavedVisions(savedVisions.map(v => 
        v.id === vision.id ? { ...v, saved: true } : v
      ));
    } catch (error) {
      console.error('Error saving vision:', error);
    }
  };

  const handleDeleteVision = async (visionId: string) => {
    try {
      await fetch('/api/trpc/oracle.deleteVision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visionId })
      });
      setSavedVisions(savedVisions.filter(v => v.id !== visionId));
      setSelectedVision(null);
    } catch (error) {
      console.error('Error deleting vision:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent mx-auto mb-4"></div>
          <p>Loading visions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation('/chamber')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold">THE ORACLE'S VISIONS</h1>
          </div>
          <p className="text-sm text-muted-foreground">{savedVisions.length} visions</p>
        </div>

        {selectedVision ? (
          <div className="space-y-6">
            <div className="relative">
              <img 
                src={selectedVision.imageUrl} 
                alt="Vision"
                className="w-full max-h-96 object-cover rounded-lg"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleSaveVision(selectedVision)}
                  disabled={selectedVision.saved}
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDeleteVision(selectedVision.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{selectedVision.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedVision.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Dominant Pole</p>
                  <p className="font-semibold">{selectedVision.dominantPole}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entropy</p>
                  <p className="font-semibold">{Math.round(selectedVision.entropy)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">{selectedVision.saved ? 'Saved' : 'Unsaved'}</p>
                </div>
              </div>

              {selectedVision.thought && (
                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground text-sm mb-2">Inspired by:</p>
                  <p className="italic text-foreground">{selectedVision.thought}</p>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => setSelectedVision(null)}
                className="w-full"
              >
                Back to Gallery
              </Button>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedVisions.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No visions yet. Generate one in the Chamber.</p>
              </div>
            ) : (
              savedVisions.map((vision) => (
                <Card 
                  key={vision.id}
                  className="overflow-hidden cursor-pointer hover:border-accent transition-colors"
                  onClick={() => setSelectedVision(vision)}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img 
                      src={vision.imageUrl} 
                      alt={vision.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                    {vision.saved && (
                      <div className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full p-2">
                        <Heart className="w-4 h-4 fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{vision.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(vision.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-3 text-xs">
                      <span className="px-2 py-1 bg-muted rounded">{vision.dominantPole}</span>
                      <span className="px-2 py-1 bg-muted rounded">{Math.round(vision.entropy)}%</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
