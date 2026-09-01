import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoreCardComponent } from '../chore-card/chore-card.component';
import { CompletionModalComponent } from '../completion-modal/completion-modal.component';
import { ChoreStoreService, RewardResult } from '../../services/chore-store.service';

@Component({
  selector: 'app-quest-board',
  standalone: true,
  imports: [CommonModule, ChoreCardComponent, CompletionModalComponent],
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

  readonly activeReward = signal<RewardResult | null>(null);

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
}
