import { Component } from '@angular/core';
import { GameStore } from '../stores';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-game-controls',
  imports: [IconComponent],
  templateUrl: './game-controls.component.html',
  styleUrl: './game-controls.component.css',
})
export class GameControlsComponent {
  constructor(protected readonly gameStore: GameStore) {}
}
