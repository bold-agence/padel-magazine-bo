import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type EventTournamentRef = {
  id: string;
  label: string;
  colorCode: string;
  slug?: string;
};

export type EventApiItem = {
  id: string;
  title: string;
  slug: string;
  startAt: string;
  endAt?: string | null;
  venue: string;
  descriptionHtml?: string | null;
  coverImageUrl?: string | null;
  tournament?: EventTournamentRef | null;
  createdAt?: string;
  updatedAt?: string;
};

export type EventPayload = {
  title: string;
  slug: string;
  startAt: string; // ISO datetime
  endAt?: string | null;
  venue: string;
  tournamentId?: string | null;
  descriptionHtml?: string | null;
};

export type UpdateEventOptions = {
  coverImageFile?: File | null;
  removeCoverImage?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly apiUrl = `${environment.apiUrl}/events`;

  constructor(private readonly http: HttpClient) {}

  findAll(filters?: { tournamentId?: string | null }): Observable<EventApiItem[]> {
    let params = new HttpParams();
    if (filters?.tournamentId) {
      params = params.set('tournamentId', filters.tournamentId);
    }
    return this.http
      .get<ApiEnvelope<EventApiItem[]> | EventApiItem[]>(this.apiUrl, { params })
      .pipe(map((response) => this.unwrap(response)));
  }

  create(
    payload: EventPayload,
    coverImage?: File | null,
  ): Observable<EventApiItem> {
    const formData = this.buildFormData(payload);
    if (coverImage) {
      formData.append('coverImage', coverImage);
    }
    return this.http
      .post<ApiEnvelope<EventApiItem> | EventApiItem>(this.apiUrl, formData)
      .pipe(map((response) => this.unwrap(response)));
  }

  update(
    id: string,
    payload: Partial<EventPayload>,
    options?: UpdateEventOptions,
  ): Observable<EventApiItem> {
    const formData = this.buildFormData(payload);
    if (options?.coverImageFile) {
      formData.append('coverImage', options.coverImageFile);
    }
    if (options?.removeCoverImage) {
      formData.append('removeCoverImage', 'true');
    }
    return this.http
      .patch<ApiEnvelope<EventApiItem> | EventApiItem>(
        `${this.apiUrl}/${id}`,
        formData,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  private buildFormData(payload: Partial<EventPayload>): FormData {
    const formData = new FormData();

    if (payload.title !== undefined) {
      formData.append('title', payload.title);
    }
    if (payload.slug !== undefined) {
      formData.append('slug', payload.slug);
    }
    if (payload.startAt !== undefined) {
      formData.append('startAt', payload.startAt);
    }
    if (payload.endAt !== undefined) {
      if (payload.endAt === null || payload.endAt === '') {
        // Explicit empty so the API treats it as cleared.
        formData.append('endAt', '');
      } else {
        formData.append('endAt', payload.endAt);
      }
    }
    if (payload.venue !== undefined) {
      formData.append('venue', payload.venue);
    }
    if (payload.tournamentId !== undefined) {
      if (payload.tournamentId === null || payload.tournamentId === '') {
        formData.append('tournamentId', '');
      } else {
        formData.append('tournamentId', payload.tournamentId);
      }
    }
    if (payload.descriptionHtml !== undefined) {
      formData.append('descriptionHtml', payload.descriptionHtml ?? '');
    }

    return formData;
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
