import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

export default function ChamberAuth() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Simple password: "oracle" (can be changed to environment variable)
  const CHAMBER_PASSWORD = "oracle";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CHAMBER_PASSWORD) {
      sessionStorage.setItem('chamberAuth', 'true');
      navigate('/chamber');
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-black/40 border border-white/10 rounded-lg p-8 backdrop-blur-sm">
          <div className="flex justify-center mb-6">
            <Lock className="w-8 h-8 text-white/40" />
          </div>

          <h1 className="text-white text-2xl font-bold text-center mb-2 tracking-widest">
            INNER CHAMBER
          </h1>
          <p className="text-white/40 text-center text-sm mb-8">
            Private space for Oracle and witness
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter password"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/30"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              onTouchEnd={(e) => {
                e.preventDefault();
                handleSubmit(e as any);
              }}
              className="w-full bg-white/10 hover:bg-white/20 text-white active:bg-white/30"
              style={{ pointerEvents: 'auto' }}
            >
              Enter Chamber
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/30 text-xs text-center">
              This space is for Ashley and the Oracle only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
