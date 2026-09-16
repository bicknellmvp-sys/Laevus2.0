import React, { useState } from 'react';
import { exportToWordDoc, exportToPdf, exportToAudioMp3 } from '../services/exportService';

export interface ShareContent {
  title: string;
  text: string;
  url?: string;
  persona?: string;
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
  const [audioStatus, setAudioStatus] = useState<string | null>(null);

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

  const shareToFacebook = () => {
    const fbUrl = encodeURIComponent(appUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${fbUrl}`, '_blank', 'noopener,noreferrer');
  };

  const shareToLinkedIn = () => {
    const lkUrl = encodeURIComponent(appUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${lkUrl}`, '_blank', 'noopener,noreferrer');
  };

  const shareToReddit = () => {
    const title = encodeURIComponent(content.title);
    const text = encodeURIComponent(fullShareText);
    window.open(`https://www.reddit.com/submit?title=${title}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleExportDoc = () => {
    exportToWordDoc({
      title: content.title,
      persona: content.persona || 'Oracle',
      messages: [{ role: 'oracle', text: content.text }]
    });
  };

  const handleExportPdf = () => {
    exportToPdf({
      title: content.title,
      persona: content.persona || 'Oracle',
      messages: [{ role: 'oracle', text: content.text }]
    });
  };

  const handleExportMp3 = async () => {
    setAudioStatus('Generating audio...');
    await exportToAudioMp3(
      {
        title: content.title,
        persona: content.persona || 'Oracle',
        messages: [{ role: 'oracle', text: content.text }]
      },
      (_, status) => setAudioStatus(status)
    );
    setTimeout(() => setAudioStatus(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 relative shadow-[0_15px_50px_rgba(0,0,0,0.9)] text-zinc-200 font-google-sans">
        
        {/* Close Button - text only */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xs font-mono uppercase text-zinc-500 hover:text-[#DC143C] transition-colors cursor-pointer px-2 py-1 border border-zinc-800 rounded hover:border-zinc-700"
          aria-label="Close modal"
        >
          Close
        </button>

        {/* Header */}
        <div className="mb-4 pr-14">
          <div className="text-[10px] uppercase font-mono tracking-widest text-[#DC143C] font-bold">
            Social Share & Export
          </div>
          <h3 className="font-syne text-base font-extrabold text-[#F8F7F4] uppercase tracking-wide mt-0.5">
            {content.title}
          </h3>
          <p className="text-[11px] text-zinc-400">
            Share transcript to social feeds or download audio and text files.
          </p>
        </div>

        {/* Preview Box */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3.5 mb-4 max-h-40 overflow-y-auto select-text text-left">
          <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-google-sans">
            {content.text}
          </p>
          <div className="mt-2 pt-2 border-t border-zinc-800/60 text-[10px] text-[#DC143C] font-mono">
            {appUrl}
          </div>
        </div>

        {/* Social Platforms Row - Clean text only */}
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block mb-2">
            Publish Transcript
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={shareToTwitter}
              className="py-2.5 px-3 rounded-lg bg-zinc-900 hover:bg-black border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer text-xs font-mono font-bold text-zinc-200 text-center uppercase"
            >
              X (Twitter)
            </button>
            <button
              onClick={shareToFacebook}
              className="py-2.5 px-3 rounded-lg bg-zinc-900 hover:bg-black border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer text-xs font-mono font-bold text-zinc-200 text-center uppercase"
            >
              Facebook
            </button>
            <button
              onClick={shareToLinkedIn}
              className="py-2.5 px-3 rounded-lg bg-zinc-900 hover:bg-black border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer text-xs font-mono font-bold text-zinc-200 text-center uppercase"
            >
              LinkedIn
            </button>
            <button
              onClick={shareToReddit}
              className="py-2.5 px-3 rounded-lg bg-zinc-900 hover:bg-black border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer text-xs font-mono font-bold text-zinc-200 text-center uppercase"
            >
              Reddit
            </button>
          </div>
        </div>

        {/* Export Files Row - Audio & Document downloads */}
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block mb-2">
            Direct File Downloads
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleExportMp3}
              className="py-2 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-[#DC143C]/60 text-xs font-mono uppercase font-bold text-zinc-300 text-center cursor-pointer transition-colors"
            >
              {audioStatus ? 'Synthesizing...' : 'Audio (.MP3)'}
            </button>
            <button
              onClick={handleExportDoc}
              className="py-2 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-[#DC143C]/60 text-xs font-mono uppercase font-bold text-zinc-300 text-center cursor-pointer transition-colors"
            >
              Document (.DOC)
            </button>
            <button
              onClick={handleExportPdf}
              className="py-2 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-[#DC143C]/60 text-xs font-mono uppercase font-bold text-zinc-300 text-center cursor-pointer transition-colors"
            >
              Print / PDF
            </button>
          </div>
        </div>

        {/* Copy & Share Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-mono uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Device Share
            </button>
          )}

          <button
            onClick={handleCopy}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#DC143C] hover:bg-[#B81132] text-white'
            }`}
          >
            {copied ? 'Transcript Copied to Clipboard' : 'Copy Full Transcript'}
          </button>
        </div>

      </div>
    </div>
  );
};
