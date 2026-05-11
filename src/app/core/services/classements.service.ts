import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Aligné sur RankingRow (front) */
export type ClassementLineDto = {
  id: string;
  sortOrder: number;
  rank: number;
  playerName: string;
  pointsNow: number;
  tournaments: number;
  previousRank: number;
  pointsPrev: number;
  rankDelta: string;
  pointsDelta: string;
};

export type ClassementSummary = {
  id: string;
  slug: string;
  title: string;
  pointsNowLabel: string | null;
  pointsPrevLabel: string | null;
  lineCount: number;
  updatedAt: string;
};

export type ClassementDetail = {
  id: string;
  slug: string;
  title: string;
  pointsNowLabel: string | null;
  pointsPrevLabel: string | null;
  createdAt?: string;
  updatedAt?: string;
  lines: ClassementLineDto[];
};

export type CreateClassementPayload = {
  slug: string;
  title: string;
  pointsNowLabel?: string | null;
  pointsPrevLabel?: string | null;
};

export type UpdateClassementPayload = Partial<CreateClassementPayload>;

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class ClassementsService {
  private readonly apiUrl = `${environment.apiUrl}/classements`;

  constructor(private readonly http: HttpClient) {}

  findAllSummaries(): Observable<ClassementSummary[]> {
    return this.http
      .get<ApiEnvelope<ClassementSummary[]> | ClassementSummary[]>(this.apiUrl)
      .pipe(map((r) => this.unwrap(r)));
  }

  findOne(id: string): Observable<ClassementDetail> {
    return this.http
      .get<ApiEnvelope<ClassementDetail> | ClassementDetail>(`${this.apiUrl}/${id}`)
      .pipe(map((r) => this.unwrap(r)));
  }

  create(payload: CreateClassementPayload): Observable<ClassementDetail> {
    return this.http
      .post<ApiEnvelope<ClassementDetail> | ClassementDetail>(this.apiUrl, payload)
      .pipe(map((r) => this.unwrap(r)));
  }

  update(id: string, payload: UpdateClassementPayload): Observable<ClassementDetail> {
    return this.http
      .patch<ApiEnvelope<ClassementDetail> | ClassementDetail>(
        `${this.apiUrl}/${id}`,
        payload,
      )
      .pipe(map((r) => this.unwrap(r)));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.apiUrl}/${id}`)
      .pipe(map((r) => this.unwrap(r)));
  }

  importExcel(id: string, file: File): Observable<{ imported: number }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http
      .post<ApiEnvelope<{ imported: number }> | { imported: number }>(
        `${this.apiUrl}/${id}/import`,
        formData,
      )
      .pipe(map((r) => this.unwrap(r)));
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
