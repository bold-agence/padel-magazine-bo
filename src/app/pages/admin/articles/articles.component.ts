import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import {
  Article,
  ArticlesService,
  PaginatedArticlesResponse,
} from '../../../core/services/articles.service';

@Component({
  selector: 'app-admin-articles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ModalComponent,
  ],
  templateUrl: './articles.component.html',
})
export class ArticlesComponent implements OnInit {
  private readonly pageSize = 10;
  articles: Article[] = [];
  isLoading = false;
  isDeleteModalOpen = false;
  isDeleting = false;
  articleToDelete: Article | null = null;
  errorMessage = '';
  currentPage = 1;
  totalPages = 1;
  hasPreviousPage = false;
  hasNextPage = false;
  pageNumbers: number[] = [1];

  /** Texte de recherche affiché (synchronisé avec l’URL `q` après navigation). */
  searchDraft = '';
  /** Dernière recherche appliquée (issue de l’URL), pour les libellés vides / retour éditeur. */
  activeSearch = '';

  constructor(
    private readonly articlesService: ArticlesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const rawPage = Number(params.get('page') ?? '1');
      const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
      const q = (params.get('q') ?? '').trim();
      this.activeSearch = q;
      this.searchDraft = q;
      this.loadArticles(page, q);
    });
  }

  loadArticles(page = 1, q = ''): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.articlesService.findPaginated(page, this.pageSize, 'all', true, false, q || undefined).subscribe({
      next: (response: PaginatedArticlesResponse) => {
        this.articles = response.items;
        this.currentPage = response.pagination.page;
        this.totalPages = response.pagination.totalPages;
        this.hasPreviousPage = response.pagination.hasPreviousPage;
        this.hasNextPage = response.pagination.hasNextPage;
        this.pageNumbers = this.buildPageNumbers(
          response.pagination.page,
          response.pagination.totalPages,
        );
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les articles.';
        this.currentPage = 1;
        this.totalPages = 1;
        this.hasPreviousPage = false;
        this.hasNextPage = false;
        this.pageNumbers = [1];
        this.isLoading = false;
      },
    });
  }

  goToPage(page: number): void {
    if (this.isLoading || page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    const q = this.route.snapshot.queryParamMap.get('q')?.trim() ?? '';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page,
        q: q || null,
      },
    });
  }

  applySearch(): void {
    const q = String(this.searchDraft ?? '').trim();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        q: q || null,
      },
    });
  }

  clearSearch(): void {
    this.searchDraft = '';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1, q: null },
    });
  }

  openCreateModal(): void {
    this.router.navigate(['/admin/articles/create'], {
      queryParams: {
        returnPage: this.currentPage,
        ...(this.activeSearch ? { returnQ: this.activeSearch } : {}),
      },
    });
  }

  openEditModal(article: Article): void {
    this.router.navigate(['/admin/articles', article.id, 'edit'], {
      queryParams: {
        returnPage: this.currentPage,
        ...(this.activeSearch ? { returnQ: this.activeSearch } : {}),
      },
    });
  }

  openDeleteModal(article: Article): void {
    this.articleToDelete = article;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) {
      return;
    }
    this.isDeleteModalOpen = false;
    this.articleToDelete = null;
  }

  confirmDeleteArticle(): void {
    if (!this.articleToDelete || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.articlesService.remove(this.articleToDelete.id).subscribe({
      next: () => {
        const q = this.route.snapshot.queryParamMap.get('q')?.trim() ?? '';
        this.loadArticles(this.currentPage, q);
      },
      error: () => {
        this.errorMessage = 'Suppression impossible pour le moment.';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.articleToDelete = null;
      },
    });
  }

  getTagsPreview(article: Article): string {
    if (!article.tags?.length) {
      return '-';
    }
    return article.tags.map((tag) => tag.name).join(', ');
  }

  private buildPageNumbers(currentPage: number, totalPages: number): number[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);
    return Array.from(
      { length: end - normalizedStart + 1 },
      (_, index) => normalizedStart + index,
    );
  }
}
