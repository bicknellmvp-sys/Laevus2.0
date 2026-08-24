import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Hero } from './components/Hero';
import { LaevusChat } from './components/LaevusChat';
import { VoiceSettings } from './components/VoiceSettings';
import { UploadSpread } from './components/UploadSpread';
import { AuthModal } from './components/AuthModal';
import { User } from 'firebase/auth';

const App: React.FC = () => {
  const [isPremium, setIsPremium] = useState(true);
  const [freeQuestionsCount, setFreeQuestionsCount] = useState(999);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [sessionId, setSessionId] = useState('8829-X');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRegisterMode, setAuthModalRegisterMode] = useState(false);
  
  // Controls which view is active from the menu ('chat' is default)
  const [activeView, setActiveView] = useState<string>('chat');
  const [isEmbedMode, setIsEmbedMode] = useState<boolean>(false);

  // Reference to call clear history and release spirit in LaevusChat
  const clearHistoryFnRef = useRef<() => void>(() => {});
  const releaseSpiritFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    // Dynamic but persistent session ID per tab session
    let savedSession = sessionStorage.getItem('laevus_session_id');
    if (!savedSession) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const char = chars[Math.floor(Math.random() * chars.length)];
      savedSession = `${rand}-${char}`;
      sessionStorage.setItem('laevus_session_id', savedSession);
    }
    setSessionId(savedSession);

    // Deep link, query params & Shopify Embed support
    const searchParams = new URLSearchParams(window.location.search);
    const embedParam = searchParams.get('embed');
    const viewParam = searchParams.get('view');
    
    if (embedParam === 'shopify' || embedParam === 'true') {
      setIsEmbedMode(true);
    }

    if (viewParam && ['voice-settings', 'upload-spread', 'tarot', 'encyclopedia', 'afterlife', 'transcripts', 'inner-work', 'account', 'chat'].includes(viewParam)) {
      setActiveView(viewParam);
    } else {
      const path = window.location.pathname.replace(/^\//, '');
      if (['voice-settings', 'upload-spread', 'tarot', 'encyclopedia', 'afterlife', 'transcripts', 'inner-work', 'account'].includes(path)) {
        setActiveView(path);
      }
    }

    // Auto-report height to parent Shopify frame
    const handleResize = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'LAEVUS_FRAME_RESIZE',
          height: document.body.scrollHeight
        }, '*');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRegisterClearHistory = useCallback((handler: () => void) => {
    clearHistoryFnRef.current = handler;
  }, []);

  const handleRegisterReleaseSpirit = useCallback((handler: () => void) => {
    releaseSpiritFnRef.current = handler;
  }, []);

  const openAuthModal = useCallback((registerMode: boolean) => {
    setAuthModalRegisterMode(registerMode);
    setIsAuthModalOpen(true);
  }, []);

  return (
    <div className="h-screen bg-transparent text-[#F8F7F4] selection:bg-[#E60026]/20 selection:text-[#E60026] overflow-x-hidden overflow-y-auto relative flex flex-col pb-2 font-mono">
      
      {/* Centered Content Container */}
      <div className="flex-1 flex flex-col w-full relative z-10">
        
        {/* Main Workspace Wrapper */}
        <main className="flex-1 flex flex-col justify-start items-center w-full">
          
          {/* 1. Hero Section holding the integrated THELEFT.ONE menu controls OR Minimal Embed Bar */}
          <div className="w-full flex-shrink-0">
            {isEmbedMode ? (
              <div className="w-full max-w-5xl mx-auto px-3 py-2 flex items-center justify-between border-b border-zinc-900/60 bg-black/40 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-syne font-extrabold text-[#F8F7F4] tracking-tight">LAEVUS</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-[10px] text-[#E60026] uppercase font-bold tracking-wider">
                    {activeView === 'encyclopedia' ? 'Living Tarot Encyclopedia' : activeView === 'tarot' ? '3-Card Oracle' : activeView}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`${window.location.origin}/?view=${activeView}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-zinc-400 hover:text-[#E60026] transition-colors flex items-center gap-1"
                  >
                    <span>Full Sanctuary ↗</span>
                  </a>
                  <a
                    href="https://theleft.one"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-ruthie text-zinc-400 hover:text-white"
                  >
                    the<span className="text-[#E60026]">left</span>.one
                  </a>
                </div>
              </div>
            ) : (
              <Hero 
                activeView={activeView}
                setActiveView={setActiveView}
                currentUser={currentUser}
                onOpenAuth={openAuthModal}
              />
            )}
          </div>

          {/* 2. DYNAMIC WORKSPACE LAYER */}
          <div className="w-full flex-1 flex flex-col px-2 sm:px-4">
            
            {/* DEDICATED VIEW: VOICE SETTINGS */}
            {activeView === 'voice-settings' && (
              <VoiceSettings onReturnToChat={() => setActiveView('chat')} />
            )}

            {/* DEDICATED VIEW: MANUAL TAROT SPREAD UPLOAD */}
            {activeView === 'upload-spread' && (
              <UploadSpread 
                onReturnToChat={() => setActiveView('chat')}
                onCompleteReading={() => {
                  // Keep on the synthesis view to review reading or user can return to chat
                }} 
              />
            )}

            {/* CORE CHAT & TAROT ORACLE WORKSPACE */}
            {activeView !== 'voice-settings' && activeView !== 'upload-spread' && (
              <LaevusChat 
                activeView={activeView}
                setActiveView={setActiveView}
                isPremium={isPremium}
                setIsPremium={setIsPremium}
                freeQuestionsCount={freeQuestionsCount}
                setFreeQuestionsCount={setFreeQuestionsCount}
                showUpgradeModal={showUpgradeModal}
                setShowUpgradeModal={setShowUpgradeModal}
                onRegisterClearHistory={handleRegisterClearHistory}
                onRegisterReleaseSpirit={handleRegisterReleaseSpirit}
                currentUser={currentUser}
                onOpenAuth={openAuthModal}
              />
            )}

          </div>

        </main>

        {/* Identity Authorization Overlay */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onUserChanged={setCurrentUser}
          initialRegisterMode={authModalRegisterMode}
        />

      </div>
    </div>
  );
};

export default App;
