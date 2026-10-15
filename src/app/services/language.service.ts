import { DOCUMENT, registerLocaleData } from '@angular/common';
import localeHu from '@angular/common/locales/hu';
import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type Lang = 'en' | 'hu';

export const SUPPORTED_LANGS: readonly Lang[] = ['en', 'hu'];

const LANG_KEY = 'choraforge.lang';

registerLocaleData(localeHu, 'hu');

function isLang(value: unknown): value is Lang {
  return SUPPORTED_LANGS.includes(value as Lang);
}

function detectInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Storage unavailable; fall through to browser detection.
  }
  return navigator.language?.toLowerCase().startsWith('hu') ? 'hu' : 'en';
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  private readonly _lang = signal<Lang>(detectInitialLang());
  readonly lang = this._lang.asReadonly();

  /** Activates the initial language; call once at startup (the app initializer does). */
  init(): void {
    this.apply(this._lang());
  }

  setLang(lang: Lang): void {
    if (lang === this._lang()) return;
    this._lang.set(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Storage unavailable (e.g. private mode); the choice just won't survive a reload.
    }
    this.apply(lang);
  }

  private apply(lang: Lang): void {
    this.transloco.setActiveLang(lang);
    this.document.documentElement.lang = lang;
  }
}
