import { Language } from './language';

export interface Vocabulary {
  language: Language;
  wordsCount: number;
  words: Map<string, string[]>;
}
