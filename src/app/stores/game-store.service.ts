import { computed, Injectable } from '@angular/core';
import { Attempt, Language } from '../models';
import { patchState, signalState } from '@ngrx/signals';
import { BoardStore } from './board-store.service';
import { LanguageStore } from './language-store.service';
import { compare, normalizeString } from '../utils/string.utils';

interface GameState {
  answer: { word: string; isSuccess: boolean } | undefined;
}

const initialState: GameState = {
  answer: undefined,
};

@Injectable({
  providedIn: 'root',
})
export class GameStore {
  private state = signalState<GameState>(initialState);

  public answer = this.state.answer;
  public language = computed(() => this.languageStore.language());

  constructor(
    private readonly boardStore: BoardStore,
    private readonly languageStore: LanguageStore,
  ) {
    this.setLanguage(this.languageStore.language());
  }

  setLanguage(language: Language) {
    this.languageStore.setLanguage(language).subscribe(() => this.newWord());
  }

  newWord() {
    this.setAnswer();

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

  giveUp() {
    const word = this.boardStore.word();

    this.boardStore.setIsEnded(true);

    this.setAnswer(word);
  }

  private setAnswer(word?: string, success = false) {
    if (word) {
      patchState(this.state, {
        answer: {
          word,
          isSuccess: success,
        },
      });

      return;
    }

    patchState(this.state, {
      answer: undefined,
    });
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
    this.setAnswer(this.boardStore.word(), true);
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

    this.tryToChangeLine();
  }

  private tryToChangeLine() {
    try {
      this.boardStore.nextAttempt();
    } catch (err) {
      this.setAnswer(this.boardStore.word(), false);
      throw err;
    }
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
