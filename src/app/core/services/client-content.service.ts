import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type BreakingNewsItem = {
  id: string;
  title: string;
  linkUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
};

export type AdSlot =
  | 'header_main'
  | 'home_leaderboard'
  | 'sidebar_top'
  | 'sidebar_bottom';

export type AdImageItem = {
  id: string;
  title: string;
  slot: AdSlot;
  imageUrl: string;
  targetUrl?: string | null;
  isActive: boolean;
};

export type CreateBreakingNewsPayload = {
  title: string;
  linkUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
};

export type CreateAdImagePayload = {
  title: string;
  slot: AdSlot;
  imageUrl: string;
  targetUrl?: string;
  isActive?: boolean;
};

export type UpdateBreakingNewsPayload = Partial<CreateBreakingNewsPayload>;
export type UpdateAdImagePayload = Partial<CreateAdImagePayload>;

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class ClientContentService {
  private readonly apiUrl = `${environment.apiUrl}/client-content`;

  constructor(private readonly http: HttpClient) {}

  uploadAdImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http
      .post<ApiEnvelope<{ url: string }> | { url: string }>(
        `${this.apiUrl}/ad-images/upload`,
        formData,
      )
      .pipe(map((response) => this.unwrap(response).url));
  }

  findAllBreakingNews(activeOnly = false): Observable<BreakingNewsItem[]> {
    return this.http
      .get<ApiEnvelope<BreakingNewsItem[]> | BreakingNewsItem[]>(
        `${this.apiUrl}/breaking-news?activeOnly=${activeOnly}`,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  createBreakingNews(payload: CreateBreakingNewsPayload): Observable<BreakingNewsItem> {
    return this.http
      .post<ApiEnvelope<BreakingNewsItem> | BreakingNewsItem>(
        `${this.apiUrl}/breaking-news`,
        payload,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  updateBreakingNews(
    id: string,
    payload: UpdateBreakingNewsPayload,
  ): Observable<BreakingNewsItem> {
    return this.http
      .patch<ApiEnvelope<BreakingNewsItem> | BreakingNewsItem>(
        `${this.apiUrl}/breaking-news/${id}`,
        payload,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  removeBreakingNews(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.apiUrl}/breaking-news/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  findAllAdImages(
    slot?: AdSlot,
    activeOnly = false,
  ): Observable<AdImageItem[]> {
    const params = new URLSearchParams();
    if (slot) {
      params.set('slot', slot);
    }
    params.set('activeOnly', String(activeOnly));
    return this.http
      .get<ApiEnvelope<AdImageItem[]> | AdImageItem[]>(
        `${this.apiUrl}/ad-images?${params.toString()}`,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  createAdImage(payload: CreateAdImagePayload): Observable<AdImageItem> {
    return this.http
      .post<ApiEnvelope<AdImageItem> | AdImageItem>(`${this.apiUrl}/ad-images`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  updateAdImage(id: string, payload: UpdateAdImagePayload): Observable<AdImageItem> {
    return this.http
      .patch<ApiEnvelope<AdImageItem> | AdImageItem>(`${this.apiUrl}/ad-images/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  removeAdImage(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.apiUrl}/ad-images/${id}`)
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
