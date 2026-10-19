import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ChoreCardComponent } from '../chore-card/chore-card.component';
import {
  ChoreCardResponse,
  ChoreCardTemplateResponse,
  DayOfWeek,
  RecurrenceDto,
  RecurrenceType,
  Rarity,
  ScheduleFrequency,
  TeamMemberResponse,
} from '../../models/api.model';

export type DueDateUnit = 'HOURS' | 'DAYS';

export interface CardDraft {
  title: string;
  description?: string;
  rarity: Rarity;
  complexity: number;
  estimatedMinutes: number;
  xpReward: number;
  goldReward: number;
  itemDrop?: string;
  imageUrl?: string;
  userImageUrls?: Record<string, string>;
  dueDateIntervalHours?: number;
  recurrence?: RecurrenceDto;
}

@Component({
  selector: 'app-card-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoDirective, ChoreCardComponent],
  templateUrl: './card-designer.component.html',
  styleUrl: './card-designer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDesignerComponent implements OnInit {
  @Input() templates: ChoreCardTemplateResponse[] = [];
  @Input() submitting = false;
  /** Translation key of the submit button label. */
  @Input() submitLabel = 'common.save';
  @Input() previewTeamId = '';
  /** Team members; each gets an optional user-specific image URL field. */
  @Input() members: TeamMemberResponse[] = [];
  /** When set, the designer opens pre-filled for editing rather than creating a new card/template. */
  @Input() initial?: CardDraft;
  @Output() save = new EventEmitter<CardDraft>();
  @Output() cancelled = new EventEmitter<void>();

  readonly rarities: Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  readonly recurrenceTypes: { value: RecurrenceType | ''; label: string }[] = [
    { value: '', label: 'designer.recurrence.NONE' },
    { value: 'SCHEDULE', label: 'designer.recurrence.SCHEDULE' },
    { value: 'AFTER_COMPLETION', label: 'designer.recurrence.AFTER_COMPLETION' },
  ];
  readonly dueDateUnits: { value: DueDateUnit; label: string }[] = [
    { value: 'HOURS', label: 'designer.unit.HOURS' },
    { value: 'DAYS', label: 'designer.unit.DAYS' },
  ];
  readonly frequencies: ScheduleFrequency[] = ['DAILY', 'WEEKLY', 'MONTHLY'];
  readonly weekDays: DayOfWeek[] = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ];

  selectedTemplateId = '';
  title = '';
  description = '';
  rarity: Rarity = 'COMMON';
  complexity = 3;
  estimatedMinutes = 15;
  xpReward = 50;
  goldReward = 10;
  itemDrop = '';
  imageUrl = '';
  userImageUrls: Record<string, string> = {};
  /** Member whose image URL field has focus; the preview shows that member's image. */
  focusedUserId: string | null = null;

  hasDueDate = false;
  dueDateAmount = 1;
  dueDateUnit: DueDateUnit = 'DAYS';

  get dueDateIntervalHours(): number {
    return this.dueDateUnit === 'DAYS' ? this.dueDateAmount * 24 : this.dueDateAmount;
  }

  recurrenceType: RecurrenceType | '' = '';
  intervalMinutes = 1440;
  frequency: ScheduleFrequency = 'DAILY';
  scheduleInterval = 1;
  daysOfWeek: DayOfWeek[] = [];
  dayOfMonth = 1;
  time = '09:00';
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  /** Translation key of the current validation error, or ''. */
  formError = '';

  get previewCard(): ChoreCardResponse {
    return {
      id: 'preview',
      teamId: this.previewTeamId,
      title: this.title.trim() || 'Untitled Quest',
      description: this.description,
      rarity: this.rarity,
      complexity: this.complexity,
      estimatedMinutes: this.estimatedMinutes,
      xpReward: this.xpReward,
      goldReward: this.goldReward,
      itemDrop: this.itemDrop || undefined,
      imageUrl: this.imageUrl || undefined,
      resolvedImageUrl: (this.focusedUserId && this.userImageUrls[this.focusedUserId]?.trim()) || undefined,
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
      dueDateIntervalHours: this.hasDueDate ? this.dueDateIntervalHours : undefined,
      recurrence: this.buildRecurrence(),
    };
  }

  /** Non-empty user image URLs, trimmed; always an object so clearing a field removes it on update. */
  private buildUserImageUrls(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [userId, url] of Object.entries(this.userImageUrls)) {
      const trimmed = url?.trim();
      if (trimmed) result[userId] = trimmed;
    }
    return result;
  }

  toggleDay(day: DayOfWeek): void {
    this.daysOfWeek = this.daysOfWeek.includes(day)
      ? this.daysOfWeek.filter((d) => d !== day)
      : [...this.daysOfWeek, day];
  }

  private buildRecurrence(): RecurrenceDto | undefined {
    if (this.recurrenceType === 'AFTER_COMPLETION') {
      return { type: 'AFTER_COMPLETION', intervalMinutes: this.intervalMinutes };
    }
    if (this.recurrenceType === 'SCHEDULE') {
      return {
        type: 'SCHEDULE',
        schedule: {
          frequency: this.frequency,
          interval: this.scheduleInterval,
          daysOfWeek: this.frequency === 'WEEKLY' ? this.weekDays.filter((d) => this.daysOfWeek.includes(d)) : undefined,
          dayOfMonth: this.frequency === 'MONTHLY' ? this.dayOfMonth : undefined,
          time: this.time,
          timeZone: this.timeZone || undefined,
        },
      };
    }
    return undefined;
  }

  ngOnInit(): void {
    if (this.initial) {
      this.applyDraft(this.initial);
    }
  }

  onTemplateSelected(): void {
    const template = this.templates.find((t) => t.id === this.selectedTemplateId);
    if (!template) return;
    this.applyDraft(template);
  }

  private applyDraft(draft: CardDraft): void {
    this.title = draft.title;
    this.description = draft.description ?? '';
    this.rarity = draft.rarity;
    this.complexity = draft.complexity;
    this.estimatedMinutes = draft.estimatedMinutes;
    this.xpReward = draft.xpReward;
    this.goldReward = draft.goldReward;
    this.itemDrop = draft.itemDrop ?? '';
    this.imageUrl = draft.imageUrl ?? '';
    this.userImageUrls = { ...(draft.userImageUrls ?? {}) };
    this.applyDueDate(draft.dueDateIntervalHours);
    this.applyRecurrence(draft.recurrence);
  }

  private applyDueDate(hours?: number): void {
    this.hasDueDate = hours != null;
    if (hours == null) return;
    if (hours >= 24 && hours % 24 === 0) {
      this.dueDateUnit = 'DAYS';
      this.dueDateAmount = hours / 24;
    } else {
      this.dueDateUnit = 'HOURS';
      this.dueDateAmount = hours;
    }
  }

  private applyRecurrence(r?: RecurrenceDto): void {
    this.recurrenceType = r?.type ?? '';
    if (!r) return;
    if (r.type === 'AFTER_COMPLETION') {
      this.intervalMinutes = r.intervalMinutes ?? this.intervalMinutes;
    } else if (r.schedule) {
      this.frequency = r.schedule.frequency;
      this.scheduleInterval = r.schedule.interval ?? 1;
      this.daysOfWeek = [...(r.schedule.daysOfWeek ?? [])];
      this.dayOfMonth = r.schedule.dayOfMonth ?? 1;
      this.time = r.schedule.time.slice(0, 5);
      this.timeZone = r.schedule.timeZone ?? this.timeZone;
    }
  }

  onSubmit(): void {
    if (!this.title.trim()) {
      this.formError = 'designer.errors.titleRequired';
      return;
    }
    if (this.hasDueDate && !(this.dueDateAmount >= 1)) {
      this.formError = 'designer.errors.dueMin';
      return;
    }
    if (this.recurrenceType === 'AFTER_COMPLETION' && !(this.intervalMinutes >= 1)) {
      this.formError = 'designer.errors.repeatMin';
      return;
    }
    if (this.recurrenceType === 'SCHEDULE') {
      if (!this.time) {
        this.formError = 'designer.errors.timeRequired';
        return;
      }
      if (this.frequency === 'WEEKLY' && !this.daysOfWeek.length) {
        this.formError = 'designer.errors.weekdayRequired';
        return;
      }
    }
    this.formError = '';
    this.save.emit({
      title: this.title.trim(),
      description: this.description || undefined,
      rarity: this.rarity,
      complexity: this.complexity,
      estimatedMinutes: this.estimatedMinutes,
      xpReward: this.xpReward,
      goldReward: this.goldReward,
      itemDrop: this.itemDrop || undefined,
      imageUrl: this.imageUrl || undefined,
      userImageUrls: this.buildUserImageUrls(),
      dueDateIntervalHours: this.hasDueDate ? this.dueDateIntervalHours : undefined,
      recurrence: this.buildRecurrence(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
