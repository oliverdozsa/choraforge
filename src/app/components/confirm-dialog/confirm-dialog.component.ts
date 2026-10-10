import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [AppDialogComponent, TranslocoPipe],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  @Input() title = '';
  @Input() message = '';
  @Input() confirmLabel = '';
  @Input() cancelLabel = '';
  @Input() confirming = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
