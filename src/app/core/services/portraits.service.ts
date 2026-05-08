import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PortraitCategory = {
  id: string;
  libelle: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Portrait = {
  id: string;
  indice: number;
  pointNumber: number;
  signature?: string | null;
  player: { id: string; name: string; slug: string };
  category: { id: string; libelle: string };
  article?: { id: string; title: string; isVisible: boolean } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PortraitCategoryPayload = { libelle: string };

export type PortraitPayload = {
  playerId: string;
  categoryId: string;
  indice: number;
  pointNumber: number;
  signature?: string | null;
  articleId?: string | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class PortraitsService {
  private readonly portraitsUrl = `${environment.apiUrl}/portraits`;
  private readonly categoriesUrl = `${environment.apiUrl}/portrait-categories`;

  constructor(private readonly http: HttpClient) {}

  // Categories
  findAllCategories(): Observable<PortraitCategory[]> {
    return this.http
      .get<ApiEnvelope<PortraitCategory[]> | PortraitCategory[]>(this.categoriesUrl)
      .pipe(map((r) => this.unwrap(r)));
  }

  createCategory(payload: PortraitCategoryPayload): Observable<PortraitCategory> {
    return this.http
      .post<ApiEnvelope<PortraitCategory> | PortraitCategory>(this.categoriesUrl, payload)
      .pipe(map((r) => this.unwrap(r)));
  }

  updateCategory(
    id: string,
    payload: Partial<PortraitCategoryPayload>,
  ): Observable<PortraitCategory> {
    return this.http
      .patch<ApiEnvelope<PortraitCategory> | PortraitCategory>(
        `${this.categoriesUrl}/${id}`,
        payload,
      )
      .pipe(map((r) => this.unwrap(r)));
  }

  removeCategory(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.categoriesUrl}/${id}`)
      .pipe(map((r) => this.unwrap(r)));
  }

  // Portraits
  findAllPortraits(): Observable<Portrait[]> {
    return this.http
      .get<ApiEnvelope<Portrait[]> | Portrait[]>(this.portraitsUrl)
      .pipe(map((r) => this.unwrap(r)));
  }

  createPortrait(payload: PortraitPayload): Observable<Portrait> {
    return this.http
      .post<ApiEnvelope<Portrait> | Portrait>(this.portraitsUrl, payload)
      .pipe(map((r) => this.unwrap(r)));
  }

  updatePortrait(id: string, payload: Partial<PortraitPayload>): Observable<Portrait> {
    return this.http
      .patch<ApiEnvelope<Portrait> | Portrait>(`${this.portraitsUrl}/${id}`, payload)
      .pipe(map((r) => this.unwrap(r)));
  }

  removePortrait(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.portraitsUrl}/${id}`)
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

