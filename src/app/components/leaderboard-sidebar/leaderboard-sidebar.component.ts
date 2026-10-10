import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';
import { ChoreStoreService } from '../../services/chore-store.service';
import { TeamMemberResponse } from '../../models/api.model';

@Component({
  selector: 'app-leaderboard-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoDirective, AppDialogComponent],
  templateUrl: './leaderboard-sidebar.component.html',
  styleUrl: './leaderboard-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardSidebarComponent {
  private readonly store = inject(ChoreStoreService);

  readonly currentUserId = this.store.currentUserId;
  readonly isTeamAdmin = this.store.isTeamAdmin;

  readonly editingMember = signal<TeamMemberResponse | null>(null);
  readonly saving = signal(false);
  /** Translation key of the current form error. */
  readonly formError = signal<string | null>(null);
  goldInput: number | null = null;

  readonly roleMember = signal<TeamMemberResponse | null>(null);
  roleInput: 'USER' | 'ADMIN' = 'USER';

  /** The team owner (TEAM_ADMIN) and yourself can't be re-roled. */
  canChangeRole(member: TeamMemberResponse): boolean {
    return this.isTeamAdmin() && member.role !== 'TEAM_ADMIN' && member.userId !== this.currentUserId();
  }

  openRoleEditor(member: TeamMemberResponse): void {
    this.roleInput = member.role === 'ADMIN' ? 'ADMIN' : 'USER';
    this.formError.set(null);
    this.roleMember.set(member);
  }

  closeRoleEditor(): void {
    this.roleMember.set(null);
  }

  async saveRole(): Promise<void> {
    const member = this.roleMember();
    if (!member || this.saving()) return;
    this.saving.set(true);
    const ok = await this.store.assignRole(member.userId, this.roleInput);
    this.saving.set(false);
    if (ok) this.closeRoleEditor();
    else this.formError.set(this.store.error() ?? 'errors.changeRole');
  }

  openGoldEditor(member: TeamMemberResponse): void {
    this.goldInput = member.gold;
    this.formError.set(null);
    this.editingMember.set(member);
  }

  closeGoldEditor(): void {
    this.editingMember.set(null);
  }

  async saveGold(): Promise<void> {
    const member = this.editingMember();
    if (!member || this.saving()) return;
    const gold = this.goldInput;
    if (gold === null || !Number.isInteger(gold) || gold < 0) {
      this.formError.set('errors.wholeNumber');
      return;
    }
    this.saving.set(true);
    const ok = await this.store.setMemberGold(member.userId, gold);
    this.saving.set(false);
    if (ok) this.closeGoldEditor();
    else this.formError.set(this.store.error() ?? 'errors.updateGold');
  }

  readonly rankedMembers = computed(() =>
    [...this.store.leaderboard()].sort((a, b) => b.level - a.level || b.currentXp - a.currentXp),
  );

  rankClass(rank: number): string {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'plain';
  }

  levelProgress(member: TeamMemberResponse): number {
    if (member.nextLevelXp <= 0) return 0;
    return Math.min(100, Math.round((member.currentXp / member.nextLevelXp) * 100));
  }

  /** Stable per-member hue so avatar tiles are distinguishable without pictures. */
  avatarHue(userId: string): number {
    let hash = 0;
    for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    return Math.abs(hash) % 360;
  }
}
