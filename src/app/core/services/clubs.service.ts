import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Club = {
  id: string;
  title: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ClubPayload = {
  title: string;
  description?: string | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class ClubsService {
  private readonly apiUrl = `${environment.apiUrl}/clubs`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Club[]> {
    return this.http
      .get<ApiEnvelope<Club[]> | Club[]>(this.apiUrl)
      .pipe(map((response) => this.unwrap(response)));
  }

  create(payload: ClubPayload): Observable<Club> {
    return this.http
      .post<ApiEnvelope<Club> | Club>(this.apiUrl, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  update(id: string, payload: Partial<ClubPayload>): Observable<Club> {
    return this.http
      .patch<ApiEnvelope<Club> | Club>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.unwrap(response)));
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

