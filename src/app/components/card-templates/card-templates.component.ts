import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoreCardComponent } from '../chore-card/chore-card.component';
import { CardDesignerComponent, CardDraft } from '../card-designer/card-designer.component';
import { ChoreStoreService } from '../../services/chore-store.service';
import { ChoreCardResponse, ChoreCardTemplateResponse } from '../../models/api.model';

@Component({
  selector: 'app-card-templates',
  standalone: true,
  imports: [CommonModule, ChoreCardComponent, CardDesignerComponent],
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

  startCreating(): void {
    this.creating.set(true);
  }

  cancel(): void {
    this.creating.set(false);
  }

  asChoreCard(template: ChoreCardTemplateResponse): ChoreCardResponse {
    return { ...template, status: 'AVAILABLE' };
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
}
