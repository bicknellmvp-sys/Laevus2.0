// Storage service for Manual Tarot Spread Past Readings
import { SpreadCard } from '../components/UploadSpread';
import { VoiceSettings, DEFAULT_VOICE_SETTINGS } from './voiceSynthesis';

export interface PastSpreadSlotCard {
  slot: 'slotA' | 'slotB' | 'slotC' | 'slotD';
  positionName: string; // e.g. "Past / Foundation", "Present / Catalyst", etc.
  card: SpreadCard;
}

export interface PastSpreadReading {
  id: string;
  timestamp: number;
  formattedDate: string;
  cards: PastSpreadSlotCard[];
  question: string;
  hasQuestion: boolean;
  includeInsightCard: boolean;
  readingText: string;
  voiceSettings: VoiceSettings;
  notes?: string;
}

const STORAGE_KEY = 'laevus_manual_spread_past_readings_v1';

// Format readable timestamp
export const formatReadingDate = (timestamp: number): string => {
  try {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Recent';
  }
};

// Retrieve all stored past readings
export const getPastSpreadReadings = (): PastSpreadReading[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (err) {
    console.error("Failed to load past spread readings:", err);
    return [];
  }
};

// Save a new reading to storage
export const savePastSpreadReading = (
  entry: Omit<PastSpreadReading, 'id' | 'timestamp' | 'formattedDate'>
): PastSpreadReading => {
  const timestamp = Date.now();
  const id = `spread_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
  const formattedDate = formatReadingDate(timestamp);

  const newReading: PastSpreadReading = {
    id,
    timestamp,
    formattedDate,
    cards: entry.cards,
    question: entry.question || '',
    hasQuestion: Boolean(entry.hasQuestion),
    includeInsightCard: Boolean(entry.includeInsightCard),
    readingText: entry.readingText,
    voiceSettings: entry.voiceSettings || DEFAULT_VOICE_SETTINGS,
    notes: entry.notes || ''
  };

  try {
    const existing = getPastSpreadReadings();
    // Prepend to top and limit to 100 entries
    const updated = [newReading, ...existing].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch custom window event so listeners can update reactively
    window.dispatchEvent(new CustomEvent('laevus_past_readings_updated', { detail: newReading }));
  } catch (err) {
    console.error("Failed to persist past spread reading:", err);
  }

  return newReading;
};

// Delete a single past reading
export const deletePastSpreadReading = (id: string): void => {
  try {
    const existing = getPastSpreadReadings();
    const filtered = existing.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('laevus_past_readings_updated'));
  } catch (err) {
    console.error("Failed to delete past reading:", err);
  }
};

// Update notes on a past reading
export const updatePastSpreadReadingNotes = (id: string, notes: string): void => {
  try {
    const existing = getPastSpreadReadings();
    const index = existing.findIndex(r => r.id === id);
    if (index !== -1) {
      existing[index].notes = notes;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('laevus_past_readings_updated'));
    }
  } catch (err) {
    console.error("Failed to update notes on past reading:", err);
  }
};

// Clear all readings
export const clearAllPastSpreadReadings = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('laevus_past_readings_updated'));
  } catch (err) {
    console.error("Failed to clear past spread readings:", err);
  }
};

// Export readings as JSON file download
export const exportPastSpreadReadings = (): void => {
  try {
    const readings = getPastSpreadReadings();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(readings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `laevus_spread_readings_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error("Failed to export readings:", err);
  }
};
