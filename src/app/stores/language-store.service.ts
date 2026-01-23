import { effect, Injectable } from '@angular/core';
import { Language } from '../models';
import { Vocabulary } from '../models/vocabulary';
import { patchState, signalState } from '@ngrx/signals';
import { LanguageService } from '../services/language.service';
import { normalizeString } from '../utils/string.utils';
import {
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { createRandomGeneratorOfDay } from '../utils/random.utils';

type Mode = 'ALL' | 'COMMON';

interface LanguageState {
  selectedLanguage: Language;
  vocabularies: Partial<
    Record<
      Language,
      {
        [k in Mode]: Vocabulary;
      }
    >
  >;
}

const initialState: LanguageState = {
  selectedLanguage: Language.PT_BR,
  vocabularies: {},
};

@Injectable({
  providedIn: 'root',
})
export class LanguageStore {
  private state = signalState(initialState);
  private getSelectedVocab = () =>
    this.state.vocabularies()[this.state.selectedLanguage()];

  public language = this.state.selectedLanguage;

  constructor(private readonly languageService: LanguageService) {
    this.loadSelectedLanguageFromStorage();

    effect(() => {
      localStorage.setItem('selectedLanguage', this.state.selectedLanguage());
    });
  }

  loadSelectedLanguageFromStorage() {
    const storedLanguage = localStorage.getItem('selectedLanguage');

    if (
      storedLanguage &&
      Object.values(Language).includes(storedLanguage as Language)
    ) {
      patchState(this.state, {
        selectedLanguage: storedLanguage as Language,
      });
      return;
    }

    localStorage.setItem('selectedLanguage', this.state.selectedLanguage());
  }

  setLanguage(language: Language): Observable<void> {
    patchState(this.state, { selectedLanguage: language });

    const vocabs = this.state().vocabularies[language];
    const generalVocab = vocabs?.['ALL'];
    const commonVocab = vocabs?.['COMMON'];

    const requests: { [key: string]: Observable<any> } = {};

    if (!generalVocab) {
      requests['all'] = this.languageService
        .getLanguageVocabulary(language, 5)
        .pipe(
          tap((words) => this.addLanguage(language, words, 'ALL')),
          catchError(() => {
            console.error(`Optional vocabulary (ALL) failed for: ${language}`);
            return of(null);
          }),
        );
    }

    if (!commonVocab) {
      requests['common'] = this.languageService
        .getLanguageCommmonVocabulary(language, 5)
        .pipe(tap((words) => this.addLanguage(language, words, 'COMMON')));
    }

    if (Object.keys(requests).length === 0) {
      return of(void 0);
    }

    return forkJoin(requests).pipe(map(() => void 0));
  }

  getRandomWord(seed?: Date) {
    const vocab = this.getSelectedVocab()?.['COMMON'];
    if (!vocab) return null;

    let randomIndex = 0;
    if (seed) {
      const generator = createRandomGeneratorOfDay(seed);
      randomIndex = generator(vocab.keys.length);
    } else {
      randomIndex = Math.floor(Math.random() * vocab.keys.length);
    }
    const wordGroup = vocab.words.get(vocab.keys[randomIndex]) || [];

    return wordGroup[Math.floor(Math.random() * wordGroup.length)];
  }

  findWord(word: string) {
    const language = this.state.selectedLanguage();
    const vocabulary =
      this.state().vocabularies[language]?.['ALL'] ||
      this.state().vocabularies[language]?.['COMMON'];

    return vocabulary?.words.get(word)?.[0];
  }

  private addLanguage(language: Language, words: string[], mode: Mode = 'ALL') {
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

    const vocabs = this.state().vocabularies[language];

    patchState(this.state, {
      vocabularies: {
        ...this.state().vocabularies,
        [language]: { ...vocabs, [mode]: vocabulary },
      },
    });
  }
}
