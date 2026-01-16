import { computed, Injectable, linkedSignal } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { Observable, of, throwError } from 'rxjs';
import { compare, normalizeString } from '../utils/string.utils';
import { Language, Attempt } from '../models';
import { LanguageService } from '../services/language.service';
import { LanguageStore } from './language-store.service';

interface BoardState {
  numberOfAttempts: number;
  word: string;
  numberOfLetters: number;
  selected: { row: number; col: number };
  currentAttempt: number;
  attempts: Attempt[][];
  language: Language;
}

const initialState: BoardState = {
  numberOfAttempts: 0,
  word: '',
  numberOfLetters: 0,
  selected: { row: 0, col: 0 },
  currentAttempt: 1,
  attempts: [],
  language: 'pt-br',
};

@Injectable({
  providedIn: 'root',
})
export class BoardStore {
  state = signalState<BoardState>(initialState);

  selected = this.state.selected;
  numberOfAttempts = this.state.numberOfAttempts;
  attempts = this.state.attempts;
  wordSize = this.state.numberOfLetters;
  currentAttempt = this.state.currentAttempt;
  isEnded = linkedSignal(() => {
    return this.state().currentAttempt >= this.state().numberOfAttempts;
  });

  constructor(private readonly languageStore: LanguageStore) {
    this.setLanguage(this.state().language);
  }

  setLanguage(language: Language) {
    this.languageStore.setLanguage(language);
  }

  setWord(word: string, numberOfAttempts: number) {
    patchState(this.state, initialState);

    patchState(this.state, {
      word,
      numberOfAttempts,
      numberOfLetters: word.length,
      currentAttempt: 0,
      attempts: Array.from({ length: numberOfAttempts }, (_, i) =>
        Array.from({ length: word.length }, (_, j) => ({
          id: `${i}_${j}`,
          letter: '',
        })),
      ),
    });

    this.selectLetter(0, 0);
  }

  selectLetter(row: number, col: number) {
    const rows = this.state().numberOfAttempts;
    const cols = this.state().numberOfLetters;
    const currentAttempt = this.state().currentAttempt;

    if (row !== currentAttempt) {
      return;
    }

    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return;
    }

    patchState(this.state, { selected: { row, col } });
  }

  typeLetter(letter: string) {
    const currentAttempt = this.state().currentAttempt;
    const attemptLetters = [...this.state().attempts[currentAttempt]];

    const attemptLetter = attemptLetters[this.state().selected.col];

    attemptLetters[this.state().selected.col] = {
      ...attemptLetter,
      letter,
    };

    this.updateCurrentAttempt(attemptLetters);

    this.selectLetter(this.state().selected.row, this.state().selected.col + 1);
  }

  submitAttempt(): Observable<void> {
    const currentAttempt = this.state().currentAttempt;
    const word = this.state()
      .attempts[currentAttempt].map((v) => v.letter)
      .filter((a) => a)
      .join('');

    if (word.length < this.state().numberOfLetters) {
      return throwError(() => new Error('Not enough letters'));
    }

    const isCorrectWord = compare(word, this.state().word);

    if (isCorrectWord) {
      this.wordHit();
      return of();
    }

    return this.wordMiss(word);
  }

  private updateCurrentAttempt(updatedAttempt: Attempt[]) {
    const currentAttempt = this.state().currentAttempt;

    patchState(this.state, {
      attempts: this.state().attempts.map((attempt, i) =>
        i === currentAttempt ? updatedAttempt : attempt,
      ),
    });
  }

  private wordHit() {
    const currentAttempt = this.state().currentAttempt;
    const attemptLetters = this.state().attempts[currentAttempt].map(
      (l) => ({ ...l, result: 'correct' }) satisfies Attempt,
    );

    this.updateCurrentAttempt(attemptLetters);
    this.isEnded.set(true);
  }

  private wordMiss(triedWord: string) {
    const foundWord = this.languageStore.findWord(triedWord);

    if (!foundWord) {
      return throwError(() => new Error('Word not found in vocabulary'));
    }

    const correctWord = normalizeString(this.state.word());
    const normalizedAttempt = normalizeString(foundWord);
    const wordAttempt = [...this.state().attempts[this.state().currentAttempt]];

    normalizedAttempt.split('').forEach((letter, index) => {
      const letterAttempt: Attempt = {
        ...wordAttempt[index],
        letter: foundWord[index],
        result: 'miss',
      };

      if (letter === correctWord[index]) {
        letterAttempt.result = 'correct';
      } else if (correctWord.includes(letter)) {
        letterAttempt.result = 'present';
      }

      wordAttempt[index] = letterAttempt;
    });

    this.updateCurrentAttempt(wordAttempt);

    return this.nextAttempt();
  }

  private nextAttempt() {
    if (this.state.currentAttempt() === this.numberOfAttempts()) {
      this.isEnded.set(true);
      return throwError(() => new Error('No more attempts available'));
    }

    patchState(this.state, {
      currentAttempt: this.state.currentAttempt() + 1,
    });

    this.selectLetter(this.selected.row() + 1, 0);

    return of();
  }
}
