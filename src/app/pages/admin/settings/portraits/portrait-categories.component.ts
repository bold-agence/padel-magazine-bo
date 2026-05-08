import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import {
  PortraitCategory,
  PortraitsService,
} from '../../../../core/services/portraits.service';

type CategoryForm = { libelle: string };

@Component({
  selector: 'app-portrait-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './portrait-categories.component.html',
})
export class PortraitCategoriesComponent implements OnInit {
  categories: PortraitCategory[] = [];
  isLoading = false;
  errorMessage = '';
  modalErrorMessage = '';
  isModalOpen = false;
  isSaving = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;

  isDeleteModalOpen = false;
  isDeleting = false;
  categoryToDelete: PortraitCategory | null = null;

  form: CategoryForm = { libelle: '' };

  constructor(private readonly portraitsService: PortraitsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.portraitsService.findAllCategories().subscribe({
      next: (items) => {
        this.categories = items;
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
    this.editingId = null;
    this.form = { libelle: '' };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(item: PortraitCategory): void {
    this.modalMode = 'edit';
    this.editingId = item.id;
    this.form = { libelle: item.libelle };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.isModalOpen = false;
  }

  submitModal(): void {
    if (this.isSaving) return;
    const payload = { libelle: this.form.libelle.trim() };
    if (!payload.libelle) {
      this.modalErrorMessage = 'Le libelle est obligatoire.';
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    if (this.modalMode === 'create') {
      this.portraitsService.createCategory(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.load();
        },
        error: (e: unknown) => {
          this.isSaving = false;
          this.modalErrorMessage = this.parseApiError(e);
        },
      });
      return;
    }

    if (!this.editingId) {
      this.isSaving = false;
      this.modalErrorMessage = 'Categorie introuvable.';
      return;
    }

    this.portraitsService.updateCategory(this.editingId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isModalOpen = false;
        this.load();
      },
      error: (e: unknown) => {
        this.isSaving = false;
        this.modalErrorMessage = this.parseApiError(e);
      },
    });
  }

  openDeleteModal(item: PortraitCategory): void {
    this.categoryToDelete = item;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.categoryToDelete = null;
  }

  confirmDelete(): void {
    if (!this.categoryToDelete || this.isDeleting) return;
    this.isDeleting = true;
    this.portraitsService.removeCategory(this.categoryToDelete.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.errorMessage = 'Suppression impossible pour le moment.';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.categoryToDelete = null;
      },
    });
  }

  private parseApiError(error: unknown): string {
    const message = (error as { error?: { message?: string | string[] } })?.error
      ?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
    return 'Une erreur est survenue.';
  }
}

