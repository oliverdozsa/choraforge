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
  @Input() canEdit = false;
  @Input() canDelete = false;
  @Input() assignedUserName?: string;
  @Output() claim = new EventEmitter<string>();
  @Output() unclaim = new EventEmitter<string>();
  @Output() complete = new EventEmitter<string>();
  @Output() verify = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.card.id);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.card.id);
  }

  onUnclaim(event: Event): void {
    event.stopPropagation();
    this.unclaim.emit(this.card.id);
  }

  get canUnclaim(): boolean {
    return this.card.status === 'CLAIMED';
  }

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

  get isOverdue(): boolean {
    if (!this.card.dueAt || this.card.status === 'VERIFIED') return false;
    const dueAt = new Date(this.card.dueAt).getTime();
    const remainingMs = dueAt - Date.now();
    if (!this.card.dueDateIntervalHours) return remainingMs < 0;
    const totalMs = this.card.dueDateIntervalHours * 60 * 60 * 1000;
    return remainingMs < totalMs * 0.2;
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
