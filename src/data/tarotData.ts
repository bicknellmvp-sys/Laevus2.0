export * from '../../data/tarotCards';
import { TAROT_DATABASE, TarotCardData } from '../../data/tarotCards';

export const MAJOR_ARCANA: TarotCardData[] = TAROT_DATABASE.filter(c => c.arcana === 'major');
export const MINOR_ARCANA: TarotCardData[] = TAROT_DATABASE.filter(c => c.arcana === 'minor');
export const FULL_DECK: TarotCardData[] = TAROT_DATABASE;
