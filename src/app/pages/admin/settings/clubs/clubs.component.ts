import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { Club, ClubsService } from '../../../../core/services/clubs.service';

type ClubForm = {
  title: string;
  description: string;
};

@Component({
  selector: 'app-clubs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './clubs.component.html',
})
export class ClubsComponent implements OnInit {
  clubs: Club[] = [];
  isLoading = false;
  errorMessage = '';
  modalErrorMessage = '';
  isModalOpen = false;
  isSaving = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;

  isDeleteModalOpen = false;
  isDeleting = false;
  clubToDelete: Club | null = null;

  form: ClubForm = { title: '', description: '' };

  constructor(private readonly clubsService: ClubsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.clubsService.findAll().subscribe({
      next: (clubs) => {
        this.clubs = clubs;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les clubs.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.form = { title: '', description: '' };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(club: Club): void {
    this.modalMode = 'edit';
    this.editingId = club.id;
    this.form = { title: club.title, description: club.description ?? '' };
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
      title: this.form.title.trim(),
      description: this.form.description.trim() || null,
    };
    if (!payload.title) {
      this.modalErrorMessage = 'Le titre est obligatoire.';
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    if (this.modalMode === 'create') {
      this.clubsService.create(payload).subscribe({
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
      this.modalErrorMessage = 'Club introuvable.';
      return;
    }

    this.clubsService.update(this.editingId, payload).subscribe({
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

  openDeleteModal(club: Club): void {
    this.clubToDelete = club;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.clubToDelete = null;
  }

  confirmDelete(): void {
    if (!this.clubToDelete || this.isDeleting) return;
    this.isDeleting = true;
    this.clubsService.remove(this.clubToDelete.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.errorMessage = 'Suppression impossible pour le moment.';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.clubToDelete = null;
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

