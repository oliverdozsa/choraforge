import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoreCardComponent } from '../chore-card/chore-card.component';
import { ChoreCardResponse, ChoreCardTemplateResponse, Rarity } from '../../models/api.model';

export interface CardDraft {
  title: string;
  description?: string;
  rarity: Rarity;
  complexity: number;
  estimatedMinutes: number;
  xpReward: number;
  goldReward: number;
  itemDrop?: string;
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

  selectedTemplateId = '';
  title = '';
  description = '';
  rarity: Rarity = 'COMMON';
  complexity = 3;
  estimatedMinutes = 15;
  xpReward = 50;
  goldReward = 10;
  itemDrop = '';

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
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
    };
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
  }

  onSubmit(): void {
    if (!this.title.trim()) {
      this.formError = 'Title is required.';
      return;
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
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
