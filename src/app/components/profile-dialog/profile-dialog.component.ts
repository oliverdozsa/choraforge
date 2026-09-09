import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';
import { ChoreStoreService } from '../../services/chore-store.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [CommonModule, AppDialogComponent],
  templateUrl: './profile-dialog.component.html',
  styleUrl: './profile-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileDialogComponent {
  private readonly store = inject(ChoreStoreService);
  private readonly auth = inject(AuthService);

  @Output() closed = new EventEmitter<void>();

  readonly user = this.store.currentUser;
  readonly profile = this.auth.profile;
  readonly teams = this.store.teams;
  readonly selectedTeamId = this.store.selectedTeamId;

  switchTeam(teamId: string): void {
    this.store.selectTeam(teamId);
  }
}
