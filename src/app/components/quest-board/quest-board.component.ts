import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoreCardComponent } from '../chore-card/chore-card.component';
import { CompletionModalComponent } from '../completion-modal/completion-modal.component';
import { CardDraft } from '../card-designer/card-designer.component';
import { CardDesignerModalComponent } from '../card-designer-modal/card-designer-modal.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ChoreStoreService } from '../../services/chore-store.service';
import { ChoreCardResponse } from '../../models/api.model';

@Component({
  selector: 'app-quest-board',
  standalone: true,
  imports: [
    CommonModule,
    ChoreCardComponent,
    CompletionModalComponent,
    CardDesignerModalComponent,
    ConfirmDialogComponent,
  ],
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
  readonly editingCard = signal<ChoreCardResponse | null>(null);
  readonly editingCardSubmitting = signal(false);
  readonly deletingCard = signal<ChoreCardResponse | null>(null);
  readonly deletingCardSubmitting = signal(false);

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

  asDraft(card: ChoreCardResponse): CardDraft {
    return {
      title: card.title,
      description: card.description,
      rarity: card.rarity,
      complexity: card.complexity,
      estimatedMinutes: card.estimatedMinutes,
      xpReward: card.xpReward,
      goldReward: card.goldReward,
      itemDrop: card.itemDrop,
      imageUrl: card.imageUrl,
      dueDateIntervalHours: card.dueDateIntervalHours,
      recurrence: card.recurrence,
    };
  }

  dismissReward(): void {
    this.store.dismissReward();
  }

  startCreatingCard(): void {
    this.editingCard.set(null);
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

  startEditingCard(cardId: string): void {
    const card = this.store.cards().find((c) => c.id === cardId);
    if (!card) return;
    this.creatingCard.set(false);
    this.editingCard.set(card);
  }

  cancelEditingCard(): void {
    this.editingCard.set(null);
  }

  async saveEditedCard(draft: CardDraft): Promise<void> {
    const card = this.editingCard();
    if (!card) return;
    this.editingCardSubmitting.set(true);
    try {
      await this.store.updateCard(card.id, draft);
      this.editingCard.set(null);
    } catch {
      // surfaced via store.error
    } finally {
      this.editingCardSubmitting.set(false);
    }
  }

  startDeletingCard(cardId: string): void {
    const card = this.store.cards().find((c) => c.id === cardId);
    if (!card) return;
    this.deletingCard.set(card);
  }

  cancelDeletingCard(): void {
    this.deletingCard.set(null);
  }

  async confirmDeleteCard(): Promise<void> {
    const card = this.deletingCard();
    if (!card) return;
    this.deletingCardSubmitting.set(true);
    try {
      await this.store.deleteCard(card.id);
      this.deletingCard.set(null);
    } catch {
      // surfaced via store.error
    } finally {
      this.deletingCardSubmitting.set(false);
    }
  }
}
