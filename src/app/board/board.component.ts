import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import { BoardStore } from '../stores/board-store.service';
import { CommonModule } from '@angular/common';
import { Key } from 'ts-key-enum';
import { LanguageStore } from '../stores';
import { normalizeString } from '../utils/string.utils';
@Component({
  selector: 'app-board',
  imports: [CommonModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
})
export class BoardComponent {
  numberOfAttempts = input<number>(6);
  animateLine = model.required<undefined | 'vibrate' | 'success'>();
  animateBoard = model.required<boolean>();

  placeholder = computed((): string => {
    const isEmpty = this.boardStoreService
      .getCurrentAttempt()
      .every((a) => a.letter == '');

    if (!isEmpty) {
      return Array(this.boardStoreService.wordSize()).fill(' ').join('');
    }

    if (this.boardStoreService.currentAttempt() === 0) {
      return this.languageStore.getRandomWord() ?? 'radio';
    }

    const placeholder = this.boardStoreService
      .attempts()
      .reduce((acc, attempt) => {
        attempt.forEach((a, j) => {
          if (a.result === 'correct') {
            acc[j] = normalizeString(a.letter);
          }
        });

        return acc;
      }, Array(this.boardStoreService.wordSize()).fill(' '));

    return placeholder.join('');
  });

  public submit = output();

  inputs = viewChildren<ElementRef<HTMLInputElement>>('cellInput');

  protected rows = computed(() => this.boardStoreService.attempts());

  constructor(
    protected readonly boardStoreService: BoardStore,
    private readonly languageStore: LanguageStore,
  ) {
    effect(() => {
      const selected = this.boardStoreService.selected();

      const input = this.inputs()[selected.col];
      input?.nativeElement.focus();
    });
  }

  select(i: number, j: number) {
    this.boardStoreService.selectLetter(i, j);
  }

  typed(i: number, j: number, event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;

    if (event.key === Key.Backspace) {
      this.boardStoreService.removeLetter();
      return;
    }

    if (event.key === Key.Enter) {
      this.submitAttempt();
      return;
    }

    if (event.key === Key.ArrowLeft) {
      this.boardStoreService.selectLetter(i, j - 1);
      return;
    }

    if (event.key === Key.ArrowRight) {
      this.boardStoreService.selectLetter(i, j + 1);
      return;
    }

    if (event.key === Key.Tab) {
      event.preventDefault();
    }

    const isLetter = event.key.length === 1 && event.key.match(/[a-z]/i);

    if (isLetter) {
      const value = event.key.toUpperCase();

      if (value.length > 1) {
        input.value = value.charAt(0);
      } else {
        input.value = value;
      }

      this.boardStoreService.typeLetter(value);
    } else if (event.key.length === 1) {
      event.preventDefault();
    }
  }

  private submitAttempt() {
    this.submit.emit();
  }
}
