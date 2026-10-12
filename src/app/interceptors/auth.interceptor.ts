import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Requests that bring their own credentials (session create / revoke) are left alone.
  if (!req.url.startsWith(environment.apiBaseUrl) || req.headers.has('Authorization')) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.sessionToken();
  if (token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
      catchError((err: unknown) => {
        // Only react if this is still the session that was rejected, not one from a later sign-in.
        if (err instanceof HttpErrorResponse && err.status === 401 && auth.sessionToken() === token) {
          auth.expire();
        }
        return throwError(() => err);
      }),
    );
  }

  const devUser = auth.devUser();
  if (devUser) {
    return next(req.clone({ setHeaders: { 'X-Dev-User': devUser } }));
  }

  return next(req);
};
