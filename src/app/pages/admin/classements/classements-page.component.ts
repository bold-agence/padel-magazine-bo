import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import {
  ClassementDetail,
  ClassementSummary,
  ClassementsService,
} from '../../../core/services/classements.service';

type ClassementForm = {
  slug: string;
  title: string;
  pointsNowLabel: string;
  pointsPrevLabel: string;
};

@Component({
  selector: 'app-classements-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './classements-page.component.html',
})
export class ClassementsPageComponent implements OnInit {
  items: ClassementSummary[] = [];
  isLoading = false;
  errorMessage = '';

  isModalOpen = false;
  isSaving = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;
  modalErrorMessage = '';
  form: ClassementForm = {
    slug: '',
    title: '',
    pointsNowLabel: '',
    pointsPrevLabel: '',
  };

  isDeleteModalOpen = false;
  isDeleting = false;
  classementToDelete: ClassementSummary | null = null;

  isPreviewOpen = false;
  previewLoading = false;
  previewError = '';
  previewDetail: ClassementDetail | null = null;

  importTargetId: string | null = null;
  isImporting = false;
  importMessage = '';

  constructor(private readonly classementsService: ClassementsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.classementsService.findAllSummaries().subscribe({
      next: (rows) => {
        this.items = rows;
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
    this.form = { slug: '', title: '', pointsNowLabel: '', pointsPrevLabel: '' };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(row: ClassementSummary): void {
    this.modalMode = 'edit';
    this.editingId = row.id;
    this.form = {
      slug: row.slug,
      title: row.title,
      pointsNowLabel: row.pointsNowLabel ?? '',
      pointsPrevLabel: row.pointsPrevLabel ?? '',
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
    const slug = this.form.slug.trim().toLowerCase();
    const title = this.form.title.trim();
    if (!slug || !title) {
      this.modalErrorMessage = 'Slug et titre sont obligatoires.';
      return;
    }
    const payload = {
      slug,
      title,
      pointsNowLabel: this.form.pointsNowLabel.trim() || null,
      pointsPrevLabel: this.form.pointsPrevLabel.trim() || null,
    };
    this.isSaving = true;
    this.modalErrorMessage = '';

    if (this.modalMode === 'create') {
      this.classementsService.create(payload).subscribe({
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
      this.modalErrorMessage = 'Classement introuvable.';
      return;
    }

    this.classementsService.update(this.editingId, payload).subscribe({
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

  openDeleteModal(row: ClassementSummary): void {
    this.classementToDelete = row;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.classementToDelete = null;
  }

  confirmDelete(): void {
    if (!this.classementToDelete || this.isDeleting) return;
    this.isDeleting = true;
    this.classementsService.remove(this.classementToDelete.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.errorMessage = 'Suppression impossible pour le moment.';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.classementToDelete = null;
      },
    });
  }

  openPreview(row: ClassementSummary): void {
    this.previewDetail = null;
    this.previewError = '';
    this.isPreviewOpen = true;
    this.previewLoading = true;
    this.classementsService.findOne(row.id).subscribe({
      next: (detail) => {
        this.previewDetail = detail;
        this.previewLoading = false;
      },
      error: () => {
        this.previewError = 'Impossible de charger le détail.';
        this.previewLoading = false;
      },
    });
  }

  closePreview(): void {
    this.isPreviewOpen = false;
    this.previewDetail = null;
  }

  onImportFileSelected(row: ClassementSummary, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.importTargetId = row.id;
    this.isImporting = true;
    this.importMessage = '';
    this.classementsService.importExcel(row.id, file).subscribe({
      next: (res) => {
        this.isImporting = false;
        this.importMessage = `${res.imported} ligne(s) importée(s).`;
        this.importTargetId = null;
        this.load();
        if (this.previewDetail?.id === row.id) {
          this.openPreview(row);
        }
      },
      error: (e: unknown) => {
        this.isImporting = false;
        this.importTargetId = null;
        this.importMessage = this.parseApiError(e);
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
