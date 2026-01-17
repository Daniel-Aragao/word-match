import { Component, computed, output } from '@angular/core';
import { BoardStore } from '../stores/board-store.service';
import { normalizeString } from '../utils/string.utils';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-virtual-keyboard',
  templateUrl: './virtual-keyboard.component.html',
  styleUrl: './virtual-keyboard.component.css',
  imports: [CommonModule],
})
export class VirtualKeyboardComponent {
  public submit = output();

  letters: string[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  usedLetters = computed(() => {
    return new Set();
    // todo: letras repetidas sao desabilitadas
    // const attemptNumber = this.boardStore.currentAttempt();
    // return new Set(
    //   this.boardStore
    //     .attempts()
    //     .filter((_, i) => i !== attemptNumber)
    //     .flatMap((a) => a.map((a) => normalizeString(a.letter).toUpperCase())),
    // );
  });

  constructor(protected boardStore: BoardStore) {}
}
