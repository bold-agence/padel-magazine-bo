import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Player = {
  id: string;
  slug: string;
  name: string;
  nationality: string;
  profilePhoto?: string;
  club?: { id: string; title: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PlayerPayload = {
  slug: string;
  name: string;
  nationality: string;
  clubId?: string | null;
};

export type UpdatePlayerOptions = {
  profilePhotoFile?: File | null;
  removeProfilePhoto?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class PlayersService {
  private readonly apiUrl = `${environment.apiUrl}/players`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Player[]> {
    return this.http
      .get<ApiEnvelope<Player[]> | Player[]>(this.apiUrl)
      .pipe(map((response) => this.unwrap(response)));
  }

  create(payload: PlayerPayload, profilePhoto?: File | null): Observable<Player> {
    const formData = new FormData();
    formData.append('slug', payload.slug);
    formData.append('name', payload.name);
    formData.append('nationality', payload.nationality);
    if (payload.clubId !== undefined && payload.clubId !== null && payload.clubId !== '') {
      formData.append('clubId', payload.clubId);
    }
    if (profilePhoto) {
      formData.append('profilePhoto', profilePhoto);
    }
    return this.http
      .post<ApiEnvelope<Player> | Player>(this.apiUrl, formData)
      .pipe(map((response) => this.unwrap(response)));
  }

  update(
    id: string,
    payload: Partial<PlayerPayload>,
    options?: UpdatePlayerOptions,
  ): Observable<Player> {
    const hasFile = !!options?.profilePhotoFile;
    const shouldRemovePhoto = !!options?.removeProfilePhoto;

    if (!hasFile && !shouldRemovePhoto) {
      return this.http
        .patch<ApiEnvelope<Player> | Player>(`${this.apiUrl}/${id}`, payload)
        .pipe(map((response) => this.unwrap(response)));
    }

    const formData = new FormData();
    if (payload.slug) {
      formData.append('slug', payload.slug);
    }
    if (payload.name) {
      formData.append('name', payload.name);
    }
    if (payload.nationality) {
      formData.append('nationality', payload.nationality);
    }
    if (payload.clubId !== undefined) {
      if (payload.clubId === null || payload.clubId === '') {
        // API expects explicit null/unset behavior; send empty string and backend treats as missing.
        // (Backend also supports JSON patch for null on the no-file path)
        formData.append('clubId', '');
      } else {
        formData.append('clubId', payload.clubId);
      }
    }
    if (hasFile && options?.profilePhotoFile) {
      formData.append('profilePhoto', options.profilePhotoFile);
    }
    if (shouldRemovePhoto) {
      formData.append('removeProfilePhoto', 'true');
    }

    return this.http
      .patch<ApiEnvelope<Player> | Player>(`${this.apiUrl}/${id}`, formData)
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
