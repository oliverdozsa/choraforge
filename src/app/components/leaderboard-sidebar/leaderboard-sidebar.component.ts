import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';
import { ChoreStoreService } from '../../services/chore-store.service';
import { TeamMemberResponse } from '../../models/api.model';

@Component({
  selector: 'app-leaderboard-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, AppDialogComponent],
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
  readonly formError = signal<string | null>(null);
  goldInput: number | null = null;

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
      this.formError.set('Enter a whole number, 0 or more.');
      return;
    }
    this.saving.set(true);
    const ok = await this.store.setMemberGold(member.userId, gold);
    this.saving.set(false);
    if (ok) this.closeGoldEditor();
    else this.formError.set(this.store.error() ?? 'Could not update gold.');
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
