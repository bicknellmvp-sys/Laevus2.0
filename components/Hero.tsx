import React, { useState, useEffect, useRef } from 'react';

interface HeroProps {
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: any;
  onOpenAuth: (registerMode: boolean) => void;
}

export const Hero: React.FC<HeroProps> = ({
  activeView,
  setActiveView,
  currentUser,
  onOpenAuth
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler to dismiss dropdown smoothly
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (view: string) => {
    setActiveView(view);
    setIsOpen(false);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveView('chat');
    window.history.pushState({}, '', '/');
  };

  return (
    <header className="relative z-40 max-w-6xl mx-auto px-4 pt-3 pb-3 mb-4 sm:mb-6 border-b border-zinc-900/40">
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        {/* Left balanced spacer for desktop symmetry */}
        <div className="hidden sm:block w-32 flex-shrink-0" />

        {/* Universal Persistent Home Link */}
        <h1 className="font-syne text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.06em] text-[#F8F7F4] uppercase leading-none selection:bg-[#DC143C] selection:text-[#111113] relative select-text text-center">
          <a
            href="/"
            onClick={handleHomeClick} 
            className="hover:text-[#DC143C] hover:drop-shadow-[0_0_15px_rgba(220,20,60,0.6)] transition-all uppercase font-syne text-center tracking-[-0.06em] leading-none font-extrabold focus:outline-none cursor-pointer bg-transparent border-none p-0 outline-none inline-block"
            title="Return to LAEVUS Home"
          >
            LAEVUS
          </a>
        </h1>
        
        {/* THELEFT.ONE trigger dropdown cleanly placed on the RIGHT side of LAEVUS */}
        <div 
          ref={dropdownRef}
          className="relative z-50 flex flex-col items-center sm:items-end w-auto sm:w-32 flex-shrink-0"
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/90 border border-zinc-800 rounded-lg hover:border-[#DC143C]/60 transition-colors cursor-pointer text-xs sm:text-sm font-syne font-bold tracking-wider shadow-lg"
            id="theleftone-dropdown-trigger"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            <span>the<span className="text-[#DC143C]">left</span>.one</span>
            <span className={`text-[10px] text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#DC143C]' : ''}`}>
              ▾
            </span>
          </button>

          {/* Dropdown Menu Categories - aligned right below the button */}
          {isOpen && (
            <div 
              className="absolute right-0 top-full mt-2 w-64 bg-black/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_30px_rgba(220,20,60,0.15)] p-2 z-50 normal-case tracking-normal text-zinc-300 animate-fadeIn border-t-2 border-t-[#DC143C]"
            >
              <div className="space-y-1 font-mono">
                
                {/* 1. Primary Oracle Chat */}
                <button
                  onClick={() => handleSelect('chat')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors uppercase font-google-sans cursor-pointer ${
                    activeView === 'chat' 
                      ? 'bg-zinc-900 text-[#DC143C] font-bold shadow-sm' 
                      : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-white'
                  }`}
                >
                  <span className="font-bold text-[11px] tracking-wider">Oracle Chat</span>
                  {activeView === 'chat' && <span className="text-[#DC143C] text-[10px]">●</span>}
                </button>

                {/* 2. Unified Divination Hub */}
                <button
                  onClick={() => handleSelect('divination')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors uppercase font-google-sans cursor-pointer ${
                    activeView === 'divination' || activeView === 'tarot' || activeView === 'upload-spread' || activeView === 'encyclopedia'
                      ? 'bg-zinc-900 text-[#DC143C] font-bold shadow-sm' 
                      : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-white'
                  }`}
                >
                  <span className="font-bold text-[11px] tracking-wider">Divination</span>
                  {(activeView === 'divination' || activeView === 'tarot' || activeView === 'upload-spread' || activeView === 'encyclopedia') && (
                    <span className="text-[#DC143C] text-[10px]">●</span>
                  )}
                </button>

                {/* 3. Voice Settings */}
                <button
                  onClick={() => handleSelect('voice-settings')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors uppercase font-google-sans cursor-pointer ${
                    activeView === 'voice-settings' 
                      ? 'bg-zinc-900 text-[#DC143C] font-bold shadow-sm' 
                      : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-white'
                  }`}
                >
                  <span className="font-bold text-[11px] tracking-wider">Voice Settings</span>
                  {activeView === 'voice-settings' && <span className="text-[#DC143C] text-[10px]">●</span>}
                </button>

                {/* 4. Unified Account & Insights Hub */}
                <button
                  onClick={() => handleSelect('account')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors uppercase font-google-sans cursor-pointer ${
                    activeView === 'account' || activeView === 'inner-work' || activeView === 'transcripts'
                      ? 'bg-zinc-900 text-[#DC143C] font-bold shadow-sm' 
                      : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-white'
                  }`}
                >
                  <span className="font-bold text-[11px] tracking-wider">Account & Insights</span>
                  {(activeView === 'account' || activeView === 'inner-work' || activeView === 'transcripts') && (
                    <span className="text-[#DC143C] text-[10px]">●</span>
                  )}
                </button>

                {/* Divider */}
                <div className="h-px bg-zinc-800/80 my-1.5" />

                {/* 5. External link to theleft.one */}
                <a
                  href="https://theleft.one"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-900/60 rounded-lg flex items-center justify-between transition-colors text-lg text-zinc-300 hover:text-white group"
                >
                  <span className="font-ruthie">the<span className="text-[#DC143C]">left</span>.one</span>
                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 font-mono">↗</span>
                </a>

              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
