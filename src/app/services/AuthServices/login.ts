import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, normalizeAuthResponse } from '../../models/api-response';
import { DtoLogin } from '../../models/iuser';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Acount/Login`;

  login(email: string, password: string): Observable<AuthResponse> {
    const body: DtoLogin = { email, password };
    return this.http
      .post<unknown>(this.apiUrl, body)
      .pipe(map((raw) => normalizeAuthResponse(raw)));
  }
}