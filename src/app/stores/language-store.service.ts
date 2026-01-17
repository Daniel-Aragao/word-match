import { computed, Injectable } from '@angular/core';
import { Language } from '../models';
import { Vocabulary } from '../models/vocabulary';
import { patchState, signalState } from '@ngrx/signals';
import { LanguageService } from '../services/language.service';
import { normalizeString } from '../utils/string.utils';
import { of, tap } from 'rxjs';

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
  private getSelectedVocab = () =>
    this.state.vocabularies()[this.state.selectedLanguage()];

  private vocabularyIndexSize = computed(() => {
    const vocab = this.getSelectedVocab();
    return vocab?.words.size ?? 0;
  });

  constructor(private readonly languageService: LanguageService) {}

  setLanguage(language: Language) {
    patchState(this.state, { selectedLanguage: language });

    if (!this.state().vocabularies[language]) {
      return this.fetchLanguageVocabulary(language);
    }

    return of();
  }

  getRandomWord() {
    const vocab = this.getSelectedVocab();
    if (!vocab) return null;

    const randomKeyIndex = Math.floor(Math.random() * vocab.keys.length);
    const wordGroup = vocab.words.get(vocab.keys[randomKeyIndex]) || [];

    return wordGroup[Math.floor(Math.random() * wordGroup.length)];
  }

  findWord(word: string) {
    const language = this.state.selectedLanguage();
    const vocabulary = this.state().vocabularies[language];
    return vocabulary?.words.get(word)?.[0];
  }

  private fetchLanguageVocabulary(language: Language) {
    return this.languageService.getLanguageVocabulary(language, 5).pipe(
      tap((words) => {
        this.addLanguage(language, words);
      }),
    );
  }

  private addLanguage(language: Language, words: string[]) {
    const wordIndex = new Map<string, string[]>();

    const vocabulary: Vocabulary = {
      language,
      words: wordIndex,
      keys: [],
    };

    for (const word of words) {
      const normalizedWord = normalizeString(word);

      if (!wordIndex.has(normalizedWord)) {
        wordIndex.set(normalizedWord, []);
      }

      wordIndex.get(normalizedWord)?.push(word);
    }

    vocabulary.keys = Array.from(wordIndex.keys());

    patchState(this.state, {
      vocabularies: {
        ...this.state().vocabularies,
        [language]: vocabulary,
      },
    });
  }
}
