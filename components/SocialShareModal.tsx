import React, { useState } from 'react';

export interface ShareContent {
  title: string;
  text: string;
  url?: string;
  category?: 'oracle' | 'tarot' | 'stats';
}

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ShareContent | null;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  content
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !content) return null;

  const appUrl = content.url || window.location.origin || 'https://theleft.one';
  const fullShareText = `${content.text}\n\n${appUrl}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullShareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullShareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.text,
          url: appUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        if ((err as Error)?.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const shareToTwitter = () => {
    const tweetText = encodeURIComponent(`${content.text}\n\n`);
    const tweetUrl = encodeURIComponent(appUrl);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank', 'noopener,noreferrer');
  };

  const shareToWhatsApp = () => {
    const waText = encodeURIComponent(`${content.text}\n\n${appUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank', 'noopener,noreferrer');
  };

  const shareToFacebook = () => {
    const fbUrl = encodeURIComponent(appUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${fbUrl}`, '_blank', 'noopener,noreferrer');
  };

  const shareToTelegram = () => {
    const tgText = encodeURIComponent(content.text);
    const tgUrl = encodeURIComponent(appUrl);
    window.open(`https://t.me/share/url?url=${tgUrl}&text=${tgText}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-5 sm:p-6 relative shadow-[0_15px_50px_rgba(0,0,0,0.9)] text-zinc-200 font-google-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-[#DC143C] transition-colors cursor-pointer text-lg font-bold p-1"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-xl text-[#DC143C]">✦</span>
          <div>
            <h3 className="font-syne text-base font-extrabold text-[#F8F7F4] uppercase tracking-wide">
              {content.title}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Share to your social feeds or copy formatted text
            </p>
          </div>
        </div>

        {/* Preview Box */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3.5 mb-5 max-h-48 overflow-y-auto select-text text-left">
          <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-google-sans">
            {content.text}
          </p>
          <div className="mt-2 pt-2 border-t border-zinc-800/60 text-[10px] text-[#DC143C] font-mono">
            {appUrl}
          </div>
        </div>

        {/* Social Share Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            
            {/* X / Twitter */}
            <button
              onClick={shareToTwitter}
              className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-zinc-900 hover:bg-black border border-zinc-800 hover:border-[#DC143C]/50 transition-all cursor-pointer group"
              title="Share on X"
            >
              <span className="text-base text-zinc-200 group-hover:text-white font-bold font-syne">𝕏</span>
              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200">X (Twitter)</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={shareToWhatsApp}
              className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-zinc-900 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/50 transition-all cursor-pointer group"
              title="Share on WhatsApp"
            >
              <span className="text-base text-emerald-400">💬</span>
              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200">WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={shareToTelegram}
              className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-zinc-900 hover:bg-sky-950/40 border border-zinc-800 hover:border-sky-500/50 transition-all cursor-pointer group"
              title="Share on Telegram"
            >
              <span className="text-base text-sky-400">✈️</span>
              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200">Telegram</span>
            </button>

            {/* Facebook */}
            <button
              onClick={shareToFacebook}
              className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-zinc-900 hover:bg-blue-950/40 border border-zinc-800 hover:border-blue-500/50 transition-all cursor-pointer group"
              title="Share on Facebook"
            >
              <span className="text-base text-blue-400 font-bold">f</span>
              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200">Facebook</span>
            </button>

          </div>

          {/* Native Web Share & Copy */}
          <div className="flex items-center gap-2 pt-1">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex-1 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>↗</span>
                <span>More Options</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#DC143C] hover:bg-[#B81132] text-white'
              }`}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
