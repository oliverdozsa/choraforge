import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements AfterViewInit {
  private readonly auth = inject(AuthService);
  readonly buttonHost = viewChild.required<ElementRef<HTMLDivElement>>('buttonHost');

  readonly sdkError = signal(false);

  ngAfterViewInit(): void {
    this.auth.renderSignInButton(this.buttonHost().nativeElement).catch(() => {
      this.sdkError.set(true);
    });
  }
}
