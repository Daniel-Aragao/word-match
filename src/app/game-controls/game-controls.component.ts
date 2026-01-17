import { Component } from '@angular/core';
import { GameStore } from '../stores';

@Component({
  selector: 'app-game-controls',
  imports: [],
  templateUrl: './game-controls.component.html',
  styleUrl: './game-controls.component.css',
})
export class GameControlsComponent {
  constructor(protected readonly gameStore: GameStore) {}
}
