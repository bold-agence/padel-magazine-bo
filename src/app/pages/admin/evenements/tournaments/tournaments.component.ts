import { CommonModule } from '@angular/common';
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

type TournamentForm = {
  label: string;
  description: string;
  slug: string;
  colorCode: string;
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

  constructor(private readonly tournamentsService: TournamentsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.tournamentsService.findAll().subscribe({
      next: (tournaments) => {
        this.tournaments = tournaments;
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
        error: (e: unknown) => {
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
      error: (e: unknown) => {
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
