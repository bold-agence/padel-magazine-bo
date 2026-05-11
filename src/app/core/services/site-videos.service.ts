import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { VideoType } from './video-types.service';

export type SiteVideo = {
  id: string;
  title: string;
  youtubeLink: string;
  videoType: VideoType;
  createdAt?: string;
  updatedAt?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

export type SiteVideoPayload = {
  title: string;
  youtubeLink: string;
  videoTypeId: string;
};

@Injectable({
  providedIn: 'root',
})
export class SiteVideosService {
  private readonly apiUrl = `${environment.apiUrl}/videos`;

  constructor(private readonly http: HttpClient) {}

  findAll(videoTypeId?: string): Observable<SiteVideo[]> {
    const q = videoTypeId?.trim()
      ? `?videoTypeId=${encodeURIComponent(videoTypeId.trim())}`
      : '';
    return this.http
      .get<ApiEnvelope<SiteVideo[]> | SiteVideo[]>(`${this.apiUrl}${q}`)
      .pipe(map((r) => this.unwrap(r)));
  }

  create(payload: SiteVideoPayload): Observable<SiteVideo> {
    return this.http
      .post<ApiEnvelope<SiteVideo> | SiteVideo>(this.apiUrl, payload)
      .pipe(map((r) => this.unwrap(r)));
  }

  update(id: string, payload: Partial<SiteVideoPayload>): Observable<SiteVideo> {
    return this.http
      .patch<ApiEnvelope<SiteVideo> | SiteVideo>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((r) => this.unwrap(r)));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.apiUrl}/${id}`)
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
