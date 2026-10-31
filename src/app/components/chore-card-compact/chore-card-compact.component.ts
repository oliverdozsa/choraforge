import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChoreCardResponse } from '../../models/api.model';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';
import { ChoreStoreService } from '../../services/chore-store.service';

/** One-row version of the chore card for read-only lists such as history and team activity. */
@Component({
  selector: 'app-chore-card-compact',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, LocalizedDatePipe],
  templateUrl: './chore-card-compact.component.html',
  styleUrl: './chore-card-compact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--r]': 'rarityColor',
  },
})
export class ChoreCardCompactComponent {
  private readonly store = inject(ChoreStoreService);

  @Input({ required: true }) card!: ChoreCardResponse;
  @Input() canEdit = false;
  @Input() canDelete = false;
  @Input() assignedUserName?: string;
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  readonly expanded = signal(false);
  readonly failedArtUrl = signal<string | null>(null);

  toggle(): void {
    this.expanded.update((e) => !e);
  }

  get rarityColor(): string {
    return `var(--rarity-${this.card.rarity.toLowerCase()})`;
  }

  get rarityKey(): string {
    return `enums.rarity.${this.card.rarity}`;
  }

  get artUrl(): string | undefined {
    return this.card.resolvedImageUrl || this.card.imageUrl;
  }

  get showArt(): boolean {
    const url = this.artUrl;
    return !!url && this.failedArtUrl() !== url;
  }

  get statusClass(): string {
    return `status-${this.card.status.toLowerCase()}`;
  }

  get ownerIsSelf(): boolean {
    const userId = this.card.assignedUserId;
    return !!userId && userId === this.store.currentUserId();
  }

  get ownerName(): string | undefined {
    const userId = this.card.assignedUserId;
    if (!userId || this.ownerIsSelf) return undefined;
    return this.assignedUserName ?? this.store.assignedUserNames().get(userId);
  }

  get timeKey(): string {
    const minutes = this.card.estimatedMinutes;
    if (minutes < 60) return 'card.time.m';
    return minutes % 60 ? 'card.time.hm' : 'card.time.h';
  }

  get timeParams(): { h: number; m: number } {
    const minutes = this.card.estimatedMinutes;
    return minutes < 60 ? { h: 0, m: minutes } : { h: Math.floor(minutes / 60), m: minutes % 60 };
  }
}
