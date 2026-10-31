import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { ChoreStoreService } from '../../services/chore-store.service';
import { AuthService } from '../../services/auth.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';
import { ProfileDialogComponent } from '../profile-dialog/profile-dialog.component';
import { ShopDialogComponent } from '../shop-dialog/shop-dialog.component';
import { LogoComponent } from '../logo/logo.component';
import { TeamSetupComponent } from '../team-setup/team-setup.component';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoDirective, TranslocoPipe, LanguageSwitcherComponent, AppDialogComponent, ProfileDialogComponent, TeamSetupComponent, ShopDialogComponent, LogoComponent],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeaderComponent {
  private readonly store = inject(ChoreStoreService);
  private readonly auth = inject(AuthService);

  readonly isTeamAdmin = this.store.isTeamAdmin;
  readonly user = this.store.currentUser;
  readonly teams = this.store.teams;
  readonly membership = this.store.currentMembership;
  readonly xpProgressPercent = this.store.xpProgressPercent;
  readonly profile = this.auth.profile;

  readonly level = computed(() => this.membership()?.level ?? 1);
  readonly xpToNext = computed(() => {
    const m = this.membership();
    return m ? Math.max(0, m.nextLevelXp - m.currentXp) : 0;
  });

  readonly avatarMenuOpen = signal(false);
  readonly profileDialogOpen = signal(false);
  readonly newTeamDialogOpen = signal(false);
  readonly shopOpen = signal(false);

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
