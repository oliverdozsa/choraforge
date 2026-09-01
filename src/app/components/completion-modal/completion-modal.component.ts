import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RewardResult } from '../../services/chore-store.service';


@Component({
  selector: 'app-completion-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './completion-modal.component.html',
  styleUrl: './completion-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletionModalComponent {
  @Input({ required: true }) result!: RewardResult;
  @Output() dismiss = new EventEmitter<void>();

  onBackdropClick(): void {
    this.dismiss.emit();
  }
}
