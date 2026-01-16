import { Injectable } from '@angular/core';
import { Language } from '../models';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  constructor(private readonly client: HttpClient) {}

  getLanguageVocabulary(language: Language): Observable<string[]> {
    return this.client
      .get(`/vocab/${language.toString()}.txt`, {
        responseType: 'text',
      })
      .pipe(
        map((data: string) => {
          return data
            .split('\n')
            .map((line: string) => line.trim().toUpperCase());
        }),
      );
  }
}
