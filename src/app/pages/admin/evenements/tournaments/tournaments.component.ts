import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import {
  Tournament,
  TournamentsService,
} from '../../../../core/services/tournaments.service';
import {
  TournamentCategoriesService,
  TournamentCategoryApiItem,
} from '../../../../core/services/tournament-categories.service';

type TournamentForm = {
  label: string;
  description: string;
  slug: string;
  colorCode: string;
};

type TournamentCategory = {
  id: string;
  tournamentId: string;
  label: string;
  slug: string;
  description: string | null;
  tournamentLabel: string;
  tournamentColor: string;
};

type TournamentCategoryForm = {
  tournamentId: string;
  label: string;
  slug: string;
  description: string;
};

@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './tournaments.component.html',
})
export class TournamentsComponent implements OnInit {
  tournaments: Tournament[] = [];
  isLoading = false;
  errorMessage = '';
  modalErrorMessage = '';
  isModalOpen = false;
  isSaving = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;

  isDeleteModalOpen = false;
  isDeleting = false;
  tournamentToDelete: Tournament | null = null;

  form: TournamentForm = {
    label: '',
    description: '',
    slug: '',
    colorCode: '#2563eb',
  };

  categories: TournamentCategory[] = [];
  isLoadingCategories = false;
  categoryErrorMessage = '';
  categoryModalErrorMessage = '';
  isCategoryModalOpen = false;
  isCategorySaving = false;
  categoryModalMode: 'create' | 'edit' = 'create';
  categoryEditingId: string | null = null;
  isCategoryDeleteModalOpen = false;
  isCategoryDeleting = false;
  categoryToDelete: TournamentCategory | null = null;
  categoryForm: TournamentCategoryForm = {
    tournamentId: '',
    label: '',
    slug: '',
    description: '',
  };

  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly tournamentCategoriesService: TournamentCategoriesService,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.tournamentsService.findAll().subscribe({
      next: (tournaments) => {
        this.tournaments = tournaments;
        this.loadCategories();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les tournois.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.form = {
      label: '',
      description: '',
      slug: '',
      colorCode: '#2563eb',
    };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(tournament: Tournament): void {
    this.modalMode = 'edit';
    this.editingId = tournament.id;
    this.form = {
      label: tournament.label,
      description: tournament.description ?? '',
      slug: tournament.slug,
      colorCode: tournament.colorCode,
    };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.isModalOpen = false;
  }

  submitModal(): void {
    if (this.isSaving) return;

    const payload = {
      label: this.form.label.trim(),
      description: this.form.description.trim() || null,
      slug: this.form.slug.trim(),
      colorCode: this.form.colorCode,
    };

    if (!payload.label) {
      this.modalErrorMessage = 'Le libellé est obligatoire.';
      return;
    }
    if (!payload.slug) {
      this.modalErrorMessage = 'Le slug est obligatoire.';
      return;
    }
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(payload.colorCode)) {
      this.modalErrorMessage = 'Code couleur invalide (format hexadécimal attendu).';
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    if (this.modalMode === 'create') {
      this.tournamentsService.create(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.load();
        },
        error: (e: HttpErrorResponse) => {
          this.isSaving = false;
          this.modalErrorMessage = this.parseApiError(e);
        },
      });
      return;
    }

    if (!this.editingId) {
      this.isSaving = false;
      this.modalErrorMessage = 'Tournois introuvable.';
      return;
    }

    this.tournamentsService.update(this.editingId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isModalOpen = false;
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.isSaving = false;
        this.modalErrorMessage = this.parseApiError(e);
      },
    });
  }

  openDeleteModal(tournament: Tournament): void {
    this.tournamentToDelete = tournament;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.tournamentToDelete = null;
  }

  confirmDelete(): void {
    if (!this.tournamentToDelete || this.isDeleting) return;
    this.isDeleting = true;
    this.tournamentsService.remove(this.tournamentToDelete.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.errorMessage = 'Suppression impossible pour le moment.';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.tournamentToDelete = null;
      },
    });
  }

  onLabelChange(value: string | number): void {
    const label = String(value ?? '');
    this.form.label = label;
    this.form.slug = this.toSlug(label);
  }

  openCategoryCreateModal(): void {
    this.categoryModalMode = 'create';
    this.categoryEditingId = null;
    this.categoryForm = {
      tournamentId: this.tournaments[0]?.id ?? '',
      label: '',
      slug: '',
      description: '',
    };
    this.categoryModalErrorMessage = '';
    this.isCategoryModalOpen = true;
  }

  openCategoryEditModal(category: TournamentCategory): void {
    this.categoryModalMode = 'edit';
    this.categoryEditingId = category.id;
    this.categoryForm = {
      tournamentId: category.tournamentId,
      label: category.label,
      slug: category.slug,
      description: category.description ?? '',
    };
    this.categoryModalErrorMessage = '';
    this.isCategoryModalOpen = true;
  }

  closeCategoryModal(): void {
    if (this.isCategorySaving) return;
    this.isCategoryModalOpen = false;
  }

  submitCategoryModal(): void {
    if (this.isCategorySaving) return;

    const tournamentId = this.categoryForm.tournamentId.trim();
    const label = this.categoryForm.label.trim();
    const slug = this.categoryForm.slug.trim();
    const description = this.categoryForm.description.trim();

    if (!tournamentId) {
      this.categoryModalErrorMessage = 'Le tournoi est obligatoire.';
      return;
    }
    if (!this.tournaments.some((t) => t.id === tournamentId)) {
      this.categoryModalErrorMessage = 'Tournoi invalide ou introuvable.';
      return;
    }
    if (!label) {
      this.categoryModalErrorMessage = 'Le libellé est obligatoire.';
      return;
    }
    if (!slug) {
      this.categoryModalErrorMessage = 'Le slug est obligatoire.';
      return;
    }

    this.isCategorySaving = true;
    this.categoryModalErrorMessage = '';

    const payload = {
      tournamentId,
      label,
      slug,
      description: description || null,
    };

    if (this.categoryModalMode === 'create') {
      this.tournamentCategoriesService.create(payload).subscribe({
        next: () => {
          this.isCategorySaving = false;
          this.isCategoryModalOpen = false;
          this.loadCategories();
        },
        error: (err: HttpErrorResponse) => {
          this.categoryModalErrorMessage = this.parseApiError(err);
          this.isCategorySaving = false;
        },
      });
      return;
    }

    if (!this.categoryEditingId) {
      this.isCategorySaving = false;
      this.categoryModalErrorMessage = 'Catégorie introuvable.';
      return;
    }

    this.tournamentCategoriesService
      .update(this.categoryEditingId, payload)
      .subscribe({
        next: () => {
          this.isCategorySaving = false;
          this.isCategoryModalOpen = false;
          this.loadCategories();
        },
        error: (err: HttpErrorResponse) => {
          this.categoryModalErrorMessage = this.parseApiError(err);
          this.isCategorySaving = false;
        },
      });
  }

  onCategoryLabelChange(value: string | number): void {
    const label = String(value ?? '');
    this.categoryForm.label = label;
    this.categoryForm.slug = this.toSlug(label);
  }

  openCategoryDeleteModal(category: TournamentCategory): void {
    this.categoryToDelete = category;
    this.isCategoryDeleteModalOpen = true;
  }

  closeCategoryDeleteModal(): void {
    if (this.isCategoryDeleting) return;
    this.isCategoryDeleteModalOpen = false;
    this.categoryToDelete = null;
  }

  confirmCategoryDelete(): void {
    if (!this.categoryToDelete || this.isCategoryDeleting) return;
    this.isCategoryDeleting = true;
    this.tournamentCategoriesService.remove(this.categoryToDelete.id).subscribe({
      next: () => {
        this.isCategoryDeleting = false;
        this.isCategoryDeleteModalOpen = false;
        this.categoryToDelete = null;
        this.loadCategories();
      },
      error: (err: HttpErrorResponse) => {
        this.categoryErrorMessage = this.parseApiError(
          err,
          'Suppression de la catégorie impossible.',
        );
        this.isCategoryDeleting = false;
      },
    });
  }

  private loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryErrorMessage = '';
    this.tournamentCategoriesService.findAll().subscribe({
      next: (list) => {
        this.categories = list.map((item) => this.mapCategoryApi(item));
        this.isLoadingCategories = false;
      },
      error: (err: HttpErrorResponse) => {
        this.categoryErrorMessage = this.parseApiError(
          err,
          'Impossible de charger les catégories.',
        );
        this.categories = [];
        this.isLoadingCategories = false;
      },
    });
  }

  private mapCategoryApi(item: TournamentCategoryApiItem): TournamentCategory {
    return {
      id: item.id,
      tournamentId: item.tournament.id,
      label: item.label,
      slug: item.slug,
      description: item.description ?? null,
      tournamentLabel: item.tournament.label,
      tournamentColor: item.tournament.colorCode,
    };
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

  private parseApiError(err: HttpErrorResponse, fallback?: string): string {
    const apiMessage = err?.error?.message;
    if (Array.isArray(apiMessage)) {
      return apiMessage.join(' · ');
    }
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }
    return fallback ?? 'Une erreur est survenue.';
  }
}
