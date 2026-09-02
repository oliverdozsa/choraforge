import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoreCardComponent } from '../chore-card/chore-card.component';
import { ChoreStoreService } from '../../services/chore-store.service';
import { ChoreCardResponse, Rarity } from '../../models/api.model';

@Component({
  selector: 'app-card-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, ChoreCardComponent],
  templateUrl: './card-templates.component.html',
  styleUrl: './card-templates.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTemplatesComponent {
  private readonly store = inject(ChoreStoreService);

  readonly templates = this.store.templates;
  readonly isTeamAdmin = this.store.isTeamAdmin;

  readonly creating = signal(false);
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly rarities: Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  title = '';
  description = '';
  rarity: Rarity = 'COMMON';
  complexity = 3;
  estimatedMinutes = 15;
  xpReward = 50;
  goldReward = 10;
  itemDrop = '';

  get previewCard(): ChoreCardResponse {
    return {
      id: 'preview',
      teamId: this.store.selectedTeamId() ?? '',
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

  startCreating(): void {
    this.formError.set(null);
    this.creating.set(true);
  }

  cancel(): void {
    this.creating.set(false);
    this.title = '';
    this.description = '';
    this.rarity = 'COMMON';
    this.complexity = 3;
    this.estimatedMinutes = 15;
    this.xpReward = 50;
    this.goldReward = 10;
    this.itemDrop = '';
  }

  asChoreCard(template: { id: string; teamId: string; title: string; description?: string; rarity: Rarity; complexity: number; estimatedMinutes: number; xpReward: number; goldReward: number; itemDrop?: string; createdAt: string }): ChoreCardResponse {
    return { ...template, status: 'AVAILABLE' };
  }

  async save(): Promise<void> {
    const teamId = this.store.selectedTeamId();
    if (!teamId) return;
    if (!this.title.trim()) {
      this.formError.set('Title is required.');
      return;
    }
    this.formError.set(null);
    this.submitting.set(true);
    try {
      await this.store.createCardTemplate({
        teamId,
        title: this.title.trim(),
        description: this.description || undefined,
        rarity: this.rarity,
        complexity: this.complexity,
        estimatedMinutes: this.estimatedMinutes,
        xpReward: this.xpReward,
        goldReward: this.goldReward,
        itemDrop: this.itemDrop || undefined,
      });
      this.cancel();
    } catch {
      // surfaced via store.error
    } finally {
      this.submitting.set(false);
    }
  }
}
