import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoreStoreService } from '../../services/chore-store.service';
import { AuthService } from '../../services/auth.service';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';
import { ProfileDialogComponent } from '../profile-dialog/profile-dialog.component';
import { TeamSetupComponent } from '../team-setup/team-setup.component';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, FormsModule, AppDialogComponent, ProfileDialogComponent, TeamSetupComponent],
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

  readonly avatarMenuOpen = signal(false);
  readonly profileDialogOpen = signal(false);
  readonly newTeamDialogOpen = signal(false);

  onTeamChange(teamId: string): void {
    this.store.selectTeam(teamId);
  }

  logout(): void {
    this.store.logout();
  }

  toggleAvatarMenu(): void {
    this.avatarMenuOpen.update((open) => !open);
  }

  closeAvatarMenu(): void {
    this.avatarMenuOpen.set(false);
  }

  openProfileDialog(): void {
    this.avatarMenuOpen.set(false);
    this.profileDialogOpen.set(true);
  }

  closeProfileDialog(): void {
    this.profileDialogOpen.set(false);
  }

  openNewTeamDialog(): void {
    this.avatarMenuOpen.set(false);
    this.newTeamDialogOpen.set(true);
  }

  closeNewTeamDialog(): void {
    this.newTeamDialogOpen.set(false);
  }
}
