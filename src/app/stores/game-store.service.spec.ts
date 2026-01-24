import { TestBed } from '@angular/core/testing';

import { GameStore } from './game-store.service';
import {
  assert,
  afterEach,
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
import { delay, Observable, of } from 'rxjs';
import { LanguageStore } from './language-store.service';
import { BoardStore } from './board-store.service';
import { Attempt } from '../models';

type LanguageStoreMock = {
  setLanguage: MockInstance<() => Observable<void>>;
  getRandomWord: MockInstance<() => string>;
  findWord: MockInstance<() => string | undefined>;
  language: MockInstance<() => string>;
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
      language: vi.fn(() => 'pt-br'),
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
    222;

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

    it('should processWordMiss should set answer when exhaust its options', () => {
      const attemptMatrix = Array.from(
        { length: correctAttempt[0].length + 1 },
        () => wrongAttempt[0],
      );
      vi.spyOn(boardStore, 'attempts').mockReturnValue(attemptMatrix);

      for (let i = 0; i < correctAttempt[0].length; i++) {
        store.submitAttempt();
      }

      assert.Throw(() => store.submitAttempt());

      expect(store.answer()).toStrictEqual({
        word: 'banana',
        isSuccess: false,
      });
    });

    it('should set answer when user hits it', () => {
      vi.spyOn(boardStore, 'attempts').mockReturnValue(correctAttempt);

      store.submitAttempt();

      expect(store.answer()).toStrictEqual({
        word: 'banana',
        isSuccess: true,
      });
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

  describe('give up', () => {
    let isEndedSpy: Mock;

    it('should end the game', () => {
      isEndedSpy = vi.spyOn(boardStore, 'setIsEnded');

      store.giveUp();

      expect(isEndedSpy).toHaveBeenCalled();
    });

    it('should return failed answer', () => {
      isEndedSpy = vi.spyOn(boardStore, 'setIsEnded');

      store.giveUp();

      expect(store.answer()).toStrictEqual({
        word: 'banana',
        isSuccess: false,
      });
    });
  });

  describe('word of the day', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-01T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should be the same every call', () => {
      const spy = vi.spyOn(boardStore, 'setWord').mockImplementation(() => {});

      store.newWordOfTheDay();
      store.newWordOfTheDay();
      store.newWordOfTheDay();
      store.newWordOfTheDay();

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(wordList[0], wordList[0].length + 1);
    });

    it('should save start time only once', async () => {
      store.newWordOfTheDay();
      const start = store.dailyResult.startTime();

      await delay(50);

      store.newWordOfTheDay();
      store.newWordOfTheDay();

      expect(store.dailyResult.startTime()).toBe(start);
    });

    it('should reload daily word when day passes', () => {
      let word1 = '';
      let word2 = '';

      const spy = vi.spyOn(boardStore, 'setWord').mockImplementation((w) => {
        if (word1) {
          word2 = w;
          return;
        }
        word1 = w;
      });

      store.newWordOfTheDay();

      langStoreMock.getRandomWord.mockReturnValueOnce(wordList[1]);
      vi.setSystemTime(new Date('2025-06-02T10:00:00Z'));
      store.newWordOfTheDay();

      expect(spy).toBeCalledTimes(2);
      expect(word2).not.toBe(word1);
    });
    it('should not reload daily word when day does not pass', () => {
      let word1 = '';
      let word2 = '';

      const spy = vi.spyOn(boardStore, 'setWord').mockImplementation((w) => {
        if (word1) {
          word2 = w;
          return;
        }
        word1 = w;
      });

      store.newWordOfTheDay();

      langStoreMock.getRandomWord.mockReturnValueOnce(wordList[1]);
      store.newWordOfTheDay();

      expect(spy).toBeCalledTimes(1);
      expect(word2).not.toBe(word1);
    });

    it('should stop challenge on giveUp', () => {
      store.newWordOfTheDay();

      store.giveUp();

      store.newWordOfTheDay();

      expect(store.isDailyGameCompleted()).toBe(true);
    });

    it('should stop challenge on newWord', () => {
      store.newWordOfTheDay();

      store.newWord();

      expect(store.isDailyGameCompleted()).toBe(true);
      expect(store.dailyResult().isSuccess).toBe(false);
    });

    it('should not restart challenge on same day', () => {
      const spy = vi.spyOn(boardStore, 'setWord').mockImplementation(() => {});
      store.newWordOfTheDay();

      store.giveUp();

      store.newWordOfTheDay();

      expect(spy).toBeCalledTimes(1);
    });
  });
});
