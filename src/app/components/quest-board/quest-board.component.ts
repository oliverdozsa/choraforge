import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoreCardComponent } from '../chore-card/chore-card.component';
import { CompletionModalComponent } from '../completion-modal/completion-modal.component';
import { CardDesignerComponent, CardDraft } from '../card-designer/card-designer.component';
import { ChoreStoreService } from '../../services/chore-store.service';

@Component({
  selector: 'app-quest-board',
  standalone: true,
  imports: [CommonModule, ChoreCardComponent, CompletionModalComponent, CardDesignerComponent],
  templateUrl: './quest-board.component.html',
  styleUrl: './quest-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestBoardComponent {
  private readonly store = inject(ChoreStoreService);

  readonly availableQuests = this.store.availableQuests;
  readonly activeHand = this.store.activeHand;
  readonly awaitingVerification = this.store.awaitingVerification;
  readonly teamActivity = this.store.teamActivity;
  readonly myVerifiedHistory = this.store.myVerifiedHistory;
  readonly error = this.store.error;
  readonly isTeamAdmin = this.store.isTeamAdmin;
  readonly templates = this.store.templates;
  readonly selectedTeamId = this.store.selectedTeamId;
  readonly activeRewards = this.store.activeRewards;
  readonly assignedUserNames = this.store.assignedUserNames;

  readonly creatingCard = signal(false);
  readonly creatingCardSubmitting = signal(false);

  private readonly historyPageSize = 6;
  readonly historyPage = signal(0);

  readonly historyTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.myVerifiedHistory().length / this.historyPageSize)),
  );

  readonly pagedVerifiedHistory = computed(() => {
    const page = Math.min(this.historyPage(), this.historyTotalPages() - 1);
    const start = page * this.historyPageSize;
    return this.myVerifiedHistory().slice(start, start + this.historyPageSize);
  });

  goToHistoryPage(page: number): void {
    const clamped = Math.min(Math.max(page, 0), this.historyTotalPages() - 1);
    this.historyPage.set(clamped);
  }

  prevHistoryPage(): void {
    this.goToHistoryPage(this.historyPage() - 1);
  }

  nextHistoryPage(): void {
    this.goToHistoryPage(this.historyPage() + 1);
  }

  claimCard(cardId: string): void {
    this.store.claimCard(cardId);
  }

  completeCard(cardId: string): void {
    this.store.completeCard(cardId);
  }

  verifyCard(cardId: string): void {
    this.store.verifyCard(cardId);
  }

  assignedUserName(card: { assignedUserId?: string }): string | undefined {
    return card.assignedUserId ? this.assignedUserNames().get(card.assignedUserId) : undefined;
  }

  dismissReward(): void {
    this.store.dismissReward();
  }

  startCreatingCard(): void {
    this.creatingCard.set(true);
  }

  cancelCreatingCard(): void {
    this.creatingCard.set(false);
  }

  async createCard(draft: CardDraft): Promise<void> {
    const teamId = this.store.selectedTeamId();
    if (!teamId) return;
    this.creatingCardSubmitting.set(true);
    try {
      await this.store.createCard({ teamId, ...draft });
      this.creatingCard.set(false);
    } catch {
      // surfaced via store.error
    } finally {
      this.creatingCardSubmitting.set(false);
    }
  }
}
