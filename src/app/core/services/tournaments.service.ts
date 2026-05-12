import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Tournament = {
  id: string;
  label: string;
  description?: string | null;
  slug: string;
  colorCode: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TournamentPayload = {
  label: string;
  description?: string | null;
  slug: string;
  colorCode: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class TournamentsService {
  private readonly apiUrl = `${environment.apiUrl}/tournaments`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Tournament[]> {
    return this.http
      .get<ApiEnvelope<Tournament[]> | Tournament[]>(this.apiUrl)
      .pipe(map((response) => this.unwrap(response)));
  }

  create(payload: TournamentPayload): Observable<Tournament> {
    return this.http
      .post<ApiEnvelope<Tournament> | Tournament>(this.apiUrl, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  update(
    id: string,
    payload: Partial<TournamentPayload>,
  ): Observable<Tournament> {
    return this.http
      .patch<ApiEnvelope<Tournament> | Tournament>(
        `${this.apiUrl}/${id}`,
        payload,
      )
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
