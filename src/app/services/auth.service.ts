import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { GoogleCredentialResponse } from '../models/google-identity';

const STORAGE_KEY = 'choragon_id_token';
const DEV_USER_KEY = 'choragon_dev_user';

interface DecodedIdToken {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _idToken = signal<string | null>(this.loadStoredToken());
  private readonly _devUser = signal<string | null>(sessionStorage.getItem(DEV_USER_KEY));

  readonly idToken = this._idToken.asReadonly();
  readonly devUser = this._devUser.asReadonly();
  readonly isAuthenticated = computed(() => this._idToken() !== null || this._devUser() !== null);
  readonly profile = computed<DecodedIdToken | null>(() => {
    const token = this._idToken();
    if (token) return this.decodeToken(token);
    const devUser = this._devUser();
    if (devUser) {
      return { sub: devUser, email: devUser, name: devUser, exp: Number.MAX_SAFE_INTEGER };
    }
    return null;
  });

  /** Dev-only: authenticate via the backend's X-Dev-User header instead of a real Google token. */
  loginAsDevUser(email: string): void {
    sessionStorage.setItem(DEV_USER_KEY, email);
    this._devUser.set(email);
  }

  private loadStoredToken(): string | null {
    const token = sessionStorage.getItem(STORAGE_KEY);
    if (!token) return null;
    const decoded = this.decodeToken(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return token;
  }

  private decodeToken(token: string): DecodedIdToken | null {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  }

  waitForGoogleSdk(timeoutMs = 5000): Promise<Window['google']> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const poll = () => {
        if (window.google?.accounts?.id) {
          resolve(window.google);
        } else if (Date.now() - start > timeoutMs) {
          reject(new Error('Google Identity Services failed to load.'));
        } else {
          setTimeout(poll, 100);
        }
      };
      poll();
    });
  }

  async renderSignInButton(target: HTMLElement): Promise<void> {
    const google = await this.waitForGoogleSdk();
    if (!google) return;

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: GoogleCredentialResponse) => this.handleCredential(response),
      cancel_on_tap_outside: true,
    });

    google.accounts.id.renderButton(target, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: 'signin_with',
      width: 280,
    });
  }

  private handleCredential(response: GoogleCredentialResponse): void {
    sessionStorage.setItem(STORAGE_KEY, response.credential);
    this._idToken.set(response.credential);
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(DEV_USER_KEY);
    this._idToken.set(null);
    this._devUser.set(null);
    window.google?.accounts.id.disableAutoSelect();
  }
}
