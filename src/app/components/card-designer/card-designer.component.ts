import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
export class CardDesignerComponent {
  @Input() templates: ChoreCardTemplateResponse[] = [];
  @Input() submitting = false;
  @Input() submitLabel = 'Save';
  @Input() previewTeamId = '';
  @Output() save = new EventEmitter<CardDraft>();
  @Output() cancelled = new EventEmitter<void>();

  readonly rarities: Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  readonly recurrenceTypes: { value: RecurrenceType | ''; label: string }[] = [
    { value: '', label: 'Does not repeat' },
    { value: 'SCHEDULE', label: 'On a schedule' },
    { value: 'AFTER_COMPLETION', label: 'After verification' },
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

  onTemplateSelected(): void {
    const template = this.templates.find((t) => t.id === this.selectedTemplateId);
    if (!template) return;
    this.title = template.title;
    this.description = template.description ?? '';
    this.rarity = template.rarity;
    this.complexity = template.complexity;
    this.estimatedMinutes = template.estimatedMinutes;
    this.xpReward = template.xpReward;
    this.goldReward = template.goldReward;
    this.itemDrop = template.itemDrop ?? '';
    this.imageUrl = template.imageUrl ?? '';
    this.applyRecurrence(template.recurrence);
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
      recurrence: this.buildRecurrence(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
