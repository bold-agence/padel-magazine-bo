import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { VideoType, VideoTypesService } from '../../../../core/services/video-types.service';

type FormModel = { title: string };

@Component({
  selector: 'app-video-types-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './video-types-page.component.html',
})
export class VideoTypesPageComponent implements OnInit {
  types: VideoType[] = [];
  isLoading = false;
  errorMessage = '';
  modalErrorMessage = '';
  isModalOpen = false;
  isSaving = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;
  isDeleteModalOpen = false;
  isDeleting = false;
  itemToDelete: VideoType | null = null;
  form: FormModel = { title: '' };

  constructor(private readonly videoTypesService: VideoTypesService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.videoTypesService.findAll().subscribe({
      next: (items) => {
        this.types = items;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les types de vidéo.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.form = { title: '' };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(t: VideoType): void {
    this.modalMode = 'edit';
    this.editingId = t.id;
    this.form = { title: t.title };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.isModalOpen = false;
  }

  submitModal(): void {
    if (this.isSaving) return;
    const title = this.form.title.trim();
    if (!title) {
      this.modalErrorMessage = 'Le titre est obligatoire.';
      return;
    }
    this.isSaving = true;
    this.modalErrorMessage = '';
    if (this.modalMode === 'create') {
      this.videoTypesService.create({ title }).subscribe({
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
      this.modalErrorMessage = 'Type introuvable.';
      return;
    }
    this.videoTypesService.update(this.editingId, { title }).subscribe({
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

  openDeleteModal(t: VideoType): void {
    this.itemToDelete = t;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.itemToDelete = null;
  }

  confirmDelete(): void {
    if (!this.itemToDelete || this.isDeleting) return;
    this.isDeleting = true;
    this.videoTypesService.remove(this.itemToDelete.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.errorMessage =
          'Suppression impossible (des vidéos utilisent peut-être ce type).';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.itemToDelete = null;
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
