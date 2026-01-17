import { Component, input } from '@angular/core';
import { IconName } from '../models';

@Component({
  selector: 'app-icon',
  imports: [],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
})
export class IconComponent {
  iconName = input.required<IconName>();
}
