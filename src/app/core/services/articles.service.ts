import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ArticleTag = {
  id: string;
  name: string;
};

export type ArticleCategory = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type ArticleSection = {
  id?: string;
  type: string;
  order?: number;
  content?: string;
  headingLevel?: number;
  imageUrl?: string;
  imageCaption?: string;
  quoteAuthor?: string;
  spacerHeight?: number;
  infoBoxTitle?: string;
  data?: Record<string, unknown>;
};

export type Article = {
  id: string;
  isVisible: boolean;
  title: string;
  slug: string;
  author: string;
  date: string;
  readingTime: string;
  bannerImage?: string;
  category?: ArticleCategory | null;
  tags: ArticleTag[];
  sections: ArticleSection[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateArticlePayload = {
  isVisible?: boolean;
  title: string;
  slug: string;
  author: string;
  date: string;
  readingTime: string;
  bannerImage?: string;
  categoryId?: string;
  tags?: string[];
  sections?: ArticleSection[];
};

export type UpdateArticlePayload = Partial<CreateArticlePayload>;
export type CreateTagPayload = { name: string };
export type UpdateTagPayload = Partial<CreateTagPayload>;
export type CreateCategoryPayload = {
  name: string;
  slug: string;
  color: string;
};
export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
export type PaginatedArticlesResponse = {
  items: Article[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
};

@Injectable({
  providedIn: 'root',
})
export class ArticlesService {
  private readonly apiUrl = `${environment.apiUrl}/articles`;
  private readonly tagsUrl = `${environment.apiUrl}/articles/tags`;
  private readonly categoriesUrl = `${environment.apiUrl}/articles/categories`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Article[]> {
    return this.http
      .get<ApiEnvelope<Article[]> | Article[]>(this.apiUrl)
      .pipe(map((response) => this.unwrap(response)));
  }

  findPaginated(
    page = 1,
    limit = 10,
    category = 'all',
    includeHidden = false,
    onlyHidden = false,
    q?: string,
  ): Observable<PaginatedArticlesResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      category,
      includeHidden: String(includeHidden),
      onlyHidden: String(onlyHidden),
    });
    const trimmed = q?.trim();
    if (trimmed) {
      params.set('q', trimmed);
    }
    return this.http
      .get<ApiEnvelope<PaginatedArticlesResponse> | PaginatedArticlesResponse>(
        `${this.apiUrl}/paginated?${params.toString()}`,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  findOne(id: string): Observable<Article> {
    return this.http
      .get<ApiEnvelope<Article> | Article>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  create(payload: CreateArticlePayload): Observable<Article> {
    return this.http
      .post<ApiEnvelope<Article> | Article>(this.apiUrl, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  update(id: string, payload: UpdateArticlePayload): Observable<Article> {
    return this.http
      .patch<ApiEnvelope<Article> | Article>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  uploadBannerImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('bannerImage', file);

    return this.http
      .post<ApiEnvelope<{ url: string }> | { url: string }>(
        `${this.apiUrl}/banner-image`,
        formData,
      )
      .pipe(map((response) => this.unwrap(response).url));
  }

  findAllTags(): Observable<ArticleTag[]> {
    return this.http
      .get<ApiEnvelope<ArticleTag[]> | ArticleTag[]>(this.tagsUrl)
      .pipe(map((response) => this.unwrap(response)));
  }

  createTag(payload: CreateTagPayload): Observable<ArticleTag> {
    return this.http
      .post<ApiEnvelope<ArticleTag> | ArticleTag>(this.tagsUrl, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  updateTag(id: string, payload: UpdateTagPayload): Observable<ArticleTag> {
    return this.http
      .patch<ApiEnvelope<ArticleTag> | ArticleTag>(`${this.tagsUrl}/${id}`, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  removeTag(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.tagsUrl}/${id}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  findAllCategories(): Observable<ArticleCategory[]> {
    return this.http
      .get<ApiEnvelope<ArticleCategory[]> | ArticleCategory[]>(this.categoriesUrl)
      .pipe(map((response) => this.unwrap(response)));
  }

  createCategory(payload: CreateCategoryPayload): Observable<ArticleCategory> {
    return this.http
      .post<ApiEnvelope<ArticleCategory> | ArticleCategory>(this.categoriesUrl, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  updateCategory(
    id: string,
    payload: UpdateCategoryPayload,
  ): Observable<ArticleCategory> {
    return this.http
      .patch<ApiEnvelope<ArticleCategory> | ArticleCategory>(
        `${this.categoriesUrl}/${id}`,
        payload,
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  removeCategory(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void> | void>(`${this.categoriesUrl}/${id}`)
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
