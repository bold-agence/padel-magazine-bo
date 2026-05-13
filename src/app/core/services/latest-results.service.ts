import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type LatestResultCategory = 'men' | 'women';

export type LatestResult = {
  id: string;
  tournamentName: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  resultDate: string;
  round: string;
  winners: string;
  score: string;
  losers: string;
  category: LatestResultCategory;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type LatestResultPayload = {
  tournamentName: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  resultDate: string;
  round: string;
  winners: string;
  score: string;
  losers: string;
  category?: LatestResultCategory;
  isPublished?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class LatestResultsService {
  private readonly apiUrl = `${environment.apiUrl}/latest-results`;

  constructor(private readonly http: HttpClient) {}

  findAdmin(): Observable<LatestResult[]> {
    return this.http
      .get<ApiEnvelope<LatestResult[]> | LatestResult[]>(`${this.apiUrl}/admin`)
      .pipe(map((response) => this.unwrap(response)));
  }

  create(payload: LatestResultPayload): Observable<LatestResult> {
    return this.http
      .post<ApiEnvelope<LatestResult> | LatestResult>(this.apiUrl, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  update(
    id: string,
    payload: Partial<LatestResultPayload>,
  ): Observable<LatestResult> {
    return this.http
      .patch<ApiEnvelope<LatestResult> | LatestResult>(
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
