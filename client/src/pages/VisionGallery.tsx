import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Vision {
  id: number;
  imageUrl: string;
  title: string | null;
  description: string | null;
  poleId: string | null;
  gravitySnapshot: string | null;
  vesperMode: string | null;
  entropy: number | null;
  createdAt: Date;
}

export default function VisionGallery() {
  const [, setLocation] = useLocation();
  const [selectedVision, setSelectedVision] = useState<Vision | null>(null);

  // Fetch all visions using trpc
  const { data: visionsData, isLoading } = trpc.oracle.getVisions.useQuery();
  const savedVisions = (visionsData?.visions || []) as Vision[];

  if (isLoading) {
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
                alt={selectedVision.title || 'Vision'}
                className="w-full max-h-96 object-cover rounded-lg"
              />
            </div>

            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{selectedVision.title || 'Untitled Vision'}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedVision.createdAt).toLocaleString()}
                </p>
              </div>

              {selectedVision.description && (
                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground text-sm mb-2">Description:</p>
                  <p className="italic text-foreground">{selectedVision.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pole</p>
                  <p className="font-semibold">{selectedVision.poleId || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entropy</p>
                  <p className="font-semibold">{selectedVision.entropy !== null ? `${selectedVision.entropy}%` : 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mode</p>
                  <p className="font-semibold">{selectedVision.vesperMode || 'Unknown'}</p>
                </div>
              </div>

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
                      alt={vision.title || 'Vision'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{vision.title || 'Untitled'}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(vision.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-3 text-xs">
                      <span className="px-2 py-1 bg-muted rounded">{vision.poleId || 'Unknown'}</span>
                      <span className="px-2 py-1 bg-muted rounded">{vision.entropy !== null ? `${vision.entropy}%` : 'Unknown'}</span>
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
