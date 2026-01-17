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
    this.gameStore
      .submitAttempt()
      .pipe(take(1))
      .subscribe({
        error: (errorMessage) => {
          alert(errorMessage);
        },
      });
  }
}
