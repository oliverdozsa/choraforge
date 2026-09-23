import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardDesignerComponent, CardDraft } from '../card-designer/card-designer.component';
import { ChoreCardTemplateResponse } from '../../models/api.model';

@Component({
  selector: 'app-card-designer-modal',
  standalone: true,
  imports: [CommonModule, CardDesignerComponent],
  templateUrl: './card-designer-modal.component.html',
  styleUrl: './card-designer-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDesignerModalComponent {
  @Input() templates: ChoreCardTemplateResponse[] = [];
  @Input() submitting = false;
  @Input() submitLabel = 'Save';
  @Input() previewTeamId = '';
  @Input() initial?: CardDraft;
  @Output() save = new EventEmitter<CardDraft>();
  @Output() cancelled = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancelled.emit();
  }

  onBackdropClick(): void {
    this.cancelled.emit();
  }
}
