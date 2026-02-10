import React, { useState, useEffect, useRef } from 'react';
import LoginStep from './components/LoginStep';
import DashboardStep from './components/DashboardStep';
import SouvenirStep from './components/SouvenirStep';
import { UserSession, TripStatus } from './types';
import { setGeminiApiKey, setImageApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [imageApiKeyInput, setImageApiKeyInput] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [imageApiKeySaved, setImageApiKeySaved] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [fabPos, setFabPos] = useState({ x: 16, y: 16 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragMovedRef = useRef(false);

  useEffect(() => {
    const storedFab = localStorage.getItem('API_KEY_FAB_POS');
    if (storedFab) {
      try {
        const parsed = JSON.parse(storedFab);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          setFabPos({ x: parsed.x, y: parsed.y });
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      dragMovedRef.current = true;
      const nextX = e.clientX - dragOffsetRef.current.x;
      const nextY = e.clientY - dragOffsetRef.current.y;
      const maxX = window.innerWidth - 48;
      const maxY = window.innerHeight - 48;
      setFabPos({
        x: Math.min(Math.max(8, nextX), Math.max(8, maxX)),
        y: Math.min(Math.max(8, nextY), Math.max(8, maxY))
      });
    };

    const handleUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const maxX = window.innerWidth - 48;
      const maxY = window.innerHeight - 48;
      const snapX = fabPos.x + 24 < window.innerWidth / 2 ? 8 : Math.max(8, maxX);
      const snapY = Math.min(Math.max(8, fabPos.y), Math.max(8, maxY));
      const snapped = { x: snapX, y: snapY };
      setFabPos(snapped);
      localStorage.setItem('API_KEY_FAB_POS', JSON.stringify(snapped));
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [fabPos]);

  useEffect(() => {
    const stored = localStorage.getItem('GEMINI_API_KEY') || '';
    const storedImage = localStorage.getItem('IMAGE_API_KEY') || '';
    if (stored) {
      setApiKeyInput(stored);
      setApiKeySaved(true);
      setGeminiApiKey(stored);
    }
    if (storedImage) {
      setImageApiKeyInput(storedImage);
      setImageApiKeySaved(true);
      setImageApiKey(storedImage);
    }
    if (!stored || !storedImage) {
      setIsKeyModalOpen(true);
    }
  }, []);

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
  };

  // Render logic based on session status
  const renderStep = () => {
    if (!session) {
      return <LoginStep onLoginSuccess={handleLoginSuccess} />;
    }

    switch (session.status) {
      case TripStatus.UPCOMING:
        // For MVP, treating upcoming similar to Dashboard but maybe restricted, 
        // or for this demo, just let them see the dashboard to explore.
        // Or we could show a "Countdown" screen. 
        // Let's reuse Dashboard but maybe with a future tense greeting.
        return <DashboardStep session={session} />;
      
      case TripStatus.DURING_STAY:
        return <DashboardStep session={session} />;
      
      case TripStatus.COMPLETED:
        return <SouvenirStep session={session} />;
      
      default:
        return <LoginStep onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden p-0 sm:p-6 lg:p-8 bg-background-light">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-primary-dark">
         <img 
            alt="Background" 
            className="w-full h-full object-cover opacity-50 scale-105 blur-[2px] transition-transform duration-[20s] ease-linear hover:scale-110" 
            src={session?.booking.backgroundImage || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"} 
         />
         <div className="absolute inset-0 bg-primary-dark/60 mix-blend-multiply"></div>
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none hilton-tech-grid"></div>

      {renderStep()}

      <button
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          draggingRef.current = true;
          dragMovedRef.current = false;
        }}
        onClick={() => {
          if (dragMovedRef.current) return;
          if (apiKeySaved && imageApiKeySaved) {
            setIsKeyModalOpen(false);
            return;
          }
          setIsKeyModalOpen(true);
        }}
        style={{ left: fabPos.x, top: fabPos.y }}
        className="fixed z-20 bg-white/80 backdrop-blur-md border border-white/50 rounded-full w-9 h-9 shadow-lg text-slate-600 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        title="API Keys"
      >
        <span className="material-symbols-outlined text-base">key</span>
      </button>

      {isKeyModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">API Keys</div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Gemini API Key (text)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="password"
                value={imageApiKeyInput}
                onChange={(e) => setImageApiKeyInput(e.target.value)}
                placeholder="Image API Key (images)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => {
                  const key = apiKeyInput.trim();
                  const imageKey = imageApiKeyInput.trim();
                  setGeminiApiKey(key);
                  setImageApiKey(imageKey);
                  if (key) {
                    localStorage.setItem('GEMINI_API_KEY', key);
                  } else {
                    localStorage.removeItem('GEMINI_API_KEY');
                  }
                  if (imageKey) {
                    localStorage.setItem('IMAGE_API_KEY', imageKey);
                  } else {
                    localStorage.removeItem('IMAGE_API_KEY');
                  }
                  setApiKeySaved(!!key);
                  setImageApiKeySaved(!!imageKey);
                  setIsKeyModalOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
            <div className="mt-3 text-[10px] text-slate-500">
              Stored locally in your browser. Do not commit to GitHub.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
