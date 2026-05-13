import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type FipRankingGender = 'men' | 'women';

export type FipRankingEntry = {
  id?: string;
  sortOrder: number;
  rank: number;
  playerName: string;
  countryCode?: string | null;
  points: number;
  playerImageUrl?: string | null;
};

export type FipRanking = {
  id: string;
  gender: FipRankingGender;
  title: string;
  rankingDate?: string | null;
  sourceUrl?: string | null;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
  entries: FipRankingEntry[];
};

export type FipRankingsPayload = Record<FipRankingGender, FipRanking | null>;

export type ReplaceFipRankingPayload = {
  title: string;
  rankingDate?: string | null;
  sourceUrl?: string | null;
  isPublished: boolean;
  entries: Omit<FipRankingEntry, 'id'>[];
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class FipRankingsService {
  private readonly apiUrl = `${environment.apiUrl}/fip-rankings`;

  constructor(private readonly http: HttpClient) {}

  findAdmin(): Observable<FipRankingsPayload> {
    return this.http
      .get<ApiEnvelope<FipRankingsPayload> | FipRankingsPayload>(
        `${this.apiUrl}/admin`,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  replace(
    gender: FipRankingGender,
    payload: ReplaceFipRankingPayload,
  ): Observable<FipRanking> {
    return this.http
      .put<ApiEnvelope<FipRanking> | FipRanking>(
        `${this.apiUrl}/${gender}`,
        payload,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  uploadPlayerImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('playerImage', file);

    return this.http
      .post<ApiEnvelope<{ url: string }> | { url: string }>(
        `${this.apiUrl}/player-image`,
        formData,
      )
      .pipe(map((response) => this.unwrap(response).url));
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
