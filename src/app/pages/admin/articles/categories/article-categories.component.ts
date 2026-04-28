import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import {
  ArticleCategory,
  ArticlesService,
} from '../../../../core/services/articles.service';

type CategoryForm = {
  name: string;
  slug: string;
  color: string;
};

@Component({
  selector: 'app-article-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './article-categories.component.html',
})
export class ArticleCategoriesComponent implements OnInit {
  categories: ArticleCategory[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  editingCategoryId: string | null = null;

  form: CategoryForm = {
    name: '',
    slug: '',
    color: '#2563eb',
  };

  constructor(private readonly articlesService: ArticlesService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.articlesService.findAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les categories.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingCategoryId = null;
    this.form = { name: '', slug: '', color: '#2563eb' };
    this.errorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(category: ArticleCategory): void {
    this.modalMode = 'edit';
    this.editingCategoryId = category.id;
    this.form = {
      name: category.name,
      slug: category.slug,
      color: category.color,
    };
    this.errorMessage = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.isModalOpen = false;
  }

  submitModal(): void {
    if (this.isSaving) {
      return;
    }

    const payload = {
      name: this.form.name.trim(),
      slug: this.form.slug.trim(),
      color: this.form.color.trim(),
    };

    if (!payload.name || !payload.slug || !payload.color) {
      this.errorMessage = 'Nom, slug et couleur sont obligatoires.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.modalMode === 'create') {
      this.articlesService.createCategory(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.successMessage = `Categorie "${payload.name}" creee.`;
          this.loadCategories();
        },
        error: () => {
          this.isSaving = false;
          this.errorMessage = 'Impossible de creer la categorie.';
        },
      });
      return;
    }

    if (!this.editingCategoryId) {
      this.isSaving = false;
      this.errorMessage = 'Categorie introuvable.';
      return;
    }

    this.articlesService.updateCategory(this.editingCategoryId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isModalOpen = false;
        this.successMessage = `Categorie "${payload.name}" modifiee.`;
        this.loadCategories();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Impossible de modifier la categorie.';
      },
    });
  }

  deleteCategory(category: ArticleCategory): void {
    if (this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.articlesService.removeCategory(category.id).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = `Categorie "${category.name}" supprimee.`;
        this.loadCategories();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Impossible de supprimer cette categorie.';
      },
    });
  }

  onNameChange(value: string | number): void {
    const name = String(value ?? '');
    this.form.name = name;
    this.form.slug = this.toSlug(name);
  }

  private toSlug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
