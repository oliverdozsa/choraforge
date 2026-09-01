import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoreStoreService } from '../../services/chore-store.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeaderComponent {
  private readonly store = inject(ChoreStoreService);
  private readonly auth = inject(AuthService);

  readonly user = this.store.currentUser;
  readonly teams = this.store.teams;
  readonly membership = this.store.currentMembership;
  readonly xpProgressPercent = this.store.xpProgressPercent;
  readonly profile = this.auth.profile;

  onTeamChange(teamId: string): void {
    this.store.selectTeam(teamId);
  }

  logout(): void {
    this.store.logout();
  }
}
