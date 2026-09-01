import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ChoreCardResponse, TeamMemberResponse, TeamMembershipResponse, UserResponse } from '../models/api.model';

export interface RewardResult {
  card: ChoreCardResponse;
  xpGained: number;
  goldGained: number;
  leveledUp: boolean;
  newLevel: number;
}

function friendlyError(err: unknown): string {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    if (status === 401) return 'Your session expired. Please sign in again.';
    if (status === 403) return "You don't have permission to do that.";
    if (status === 400) return 'That request was invalid.';
  }
  return 'Something went wrong talking to the server.';
}

@Injectable({ providedIn: 'root' })
export class ChoreStoreService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly _currentUser = signal<UserResponse | null>(null);
  private readonly _selectedTeamId = signal<string | null>(null);
  private readonly _cards = signal<ChoreCardResponse[]>([]);
  private readonly _leaderboard = signal<TeamMemberResponse[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly selectedTeamId = this._selectedTeamId.asReadonly();
  readonly leaderboard = this._leaderboard.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly teams = computed<TeamMembershipResponse[]>(() => this._currentUser()?.teams ?? []);
  readonly hasTeam = computed(() => this.teams().length > 0);
  readonly currentUserId = computed(() => this._currentUser()?.id ?? null);

  readonly currentMembership = computed<TeamMembershipResponse | null>(() => {
    const teamId = this._selectedTeamId();
    return this.teams().find((t) => t.teamId === teamId) ?? null;
  });

  readonly xpProgressPercent = computed(() => {
    const m = this.currentMembership();
    if (!m || m.nextLevelXp <= 0) return 0;
    return Math.min(100, Math.round((m.currentXp / m.nextLevelXp) * 100));
  });

  readonly availableQuests = computed(() =>
    this._cards().filter((c) => c.status === 'AVAILABLE'),
  );

  readonly activeHand = computed(() =>
    this._cards().filter((c) => c.status === 'CLAIMED' && c.assignedUserId === this.currentUserId()),
  );

  readonly awaitingVerification = computed(() =>
    this._cards().filter((c) => c.status === 'COMPLETED' && c.assignedUserId === this.currentUserId()),
  );

  readonly teamActivity = computed(() =>
    this._cards().filter((c) => c.status !== 'AVAILABLE' && c.assignedUserId !== this.currentUserId()),
  );

  async bootstrap(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const me = await firstValueFrom(this.api.getMe());
      this._currentUser.set(me);
      if (me.teams.length) {
        await this.selectTeam(me.teams[0].teamId);
      }
    } catch (err) {
      this._error.set(friendlyError(err));
    } finally {
      this._loading.set(false);
    }
  }

  async selectTeam(teamId: string): Promise<void> {
    this._selectedTeamId.set(teamId);
    await this.refreshTeamData();
  }

  async refreshTeamData(): Promise<void> {
    const teamId = this._selectedTeamId();
    if (!teamId) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const [cards, leaderboard] = await Promise.all([
        firstValueFrom(this.api.getTeamCards(teamId)),
        firstValueFrom(this.api.getLeaderboard(teamId)),
      ]);
      this._cards.set(cards);
      this._leaderboard.set(leaderboard);
    } catch (err) {
      this._error.set(friendlyError(err));
    } finally {
      this._loading.set(false);
    }
  }

  private async refreshMe(): Promise<void> {
    const me = await firstValueFrom(this.api.getMe());
    this._currentUser.set(me);
  }

  async createTeam(name: string): Promise<void> {
    this._error.set(null);
    try {
      const beforeIds = new Set(this.teams().map((t) => t.teamId));
      await firstValueFrom(this.api.createTeam({ name }));
      await this.refreshMe();
      const newTeam = this.teams().find((t) => !beforeIds.has(t.teamId));
      if (newTeam) {
        await this.selectTeam(newTeam.teamId);
      }
    } catch (err) {
      this._error.set(friendlyError(err));
      throw err;
    }
  }

  async joinTeam(teamId: string, email: string): Promise<void> {
    this._error.set(null);
    try {
      await firstValueFrom(this.api.joinTeam(teamId, { email }));
      await this.refreshMe();
      await this.selectTeam(teamId);
    } catch (err) {
      this._error.set(friendlyError(err));
      throw err;
    }
  }

  logout(): void {
    this.auth.logout();
    this._currentUser.set(null);
    this._selectedTeamId.set(null);
    this._cards.set([]);
    this._leaderboard.set([]);
  }

  private replaceCard(updated: ChoreCardResponse): void {
    this._cards.update((cards) => cards.map((c) => (c.id === updated.id ? updated : c)));
  }

  async claimCard(cardId: string): Promise<void> {
    this._error.set(null);
    try {
      const updated = await firstValueFrom(this.api.claimCard(cardId));
      this.replaceCard(updated);
    } catch (err) {
      this._error.set(friendlyError(err));
    }
  }

  async completeCard(cardId: string): Promise<void> {
    this._error.set(null);
    try {
      const updated = await firstValueFrom(this.api.completeCard(cardId));
      this.replaceCard(updated);
    } catch (err) {
      this._error.set(friendlyError(err));
    }
  }

  async verifyCard(cardId: string): Promise<RewardResult | null> {
    this._error.set(null);
    try {
      const result = await firstValueFrom(this.api.verifyCard(cardId));
      this.replaceCard(result.cardCompleted);
      const teamId = this._selectedTeamId();
      await Promise.all([
        this.refreshMe(),
        teamId ? firstValueFrom(this.api.getLeaderboard(teamId)).then((lb) => this._leaderboard.set(lb)) : Promise.resolve(),
      ]);
      return {
        card: result.cardCompleted,
        xpGained: result.xpGained,
        goldGained: result.goldGained,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
      };
    } catch (err) {
      this._error.set(friendlyError(err));
      return null;
    }
  }
}
