import React, { useState } from 'react';
import { ThreeCardOracle, TarotCard } from './ThreeCardOracle';
import { TarotEncyclopedia } from './TarotEncyclopedia';
import { UploadSpread } from './UploadSpread';

interface DivinationHubProps {
  initialTab?: 'oracle' | 'offline-spread' | 'encyclopedia';
  onReturnToChat: () => void;
  onStartSeanceWithCard?: (cardName: string, promptQuestion?: string) => void;
  onStartReading?: (prompt: string, mode: 'tarot' | 'tarot-physical', cards: TarotCard[]) => void;
  onShareTarotReading?: (question: string, cards: TarotCard[]) => void;
}

export const DivinationHub: React.FC<DivinationHubProps> = ({
  initialTab = 'oracle',
  onReturnToChat,
  onStartSeanceWithCard,
  onStartReading,
  onShareTarotReading
}) => {
  const [activeTab, setActiveTab] = useState<'oracle' | 'offline-spread' | 'encyclopedia'>(initialTab);

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col min-h-0 relative font-google-sans text-zinc-300 animate-fadeIn pt-1 sm:pt-2">
      
      {/* Top Header & Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900/60 pb-3 mb-4 flex-shrink-0">
        <div>
          <h2 className="text-sm sm:text-base font-bold italic text-zinc-300 tracking-wide uppercase">
            Divination
          </h2>
        </div>

        {/* Tab Selection Switcher in exact layout sequence */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900/80 shadow-inner self-start sm:self-auto gap-1">
          <button
            onClick={() => setActiveTab('oracle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'oracle'
                ? 'bg-[#DC143C] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <span>3-Card Oracle</span>
          </button>

          <button
            onClick={() => setActiveTab('offline-spread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'offline-spread'
                ? 'bg-[#DC143C] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <span>Offline Spread</span>
          </button>

          <button
            onClick={() => setActiveTab('encyclopedia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'encyclopedia'
                ? 'bg-[#DC143C] text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <span>Encyclopedia</span>
          </button>
        </div>
      </div>

      {/* Tab Contents with fast subtle transitions */}
      <div className="flex-1 min-h-0 flex flex-col transition-all duration-200">
        {activeTab === 'oracle' && (
          <ThreeCardOracle 
            onStartReading={(prompt, mode, cards) => {
              if (onStartReading) {
                onStartReading(prompt, mode, cards);
              }
            }}
            onShareTarotReading={onShareTarotReading}
          />
        )}

        {activeTab === 'offline-spread' && (
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

