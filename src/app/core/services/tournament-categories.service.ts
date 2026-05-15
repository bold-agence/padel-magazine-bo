import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TournamentCategoryApiItem = {
  id: string;
  label: string;
  slug: string;
  description?: string | null;
  tournament: {
    id: string;
    label: string;
    slug: string;
    colorCode: string;
  };
};

export type TournamentCategoryPayload = {
  tournamentId: string;
  label: string;
  slug: string;
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
export class TournamentCategoriesService {
  private readonly apiUrl = `${environment.apiUrl}/tournament-categories`;

  constructor(private readonly http: HttpClient) {}

  findAll(filters?: {
    tournamentId?: string | null;
  }): Observable<TournamentCategoryApiItem[]> {
    let params = new HttpParams();
    if (filters?.tournamentId) {
      params = params.set('tournamentId', filters.tournamentId);
    }
    return this.http
      .get<
        ApiEnvelope<TournamentCategoryApiItem[]> | TournamentCategoryApiItem[]
      >(this.apiUrl, { params })
      .pipe(map((response) => this.unwrap(response)));
  }

  create(
    payload: TournamentCategoryPayload,
  ): Observable<TournamentCategoryApiItem> {
    return this.http
      .post<
        ApiEnvelope<TournamentCategoryApiItem> | TournamentCategoryApiItem
      >(this.apiUrl, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  update(
    id: string,
    payload: Partial<TournamentCategoryPayload>,
  ): Observable<TournamentCategoryApiItem> {
    return this.http
      .patch<
        ApiEnvelope<TournamentCategoryApiItem> | TournamentCategoryApiItem
      >(`${this.apiUrl}/${id}`, payload)
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
