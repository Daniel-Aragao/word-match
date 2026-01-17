import { Injectable } from '@angular/core';
import { Attempt, Language } from '../models';
import { signalState } from '@ngrx/signals';
import { BoardStore } from './board-store.service';
import { LanguageStore } from './language-store.service';
import { Observable, of, throwError } from 'rxjs';
import { compare, normalizeString } from '../utils/string.utils';

interface GameState {
  language: Language;
}

const initialState: GameState = {
  language: 'pt-br',
};

@Injectable({
  providedIn: 'root',
})
export class GameStore {
  state = signalState<GameState>(initialState);

  constructor(
    private readonly boardStore: BoardStore,
    private readonly languageStore: LanguageStore,
  ) {
    this.setLanguage(this.state().language);
  }

  setLanguage(language: Language) {
    this.languageStore.setLanguage(language).subscribe(() => this.newWord());
  }

  newWord() {
    const word = this.languageStore.getRandomWord();

    if (word) {
      this.boardStore.setWord(word, word.length + 1);
    }
  }

  submitAttempt(): Observable<void> {
    const currentAttempt = this.boardStore.currentAttempt();

    const word = this.boardStore
      .attempts()
      [currentAttempt].map((v) => v.letter)
      .filter((a) => a)
      .join('');

    if (word.length < this.boardStore.wordSize()) {
      return throwError(() => new Error('Not enough letters'));
    }

    const isCorrectWord = compare(word, this.boardStore.word());

    if (isCorrectWord) {
      this.wordHit();
      return of();
    }

    return this.wordMiss(word);
  }

  private wordHit() {
    const currentAttempt = this.boardStore.currentAttempt();
    const attemptLetters = this.boardStore
      .attempts()
      [
        currentAttempt
      ].map((l) => ({ ...l, result: 'correct' }) satisfies Attempt);

    this.boardStore.updateCurrentAttempt(attemptLetters);
    this.boardStore.setIsEnded(true);
  }

  private wordMiss(triedWord: string) {
    const foundWord = this.languageStore.findWord(triedWord);

    if (!foundWord) {
      return throwError(() => new Error('Word not found in vocabulary'));
    }

    const correctWord = normalizeString(this.boardStore.word());

    const correctLetters = new Map<string, number>();

    correctWord.split('').forEach((letter) => {
      if (!correctLetters.has(letter)) {
        correctLetters.set(letter, 0);
      }

      correctLetters.set(letter, correctLetters.get(letter)! + 1);
    });

    const normalizedAttempt = normalizeString(foundWord);
    const wordAttempt = this.boardStore.getCurrentAttempt();

    normalizedAttempt.split('').forEach((letter, index) => {
      const letterAttempt: Attempt = {
        ...wordAttempt[index],
        letter: foundWord[index],
        result: 'miss',
      };

      if (letter === correctWord[index]) {
        letterAttempt.result = 'correct';

        if (correctLetters.has(letter)) {
          correctLetters.set(letter, correctLetters.get(letter)! - 1);
        }
      }
      wordAttempt[index] = letterAttempt;
    });

    normalizedAttempt.split('').forEach((letter, index) => {
      const letterAttempt: Attempt = wordAttempt[index];

      if (letter !== correctWord[index] && correctLetters.has(letter)) {
        const letterCount = correctLetters.get(letter)!;

        if (letterCount > 0) {
          correctLetters.set(letter, letterCount - 1);
          letterAttempt.result = 'present';
        }
      }
    });

    this.boardStore.updateCurrentAttempt(wordAttempt);

    return this.boardStore
      .nextAttempt()
      .subscribe({ error: (err) => alert(err) });
  }
}
