import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

function isAnonymousAuthUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes('/api/acount/login') ||
    u.includes('/api/acount/register') ||
    u.includes('/api/acount/confirmemail')
  );
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAnonymousAuthUrl(req.url)) {
        auth.logout();
        router.navigate(['/login']);
      } else if (err.status === 403) {
        router.navigate(['/home']);
      } else if (err.status === 404) {
        console.error('Resource not found');
      } else if (err.status === 500) {
        console.error('Server error');
      }
      return throwError(() => err);
    })
  );
};
