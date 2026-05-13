import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, normalizeAuthResponse } from '../../models/api-response';
import { DtoNewUser } from '../../models/iuser';

/** OpenAPI `DtoNewUser` uses `additionalProperties: false` — send only declared keys, no empty strings. */
function toRegisterBody(user: DtoNewUser): Record<string, string> {
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

@Injectable({ providedIn: 'root' })
export class RegisterService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Acount/Register`;

  register(user: DtoNewUser): Observable<AuthResponse> {
    return this.http
      .post<unknown>(this.apiUrl, toRegisterBody(user))
      .pipe(map((raw) => normalizeAuthResponse(raw)));
  }
}
