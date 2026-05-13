import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IUser, DtoNewUser, UpdateSellerProfileDto } from '../../models/iuser';

const LS_ADMIN_EDITS = 'admin_user_edits_v1';

function pick<T>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v as T;
  }
  return undefined;
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function normalizeUser(raw: unknown): IUser {
  const o = asRecord(raw);
  return {
    id: pick(o, ['id', 'Id', 'userId', 'UserId']),
    firstName: String(pick(o, ['firstName', 'FirstName', 'givenName', 'GivenName']) ?? ''),
    lastName: String(pick(o, ['lastName', 'LastName', 'familyName', 'FamilyName', 'surname']) ?? ''),
    email: String(pick(o, ['email', 'Email', 'userName', 'UserName']) ?? ''),
    password: '',
    role: String(pick(o, ['role', 'Role']) ?? 'Customer'),
    phoneNumber: pick(o, ['phoneNumber', 'PhoneNumber', 'phone', 'Phone']),
    address: pick(o, ['address', 'Address']),
    city: pick(o, ['city', 'City']),
    isActive: pick(o, ['isActive', 'IsActive']),
    isRestricted: pick(o, ['isRestricted', 'IsRestricted']),
  };
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/Admin`;
  private sellerUrl = `${environment.apiUrl}/Seller`;
  private registerUrl = `${environment.apiUrl}/Acount/Register`;

  private readEdits(): Record<string, Partial<IUser>> {
    try {
      const raw = localStorage.getItem(LS_ADMIN_EDITS);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, Partial<IUser>>;
    } catch {
      return {};
    }
  }

  private writeEdits(m: Record<string, Partial<IUser>>): void {
    localStorage.setItem(LS_ADMIN_EDITS, JSON.stringify(m));
  }

  getUsers(): Observable<IUser[]> {
    const edits = this.readEdits();
    return this.http.get<unknown[]>(`${this.adminUrl}/AllUsers`).pipe(
      map((rows) =>
        (Array.isArray(rows) ? rows : []).map((row) => {
          const u = normalizeUser(row);
          const patch = u.id != null ? edits[String(u.id)] : undefined;
          return patch ? { ...u, ...patch } : u;
        })
      )
    );
  }

  updateSellerProfile(dto: UpdateSellerProfileDto): Observable<unknown> {
    return this.http.put(`${this.sellerUrl}/UpdateProfile`, dto);
  }

  /** Swagger: `PUT /api/Seller/UpdateProfile` — seller self-service only. */
  updateUser(user: IUser): Observable<IUser> {
    const dto: UpdateSellerProfileDto = {
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address,
      phoneNumber: user.phoneNumber,
    };
    return this.http.put<unknown>(`${this.sellerUrl}/UpdateProfile`, dto).pipe(
      map(() => ({ ...user, password: user.password ?? '' }))
    );
  }

  /** Admin-only overlay (no OpenAPI endpoint for arbitrary user updates). */
  saveAdminUserEdits(user: IUser): Observable<IUser> {
    if (user.id == null) return of(user);
    const m = this.readEdits();
    m[String(user.id)] = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };
    this.writeEdits(m);
    return of({ ...user });
  }

  /** Swagger: `POST /api/Acount/Register`. */
  addUser(user: IUser): Observable<IUser> {
    const body: DtoNewUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      password: user.password || 'ChangeMe!1',
      email: user.email || undefined,
      role: user.role || 'Customer',
      address: user.address,
      phoneNumber: user.phoneNumber,
      city: user.city,
    };
    return this.http.post<unknown>(this.registerUrl, body).pipe(
      map(() => user)
    );
  }

  /** No delete-user path in OpenAPI — client completes without remote call. */
  deleteUser(_id: unknown): Observable<void> {
    return of(undefined);
  }
}
