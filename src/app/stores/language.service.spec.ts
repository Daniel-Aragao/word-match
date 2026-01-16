import { TestBed } from '@angular/core/testing';

import { LanguageStore } from './language-store.service';

describe('LanguageStore', () => {
  let service: LanguageStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
