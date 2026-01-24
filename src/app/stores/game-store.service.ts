import { computed, effect, Injectable } from '@angular/core';
import { Attempt, Challenge, Language } from '../models';
import { patchState, signalState } from '@ngrx/signals';
import { BoardStore } from './board-store.service';
import { LanguageStore } from './language-store.service';
import { compare, normalizeString } from '../utils/string.utils';
import { dateKey } from '../utils/date.utils';
import { Constants } from '../models/constants';

interface GameState {
  answer: { word: string; isSuccess: boolean } | undefined;
  dailyResult: Challenge;
}

const initialState: GameState = {
  answer: undefined,
  dailyResult: {
    date: new Date(),
    startTime: 0,
    endTime: 0,
    isSuccess: undefined,
    isStarted: false,
  },
};

@Injectable({
  providedIn: 'root',
})
export class GameStore {
  private state = signalState<GameState>(initialState);

  public answer = this.state.answer;
  public language = computed(() => this.languageStore.language());
  public dailyResult = this.state.dailyResult;
  public isDailyGameActive = computed(() => {
    return (
      this.state.dailyResult().isStarted &&
      this.state.dailyResult().endTime === 0
    );
  });
  public isDailyGameCompleted = computed(() => {
    return (
      this.state.dailyResult().isStarted && this.state.dailyResult().endTime > 0
    );
  });

  constructor(
    private readonly boardStore: BoardStore,
    private readonly languageStore: LanguageStore,
  ) {
    this.setLanguage(this.languageStore.language());

    effect(() => {
      this.loadDailyResult();
    });
  }

  setLanguage(language: Language) {
    this.languageStore.setLanguage(language).subscribe(() => this.newWord());
  }

  newWord(seed?: Date) {
    if (!seed && this.isDailyGameActive()) {
      this.endDailyGame(false);
    }

    this.setAnswer();

    const word = this.languageStore.getRandomWord(seed);

    if (word) {
      this.boardStore.setWord(word, word.length + 1);
    }
  }

  newWordOfTheDay() {
    const today = new Date();

    if (dateKey(this.state.dailyResult().date) === dateKey(today)) {
      if (this.state.dailyResult().isStarted) {
        return;
      }
    }

    patchState(this.state, {
      dailyResult: {
        ...this.state.dailyResult(),
        date: today,
        startTime: Date.now(),
        isStarted: true,
      },
    });

    this.newWord(today);
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

      this.endDailyGame(success);

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

  private endDailyGame(hit: boolean) {
    if (this.isDailyGameActive()) {
      patchState(this.state, {
        dailyResult: {
          ...this.state.dailyResult(),
          endTime: Date.now(),
          isSuccess: hit,
        },
      });

      this.storeDailyResult();
    }
  }

  private storeDailyResult() {
    localStorage.setItem(
      Constants.storage.dailyResult(this.language()),
      JSON.stringify(this.state.dailyResult()),
    );
  }

  private loadDailyResult() {
    const dailyResult = localStorage.getItem(
      Constants.storage.dailyResult(this.language()),
    );

    if (dailyResult) {
      const daily = JSON.parse(dailyResult);
      daily.date = new Date(daily.date);

      if (dateKey(daily.date) === dateKey(new Date())) {
        patchState(this.state, {
          dailyResult: daily,
        });
        return;
      }
    }

    patchState(this.state, {
      dailyResult: { ...initialState.dailyResult },
    });
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
      this.processMissedGame();
      throw err;
    }
  }

  private processMissedGame() {
    this.setAnswer(this.boardStore.word(), false);
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
