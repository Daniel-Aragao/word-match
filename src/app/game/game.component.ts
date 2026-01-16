import { Component } from '@angular/core';
import { BoardComponent } from '../board/board.component';
import { VirtualKeyboardComponent } from '../virtual-keyboard/virtual-keyboard.component';
import { GameControlsComponent } from '../game-controls/game-controls.component';

@Component({
  selector: 'app-game',
  imports: [BoardComponent, VirtualKeyboardComponent, GameControlsComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent {}
