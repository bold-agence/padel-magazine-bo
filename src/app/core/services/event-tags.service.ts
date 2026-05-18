import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type EventTag = {
  id: string;
  name: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class EventTagsService {
  private readonly apiUrl = `${environment.apiUrl}/events/tags`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<EventTag[]> {
    return this.http
      .get<ApiEnvelope<EventTag[]> | EventTag[]>(this.apiUrl)
      .pipe(map((response) => this.unwrap(response)));
  }

  create(payload: { name: string }): Observable<EventTag> {
    return this.http
      .post<ApiEnvelope<EventTag> | EventTag>(this.apiUrl, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  update(id: string, payload: { name: string }): Observable<EventTag> {
    return this.http
      .patch<ApiEnvelope<EventTag> | EventTag>(`${this.apiUrl}/${id}`, payload)
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
