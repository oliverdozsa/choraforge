import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoreCardComponent } from '../chore-card/chore-card.component';
import {
  ChoreCardResponse,
  ChoreCardTemplateResponse,
  DayOfWeek,
  RecurrenceDto,
  RecurrenceType,
  Rarity,
  ScheduleFrequency,
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
  dueDateIntervalHours?: number;
  recurrence?: RecurrenceDto;
}

@Component({
  selector: 'app-card-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, ChoreCardComponent],
  templateUrl: './card-designer.component.html',
  styleUrl: './card-designer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDesignerComponent implements OnInit {
  @Input() templates: ChoreCardTemplateResponse[] = [];
  @Input() submitting = false;
  @Input() submitLabel = 'Save';
  @Input() previewTeamId = '';
  /** When set, the designer opens pre-filled for editing rather than creating a new card/template. */
  @Input() initial?: CardDraft;
  @Output() save = new EventEmitter<CardDraft>();
  @Output() cancelled = new EventEmitter<void>();

  readonly rarities: Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  readonly recurrenceTypes: { value: RecurrenceType | ''; label: string }[] = [
    { value: '', label: 'Does not repeat' },
    { value: 'SCHEDULE', label: 'On a schedule' },
    { value: 'AFTER_COMPLETION', label: 'After verification' },
  ];
  readonly dueDateUnits: { value: DueDateUnit; label: string }[] = [
    { value: 'HOURS', label: 'Hours' },
    { value: 'DAYS', label: 'Days' },
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
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
      dueDateIntervalHours: this.hasDueDate ? this.dueDateIntervalHours : undefined,
      recurrence: this.buildRecurrence(),
    };
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
      this.formError = 'Title is required.';
      return;
    }
    if (this.hasDueDate && !(this.dueDateAmount >= 1)) {
      this.formError = 'Due in must be at least 1.';
      return;
    }
    if (this.recurrenceType === 'AFTER_COMPLETION' && !(this.intervalMinutes >= 1)) {
      this.formError = 'Repeat delay must be at least 1 minute.';
      return;
    }
    if (this.recurrenceType === 'SCHEDULE') {
      if (!this.time) {
        this.formError = 'Schedule time is required.';
        return;
      }
      if (this.frequency === 'WEEKLY' && !this.daysOfWeek.length) {
        this.formError = 'Pick at least one weekday.';
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
      dueDateIntervalHours: this.hasDueDate ? this.dueDateIntervalHours : undefined,
      recurrence: this.buildRecurrence(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
