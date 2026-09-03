import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {
  ChoreCardResponse,
  ChoreCardTemplateResponse,
  CreateChoreCardRequest,
  CreateChoreCardTemplateRequest,
  TeamMemberResponse,
  TeamMembershipResponse,
  UserResponse,
} from '../models/api.model';

export interface RewardResult {
  card: ChoreCardResponse;
  xpGained: number;
  goldGained: number;
  leveledUp: boolean;
  newLevel: number;
}

const REWARD_POLL_INTERVAL_MS = 15000;

function byDateDesc(getDate: (card: ChoreCardResponse) => string | undefined) {
  return (a: ChoreCardResponse, b: ChoreCardResponse) =>
    new Date(getDate(b) ?? 0).getTime() - new Date(getDate(a) ?? 0).getTime();
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
  private readonly _templates = signal<ChoreCardTemplateResponse[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _activeReward = signal<RewardResult | null>(null);

  private pollHandle: ReturnType<typeof setInterval> | null = null;

  readonly currentUser = this._currentUser.asReadonly();
  readonly selectedTeamId = this._selectedTeamId.asReadonly();
  readonly leaderboard = this._leaderboard.asReadonly();
  readonly templates = this._templates.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly activeReward = this._activeReward.asReadonly();

  readonly teams = computed<TeamMembershipResponse[]>(() => this._currentUser()?.teams ?? []);
  readonly hasTeam = computed(() => this.teams().length > 0);
  readonly currentUserId = computed(() => this._currentUser()?.id ?? null);

  readonly currentMembership = computed<TeamMembershipResponse | null>(() => {
    const teamId = this._selectedTeamId();
    return this.teams().find((t) => t.teamId === teamId) ?? null;
  });

  readonly isTeamAdmin = computed(() => {
    const role = this.currentMembership()?.role;
    return role === 'TEAM_ADMIN' || role === 'ADMIN';
  });

  readonly xpProgressPercent = computed(() => {
    const m = this.currentMembership();
    if (!m || m.nextLevelXp <= 0) return 0;
    return Math.min(100, Math.round((m.currentXp / m.nextLevelXp) * 100));
  });

  readonly availableQuests = computed(() =>
    this._cards()
      .filter((c) => c.status === 'AVAILABLE')
      .sort(byDateDesc((c) => c.createdAt)),
  );

  readonly activeHand = computed(() =>
    this._cards()
      .filter((c) => c.status === 'CLAIMED' && c.assignedUserId === this.currentUserId())
      .sort(byDateDesc((c) => c.claimedAt)),
  );

  // Admins see every completed card on the team (they can verify anyone's); everyone else sees only their own.
  readonly awaitingVerification = computed(() => {
    const isAdmin = this.isTeamAdmin();
    const userId = this.currentUserId();
    return this._cards()
      .filter((c) => c.status === 'COMPLETED' && (isAdmin || c.assignedUserId === userId))
      .sort(byDateDesc((c) => c.completedAt));
  });

  readonly teamActivity = computed(() => {
    const userId = this.currentUserId();
    const awaiting = new Set(this.awaitingVerification().map((c) => c.id));
    return this._cards().filter(
      (c) => c.status !== 'AVAILABLE' && c.assignedUserId !== userId && !awaiting.has(c.id),
    );
  });

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
    this.startRewardPolling();
  }

  async refreshTeamData(): Promise<void> {
    const teamId = this._selectedTeamId();
    if (!teamId) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const [cards, leaderboard, templates] = await Promise.all([
        firstValueFrom(this.api.getTeamCards(teamId)),
        firstValueFrom(this.api.getLeaderboard(teamId)),
        firstValueFrom(this.api.getTeamCardTemplates(teamId)),
      ]);
      this._cards.set(cards);
      this._leaderboard.set(leaderboard);
      this._templates.set(templates);
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
    this.stopRewardPolling();
    this.auth.logout();
    this._currentUser.set(null);
    this._selectedTeamId.set(null);
    this._cards.set([]);
    this._leaderboard.set([]);
    this._templates.set([]);
    this._activeReward.set(null);
  }

  async createCard(request: CreateChoreCardRequest): Promise<void> {
    this._error.set(null);
    try {
      const card = await firstValueFrom(this.api.createCard(request));
      this._cards.update((cards) => [...cards, card]);
    } catch (err) {
      this._error.set(friendlyError(err));
      throw err;
    }
  }

  async createCardTemplate(request: CreateChoreCardTemplateRequest): Promise<void> {
    this._error.set(null);
    try {
      const template = await firstValueFrom(this.api.createCardTemplate(request));
      this._templates.update((templates) => [...templates, template]);
    } catch (err) {
      this._error.set(friendlyError(err));
      throw err;
    }
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

  // Only admins may call this (server-enforced). Verifying someone else's card refreshes
  // team state but doesn't pop the reward modal here — the assignee's own client picks that
  // up via polling once the backend marks the reward unacknowledged.
  async verifyCard(cardId: string): Promise<void> {
    this._error.set(null);
    try {
      const result = await firstValueFrom(this.api.verifyCard(cardId));
      this.replaceCard(result.cardCompleted);
      const teamId = this._selectedTeamId();
      await Promise.all([
        this.refreshMe(),
        teamId ? firstValueFrom(this.api.getLeaderboard(teamId)).then((lb) => this._leaderboard.set(lb)) : Promise.resolve(),
      ]);
      if (result.cardCompleted.assignedUserId === this.currentUserId()) {
        this._activeReward.set({
          card: result.cardCompleted,
          xpGained: result.xpGained,
          goldGained: result.goldGained,
          leveledUp: result.leveledUp,
          newLevel: result.newLevel,
        });
      }
    } catch (err) {
      this._error.set(friendlyError(err));
    }
  }

  async dismissReward(): Promise<void> {
    const reward = this._activeReward();
    this._activeReward.set(null);
    if (!reward) return;
    try {
      const updated = await firstValueFrom(this.api.acknowledgeReward(reward.card.id));
      this.replaceCard(updated);
    } catch {
      // best-effort: if this fails the card may briefly re-surface on the next poll
    }
  }

  private startRewardPolling(): void {
    this.stopRewardPolling();
    this.pollHandle = setInterval(() => this.checkPendingRewards(), REWARD_POLL_INTERVAL_MS);
  }

  private stopRewardPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  private async checkPendingRewards(): Promise<void> {
    const teamId = this._selectedTeamId();
    const userId = this.currentUserId();
    if (!teamId || !userId || this._activeReward()) return;
    try {
      const cards = await firstValueFrom(this.api.getTeamCards(teamId));
      this._cards.set(cards);
      const pending = cards.find(
        (c) => c.status === 'VERIFIED' && c.assignedUserId === userId && !c.rewardAcknowledgedAt,
      );
      if (!pending) return;

      const levelBefore = this.currentMembership()?.level ?? 1;
      await this.refreshMe();
      const levelAfter = this.currentMembership()?.level ?? levelBefore;

      this._activeReward.set({
        card: pending,
        xpGained: pending.xpReward,
        goldGained: pending.goldReward,
        leveledUp: levelAfter > levelBefore,
        newLevel: levelAfter,
      });

      const teamIdNow = this._selectedTeamId();
      if (teamIdNow) {
        const lb = await firstValueFrom(this.api.getLeaderboard(teamIdNow));
        this._leaderboard.set(lb);
      }
    } catch {
      // silent: this is a background check, surfacing errors here would be noisy
    }
  }
}
