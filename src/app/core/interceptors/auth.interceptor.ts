import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

function isAnonymousAuthUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes('/api/acount/login') || u.includes('/api/acount/register');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isAnonymousAuthUrl(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.getToken();

  if (!token) return next(req);

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(cloned);
};
