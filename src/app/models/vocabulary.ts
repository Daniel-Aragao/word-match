import { Language } from './language';

export interface Vocabulary {
  language: Language;
  words: Map<string, string[]>;
  keys: string[];
}
