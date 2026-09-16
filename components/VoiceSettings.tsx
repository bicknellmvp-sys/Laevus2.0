import React, { useState, useEffect } from 'react';
import { 
  VoiceSettings as VoiceSettingsType, 
  getSavedVoiceSettings, 
  saveVoiceSettings, 
  PERSONA_PROFILES, 
  PersonaId,
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

  const handlePersonaSelect = (personaId: PersonaId) => {
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

  const handleResetSliders = () => {
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

  // Four personas in exact 2x2 grid positions
  const personaList: PersonaId[] = [
    'Madame Blavatsky',        // Box 1 (Top-Left)
    'Sophisticated Gentleman',  // Box 2 (Top-Right)
    'Khan',                     // Box 3 (Bottom-Left)
    'Marie'                     // Box 4 (Bottom-Right)
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 my-2 animate-fadeIn font-google-sans text-zinc-200 select-text">
      
      {/* Header Banner */}
      <div className="border-b border-zinc-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#DC143C] font-bold">
              Voice Persona
            </span>
            {savedNotice && (
              <span className="text-[10px] font-mono text-emerald-400">
                Saved
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-syne text-[#F8F7F4] tracking-tight">
            Voice Settings
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure persona profiles, speech-to-text input, and audio export settings.
          </p>
        </div>

        {/* Return to chat if handler supplied */}
        {onReturnToChat && (
          <button
            onClick={onReturnToChat}
            className="self-start sm:self-center px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono uppercase tracking-wider text-zinc-300 rounded-lg transition-colors cursor-pointer"
          >
            Return
          </button>
        )}
      </div>

      {/* TOP SECTION: Four Small Persona Selector Boxes (2x2 Grid) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
            Voice Persona
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            Active: {settings.persona}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {personaList.map((id, index) => {
            const profile = PERSONA_PROFILES[id];
            const isSelected = settings.persona === id;

            return (
              <button
                key={id}
                onClick={() => handlePersonaSelect(id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-zinc-950 border-[#DC143C] shadow-[0_0_15px_rgba(220,20,60,0.15)] ring-1 ring-[#DC143C]/50'
                    : 'bg-black border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      Box {index + 1}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-[#DC143C]/20 border border-[#DC143C]/40 text-[#DC143C] font-bold">
                        Selected
                      </span>
                    )}
                  </div>

                  <h3 className={`text-sm font-bold font-syne uppercase tracking-wider ${
                    isSelected ? 'text-white' : 'text-zinc-200'
                  }`}>
                    {profile.title}
                  </h3>

                  <div className="text-[11px] font-mono text-[#DC143C] mt-1 font-medium">
                    {profile.accent}
                  </div>

                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {profile.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-900/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>Pitch: {profile.defaultPitch.toFixed(2)}x</span>
                  <span>Cadence: {profile.defaultSpeed.toFixed(2)}x</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION: One Larger Container for Audio Settings, Controls, STT, and Disclaimers */}
      <div className="bg-black border border-zinc-900 rounded-2xl p-5 sm:p-7 space-y-6 shadow-2xl">
        
        {/* Section 1: Master Audio Synthesis Toggle & Test */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-900">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              Audio Synthesis Status
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Controls spoken audio delivery for oracle conversations and readings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleUpdate({ enabled: !settings.enabled })}
              className={`px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer border ${
                settings.enabled
                  ? 'bg-[#DC143C] text-white border-[#DC143C]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {settings.enabled ? 'Audio Enabled' : 'Audio Muted'}
            </button>

            <button
              onClick={handleTestVoice}
              disabled={!settings.enabled}
              className={`px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer border ${
                !settings.enabled
                  ? 'bg-zinc-950 text-zinc-700 border-zinc-900 cursor-not-allowed'
                  : isSpeaking
                  ? 'bg-zinc-900 text-[#DC143C] border-[#DC143C]'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
              }`}
            >
              {isSpeaking ? 'Stop Voice' : 'Test Voice'}
            </button>
          </div>
        </div>

        {/* Section 2: Pitch and Cadence Modulation Sliders */}
        <div className="space-y-4 pb-5 border-b border-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              Audio Modulation
            </span>
            <button
              onClick={handleResetSliders}
              className="text-[10px] font-mono uppercase text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Reset Sliders
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pitch Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-xs font-mono text-zinc-300">
                  Pitch
                </label>
                <span className="text-xs font-mono font-bold text-[#DC143C] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
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
                className="w-full accent-[#DC143C] bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-600 uppercase">
                <span>0.50x Low</span>
                <span>1.00x Natural</span>
                <span>1.80x High</span>
              </div>
            </div>

            {/* Cadence Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-xs font-mono text-zinc-300">
                  Cadence
                </label>
                <span className="text-xs font-mono font-bold text-[#DC143C] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
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
                className="w-full accent-[#DC143C] bg-zinc-900 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-600 uppercase">
                <span>0.50x Deliberate</span>
                <span>1.00x Normal</span>
                <span>1.80x Swift</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Voice-to-Text (STT) Settings */}
        <div className="space-y-3 pb-5 border-b border-zinc-900">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
            Voice-to-Text Input (STT)
          </div>
          <p className="text-xs text-zinc-400">
            Enables microphone dictation across all text fields in the Oracle and Divination interfaces.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handleUpdate({ sttEnabled: !settings.sttEnabled })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between ${
                settings.sttEnabled
                  ? 'bg-zinc-950 border-[#DC143C]/70 text-white'
                  : 'bg-black border-zinc-900 text-zinc-400 hover:border-zinc-800'
              }`}
            >
              <div>
                <div className="text-xs font-mono font-bold uppercase">Dictation Input</div>
                <div className="text-[10px] text-zinc-500">Show Voice button in chat fields</div>
              </div>
              <span className="text-xs font-mono font-bold text-[#DC143C]">
                {settings.sttEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </button>

            <button
              onClick={() => handleUpdate({ autoSendVoice: !settings.autoSendVoice })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between ${
                settings.autoSendVoice
                  ? 'bg-zinc-950 border-[#DC143C]/70 text-white'
                  : 'bg-black border-zinc-900 text-zinc-400 hover:border-zinc-800'
              }`}
            >
              <div>
                <div className="text-xs font-mono font-bold uppercase">Auto-Send on Silence</div>
                <div className="text-[10px] text-zinc-500">Send message automatically on pause</div>
              </div>
              <span className="text-xs font-mono font-bold text-[#DC143C]">
                {settings.autoSendVoice ? 'Enabled' : 'Disabled'}
              </span>
            </button>
          </div>
        </div>

        {/* Section 4: Voice Cloning & Audio Export Profile */}
        <div className="space-y-3 pb-5 border-b border-zinc-900">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
            Audio Exports & Voice Profile Configuration
          </div>
          <p className="text-xs text-zinc-400">
            Choose how user dialogue is articulated in exported MP3 conversation recordings.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={() => handleUpdate({ userVoiceMode: 'actual' })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                settings.userVoiceMode === 'actual'
                  ? 'bg-zinc-950 border-[#DC143C] text-white ring-1 ring-[#DC143C]/40'
                  : 'bg-black border-zinc-900 text-zinc-400 hover:border-zinc-800'
              }`}
            >
              <div className="text-xs font-mono font-bold uppercase">Actual Voice</div>
              <div className="text-[10px] text-zinc-500 mt-1">Captured directly via microphone STT recording</div>
            </button>

            <button
              onClick={() => handleUpdate({ userVoiceMode: 'cloned' })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                settings.userVoiceMode === 'cloned'
                  ? 'bg-zinc-950 border-[#DC143C] text-white ring-1 ring-[#DC143C]/40'
                  : 'bg-black border-zinc-900 text-zinc-400 hover:border-zinc-800'
              }`}
            >
              <div className="text-xs font-mono font-bold uppercase">Cloned Audio Profile</div>
              <div className="text-[10px] text-zinc-500 mt-1">Modulated audio synthesis profile matching user tone</div>
            </button>

            <button
              onClick={() => handleUpdate({ userVoiceMode: 'default' })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                settings.userVoiceMode === 'default'
                  ? 'bg-zinc-950 border-[#DC143C] text-white ring-1 ring-[#DC143C]/40'
                  : 'bg-black border-zinc-900 text-zinc-400 hover:border-zinc-800'
              }`}
            >
              <div className="text-xs font-mono font-bold uppercase">Default System Voice</div>
              <div className="text-[10px] text-zinc-500 mt-1">Standard system speech synthesis (Opt-out of cloning)</div>
            </button>
          </div>
        </div>

        {/* Section 5: Esoteric Wisdom Persona Sample */}
        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#DC143C] font-bold">
            Esoteric Wisdom Sample
          </div>
          <p className="text-xs text-zinc-300 italic pl-3 border-l-2 border-[#DC143C]">
            "{activeProfile.testPhrase}"
          </p>
        </div>

        {/* Mandatory Performance Notice & Disclaimer */}
        <div className="p-4 bg-black border border-zinc-800/80 rounded-xl">
          <div className="text-[10px] font-mono uppercase font-bold text-zinc-400 mb-1 tracking-wider">
            Performance Notice & Disclaimer
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-google-sans">
            Enabling real-time voice synthesis, audio cloning, and advanced voice-to-text processing may impact application responsiveness and loading speeds depending on your hardware and network connection. You may opt out of audio processing features at any time to optimize performance.
          </p>
        </div>

      </div>

    </div>
  );
};
