export type AppView =
  | 'studio'
  | 'spatial'
  | 'scenarios'
  | 'phrasebook'
  | 'review'
  | 'pricing';

export type CefrLevel = 'A2' | 'B1' | 'B2' | 'C1';

export type VoiceName = 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';

export type CorrectionStyle = 'gentle' | 'active' | 'immersive';

export type SpeakingPace = 'slow' | 'natural' | 'brisk';

export interface LanguageOption {
  code: string;
  speechLocale: string;
  name: string;
  nativeName: string;
  regionHint: string;
  hasNonLatinScript?: boolean;
}

export interface VoicePersona {
  id: VoiceName;
  label: string;
  tone: string;
}

export interface Scenario {
  id: string;
  title: string;
  city: string;
  category: string;
  durationLabel: string;
  defaultLanguageCode: string;
  recommendedLevel: CefrLevel;
  partnerName: string;
  partnerRole: string;
  defaultVoice: VoiceName;
  imageUrl?: string;
  fallbackGradient: string;
  summary: string;
  promptContext: string;
  goals: string[];
  starterPhrases: Record<string, { text: string; reading?: string; meaning: string }[]>;
  isCustom?: boolean;
}

export interface TurnTranslation {
  english: string;
  literalNote: string;
  reading?: string;
}

export interface CoachFeedback {
  turnId: string;
  original: string;
  isNatural: boolean;
  corrected: string;
  explanation: string;
  tip: string;
  keyPhrase?: {
    phrase: string;
    translation: string;
    reading?: string;
  };
  completedGoalIndices: number[];
  createdAt: number;
}

export interface TranscriptTurn {
  id: string;
  role: 'user' | 'partner';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  translation?: TurnTranslation;
  translating?: boolean;
  feedback?: CoachFeedback;
  analyzing?: boolean;
}

export interface ReplySuggestion {
  text: string;
  reading?: string;
  translation: string;
  register: string;
}

export interface SavedPhrase {
  id: string;
  phrase: string;
  translation: string;
  reading?: string;
  languageCode: string;
  scenarioTitle: string;
  note?: string;
  createdAt: number;
  mastered: boolean;
}

export interface DebriefReport {
  summary: string;
  strengths: string[];
  focusAreas: {
    original: string;
    improved: string;
    note: string;
  }[];
  vocabularyHighlights: {
    term: string;
    translation: string;
    context: string;
  }[];
  nextStep: string;
}

export interface PracticeSessionRecord {
  id: string;
  date: number;
  languageCode: string;
  level: CefrLevel;
  scenarioTitle: string;
  partnerName: string;
  durationSeconds: number;
  userTurnsCount: number;
  partnerTurnsCount: number;
  goalsCompleted: number;
  goalsTotal: number;
  transcript: { role: 'user' | 'partner'; text: string }[];
  debrief?: DebriefReport;
}
