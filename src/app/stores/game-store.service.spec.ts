import { TestBed } from '@angular/core/testing';

import { GameStore } from './game-store.service';
import {
  assert,
  beforeEach,
  describe,
  expect,
  it,
  Mock,
  MockInstance,
  vi,
  vitest,
} from 'vitest';
import { LanguageService } from '../services/language.service';
import { Observable, of } from 'rxjs';
import { LanguageStore } from './language-store.service';
import { BoardStore } from './board-store.service';
import { Attempt } from '../models';

type LanguageStoreMock = {
  setLanguage: MockInstance<() => Observable<void>>;
  getRandomWord: MockInstance<() => string>;
  findWord: MockInstance<() => string | undefined>;
};

describe(GameStore.name, () => {
  let store: GameStore;
  let boardStore: BoardStore;
  let wordList = [
    'banana',
    'exceto',
    'cínico',
    'idôneo',
    'âmbito',
    'néscio',
    'mister',
  ];
  let langStoreMock: LanguageStoreMock;

  beforeEach(() => {
    langStoreMock = {
      setLanguage: vi.fn(() => of(undefined)),
      getRandomWord: vi.fn(() => wordList[0]),
      findWord: vi.fn().mockReturnValue('bananc'),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: LanguageService,
          useValue: {
            getLanguageVocabulary: vitest.fn().mockReturnValue(of(wordList)),
          },
        },
        {
          provide: LanguageStore,
          useValue: langStoreMock,
        },
      ],
    });

    store = TestBed.inject(GameStore);
    boardStore = TestBed.inject(BoardStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('new word', () => {
    it('should select a word', () => {
      expect(langStoreMock.setLanguage).toHaveBeenCalled();
      expect(langStoreMock.getRandomWord).toHaveBeenCalled();
    });

    it('should select a word again', () => {
      store.newWord();
      expect(langStoreMock.getRandomWord).toHaveBeenCalledTimes(2);
    });
  });

  describe('submit attempt', () => {
    let isEndedSpy: Mock;
    let updateCurrentAttemptSpy: Mock;
    let correctAttempt: Attempt[][];
    let wrongAttempt: Attempt[][];

    beforeEach(() => {
      correctAttempt = [
        [
          {
            id: '0_0',
            letter: 'b',
          },
          {
            id: '0_1',
            letter: 'a',
          },
          {
            id: '0_2',
            letter: 'n',
          },
          {
            id: '0_3',
            letter: 'a',
          },
          {
            id: '0_4',
            letter: 'n',
          },
          {
            id: '0_5',
            letter: 'a',
          },
        ],
      ];
      wrongAttempt = [
        [
          {
            id: '0_0',
            letter: 'b',
          },
          {
            id: '0_1',
            letter: 'a',
          },
          {
            id: '0_2',
            letter: 'n',
          },
          {
            id: '0_3',
            letter: 'a',
          },
          {
            id: '0_4',
            letter: 'n',
          },
          {
            id: '0_5',
            letter: 'c',
          },
        ],
      ];

      isEndedSpy = vi.spyOn(boardStore, 'setIsEnded');
      updateCurrentAttemptSpy = vi.spyOn(boardStore, 'updateCurrentAttempt');

      vi.spyOn(boardStore, 'word').mockReturnValue(wordList[0]);
    });

    it('should throw when not enough letters', () => {
      assert.Throw(() => store.submitAttempt(), 'Not enough letters');
    });

    it('should processWordHit, end the game and set all letters to correct', () => {
      vi.spyOn(boardStore, 'attempts').mockReturnValue(correctAttempt);

      store.submitAttempt();
      expect(updateCurrentAttemptSpy).toBeCalledWith(
        correctAttempt[0].map((a) => ({ ...a, result: 'correct' })),
      );
      expect(isEndedSpy).toHaveBeenCalledWith(true);
    });

    it('should processWordMiss should throw when invalid word is sent', () => {
      langStoreMock.findWord.mockReturnValue(undefined);
      vi.spyOn(boardStore, 'attempts').mockReturnValue(wrongAttempt);
      const nextAttemptMock = vi.spyOn(boardStore, 'nextAttempt');

      assert.Throw(() => store.submitAttempt(), 'Word not found in vocabulary');

      expect(nextAttemptMock).not.toHaveBeenCalled();
    });

    it('should processWordMiss should go to next attempt', () => {
      vi.spyOn(boardStore, 'attempts').mockReturnValue(wrongAttempt);
      const nextAttemptMock = vi.spyOn(boardStore, 'nextAttempt');

      store.submitAttempt();

      expect(nextAttemptMock).toHaveBeenCalled();
    });

    it('should processWordMiss should update attempt with 5 "correct" letters and a "miss"', () => {
      vi.spyOn(boardStore, 'attempts').mockReturnValue(wrongAttempt);
      const nextAttemptMock = vi.spyOn(boardStore, 'nextAttempt');

      store.submitAttempt();

      const expected = wrongAttempt[0].map((a) => ({
        ...a,
        result: 'correct',
      }));
      expected[expected.length - 1].result = 'miss';

      expect(nextAttemptMock).toHaveBeenCalled();
      expect(updateCurrentAttemptSpy).toBeCalledWith(expected);
    });

    it('should processWordMiss should update attempt with 4 "correct" letters and 1 "present" and 1 "miss"', () => {
      wrongAttempt = [
        [
          {
            id: '0_0',
            letter: 'b',
          },
          {
            id: '0_1',
            letter: 'a',
          },
          {
            id: '0_2',
            letter: 'x',
          },
          {
            id: '0_3',
            letter: 'n',
          },
          {
            id: '0_4',
            letter: 'n',
          },
          {
            id: '0_5',
            letter: 'a',
          },
        ],
      ];

      langStoreMock.findWord.mockReturnValue(
        wrongAttempt[0].map((a) => a.letter).join(''),
      );

      vi.spyOn(boardStore, 'attempts').mockReturnValue(wrongAttempt);
      vi.spyOn(boardStore, 'getCurrentAttempt').mockReturnValue(
        wrongAttempt[0],
      );
      const nextAttemptMock = vi.spyOn(boardStore, 'nextAttempt');

      store.submitAttempt();

      const expected: Attempt[] = wrongAttempt[0].map((a) => ({
        ...a,
        result: 'correct',
      }));

      expected[2].result = 'miss';
      expected[3].result = 'present';

      expect(nextAttemptMock).toHaveBeenCalled();
      expect(updateCurrentAttemptSpy).toBeCalledWith(expected);
    });
    it('should processWordMiss should update attempt with 4 "correct" letters and 2 "present"', () => {
      wrongAttempt = [
        [
          {
            id: '0_0',
            letter: 'b',
          },
          {
            id: '0_1',
            letter: 'a',
          },
          {
            id: '0_2',
            letter: 'a',
          },
          {
            id: '0_3',
            letter: 'n',
          },
          {
            id: '0_4',
            letter: 'n',
          },
          {
            id: '0_5',
            letter: 'a',
          },
        ],
      ];

      langStoreMock.findWord.mockReturnValue(
        wrongAttempt[0].map((a) => a.letter).join(''),
      );

      vi.spyOn(boardStore, 'attempts').mockReturnValue(wrongAttempt);
      vi.spyOn(boardStore, 'getCurrentAttempt').mockReturnValue(
        wrongAttempt[0],
      );
      const nextAttemptMock = vi.spyOn(boardStore, 'nextAttempt');

      store.submitAttempt();

      const expected: Attempt[] = wrongAttempt[0].map((a) => ({
        ...a,
        result: 'correct',
      }));

      expected[2].result = 'present';
      expected[3].result = 'present';

      expect(nextAttemptMock).toHaveBeenCalled();
      expect(updateCurrentAttemptSpy).toBeCalledWith(expected);
    });
  });
});
