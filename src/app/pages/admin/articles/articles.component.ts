import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import {
  Article,
  ArticlesService,
} from '../../../core/services/articles.service';

@Component({
  selector: 'app-admin-articles',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    ModalComponent,
  ],
  templateUrl: './articles.component.html',
})
export class ArticlesComponent implements OnInit {
  articles: Article[] = [];
  isLoading = false;
  isDeleteModalOpen = false;
  isDeleting = false;
  articleToDelete: Article | null = null;
  errorMessage = '';

  constructor(
    private readonly articlesService: ArticlesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.articlesService.findAll().subscribe({
      next: (articles) => {
        this.articles = articles;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les articles.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.router.navigate(['/admin/articles/create']);
  }

  openEditModal(article: Article): void {
    this.router.navigate(['/admin/articles', article.id, 'edit']);
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
      next: () => this.loadArticles(),
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
}
