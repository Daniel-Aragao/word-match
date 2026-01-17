import { Component, effect, signal } from '@angular/core';
import { BoardComponent } from '../board/board.component';
import { VirtualKeyboardComponent } from '../virtual-keyboard/virtual-keyboard.component';
import { GameStore } from '../stores';
import { GameControlsComponent } from '../game-controls/game-controls.component';

@Component({
  selector: 'app-game',
  imports: [BoardComponent, VirtualKeyboardComponent, GameControlsComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent {
  protected animateLine = signal<undefined | 'vibrate' | 'success'>(undefined);
  protected animateBoard = signal(false);

  constructor(private readonly gameStore: GameStore) {
    effect(() => {
      const answer = this.gameStore.answer();

      if (answer) {
        if (!answer.isSuccess) {
          this.animateBoard.set(true);
        } else {
          this.animateLine.set('success');
        }
      }
    });
  }

  submit() {
    try {
      this.gameStore.submitAttempt();
    } catch (ex) {
      if (ex instanceof Error) {
        if (ex.message === 'Not enough letters') {
          this.animateLine.set('vibrate');
        } else if (ex.message === 'Word not found in vocabulary') {
          this.animateLine.set('vibrate');
        } else if (ex.message.includes('No more attempts available')) {
          this.animateBoard.set(true);
        }
      }
    }
  }
}
