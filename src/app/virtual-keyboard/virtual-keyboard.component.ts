import { Component, computed, output } from '@angular/core';
import { BoardStore } from '../stores/board-store.service';
import { compare, normalizeString } from '../utils/string.utils';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-virtual-keyboard',
  templateUrl: './virtual-keyboard.component.html',
  styleUrl: './virtual-keyboard.component.css',
  imports: [CommonModule, IconComponent],
})
export class VirtualKeyboardComponent {
  public submit = output();

  letters: string[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  usedLetters = computed(() => {
    const attemptNumber = this.boardStore.currentAttempt();

    return new Set(
      this.boardStore
        .attempts()
        .filter((_, i) => i !== attemptNumber)
        .flatMap((a) => a)
        .filter(
          (a, i, all) =>
            a.result === 'miss' &&
            !all.find(
              (b, j) =>
                i !== j && compare(b.letter, a.letter) && b.result !== 'miss',
            ),
        )
        .map((a) => normalizeString(a.letter)),
    );
  });

  constructor(protected boardStore: BoardStore) {}
}
