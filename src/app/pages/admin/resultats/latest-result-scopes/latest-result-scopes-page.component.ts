import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LatestResultScope,
  LatestResultScopePayload,
  LatestResultsService,
} from '../../../../core/services/latest-results.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';

type ScopeForm = {
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
};

@Component({
  selector: 'app-latest-result-scopes-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ModalComponent],
  templateUrl: './latest-result-scopes-page.component.html',
})
export class LatestResultScopesPageComponent implements OnInit {
  scopes: LatestResultScope[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;
  form: ScopeForm = this.createEmptyForm();

  constructor(private readonly latestResultsService: LatestResultsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.latestResultsService.findScopesAdmin().subscribe({
      next: (scopes) => {
        this.scopes = scopes;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les classements.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.form = this.createEmptyForm();
    this.errorMessage = '';
    this.successMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(scope: LatestResultScope): void {
    this.modalMode = 'edit';
    this.editingId = scope.id;
    this.form = {
      name: scope.name,
      slug: scope.slug,
      displayOrder: scope.displayOrder,
      isActive: scope.isActive,
    };
    this.errorMessage = '';
    this.successMessage = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.isModalOpen = false;
  }

  submitModal(): void {
    if (this.isSaving) return;

    const payload = this.buildPayload();
    if (!payload) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ =
      this.modalMode === 'edit' && this.editingId
        ? this.latestResultsService.updateScope(this.editingId, payload)
        : this.latestResultsService.createScope(payload);

    request$.subscribe({
      next: (scope) => {
        this.isSaving = false;
        this.isModalOpen = false;
        this.successMessage = `Classement "${scope.name}" enregistré.`;
        this.load();
      },
      error: (error: unknown) => {
        this.isSaving = false;
        this.errorMessage = this.parseApiError(error);
      },
    });
  }

  deleteScope(scope: LatestResultScope): void {
    if (this.isSaving) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.latestResultsService.removeScope(scope.id).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = `Classement "${scope.name}" supprimé.`;
        this.load();
      },
      error: (error: unknown) => {
        this.isSaving = false;
        this.errorMessage = this.parseApiError(error);
      },
    });
  }

  onNameChange(value: string): void {
    this.form.name = value;
    this.form.slug = this.toSlug(value);
  }

  private createEmptyForm(): ScopeForm {
    return {
      name: '',
      slug: '',
      displayOrder: this.scopes.length,
      isActive: true,
    };
  }

  private buildPayload(): LatestResultScopePayload | null {
    const payload = {
      name: this.form.name.trim(),
      slug: this.form.slug.trim().toLowerCase(),
      displayOrder: Number(this.form.displayOrder) || 0,
      isActive: this.form.isActive,
    };

    if (!payload.name || !payload.slug) {
      this.errorMessage = 'Nom et slug sont obligatoires.';
      return null;
    }

    return payload;
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

  private parseApiError(error: unknown): string {
    const message = (error as { error?: { message?: string | string[] } })?.error
      ?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
    return 'Une erreur est survenue.';
  }
}
