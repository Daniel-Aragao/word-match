import { Component, computed, inject, input } from '@angular/core';
import { Icon, IconName } from './icons';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-icon',
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
})
export class IconComponent {
  private sanitizer = inject(DomSanitizer);
  iconName = input.required<IconName>();
  iconPath = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(Icon[this.iconName()]),
  );
}
