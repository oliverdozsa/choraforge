import { formatDate } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

/**
 * Formats dates in the active UI language. Impure on purpose: it reads the language
 * signal, so templates using it re-render when the language changes.
 */
@Pipe({ name: 'localizedDate', standalone: true, pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: string | number | Date | null | undefined, format: string): string {
    if (value == null || value === '') return '';
    return formatDate(value, format, this.language.lang());
  }
}
