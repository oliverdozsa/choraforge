import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  isDevMode,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements AfterViewInit {
  private readonly auth = inject(AuthService);
  readonly buttonHost = viewChild.required<ElementRef<HTMLDivElement>>('buttonHost');

  readonly sdkError = signal(false);
  readonly isDevMode = isDevMode();
  devEmail = '';

  ngAfterViewInit(): void {
    this.auth.renderSignInButton(this.buttonHost().nativeElement).catch(() => {
      this.sdkError.set(true);
    });
  }

  loginAsDevUser(): void {
    const email = this.devEmail.trim();
    if (!email) return;
    this.auth.loginAsDevUser(email);
  }
}
