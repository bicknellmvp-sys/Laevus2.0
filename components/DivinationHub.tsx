import React, { useState } from 'react';
import { Sparkles, Layers, Compass, ChevronLeft } from 'lucide-react';
import { TarotEncyclopedia } from './TarotEncyclopedia';
import { UploadSpread } from './UploadSpread';

interface DivinationHubProps {
  initialTab?: 'oracle' | 'upload' | 'encyclopedia';
  onReturnToChat: () => void;
  onStartSeanceWithCard?: (cardName: string, promptQuestion?: string) => void;
  onSelectTarotReadMode?: (mode: 'digital' | 'physical', question: string, past?: string, present?: string, future?: string) => void;
  onLaunchThreeCardDraw?: () => void;
}

export const DivinationHub: React.FC<DivinationHubProps> = ({
  initialTab = 'oracle',
  onReturnToChat,
  onStartSeanceWithCard,
  onLaunchThreeCardDraw
}) => {
  const [activeTab, setActiveTab] = useState<'oracle' | 'upload' | 'encyclopedia'>(initialTab);

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col min-h-0 relative font-google-sans text-zinc-300 animate-fadeIn">
      
      {/* Top Header & Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900/60 pb-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToChat}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors uppercase cursor-pointer border border-zinc-800"
            title="Return to Oracle Chat"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#E60026]" />
            <span>Chat</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-syne font-extrabold text-[#F8F7F4] tracking-tight uppercase flex items-center gap-2">
              <span>Divination Sanctuary</span>
              <span className="text-[10px] font-mono font-bold text-[#E60026] bg-[#E60026]/10 px-2 py-0.5 rounded border border-[#E60026]/20">
                UNIFIED REALM
              </span>
            </h2>
          </div>
        </div>

        {/* Tab Selection Switcher */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900/80 shadow-inner self-start sm:self-auto gap-1">
          <button
            onClick={() => {
              setActiveTab('oracle');
              if (onLaunchThreeCardDraw) onLaunchThreeCardDraw();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'oracle'
                ? 'bg-[#E60026] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3-Card Oracle</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#E60026] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Spread Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('encyclopedia')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'encyclopedia'
                ? 'bg-[#E60026] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Encyclopedia</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === 'upload' && (
          <UploadSpread 
            onReturnToChat={onReturnToChat}
            onCompleteReading={() => {}}
          />
        )}

        {activeTab === 'encyclopedia' && (
          <TarotEncyclopedia 
            onStartSeanceWithCard={(card, prompt) => {
              if (onStartSeanceWithCard) {
                onStartSeanceWithCard(card, prompt);
              }
            }}
            onReturnToChat={onReturnToChat}
          />
        )}
      </div>

    </div>
  );
};
