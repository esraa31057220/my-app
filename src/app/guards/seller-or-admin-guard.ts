import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/AuthServices/auth-service';

/** Allows Admin or Seller (e.g. analytics). */
export const SellerOrAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin() || auth.isSeller()) return true;
  router.navigate(['/home']);
  return false;
};
