import { Injectable } from '@angular/core';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private static readonly ROLE_CLAIM_KEYS = [
    'role',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  ] as const;

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  decodePayload(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  /** All role strings present on the JWT (Identity may emit one or many `role` claims). */
  getRoles(): string[] {
    const payload = this.decodePayload();
    if (!payload) return [];
    const out: string[] = [];
    for (const key of AuthTokenService.ROLE_CLAIM_KEYS) {
      const v = payload[key as string];
      if (v == null) continue;
      if (Array.isArray(v)) {
        for (const x of v) {
          if (x != null && String(x).trim()) out.push(String(x).trim());
        }
      } else if (typeof v === 'string' && v.trim()) {
        out.push(v.trim());
      }
    }
    return out;
  }

  getRole(): string | null {
    const roles = this.getRoles();
    return roles[0] ?? null;
  }

  hasRole(role: string): boolean {
    const t = role.toLowerCase();
    return this.getRoles().some((r) => r.toLowerCase() === t);
  }

  isExpired(): boolean {
    const payload = this.decodePayload();
    if (!payload?.exp) return true;
    return Date.now() / 1000 > payload.exp;
  }
}