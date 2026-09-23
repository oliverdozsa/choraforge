import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoreCardComponent } from '../chore-card/chore-card.component';
import { CardDraft } from '../card-designer/card-designer.component';
import { CardDesignerModalComponent } from '../card-designer-modal/card-designer-modal.component';
import { ChoreStoreService } from '../../services/chore-store.service';
import { ChoreCardResponse, ChoreCardTemplateResponse } from '../../models/api.model';

@Component({
  selector: 'app-card-templates',
  standalone: true,
  imports: [CommonModule, ChoreCardComponent, CardDesignerModalComponent],
  templateUrl: './card-templates.component.html',
  styleUrl: './card-templates.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTemplatesComponent {
  private readonly store = inject(ChoreStoreService);

  readonly templates = this.store.templates;
  readonly isTeamAdmin = this.store.isTeamAdmin;
  readonly selectedTeamId = this.store.selectedTeamId;

  readonly creating = signal(false);
  readonly submitting = signal(false);
  readonly editingTemplate = signal<ChoreCardTemplateResponse | null>(null);
  readonly editingSubmitting = signal(false);

  startCreating(): void {
    this.editingTemplate.set(null);
    this.creating.set(true);
  }

  cancel(): void {
    this.creating.set(false);
  }

  asChoreCard(template: ChoreCardTemplateResponse): ChoreCardResponse {
    return { ...template, status: 'AVAILABLE' };
  }

  asDraft(template: ChoreCardTemplateResponse): CardDraft {
    return {
      title: template.title,
      description: template.description,
      rarity: template.rarity,
      complexity: template.complexity,
      estimatedMinutes: template.estimatedMinutes,
      xpReward: template.xpReward,
      goldReward: template.goldReward,
      itemDrop: template.itemDrop,
      imageUrl: template.imageUrl,
      recurrence: template.recurrence,
    };
  }

  async save(draft: CardDraft): Promise<void> {
    const teamId = this.store.selectedTeamId();
    if (!teamId) return;
    this.submitting.set(true);
    try {
      await this.store.createCardTemplate({ teamId, ...draft });
      this.creating.set(false);
    } catch {
      // surfaced via store.error
    } finally {
      this.submitting.set(false);
    }
  }

  startEditing(templateId: string): void {
    const template = this.templates().find((t) => t.id === templateId);
    if (!template) return;
    this.creating.set(false);
    this.editingTemplate.set(template);
  }

  cancelEditing(): void {
    this.editingTemplate.set(null);
  }

  async saveEdited(draft: CardDraft): Promise<void> {
    const template = this.editingTemplate();
    if (!template) return;
    this.editingSubmitting.set(true);
    try {
      await this.store.updateCardTemplate(template.id, draft);
      this.editingTemplate.set(null);
    } catch {
      // surfaced via store.error
    } finally {
      this.editingSubmitting.set(false);
    }
  }
}
