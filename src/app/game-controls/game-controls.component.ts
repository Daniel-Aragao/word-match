import { Component } from '@angular/core';
import { GameStore } from '../stores';
import { IconComponent } from '../icon/icon.component';
import { Language } from '../models';

@Component({
  selector: 'app-game-controls',
  imports: [IconComponent],
  templateUrl: './game-controls.component.html',
  styleUrl: './game-controls.component.css',
})
export class GameControlsComponent {
  protected readonly Language? = Language;

  constructor(protected readonly gameStore: GameStore) {}
}
