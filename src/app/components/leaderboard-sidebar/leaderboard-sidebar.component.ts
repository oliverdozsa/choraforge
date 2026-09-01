import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoreStoreService } from '../../services/chore-store.service';

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

  rankSuffix(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }
}
