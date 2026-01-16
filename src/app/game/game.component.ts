import { Component } from '@angular/core';
import { BoardComponent } from '../board/board.component';
import { VirtualKeyboardComponent } from '../virtual-keyboard/virtual-keyboard.component';

@Component({
  selector: 'app-game',
  imports: [BoardComponent, VirtualKeyboardComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent {}
