import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest } from '../../models';
import { IUser } from '../../models/iuser';
import { readApiErrorMessage } from '../../utils/api-error.util';

const TOKEN_KEY = 'token';
const ROLES_KEY = 'roles';
const FIRST_NAME_KEY = 'firstName';
const LAST_NAME_KEY = 'lastName';
const LEGACY_TOKEN_KEY = 'auth_token';
const CURRENT_USER_KEY = 'currentUser';

const CLAIMS_BASE = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/';
const ROLE_CLAIM_KEYS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
] as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = `${environment.apiUrl}/Acount`;

  private currentUserSubject = new BehaviorSubject<IUser | null>(this.loadUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<unknown>(`${this.apiUrl}/Login`, req).pipe(
      map((raw) => this.normalizeLoginResponse(raw))
    );
  }

  register(req: RegisterRequest): Observable<string> {
    const body = this.toRegisterBody(req);
    return this.http
      .post(`${this.apiUrl}/Register`, body, { responseType: 'text' as const })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err && typeof err.error === 'string') {
            return throwError(() => err);
          }
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
  }

  getRoles(): string[] {
    try {
      const raw = localStorage.getItem(ROLES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch {
      /* fall through to JWT */
    }
    return this.decodeRolesFromToken();
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getRoles().some((r) => r.toLowerCase() === 'admin');
  }

  isSeller(): boolean {
    return this.getRoles().some((r) => r.toLowerCase() === 'seller');
  }

  saveSession(res: LoginResponse): void {
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(LEGACY_TOKEN_KEY, res.token);
    }
    if (res.firstName != null) localStorage.setItem(FIRST_NAME_KEY, res.firstName);
    if (res.lastName != null) localStorage.setItem(LAST_NAME_KEY, res.lastName);
    if (res.roles) localStorage.setItem(ROLES_KEY, JSON.stringify(res.roles));
    const user = this.buildUserFromSession(res);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: IUser): void {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  static registerErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0)
        return 'Cannot reach the server. Confirm the API is running and try again.';
      if (err.status === 409) return 'This email is already registered. Please login instead.';
      const fromBody = readApiErrorMessage(err);
      if (fromBody) return fromBody;
    }
    return 'Registration failed. Please try again.';
  }

  private buildUserFromSession(res: LoginResponse): IUser {
    const fromToken = this.decodeUserFromToken();
    const roles = res.roles ?? this.decodeRolesFromToken();
    const primaryRole = roles[0] ?? fromToken?.role ?? 'Customer';
    return {
      id: fromToken?.id ?? null,
      firstName: res.firstName?.trim() || fromToken?.firstName || '',
      lastName: res.lastName?.trim() || fromToken?.lastName || '',
      email: fromToken?.email ?? '',
      password: '',
      role: primaryRole,
    };
  }

  private loadUserFromStorage(): IUser | null {
    const fromToken = this.getToken() ? this.decodeUserFromToken() : null;
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    let fromStorage: IUser | null = null;
    if (raw) {
      try {
        fromStorage = JSON.parse(raw) as IUser;
      } catch {
        /* ignore */
      }
    }
    if (!fromToken && !fromStorage) return null;
    // Merge token (always fresh from JWT) with storage extras (phone/address/payment
    // saved locally by the profile edit flow). Storage wins only if it has a non-empty value,
    // so a stale storage record with empty email is overwritten by the live JWT claim.
    const merged: IUser = { ...(fromToken ?? ({} as IUser)), ...(fromStorage ?? {}) };
    if (fromToken) {
      merged.id = fromStorage?.id ?? fromToken.id;
      merged.firstName = fromStorage?.firstName || fromToken.firstName || '';
      merged.lastName = fromStorage?.lastName || fromToken.lastName || '';
      merged.email = fromStorage?.email || fromToken.email || '';
      merged.role = fromStorage?.role || fromToken.role || 'Customer';
    }
    return merged;
  }

  private toRegisterBody(user: RegisterRequest): Record<string, string> {
    const body: Record<string, string> = {
      firstName: (user.firstName ?? '').trim(),
      lastName: (user.lastName ?? '').trim(),
      password: user.password ?? '',
    };
    const email = (user.email ?? '').trim();
    if (email) body['email'] = email;
    const role = (user.role ?? '').trim();
    if (role) body['role'] = role;
    const phoneNumber = (user.phoneNumber ?? '').trim();
    if (phoneNumber) body['phoneNumber'] = phoneNumber;
    const address = (user.address ?? '').trim();
    if (address) body['address'] = address;
    const city = (user.city ?? '').trim();
    if (city) body['city'] = city;
    return body;
  }

  private normalizeLoginResponse(raw: unknown): LoginResponse {
    const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const token = String(
      o['token'] ?? o['Token'] ?? o['access_token'] ?? o['accessToken'] ?? ''
    );
    const expiration = String(o['expiration'] ?? o['Expiration'] ?? '');
    const firstName = String(o['firstName'] ?? o['FirstName'] ?? '');
    const lastName = String(o['lastName'] ?? o['LastName'] ?? '');
    const rolesRaw = o['roles'] ?? o['Roles'] ?? o['role'] ?? o['Role'];
    let roles: string[] = [];
    if (Array.isArray(rolesRaw)) {
      roles = rolesRaw.map((r) => String(r));
    } else if (typeof rolesRaw === 'string' && rolesRaw.trim()) {
      roles = [rolesRaw.trim()];
    }
    return { token, expiration, firstName, lastName, roles };
  }

  private decodePayload(): Record<string, unknown> | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private decodeRolesFromToken(): string[] {
    const payload = this.decodePayload();
    if (!payload) return [];
    const out: string[] = [];
    for (const key of ROLE_CLAIM_KEYS) {
      const v = payload[key];
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

  private decodeUserFromToken(): IUser | null {
    const payload = this.decodePayload();
    if (!payload) return null;
    const id =
      payload['nameid'] ??
      payload['sub'] ??
      payload[CLAIMS_BASE + 'nameidentifier'] ??
      null;
    const firstName =
      payload['given_name'] ?? payload[CLAIMS_BASE + 'givenname'] ?? '';
    const lastName =
      payload['family_name'] ??
      payload[CLAIMS_BASE + 'surname'] ??
      payload[CLAIMS_BASE + 'familyname'] ??
      '';
    const email =
      payload['email'] ??
      payload[CLAIMS_BASE + 'emailaddress'] ??
      payload['unique_name'] ??
      payload[CLAIMS_BASE + 'name'] ??
      payload['preferred_username'] ??
      payload['upn'] ??
      '';
    const roles = this.decodeRolesFromToken();
    return {
      id,
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email),
      password: '',
      role: roles[0] ?? 'Customer',
    };
  }

  isExpired(): boolean {
    const payload = this.decodePayload();
    if (!payload?.['exp']) return true;
    const exp = Number(payload['exp']);
    return Date.now() / 1000 > exp;
  }
}
