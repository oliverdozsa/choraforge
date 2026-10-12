import { APP_INITIALIZER, ApplicationConfig, inject, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './interceptors/auth.interceptor';
import { TranslocoHttpLoader } from './i18n/transloco-loader';
import { LanguageService, SUPPORTED_LANGS } from './services/language.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTransloco({
      config: {
        availableLangs: [...SUPPORTED_LANGS],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: { logMissingKey: true },
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoMessageformat(),
    {
      // Load and activate the stored language before first render so no raw keys flash.
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const language = inject(LanguageService);
        const transloco = inject(TranslocoService);
        return () => {
          language.init();
          return firstValueFrom(transloco.load(language.lang()));
        };
      },
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
