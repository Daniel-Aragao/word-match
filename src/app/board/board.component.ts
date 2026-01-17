import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { BoardStore } from '../stores/board-store.service';
import { CommonModule } from '@angular/common';
import { Key } from 'ts-key-enum';
@Component({
  selector: 'app-board',
  imports: [CommonModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
})
export class BoardComponent {
  numberOfAttempts = input<number>(6);
  word = input<string>('ANGULAR');
  public submit = output();

  inputs = viewChildren<ElementRef<HTMLInputElement>>('cellInput');

  protected rows = computed(() => this.boardStoreService.attempts());

  constructor(protected readonly boardStoreService: BoardStore) {
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
