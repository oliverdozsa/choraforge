import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { CardStatus, ChoreCardResponse, Rarity } from '../../models/api.model';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';
import { ChoreStoreService } from '../../services/chore-store.service';

const RARITY_TIER: Record<Rarity, number> = {
  COMMON: 1,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
};

/** Statuses that get a badge on the card art. */
const BADGE_STATUSES: readonly CardStatus[] = ['CLAIMED', 'COMPLETED', 'VERIFIED'];

@Component({
  selector: 'app-chore-card',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, LocalizedDatePipe],
  templateUrl: './chore-card.component.html',
  styleUrl: './chore-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--r]': 'rarityColor',
  },
})
export class ChoreCardComponent implements AfterViewInit, OnDestroy {
  private readonly store = inject(ChoreStoreService);
  private readonly zone = inject(NgZone);

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

  @ViewChild('stage', { static: true }) private stage!: ElementRef<HTMLElement>;

  readonly flipped = signal(false);
  readonly failedArtUrl = signal<string | null>(null);
  readonly complexityPips = Array.from({ length: 10 }, (_, i) => i);
  readonly gems = Array.from({ length: 5 }, (_, i) => i);

  private removeTiltListeners?: () => void;

  ngAfterViewInit(): void {
    const el = this.stage.nativeElement;
    // Tilt and foil only touch CSS custom properties, so keep them out of change detection.
    this.zone.runOutsideAngular(() => {
      const move = (e: PointerEvent) => {
        if (e.pointerType === 'touch' || prefersReducedMotion()) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${x * 100}%`);
        el.style.setProperty('--my', `${y * 100}%`);
        el.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
        el.style.setProperty('--ry', `${(x - 0.5) * 18}deg`);
        el.style.setProperty('--o', '1');
      };
      const leave = () => {
        for (const prop of ['--mx', '--my', '--rx', '--ry', '--o']) el.style.removeProperty(prop);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      this.removeTiltListeners = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
      };
    });
  }

  ngOnDestroy(): void {
    this.removeTiltListeners?.();
  }

  toggleFlip(event?: Event): void {
    event?.preventDefault();
    this.flipped.update((f) => !f);
  }

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

  onAction(): void {
    if (this.card.status === 'AVAILABLE') {
      this.claim.emit(this.card.id);
    } else if (this.card.status === 'CLAIMED') {
      this.complete.emit(this.card.id);
    } else if (this.card.status === 'COMPLETED' && this.canVerify) {
      this.verify.emit(this.card.id);
    }
  }

  get rarityColor(): string {
    return `var(--rarity-${this.card.rarity.toLowerCase()})`;
  }

  get rarityKey(): string {
    return `enums.rarity.${this.card.rarity}`;
  }

  get tier(): number {
    return RARITY_TIER[this.card.rarity] ?? 1;
  }

  get showArt(): boolean {
    return !!this.card.imageUrl && this.failedArtUrl() !== this.card.imageUrl;
  }

  /** Translation key for the status badge, or '' when the status has no badge. */
  get statusKey(): string {
    return BADGE_STATUSES.includes(this.card.status) ? `enums.cardStatus.${this.card.status}` : '';
  }

  get statusClass(): string {
    return `status-${this.card.status.toLowerCase()}`;
  }

  get ownerIsSelf(): boolean {
    const userId = this.card.assignedUserId;
    return !!userId && userId === this.store.currentUserId();
  }

  /** Name of the card's owner when it is someone else; undefined for unowned or own cards. */
  get ownerName(): string | undefined {
    const userId = this.card.assignedUserId;
    if (!userId || this.ownerIsSelf) return undefined;
    return this.assignedUserName ?? this.store.assignedUserNames().get(userId);
  }

  get hasOwner(): boolean {
    return this.ownerIsSelf || !!this.ownerName;
  }

  get questCode(): string {
    return this.card.id ? `QST-${this.card.id.slice(0, 4).toUpperCase()}` : '—';
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

  get isOverdue(): boolean {
    if (!this.card.dueAt || this.card.status === 'VERIFIED') return false;
    const dueAt = new Date(this.card.dueAt).getTime();
    const remainingMs = dueAt - Date.now();
    if (!this.card.dueDateIntervalHours) return remainingMs < 0;
    const totalMs = this.card.dueDateIntervalHours * 60 * 60 * 1000;
    return remainingMs < totalMs * 0.2;
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
