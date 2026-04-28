import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  access_token: string;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenStorageKey = 'pm_admin_access_token';

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<ApiEnvelope<LoginResponse> | LoginResponse>(
        `${this.apiUrl}/auth/login`,
        payload,
      )
      .pipe(
        map((response) => this.unwrap(response)),
        tap((response) => {
          const token = response.access_token;
          if (token) {
            this.setToken(token);
          }
        }),
      );
  }

  me(): Observable<AuthUser> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http
      .get<ApiEnvelope<AuthUser> | AuthUser>(`${this.apiUrl}/auth/me`, { headers })
      .pipe(map((response) => this.unwrap(response)));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private unwrap<T>(response: ApiEnvelope<T> | T): T {
    if (
      response !== null &&
      typeof response === 'object' &&
      'data' in (response as Record<string, unknown>)
    ) {
      return (response as ApiEnvelope<T>).data;
    }
    return response as T;
  }
}
