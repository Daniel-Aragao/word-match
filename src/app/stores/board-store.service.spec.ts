import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { BoardStore } from './board-store.service';
import { describe, it, expect, beforeEach, assert } from 'vitest';

describe('BoardStore', () => {
  let store: BoardStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BoardStore],
    });
    store = TestBed.inject(BoardStore);
  });

  it('should be created with initial state', () => {
    expect(store.word()).toBe('');
    expect(store.currentAttempt()).toBe(0);
    expect(store.attempts()).toEqual([]);
    expect(store.isEnded()).toBe(true);
  });

  describe('setWord', () => {
    it('should configure word and create attempts matrix', () => {
      store.setWord('BANANA', 6);

      expect(store.word()).toBe('BANANA');
      expect(store.wordSize()).toBe(6);
      expect(store.numberOfAttempts()).toBe(6);
      expect(store.attempts().length).toBe(6);
      expect(store.attempts()[0].length).toBe(6);
      expect(store.selected()).toEqual({ row: 0, col: 0 });
      expect(store.isEnded()).toBe(false); // 0 < 6
    });
  });

  describe('input actions', () => {
    beforeEach(() => {
      store.setWord('TESTE', 5);
    });

    it('should input a letter and move to next column', () => {
      store.typeLetter('T');

      const current = store.getCurrentAttempt();
      expect(current[0].letter).toBe('T');
      expect(store.selected().col).toBe(1);
    });

    it('should remove letter current letter if exists', () => {
      store.typeLetter('T');
      store.removeLetter();

      const current = store.getCurrentAttempt();
      expect(current[0].letter).toBe('');
      expect(store.selected().col).toBe(0);
    });

    it('should not allow selection of an attempt that is not in game yet/anymore', () => {
      store.selectLetter(1, 0); // Tentativa atual é 0
      expect(store.selected().row).toBe(0); // Não deve mudar
    });
  });

  describe('Game flow (nextAttempt)', () => {
    beforeEach(() => {
      store.setWord('WEB', 2);
    });

    it('should advance to the next attempt and reset the column', () => {
      store.nextAttempt();

      expect(store.currentAttempt()).toBe(1);
      expect(store.selected()).toEqual({ row: 1, col: 0 });
      expect(store.isEnded()).toBe(false);
    });

    it('should end the game and throw exception when out of attempts', async () => {
      store.nextAttempt(); // vai para a tentativa 1 (limite é 2)

      assert.Throw(() => store.nextAttempt(), 'No more attempts available');
      expect(store.isEnded()).toBe(true);
    });
  });
});
