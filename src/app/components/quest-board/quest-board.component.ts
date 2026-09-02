import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoreCardComponent } from '../chore-card/chore-card.component';
import { CompletionModalComponent } from '../completion-modal/completion-modal.component';
import { CardDesignerComponent, CardDraft } from '../card-designer/card-designer.component';
import { ChoreStoreService, RewardResult } from '../../services/chore-store.service';

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
  readonly error = this.store.error;
  readonly isTeamAdmin = this.store.isTeamAdmin;
  readonly templates = this.store.templates;
  readonly selectedTeamId = this.store.selectedTeamId;

  readonly activeReward = signal<RewardResult | null>(null);
  readonly creatingCard = signal(false);
  readonly creatingCardSubmitting = signal(false);

  claimCard(cardId: string): void {
    this.store.claimCard(cardId);
  }

  completeCard(cardId: string): void {
    this.store.completeCard(cardId);
  }

  async verifyCard(cardId: string): Promise<void> {
    const result = await this.store.verifyCard(cardId);
    if (result) {
      this.activeReward.set(result);
    }
  }

  dismissReward(): void {
    this.activeReward.set(null);
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
