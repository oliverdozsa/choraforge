import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvitationResponse } from '../../models/api.model';
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
  readonly mode = signal<'create' | 'join' | 'teams' | 'invite'>(this.hasTeam() ? 'teams' : 'create');
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly switchingTeamId = signal<string | null>(null);

  teamName = '';
  joinCode = '';
  inviteEmail = '';

  readonly myInvitations = signal<InvitationResponse[]>([]);
  readonly teamInvitations = signal<InvitationResponse[]>([]);
  readonly inviteNotice = signal<string | null>(null);

  readonly error = this.store.error;
  readonly teams = this.store.teams;
  readonly isTeamAdmin = this.store.isTeamAdmin;
  readonly selectedTeamId = this.store.selectedTeamId;

  constructor() {
    void this.loadMyInvitations();
  }

  setMode(mode: 'create' | 'join' | 'teams' | 'invite'): void {
    this.mode.set(mode);
    this.formError.set(null);
    this.inviteNotice.set(null);
    if (mode === 'invite') void this.loadTeamInvitations();
    if (mode === 'join') void this.loadMyInvitations();
  }

  private async loadMyInvitations(): Promise<void> {
    const all = await this.store.loadMyInvitations();
    this.myInvitations.set(all.filter((i) => i.status === 'PENDING'));
  }

  private async loadTeamInvitations(): Promise<void> {
    this.teamInvitations.set(await this.store.loadTeamInvitations());
  }

  useCode(code: string | undefined): void {
    if (code) this.joinCode = code;
  }

  async sendInvite(): Promise<void> {
    const email = this.inviteEmail.trim();
    if (!email) {
      this.formError.set('Email is required.');
      return;
    }
    this.formError.set(null);
    this.inviteNotice.set(null);
    this.submitting.set(true);
    try {
      await this.store.inviteToTeam(email);
      this.inviteEmail = '';
      this.inviteNotice.set(`Invitation sent to ${email}.`);
      await this.loadTeamInvitations();
    } catch {
      // surfaced via store.error
    } finally {
      this.submitting.set(false);
    }
  }

  async revoke(invitationId: string): Promise<void> {
    if (await this.store.revokeInvitation(invitationId)) {
      await this.loadTeamInvitations();
    }
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

  async acceptInvitation(): Promise<void> {
    const code = this.joinCode.trim();
    if (!code) {
      this.formError.set('Invitation code is required.');
      return;
    }
    this.formError.set(null);
    this.submitting.set(true);
    try {
      await this.store.acceptInvitationByCode(code);
      this.joinCode = '';
      this.completed.emit();
    } catch {
      // surfaced via store.error
    } finally {
      this.submitting.set(false);
    }
  }
}
