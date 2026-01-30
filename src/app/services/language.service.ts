import { Injectable } from '@angular/core';
import { Language } from '../models';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  constructor(private readonly client: HttpClient) {}

  getLanguageVocabulary(
    language: Language,
    wordSize: number,
  ): Observable<string[]> {
    return this.client
      .get(`vocab/${language.toString()}.txt`, {
        responseType: 'text',
      })
      .pipe(this.formatData(wordSize));
  }

  getLanguageCommmonVocabulary(
    language: Language,
    wordSize: number,
  ): Observable<string[]> {
    return this.client
      .get(`vocab/${language.toString()}-common.txt`, {
        responseType: 'text',
      })
      .pipe(this.formatData(wordSize));
  }

  getLanguageKidsVocabulary(
    language: Language,
    wordSize: number,
  ): Observable<string[]> {
    return this.client
      .get(`vocab/${language.toString()}-kids.txt`, {
        responseType: 'text',
      })
      .pipe(this.formatData(wordSize));
  }

  private formatData(wordSize: number) {
    return map((data: string) => {
      return data
        .split('\n')
        .filter((line) => line.length === wordSize)
        .map((line: string) => line.trim().toUpperCase());
    });
  }
}
