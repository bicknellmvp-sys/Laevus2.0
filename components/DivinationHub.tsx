import React, { useState } from 'react';
import { ThreeCardOracle, TarotCard } from './ThreeCardOracle';
import { TarotEncyclopedia } from './TarotEncyclopedia';
import { UploadSpread } from './UploadSpread';

interface DivinationHubProps {
  initialTab?: 'oracle' | 'offline-spread' | 'encyclopedia';
  onReturnToChat: () => void;
  onStartSeanceWithCard?: (cardName: string, promptQuestion?: string) => void;
  onStartReading?: (
    prompt: string, 
    mode: 'tarot' | 'tarot-physical', 
    cards: TarotCard[],
    extra?: { followUpQuestion?: string; primaryQuestion?: string }
  ) => void;
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
      {/* Tab Contents with fast subtle transitions */}
      <div className="flex-1 min-h-0 flex flex-col transition-all duration-200">
        {activeTab === 'oracle' && (
          <ThreeCardOracle 
            onStartReading={(prompt, mode, cards, extra) => {
              if (onStartReading) {
                onStartReading(prompt, mode, cards, extra);
              }
            }}
            onShareTarotReading={onShareTarotReading}
            onSelectEncyclopedia={() => setActiveTab('encyclopedia')}
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

