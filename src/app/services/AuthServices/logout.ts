import { Injectable, inject } from '@angular/core';
import { AuthTokenService } from './auth-token.service';

@Injectable({ providedIn: 'root' })
export class LogoutService {
  private tokenService = inject(AuthTokenService);

  logout(): void {
    this.tokenService.clearToken();
    localStorage.removeItem('currentUser');
  }
}