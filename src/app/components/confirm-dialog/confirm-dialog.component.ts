import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [AppDialogComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  @Input() title = 'Are you sure?';
  @Input() message = '';
  @Input() confirmLabel = 'Delete';
  @Input() cancelLabel = 'Cancel';
  @Input() confirming = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
