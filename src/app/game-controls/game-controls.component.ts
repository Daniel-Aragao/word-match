import {
  Component,
  signal,
  linkedSignal,
  effect,
  computed,
  NgZone,
} from '@angular/core';
import { GameStore } from '../stores';
import { IconComponent } from '../icon/icon.component';
import { Language } from '../models';
import { DurationPipe } from '../pipes/duration.pipe';

@Component({
  selector: 'app-game-controls',
  imports: [IconComponent, DurationPipe],
  templateUrl: './game-controls.component.html',
  styleUrl: './game-controls.component.css',
})
export class GameControlsComponent {
  protected readonly Language? = Language;

  protected isWordOfTheDayOpen = signal(true);
  protected isGameMenuOpen = signal(true);
  protected isLanguageSelectorOpen = signal(true);

  private interval?: number;

  gameOfTheDayDuration = linkedSignal(() => {
    const dailyResult = this.gameStore.dailyResult();

    if (dailyResult.endTime > 0) {
      return dailyResult.endTime - dailyResult.startTime;
    }

    return 0;
  });

  languages = signal(
    [
      { code: Language.PT_BR, label: 'PT' },
      { code: Language.EN_US, label: 'EN' },
      { code: Language.FR, label: 'FR' },
    ].sort((a, b) => a.label.localeCompare(b.label)),
  );

  constructor(
    protected readonly gameStore: GameStore,
    private readonly zone: NgZone,
  ) {
    effect(() => {
      const currentLanguage = this.gameStore.language();
      this.setLanguages(currentLanguage);
    });

    setTimeout(() => {
      this.isGameMenuOpen.set(false);
      this.isLanguageSelectorOpen.set(false);
      this.isWordOfTheDayOpen.set(false);
    }, 1000);

    effect(() => {
      if (!this.gameStore.isDailyGameActive()) {
        if (this.interval) {
          clearInterval(this.interval);
        }
      }
    });
  }

  startGameOfTheDay() {
    this.gameStore.newWordOfTheDay();

    this.zone.runOutsideAngular(() => {
      const dailyResult = this.gameStore.dailyResult();

      this.interval = setInterval(() => {
        if (dailyResult.endTime === 0) {
          this.gameOfTheDayDuration.set(Date.now() - dailyResult.startTime);
        }
      }, 500) as unknown as number;
    });
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
