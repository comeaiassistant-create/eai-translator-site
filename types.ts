export enum AppMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  CAMERA = 'CAMERA',
  FILES = 'FILES',
  SETTINGS = 'SETTINGS'
}

export interface Language {
  code: string;
  name: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedLanguage?: string;
}

export interface HistoryItem extends TranslationResult {
  id: string;
  timestamp: number;
  mode: AppMode;
}

export interface AudioState {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
}
