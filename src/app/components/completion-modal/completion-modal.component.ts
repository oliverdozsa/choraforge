import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { RewardBatch } from '../../services/chore-store.service';


@Component({
  selector: 'app-completion-modal',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
  templateUrl: './completion-modal.component.html',
  styleUrl: './completion-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletionModalComponent {
  @Input({ required: true }) batch!: RewardBatch;
  @Output() dismiss = new EventEmitter<void>();

  get totalXp(): number {
    return this.batch.rewards.reduce((sum, r) => sum + r.xpGained, 0);
  }

  get totalGold(): number {
    return this.batch.rewards.reduce((sum, r) => sum + r.goldGained, 0);
  }

  rarityClass(rarity: string): string {
    return `rarity-${rarity.toLowerCase()}`;
  }

  onBackdropClick(): void {
    this.dismiss.emit();
  }
}
