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

  submitAttempt() {
    const currentAttempt = this.boardStore.currentAttempt();

    const word = this.formWord(currentAttempt);

    if (word.length < this.boardStore.wordSize()) {
      throw new Error('Not enough letters');
    }

    const isCorrectWord = compare(word, this.boardStore.word());

    if (isCorrectWord) {
      this.processWordHit(this.boardStore.word());
      return;
    }

    this.processWordMiss(word);
  }

  private formWord(currentAttempt: number) {
    return this.boardStore
      .attempts()
      [currentAttempt].map((v) => v.letter)
      .filter((a) => a)
      .join('');
  }

  private processWordHit(word: string) {
    const currentAttempt = this.boardStore.currentAttempt();
    let attemptLetters = this.boardStore.attempts()[currentAttempt];

    attemptLetters = this.correctAccents(attemptLetters, word);

    this.boardStore.updateCurrentAttempt(attemptLetters);
    this.boardStore.setIsEnded(true);
  }

  private correctAccents(attemptLetters: Attempt[], word: string): Attempt[] {
    return attemptLetters.map(
      (l, i) =>
        ({ ...l, letter: word.charAt(i), result: 'correct' }) satisfies Attempt,
    );
  }

  private processWordMiss(triedWord: string) {
    const foundWord = this.languageStore.findWord(triedWord);

    if (!foundWord) {
      throw new Error('Word not found in vocabulary');
    }

    const correctWord = normalizeString(this.boardStore.word()).toUpperCase();

    const correctLetters = new Map<string, number>();

    correctWord.split('').forEach((letter) => {
      if (!correctLetters.has(letter)) {
        correctLetters.set(letter, 0);
      }

      correctLetters.set(letter, correctLetters.get(letter)! + 1);
    });

    const normalizedAttempt = normalizeString(foundWord);
    const wordAttempt = this.boardStore.getCurrentAttempt();

    this.updateHittedLetters(
      normalizedAttempt,
      wordAttempt,
      foundWord,
      correctWord,
      correctLetters,
    );

    this.updatedMisplacedLetters(
      normalizedAttempt,
      wordAttempt,
      correctWord,
      correctLetters,
    );

    this.boardStore.updateCurrentAttempt(wordAttempt);

    this.boardStore.nextAttempt();
  }

  private updateHittedLetters(
    normalizedAttempt: string,
    wordAttempt: Attempt[],
    foundWord: string,
    correctWord: string,
    correctLetters: Map<string, number>,
  ) {
    normalizedAttempt.split('').forEach((letter, index) => {
      const letterAttempt: Attempt = {
        ...wordAttempt[index],
        letter: foundWord[index],
        result: 'miss',
      };

      if (compare(letter, correctWord[index])) {
        letterAttempt.result = 'correct';

        if (correctLetters.has(letter)) {
          correctLetters.set(letter, correctLetters.get(letter)! - 1);
        }
      }
      wordAttempt[index] = letterAttempt;
    });
  }

  private updatedMisplacedLetters(
    normalizedAttempt: string,
    wordAttempt: Attempt[],
    correctWord: string,
    correctLetters: Map<string, number>,
  ) {
    normalizedAttempt.split('').forEach((letter, index) => {
      const letterAttempt: Attempt = wordAttempt[index];

      if (
        !compare(letter, correctWord[index]) &&
        correctLetters.has(letter.toUpperCase())
      ) {
        const letterCount = correctLetters.get(letter.toUpperCase())!;

        if (letterCount > 0) {
          correctLetters.set(letter, letterCount - 1);
          letterAttempt.result = 'present';
        }
      }
    });
  }
}
