import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthTokenService } from '../services/AuthServices/auth-token.service';

/** Do not treat failed anonymous auth calls as "session expired". */
function isAnonymousAuthUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes('/acount/login') ||
    u.includes('/acount/register') ||
    u.includes('/acount/confirmemail')
  );
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(AuthTokenService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAnonymousAuthUrl(req.url)) {
        tokenService.clearToken();
        localStorage.removeItem('currentUser');
        router.navigate(['/login']);
      } else if (err.status === 403) {
        router.navigate(['/home']);
      }
      return throwError(() => err);
    })
  );
};