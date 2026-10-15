import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { GoogleCredentialResponse } from '../models/google-identity';

const SESSION_KEY = 'choraforge_session';
const DEV_USER_KEY = 'choraforge_dev_user';
const SESSION_URL = `${environment.apiBaseUrl}/api/v1/auth/session`;

export interface AuthProfile {
  name: string;
  email: string;
  picture?: string;
}

interface StoredSession extends AuthProfile {
  token: string;
}

/** Why the user is looking at the login screen without having clicked "sign out". */
export type LoginNotice = 'expired' | 'failed';

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<StoredSession>) : null;
    return stored?.token ? (stored as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredSession | null): void {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable (e.g. private mode); the session just won't survive a reload.
  }
}

/**
 * Signs in with Google once, then trades the short-lived Google ID token for a long-lived
 * backend session token, so the installed app doesn't ask for Google sign-in again every hour.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _session = signal<StoredSession | null>(readStoredSession());
  private readonly _devUser = signal<string | null>(sessionStorage.getItem(DEV_USER_KEY));
  private readonly _notice = signal<LoginNotice | null>(null);

  readonly sessionToken = computed(() => this._session()?.token ?? null);
  readonly devUser = this._devUser.asReadonly();
  readonly notice = this._notice.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null || this._devUser() !== null);
  readonly profile = computed<AuthProfile | null>(() => {
    const session = this._session();
    if (session) return { name: session.name, email: session.email, picture: session.picture };
    const devUser = this._devUser();
    return devUser ? { name: devUser, email: devUser } : null;
  });

  /** Dev-only: authenticate via the backend's X-Dev-User header instead of a real Google token. */
  loginAsDevUser(email: string): void {
    sessionStorage.setItem(DEV_USER_KEY, email);
    this._devUser.set(email);
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
      callback: (response: GoogleCredentialResponse) => void this.handleCredential(response),
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

  private async handleCredential(response: GoogleCredentialResponse): Promise<void> {
    this._notice.set(null);
    try {
      const created = await firstValueFrom(
        this.http.post<{ token: string; name: string; email: string; picture?: string }>(
          SESSION_URL,
          null,
          { headers: new HttpHeaders({ Authorization: `Bearer ${response.credential}` }) },
        ),
      );
      const session: StoredSession = {
        token: created.token,
        name: created.name,
        email: created.email,
        picture: created.picture ?? undefined,
      };
      writeStoredSession(session);
      this._session.set(session);
    } catch {
      this._notice.set('failed');
    }
  }

  /** The backend rejected our session token: drop it and say why on the login screen. */
  expire(): void {
    this.clear();
    this._notice.set('expired');
  }

  logout(): void {
    const token = this.sessionToken();
    this.clear();
    this._notice.set(null);
    if (token) {
      // Best effort: revoke the session server-side so a copied token stops working.
      this.http
        .delete(SESSION_URL, { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) })
        .subscribe({ error: () => undefined });
    }
  }

  private clear(): void {
    writeStoredSession(null);
    sessionStorage.removeItem(DEV_USER_KEY);
    this._session.set(null);
    this._devUser.set(null);
    window.google?.accounts.id.disableAutoSelect();
  }
}
