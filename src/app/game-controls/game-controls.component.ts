import { Component, signal, linkedSignal, effect } from '@angular/core';
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

  protected isGameMenuOpen = signal(true);
  protected isLanguageSelectorOpen = signal(true);

  languages = signal(
    [
      { code: Language.PT_BR, label: 'PT' },
      { code: Language.EN_US, label: 'EN' },
      { code: Language.FR, label: 'FR' },
    ].sort((a, b) => a.label.localeCompare(b.label)),
  );

  constructor(protected readonly gameStore: GameStore) {
    effect(() => {
      const currentLanguage = this.gameStore.language();
      this.setLanguages(currentLanguage);
    });

    setTimeout(() => {
      this.isGameMenuOpen.set(false);
      this.isLanguageSelectorOpen.set(false);
    }, 1500);
  }

  selectLanguage(language: Language, event?: Event) {
    if (this.isLanguageSelectorOpen()) {
      event?.stopPropagation();

      this.gameStore.setLanguage(language);

      this.isLanguageSelectorOpen.set(false);
    }
  }
  private setLanguages(language: Language) {
    this.languages.update((langs) => {
      return [
        langs.find((lang) => lang.code === language)!,
        ...langs.filter((lang) => lang.code !== language),
      ];
    });
  }

  protected toggleLanguageSelector() {
    this.isLanguageSelectorOpen.update((isOpen) => !isOpen);
  }
}
