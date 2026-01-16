import { Injectable } from '@angular/core';
import { Language } from '../models';
import { Vocabulary } from '../models/vocabulary';
import { patchState, signalState } from '@ngrx/signals';
import { LanguageService } from '../services/language.service';
import { normalizeString } from '../utils/string.utils';

interface LanguageState {
  selectedLanguage: Language;
  vocabularies: Partial<Record<Language, Vocabulary>>;
}

const initialState: LanguageState = {
  selectedLanguage: 'pt-br',
  vocabularies: {},
};

@Injectable({
  providedIn: 'root',
})
export class LanguageStore {
  private state = signalState(initialState);

  constructor(private readonly languageService: LanguageService) {}

  setLanguage(language: Language) {
    patchState(this.state, { selectedLanguage: language });

    if (!this.state().vocabularies[language]) {
      this.fetchLanguageVocabulary(language);
    }
  }

  findWord(word: string) {
    const language = this.state.selectedLanguage();
    const vocabulary = this.state().vocabularies[language];
    return vocabulary?.words.get(word)?.[0];
  }

  private fetchLanguageVocabulary(language: Language) {
    this.languageService.getLanguageVocabulary(language).subscribe((words) => {
      this.addLanguage(language, words);
    });
  }

  private addLanguage(language: Language, words: string[]) {
    const wordIndex = new Map<string, string[]>();

    const vocabulary: Vocabulary = {
      language,
      wordsCount: words.length,
      words: wordIndex,
    };

    for (const word of words) {
      const normalizedWord = normalizeString(word);

      if (!wordIndex.has(normalizedWord)) {
        wordIndex.set(normalizedWord, []);
      }

      wordIndex.get(normalizedWord)?.push(word);
    }

    patchState(this.state, {
      vocabularies: {
        ...this.state().vocabularies,
        [language]: vocabulary,
      },
    });
  }
}
