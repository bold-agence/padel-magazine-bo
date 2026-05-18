import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type NewsletterSubscriber = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  acceptsEmails: boolean;
  acceptsPrintMagazine: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({ providedIn: 'root' })
export class NewsletterSubscribersService {
  private readonly baseUrl = `${environment.apiUrl}/newsletter-subscribers`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<NewsletterSubscriber[]> {
    return this.http
      .get<ApiEnvelope<NewsletterSubscriber[]> | NewsletterSubscriber[]>(
        this.baseUrl,
      )
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
