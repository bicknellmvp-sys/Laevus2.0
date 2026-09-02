import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  Sparkles, 
  User as UserIcon, 
  Volume2, 
  MessageSquare,
  Compass
} from 'lucide-react';

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
    <div className="text-center relative z-40 max-w-6xl mx-auto px-4 pt-3 pb-2 flex flex-col items-center">
      <div className="relative inline-block">
        <h1 className="font-syne text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.06em] text-[#F8F7F4] uppercase leading-[0.85] selection:bg-[#E60026] selection:text-[#111113] relative select-none">
          {/* Universal Persistent Home Link */}
          <a
            href="/"
            onClick={handleHomeClick} 
            className="hover:text-[#E60026] hover:drop-shadow-[0_0_15px_rgba(230,0,38,0.6)] transition-all uppercase font-syne text-center tracking-[-0.06em] leading-none font-extrabold focus:outline-none cursor-pointer bg-transparent border-none p-0 outline-none inline-block"
            title="Return to LAEVUS Home"
          >
            LAEVUS
          </a>
          
          {/* THELEFT.ONE trigger dropdown positioned cleanly beneath the right edge */}
          <div 
            ref={dropdownRef}
            className="absolute right-0 bottom-[-22px] sm:bottom-[-26px] md:bottom-[-30px] translate-y-[20%] z-50 flex flex-col items-end"
          >
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-50 flex items-center gap-1.5 px-3 py-1 bg-black border border-zinc-800 rounded-lg hover:border-[#E60026]/60 transition-colors cursor-pointer text-base sm:text-lg md:text-xl font-ruthie tracking-normal normal-case shadow-lg"
              id="theleftone-dropdown-trigger"
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="font-ruthie">the<span className="text-[#E60026]">left</span>.one</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#E60026]' : ''}`} />
            </button>

            {/* Dropdown Menu Categories */}
            {isOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-64 bg-black/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(230,0,38,0.12)] p-2 z-50 normal-case tracking-normal text-zinc-300 animate-fadeIn border-t-2 border-t-[#E60026]"
              >
                <div className="space-y-1 font-mono">
                  
                  {/* 1. Primary Oracle Chat */}
                  <button
                    onClick={() => handleSelect('chat')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors uppercase font-google-sans cursor-pointer ${
                      activeView === 'chat' 
                        ? 'bg-zinc-900 text-[#E60026] font-bold shadow-sm' 
                        : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-white'
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 ${activeView === 'chat' ? 'text-[#E60026]' : 'text-[#E60026]'}`} />
                    <span className="font-bold text-[11px] tracking-wider">Oracle Chat</span>
                  </button>

                  {/* 2. Unified Divination Hub */}
                  <button
                    onClick={() => handleSelect('divination')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors uppercase font-google-sans cursor-pointer ${
                      activeView === 'divination' || activeView === 'tarot' || activeView === 'upload-spread' || activeView === 'encyclopedia'
                        ? 'bg-zinc-900 text-[#E60026] font-bold shadow-sm' 
                        : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-[11px] tracking-wider">Divination</span>
                  </button>

                  {/* 3. Voice Settings */}
                  <button
                    onClick={() => handleSelect('voice-settings')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors uppercase font-google-sans cursor-pointer ${
                      activeView === 'voice-settings' 
                        ? 'bg-zinc-900 text-[#E60026] font-bold shadow-sm' 
                        : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-white'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#E60026]" />
                    <span className="font-bold text-[11px] tracking-wider">Voice Settings</span>
                  </button>

                  {/* 4. Unified Account & Insights Hub */}
                  <button
                    onClick={() => handleSelect('account')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors uppercase font-google-sans cursor-pointer ${
                      activeView === 'account' || activeView === 'inner-work' || activeView === 'transcripts'
                        ? 'bg-zinc-900 text-[#E60026] font-bold shadow-sm' 
                        : 'text-zinc-300 hover:bg-zinc-900/60 hover:text-white'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-bold text-[11px] tracking-wider">Account & Insights</span>
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-zinc-800/80 my-1.5" />

                  {/* 5. External link to theleft.one */}
                  <a
                    href="https://theleft.one"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-900/60 rounded-lg flex items-center gap-2.5 transition-colors text-lg text-zinc-300 hover:text-white group"
                  >
                    <Compass className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#E60026] transition-colors" />
                    <span className="font-ruthie">the<span className="text-[#E60026]">left</span>.one</span>
                    <span className="ml-auto text-[10px] text-zinc-600 group-hover:text-zinc-400 font-mono">↗</span>
                  </a>

                </div>
              </div>
            )}
          </div>
        </h1>
      </div>
    </div>
  );
};
