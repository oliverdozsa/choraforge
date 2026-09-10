import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoreStoreService } from '../../services/chore-store.service';

@Component({
  selector: 'app-team-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-setup.component.html',
  styleUrl: './team-setup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSetupComponent {
  private readonly store = inject(ChoreStoreService);

  /** When true, renders just the form (no full-page shell/heading) for use inside a dialog. */
  @Input() embedded = false;
  /** Emits once a team has been created or joined. */
  @Output() completed = new EventEmitter<void>();

  readonly hasTeam = this.store.hasTeam;
  readonly mode = signal<'create' | 'join' | 'teams'>(this.hasTeam() ? 'teams' : 'create');
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly switchingTeamId = signal<string | null>(null);

  teamName = '';
  joinTeamId = '';
  joinEmail = '';

  readonly error = this.store.error;
  readonly teams = this.store.teams;
  readonly selectedTeamId = this.store.selectedTeamId;

  setMode(mode: 'create' | 'join' | 'teams'): void {
    this.mode.set(mode);
    this.formError.set(null);
  }

  logout(): void {
    this.store.logout();
  }

  async switchTeam(teamId: string): Promise<void> {
    if (teamId === this.selectedTeamId()) return;
    this.switchingTeamId.set(teamId);
    try {
      await this.store.selectTeam(teamId);
      this.completed.emit();
    } finally {
      this.switchingTeamId.set(null);
    }
  }

  async createTeam(): Promise<void> {
    if (!this.teamName.trim()) {
      this.formError.set('Team name is required.');
      return;
    }
    this.formError.set(null);
    this.submitting.set(true);
    try {
      await this.store.createTeam(this.teamName.trim());
      this.completed.emit();
    } catch {
      // surfaced via store.error
    } finally {
      this.submitting.set(false);
    }
  }

  async joinTeam(): Promise<void> {
    if (!this.joinTeamId.trim() || !this.joinEmail.trim()) {
      this.formError.set('Team ID and email are required.');
      return;
    }
    this.formError.set(null);
    this.submitting.set(true);
    try {
      await this.store.joinTeam(this.joinTeamId.trim(), this.joinEmail.trim());
      this.completed.emit();
    } catch {
      // surfaced via store.error
    } finally {
      this.submitting.set(false);
    }
  }
}
