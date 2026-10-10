import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Lang, LanguageService, SUPPORTED_LANGS } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  private readonly language = inject(LanguageService);

  readonly langs = SUPPORTED_LANGS;
  readonly current = this.language.lang;

  select(lang: Lang): void {
    this.language.setLang(lang);
  }
}
