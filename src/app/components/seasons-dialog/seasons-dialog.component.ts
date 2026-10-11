import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';
import { ChoreStoreService } from '../../services/chore-store.service';
import { SeasonResponse, SeasonResultResponse } from '../../models/api.model';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-seasons-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoDirective, AppDialogComponent, ConfirmDialogComponent, LocalizedDatePipe],
  templateUrl: './seasons-dialog.component.html',
  styleUrl: './seasons-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonsDialogComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  private readonly store = inject(ChoreStoreService);

  readonly currentSeason = this.store.currentSeason;
  readonly isTeamAdmin = this.store.isTeamAdmin;

  readonly pastSeasons = signal<SeasonResponse[]>([]);
  readonly loadingPast = signal(true);
  readonly openSeason = signal<SeasonResponse | null>(null);
  readonly results = signal<SeasonResultResponse[] | null>(null);
  readonly loadingResults = signal(false);

  readonly saving = signal(false);
  readonly confirmingEnd = signal(false);
  /** Translation key of the current error or confirmation message. */
  readonly formError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  extendDays: number | null = 7;
  lengthDays: number | null = null;

  readonly daysLeft = computed(() => {
    const season = this.currentSeason();
    return season ? daysUntil(season.endsAt) : 0;
  });

  ngOnInit(): void {
    void this.loadPast();
  }

  private async loadPast(): Promise<void> {
    this.loadingPast.set(true);
    const seasons = await this.store.loadSeasons();
    this.pastSeasons.set(seasons.filter((s) => s.status === 'ENDED').sort((a, b) => b.number - a.number));
    this.loadingPast.set(false);
  }

  async showResults(season: SeasonResponse): Promise<void> {
    if (this.openSeason()?.id === season.id) {
      this.openSeason.set(null);
      return;
    }
    this.openSeason.set(season);
    this.results.set(null);
    this.loadingResults.set(true);
    const results = await this.store.loadSeasonResults(season.id);
    this.loadingResults.set(false);
    if (this.openSeason()?.id === season.id) this.results.set(results?.sort((a, b) => a.rank - b.rank) ?? []);
  }

  async extend(): Promise<void> {
    const days = this.extendDays;
    if (!this.validDays(days, 1)) return;
    await this.run(() => this.store.extendSeason(days), 'seasons.extended', 'errors.extendSeason');
  }

  async saveLength(): Promise<void> {
    const days = this.lengthDays;
    if (!this.validDays(days, 7)) return;
    await this.run(() => this.store.setSeasonLength(days), 'seasons.lengthSaved', 'errors.seasonLength');
  }

  async confirmEnd(): Promise<void> {
    await this.run(() => this.store.endSeason(), 'seasons.ended', 'errors.endSeason');
    this.confirmingEnd.set(false);
    await this.loadPast();
  }

  private validDays(days: number | null, min: number): days is number {
    if (days === null || !Number.isInteger(days) || days < min || days > 365) {
      this.notice.set(null);
      this.formError.set(min === 1 ? 'seasons.errors.extendRange' : 'seasons.errors.lengthRange');
      return false;
    }
    return true;
  }

  private async run(action: () => Promise<boolean>, doneKey: string, errorKey: string): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set(null);
    this.notice.set(null);
    const ok = await action();
    this.saving.set(false);
    if (ok) this.notice.set(doneKey);
    else this.formError.set(this.store.error() ?? errorKey);
  }
}

export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / MS_PER_DAY));
}
