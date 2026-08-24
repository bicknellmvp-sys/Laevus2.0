import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  Radio, 
  Check, 
  Headphones,
  ChevronLeft
} from 'lucide-react';
import { 
  VoiceSettings as VoiceSettingsType, 
  getSavedVoiceSettings, 
  saveVoiceSettings, 
  PERSONA_PROFILES, 
  voiceEngine 
} from '../services/voiceSynthesis';

interface VoiceSettingsProps {
  onReturnToChat?: () => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ onReturnToChat }) => {
  const [settings, setSettings] = useState<VoiceSettingsType>(getSavedVoiceSettings());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const unsubscribe = voiceEngine.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsubscribe();
      voiceEngine.stop();
    };
  }, []);

  const handleUpdate = (updated: Partial<VoiceSettingsType>) => {
    const next = { ...settings, ...updated };
    setSettings(next);
    saveVoiceSettings(next);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1500);
  };

  const handlePersonaSelect = (personaId: VoiceSettingsType['persona']) => {
    const profile = PERSONA_PROFILES[personaId];
    const next: VoiceSettingsType = {
      ...settings,
      persona: personaId,
      pitch: profile.defaultPitch,
      speed: profile.defaultSpeed
    };
    setSettings(next);
    saveVoiceSettings(next);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1500);
  };

  const handleTestVoice = () => {
    if (isSpeaking) {
      voiceEngine.stop();
    } else {
      voiceEngine.testVoice(settings);
    }
  };

  const handleResetDefaults = () => {
    const profile = PERSONA_PROFILES[settings.persona];
    const next: VoiceSettingsType = {
      ...settings,
      pitch: profile.defaultPitch,
      speed: profile.defaultSpeed
    };
    setSettings(next);
    saveVoiceSettings(next);
  };

  const activeProfile = PERSONA_PROFILES[settings.persona] || PERSONA_PROFILES['Madame Blavatsky'];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 my-2 animate-fadeIn font-google-sans text-zinc-200">
      
      {/* Header Banner */}
      <div className="border-b border-zinc-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#E60026] font-bold bg-[#E60026]/10 px-2 py-0.5 rounded border border-[#E60026]/30">
              Aural Resonance Conduit
            </span>
            {savedNotice && (
              <span className="text-[10px] font-mono text-emerald-400 animate-pulse">
                ● Synchronized
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-syne text-[#F8F7F4] tracking-tight">
            Esoteric Voice Synthesis Settings
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure vocal conduits, astral frequency pitches, and speech playback speed for all readings.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {onReturnToChat && (
            <button
              onClick={onReturnToChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-[#E60026]/50 text-zinc-300 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-md group"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#E60026] group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-bold uppercase tracking-wider text-[10px]">Return to Oracle Chat</span>
            </button>
          )}

          {/* Global Master Audio Toggle */}
          <div className="flex items-center gap-3 bg-black border border-zinc-900 rounded-xl p-2.5 shadow-lg">
            <div className="flex items-center gap-2">
              {settings.enabled ? (
                <Volume2 className="w-4 h-4 text-[#E60026] animate-pulse" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-600" />
              )}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-zinc-400">
                  Audio Synthesis
                </span>
                <span className={`text-[11px] font-bold ${settings.enabled ? 'text-[#E60026]' : 'text-zinc-600'}`}>
                  {settings.enabled ? 'ENABLED' : 'MUTED'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleUpdate({ enabled: !settings.enabled })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                settings.enabled ? 'bg-[#E60026]' : 'bg-zinc-800'
              }`}
              aria-label="Toggle Audio Synthesis"
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Persona Conduits Selection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#E60026]" />
              Select Voice Persona
            </span>
            <span className="text-[10px] font-mono text-zinc-600">4 Conduits Available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(PERSONA_PROFILES).map((profile) => {
              const isSelected = settings.persona === profile.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => handlePersonaSelect(profile.id)}
                  className={`p-4 rounded-xl border text-left transition-all duration-300 relative group flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-950 border-[#E60026] shadow-[0_0_20px_rgba(230,0,38,0.15)] ring-1 ring-[#E60026]/40'
                      : 'bg-black border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl p-1.5 bg-zinc-900/80 rounded-lg border border-zinc-800">
                          {profile.avatar}
                        </span>
                        <div>
                          <h4 className={`text-xs font-bold font-syne uppercase tracking-wider ${
                            isSelected ? 'text-[#F8F7F4]' : 'text-zinc-300 group-hover:text-white'
                          }`}>
                            {profile.title}
                          </h4>
                          <span className="text-[9px] text-[#E60026] font-mono block">
                            {profile.tone}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#E60026] text-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <p className="text-[10.5px] leading-relaxed text-zinc-400 mt-2 font-google-sans">
                      {profile.tagline}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-900/60 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                    <span>Base Pitch: {profile.defaultPitch}x</span>
                    <span>Base Speed: {profile.defaultSpeed}x</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Persona Live Quote Card */}
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E60026]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
              <Sparkles className="w-3 h-3 text-[#E60026]" />
              Active Astral Matrix Quote
            </div>
            <p className="text-xs text-zinc-300 italic font-google-sans pl-2 border-l-2 border-[#E60026]">
              "{activeProfile.testPhrase}"
            </p>
          </div>
        </div>

        {/* Right Column: Granular Controls & Sliders */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#E60026]" />
              Granular Modulation
            </span>
            <button
              onClick={handleResetDefaults}
              className="text-[9px] uppercase font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Reset Sliders
            </button>
          </div>

          <div className="bg-black border border-zinc-900 rounded-xl p-5 space-y-6 shadow-xl">
            
            {/* Pitch Modulation Slider */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-300">
                  Resonance Pitch
                </label>
                <span className="text-xs font-mono font-bold text-[#E60026] bg-[#E60026]/10 px-2 py-0.5 rounded border border-[#E60026]/20">
                  {settings.pitch.toFixed(2)}x
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.05"
                value={settings.pitch}
                onChange={(e) => handleUpdate({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-[#E60026] bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase">
                <span>0.5x (Deep/Archaic)</span>
                <span>1.0x (Harmonic)</span>
                <span>1.8x (Ethereal)</span>
              </div>
            </div>

            {/* Speed / Rate Modulation Slider */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-300">
                  Vocal Cadence Speed
                </label>
                <span className="text-xs font-mono font-bold text-[#E60026] bg-[#E60026]/10 px-2 py-0.5 rounded border border-[#E60026]/20">
                  {settings.speed.toFixed(2)}x
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.05"
                value={settings.speed}
                onChange={(e) => handleUpdate({ speed: parseFloat(e.target.value) })}
                className="w-full accent-[#E60026] bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase">
                <span>0.5x (Meditative)</span>
                <span>1.0x (Standard)</span>
                <span>1.8x (Electric)</span>
              </div>
            </div>

            {/* Test Voice Control */}
            <div className="pt-4 border-t border-zinc-900 space-y-3">
              <button
                onClick={handleTestVoice}
                disabled={!settings.enabled}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  !settings.enabled
                    ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800'
                    : isSpeaking
                    ? 'bg-zinc-900 text-[#E60026] border border-[#E60026] shadow-[0_0_20px_rgba(230,0,38,0.2)]'
                    : 'bg-[#E60026] hover:bg-[#ff334b] text-black shadow-[0_4px_20px_rgba(230,0,38,0.25)]'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Halt Vocal Transmission</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test Voice Synthesis</span>
                  </>
                )}
              </button>

              {isSpeaking && (
                <div className="flex items-center justify-center gap-1 py-1">
                  <div className="w-1 h-3 bg-[#E60026] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1 h-5 bg-[#E60026] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1 h-4 bg-[#E60026] rounded-full animate-bounce" />
                  <div className="w-1 h-6 bg-[#E60026] rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-1 h-3 bg-[#E60026] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="text-[10px] font-mono text-zinc-400 ml-2">Synthesizing audio wave...</span>
                </div>
              )}
            </div>

          </div>

          {/* Quick Guidance Info */}
          <div className="p-3 bg-zinc-950/80 border border-zinc-900/60 rounded-lg text-[10px] text-zinc-500 font-mono flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5 text-[#E60026] flex-shrink-0" />
            <span>Voice synthesis automatically articulates all tarot and spiritual consultations.</span>
          </div>

        </div>

      </div>

    </div>
  );
};
