import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type VideoType = {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class VideoTypesService {
  private readonly apiUrl = `${environment.apiUrl}/video-types`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<VideoType[]> {
    return this.http
      .get<ApiEnvelope<VideoType[]> | VideoType[]>(this.apiUrl)
      .pipe(map((r) => this.unwrap(r)));
  }

  create(payload: { title: string }): Observable<VideoType> {
    return this.http
      .post<ApiEnvelope<VideoType> | VideoType>(this.apiUrl, payload)
      .pipe(map((r) => this.unwrap(r)));
  }

  update(id: string, payload: { title?: string }): Observable<VideoType> {
    return this.http
      .patch<ApiEnvelope<VideoType> | VideoType>(`${this.apiUrl}/${id}`, payload)
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
