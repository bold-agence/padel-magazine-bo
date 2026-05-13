import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type LiveChannelSettings = {
  id: string;
  channelName: string | null;
  channelUrl: string | null;
};

export type LiveEventRef = {
  id: string;
  title: string;
  slug?: string;
  startAt: string;
  venue?: string;
  coverImageUrl?: string | null;
};

export type LiveApiItem = {
  id: string;
  startTime: string;
  endTime?: string | null;
  liveUrl: string;
  replayUrl?: string | null;
  coverImageUrl?: string | null;
  event: LiveEventRef;
  createdAt?: string;
  updatedAt?: string;
};

export type LivePayload = {
  eventId: string;
  startTime: string;
  endTime?: string | null;
  liveUrl: string;
  replayUrl?: string | null;
};

export type UpdateLiveOptions = {
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
export class LivesService {
  private readonly apiBase = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // ---------- Channel settings ----------

  getChannelSettings(): Observable<LiveChannelSettings> {
    return this.http
      .get<ApiEnvelope<LiveChannelSettings> | LiveChannelSettings>(
        `${this.apiBase}/live-settings`,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  updateChannelSettings(payload: {
    channelName: string | null;
    channelUrl: string | null;
  }): Observable<LiveChannelSettings> {
    return this.http
      .patch<ApiEnvelope<LiveChannelSettings> | LiveChannelSettings>(
        `${this.apiBase}/live-settings`,
        payload,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  // ---------- Lives ----------

  findAll(filters?: { eventId?: string | null }): Observable<LiveApiItem[]> {
    let params = new HttpParams();
    if (filters?.eventId) {
      params = params.set('eventId', filters.eventId);
    }
    return this.http
      .get<ApiEnvelope<LiveApiItem[]> | LiveApiItem[]>(`${this.apiBase}/lives`, {
        params,
      })
      .pipe(map((response) => this.unwrap(response)));
  }

  create(
    payload: LivePayload,
    coverImage?: File | null,
  ): Observable<LiveApiItem> {
    const formData = this.buildFormData(payload);
    if (coverImage) {
      formData.append('coverImage', coverImage);
    }
    return this.http
      .post<ApiEnvelope<LiveApiItem> | LiveApiItem>(
        `${this.apiBase}/lives`,
        formData,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  update(
    id: string,
    payload: Partial<LivePayload>,
    options?: UpdateLiveOptions,
  ): Observable<LiveApiItem> {
    const formData = this.buildFormData(payload);
    if (options?.coverImageFile) {
      formData.append('coverImage', options.coverImageFile);
    }
    if (options?.removeCoverImage) {
      formData.append('removeCoverImage', 'true');
    }
    return this.http
      .patch<ApiEnvelope<LiveApiItem> | LiveApiItem>(
        `${this.apiBase}/lives/${id}`,
        formData,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.apiBase}/lives/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  private buildFormData(payload: Partial<LivePayload>): FormData {
    const formData = new FormData();
    if (payload.eventId !== undefined) {
      formData.append('eventId', payload.eventId);
    }
    if (payload.startTime !== undefined) {
      formData.append('startTime', payload.startTime);
    }
    if (payload.endTime !== undefined) {
      const endTime = payload.endTime?.trim();
      formData.append('endTime', endTime ? endTime : '');
    }
    if (payload.liveUrl !== undefined) {
      formData.append('liveUrl', payload.liveUrl);
    }
    if (payload.replayUrl !== undefined) {
      const replayUrl = payload.replayUrl?.trim();
      if (replayUrl) {
        formData.append('replayUrl', replayUrl);
      } else {
        formData.append('replayUrl', '');
      }
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
