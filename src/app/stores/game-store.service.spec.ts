import { TestBed } from '@angular/core/testing';

import { GameStore } from './game-store.service';

describe('GameStoreService', () => {
  let service: GameStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
// todo: criar teste com palavra Uivai, e resposta arcar, com um A verde e o resto todo cinza
// todo: criar teste com palavra Uivai, e resposta xiita, com um i verde o outro amarelo, o A amarelo e o resto todo cinza
