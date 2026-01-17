import { Component } from '@angular/core';
import { BoardComponent } from '../board/board.component';
import { VirtualKeyboardComponent } from '../virtual-keyboard/virtual-keyboard.component';
import { GameStore } from '../stores';
import { take } from 'rxjs';
import { GameControlsComponent } from '../game-controls/game-controls.component';

@Component({
  selector: 'app-game',
  imports: [BoardComponent, VirtualKeyboardComponent, GameControlsComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent {
  constructor(private readonly gameStore: GameStore) {}

  submit() {
    try {
      this.gameStore.submitAttempt();
    } catch (ex) {
      if (ex instanceof Error) {
        alert(ex.message);
      }
    }
  }
}
