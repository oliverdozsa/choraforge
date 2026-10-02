import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoreStoreService } from '../../services/chore-store.service';
import { TeamMemberResponse } from '../../models/api.model';

@Component({
  selector: 'app-leaderboard-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard-sidebar.component.html',
  styleUrl: './leaderboard-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardSidebarComponent {
  private readonly store = inject(ChoreStoreService);

  readonly currentUserId = this.store.currentUserId;

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
