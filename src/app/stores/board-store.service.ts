import { computed, Injectable, linkedSignal } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { Observable, of, throwError } from 'rxjs';
import { compare, normalizeString } from '../utils/string.utils';
import { Attempt } from '../models';

interface BoardState {
  word: string;
  numberOfAttempts: number;
  numberOfLetters: number;
  selected: { row: number; col: number };
  currentAttempt: number;
  attempts: Attempt[][];
}

const initialState: BoardState = {
  word: '',
  numberOfAttempts: 0,
  numberOfLetters: 0,
  selected: { row: 0, col: 0 },
  currentAttempt: 0,
  attempts: [],
};

@Injectable({
  providedIn: 'root',
})
export class BoardStore {
  state = signalState<BoardState>(initialState);

  word = this.state.word;
  selected = this.state.selected;
  numberOfAttempts = this.state.numberOfAttempts;
  attempts = this.state.attempts;
  wordSize = this.state.numberOfLetters;
  currentAttempt = this.state.currentAttempt;
  isEnded = linkedSignal(() => {
    return this.state().currentAttempt >= this.state().numberOfAttempts;
  });

  getCurrentAttempt() {
    return [...this.state.attempts()[this.state.currentAttempt()]];
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
    if (this.isEnded()) {
      return;
    }

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

  removeLetter() {
    const currentAttempt = this.state().currentAttempt;
    const attemptLetters = [...this.state().attempts[currentAttempt]];
    const col = this.state().selected.col;

    let attemptLetter = attemptLetters[col];

    if (attemptLetter.letter) {
      attemptLetters[col] = {
        ...attemptLetter,
        letter: '',
      };
    } else if (col > 0) {
      attemptLetter = attemptLetters[col - 1];
      attemptLetters[col - 1] = {
        ...attemptLetter,
        letter: '',
      };

      this.selectLetter(this.state().selected.row, col - 1);
    }
    this.updateCurrentAttempt(attemptLetters);
  }

  updateCurrentAttempt(updatedAttempt: Attempt[]) {
    const currentAttempt = this.state().currentAttempt;

    patchState(this.state, {
      attempts: this.state().attempts.map((attempt, i) =>
        i === currentAttempt ? updatedAttempt : attempt,
      ),
    });
  }

  setIsEnded(isEnded: boolean) {
    this.isEnded.set(isEnded);
  }

  nextAttempt() {
    if (this.state.currentAttempt() + 1 === this.numberOfAttempts()) {
      this.isEnded.set(true);

      throw new Error('No more attempts available ' + this.state.word());
    }

    patchState(this.state, {
      currentAttempt: this.state.currentAttempt() + 1,
    });

    this.selectLetter(this.selected.row() + 1, 0);
  }
}
