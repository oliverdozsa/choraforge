import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { LeaderboardSidebarComponent } from './components/leaderboard-sidebar/leaderboard-sidebar.component';
import { QuestBoardComponent } from './components/quest-board/quest-board.component';
import { LogoComponent } from './components/logo/logo.component';
import { LoginComponent } from './components/login/login.component';
import { TeamSetupComponent } from './components/team-setup/team-setup.component';
import { CardTemplatesComponent } from './components/card-templates/card-templates.component';
import { AuthService } from './services/auth.service';
import { ChoreStoreService } from './services/chore-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    TranslocoPipe,
    DashboardHeaderComponent,
    LeaderboardSidebarComponent,
    QuestBoardComponent,
    LoginComponent,
    TeamSetupComponent,
    CardTemplatesComponent,
    LogoComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly store = inject(ChoreStoreService);

  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly hasTeam = this.store.hasTeam;
  readonly loading = this.store.loading;

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        untracked(() => this.store.bootstrap());
      }
    });
  }
}
