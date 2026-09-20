import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoreCardResponse } from '../../models/api.model';

@Component({
  selector: 'app-chore-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chore-card.component.html',
  styleUrl: './chore-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoreCardComponent {
  @Input({ required: true }) card!: ChoreCardResponse;
  @Input() readonlyCard = false;
  @Input() canVerify = true;
  @Input() assignedUserName?: string;
  @Output() claim = new EventEmitter<string>();
  @Output() complete = new EventEmitter<string>();
  @Output() verify = new EventEmitter<string>();

  get rarityClass(): string {
    return `rarity-${this.card.rarity.toLowerCase()}`;
  }

  get complexityPips(): number[] {
    return Array.from({ length: 10 }, (_, i) => i);
  }

  get ctaLabel(): string {
    switch (this.card.status) {
      case 'AVAILABLE':
        return 'Claim Card';
      case 'CLAIMED':
        return 'Complete Quest';
      case 'COMPLETED':
        return 'Verify';
      case 'VERIFIED':
        return 'Verified ✓';
    }
  }

  get showCta(): boolean {
    return this.card.status !== 'COMPLETED' || this.canVerify;
  }

  get statusLabel(): string {
    switch (this.card.status) {
      case 'CLAIMED':
        return 'In Progress';
      case 'COMPLETED':
        return 'Awaiting Verification';
      case 'VERIFIED':
        return 'Verified';
      default:
        return '';
    }
  }

  onAction(): void {
    if (this.card.status === 'AVAILABLE') {
      this.claim.emit(this.card.id);
    } else if (this.card.status === 'CLAIMED') {
      this.complete.emit(this.card.id);
    } else if (this.card.status === 'COMPLETED' && this.canVerify) {
      this.verify.emit(this.card.id);
    }
  }
}
