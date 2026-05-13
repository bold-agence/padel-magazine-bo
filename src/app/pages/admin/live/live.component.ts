import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import {
  EventApiItem,
  EventsService,
} from '../../../core/services/events.service';
import {
  LiveApiItem,
  LivePayload,
  LivesService,
} from '../../../core/services/lives.service';

export type LiveStream = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartAt: string;
  startTime: string; // HH:mm
  endTime: string | null; // HH:mm
  liveUrl: string;
  replayUrl: string | null;
  coverImageUrl: string | null;
};

type LiveForm = {
  eventId: string;
  startTime: string;
  endTime: string;
  liveUrl: string;
  replayUrl: string;
  coverImageFile: File | null;
  coverImageName: string;
  existingCoverImageUrl: string | null;
  coverPreviewUrl: string | null;
  removeCoverImage: boolean;
};

@Component({
  selector: 'app-live',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './live.component.html',
})
export class LiveComponent implements OnInit, OnDestroy {
  // Section "Informations générales"
  channelName = '';
  channelUrl = '';
  isLoadingChannel = false;
  isSavingChannel = false;
  channelSavedMessage = '';
  channelErrorMessage = '';

  // Liste des évènements (pour le sélecteur)
  events: EventApiItem[] = [];
  isLoadingEvents = false;

  // Lives
  lives: LiveStream[] = [];
  isLoading = false;
  errorMessage = '';

  // Modale création / édition
  isModalOpen = false;
  isSaving = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;
  modalErrorMessage = '';

  // Modale suppression
  isDeleteModalOpen = false;
  isDeleting = false;
  liveToDelete: LiveStream | null = null;

  form: LiveForm = this.createEmptyForm();

  constructor(
    private readonly livesService: LivesService,
    private readonly eventsService: EventsService,
  ) {}

  ngOnInit(): void {
    this.loadChannelSettings();
    this.loadEvents();
    this.loadLives();
  }

  ngOnDestroy(): void {
    this.revokeCoverPreview();
  }

  loadChannelSettings(): void {
    this.isLoadingChannel = true;
    this.livesService.getChannelSettings().subscribe({
      next: (settings) => {
        this.channelName = settings.channelName ?? '';
        this.channelUrl = settings.channelUrl ?? '';
        this.isLoadingChannel = false;
      },
      error: () => {
        this.isLoadingChannel = false;
      },
    });
  }

  loadEvents(): void {
    this.isLoadingEvents = true;
    this.eventsService.findAll().subscribe({
      next: (list) => {
        this.events = list;
        this.isLoadingEvents = false;
      },
      error: () => {
        this.events = [];
        this.isLoadingEvents = false;
      },
    });
  }

  loadLives(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.livesService.findAll().subscribe({
      next: (list) => {
        this.lives = list.map((item) => this.mapApiToItem(item));
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = this.parseApiError(
          err,
          'Impossible de charger les lives.',
        );
        this.lives = [];
        this.isLoading = false;
      },
    });
  }

  saveChannel(): void {
    this.channelSavedMessage = '';
    this.channelErrorMessage = '';

    const name = this.channelName.trim();
    const url = this.channelUrl.trim();

    if (!name) {
      this.channelErrorMessage = 'Le nom de la chaîne est obligatoire.';
      return;
    }
    if (!url) {
      this.channelErrorMessage = 'Le lien de la chaîne est obligatoire.';
      return;
    }
    if (!this.isHttpUrl(url)) {
      this.channelErrorMessage =
        'Le lien de la chaîne doit être une URL valide (http/https).';
      return;
    }

    this.isSavingChannel = true;
    this.livesService
      .updateChannelSettings({ channelName: name, channelUrl: url })
      .subscribe({
        next: (settings) => {
          this.channelName = settings.channelName ?? '';
          this.channelUrl = settings.channelUrl ?? '';
          this.isSavingChannel = false;
          this.channelSavedMessage = 'Informations enregistrées.';
        },
        error: (err: HttpErrorResponse) => {
          this.channelErrorMessage = this.parseApiError(
            err,
            'Impossible d’enregistrer les informations de chaîne.',
          );
          this.isSavingChannel = false;
        },
      });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.revokeCoverPreview();
    this.form = this.createEmptyForm();
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(live: LiveStream): void {
    this.modalMode = 'edit';
    this.editingId = live.id;
    this.revokeCoverPreview();
    this.form = {
      eventId: live.eventId,
      startTime: live.startTime,
      endTime: live.endTime ?? '',
      liveUrl: live.liveUrl,
      replayUrl: live.replayUrl ?? '',
      coverImageFile: null,
      coverImageName: '',
      existingCoverImageUrl: live.coverImageUrl,
      coverPreviewUrl: null,
      removeCoverImage: false,
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

    const eventId = this.form.eventId;
    const startTime = this.form.startTime;
    const endTime = this.form.endTime;
    const liveUrl = this.form.liveUrl.trim();
    const replayUrl = this.form.replayUrl.trim();

    if (!eventId) {
      this.modalErrorMessage = 'L’évènement est obligatoire.';
      return;
    }
    if (!startTime) {
      this.modalErrorMessage = 'L’heure de début est obligatoire.';
      return;
    }
    if (endTime && endTime <= startTime) {
      this.modalErrorMessage =
        'L’heure de fin doit être postérieure à l’heure de début.';
      return;
    }
    if (!liveUrl) {
      this.modalErrorMessage = 'Le lien du live est obligatoire.';
      return;
    }
    if (!this.isHttpUrl(liveUrl)) {
      this.modalErrorMessage =
        'Le lien du live doit être une URL valide (http/https).';
      return;
    }
    if (replayUrl && !this.isHttpUrl(replayUrl)) {
      this.modalErrorMessage =
        'Le lien de replay doit être une URL valide (http/https).';
      return;
    }

    const payload: LivePayload = {
      eventId,
      startTime,
      endTime: endTime || null,
      liveUrl,
      replayUrl: replayUrl || null,
    };

    this.isSaving = true;
    this.modalErrorMessage = '';

    if (this.modalMode === 'create') {
      this.livesService
        .create(payload, this.form.coverImageFile)
        .subscribe({
          next: (created) => {
            this.lives = [this.mapApiToItem(created), ...this.lives];
            this.isSaving = false;
            this.isModalOpen = false;
          },
          error: (err: HttpErrorResponse) => {
            this.modalErrorMessage = this.parseApiError(
              err,
              'Impossible de créer le live.',
            );
            this.isSaving = false;
          },
        });
      return;
    }

    if (!this.editingId) {
      this.isSaving = false;
      return;
    }

    this.livesService
      .update(this.editingId, payload, {
        coverImageFile: this.form.coverImageFile,
        removeCoverImage: this.form.removeCoverImage,
      })
      .subscribe({
        next: (updated) => {
          const mapped = this.mapApiToItem(updated);
          this.lives = this.lives.map((l) =>
            l.id === mapped.id ? mapped : l,
          );
          this.isSaving = false;
          this.isModalOpen = false;
        },
        error: (err: HttpErrorResponse) => {
          this.modalErrorMessage = this.parseApiError(
            err,
            'Impossible de mettre à jour le live.',
          );
          this.isSaving = false;
        },
      });
  }

  openDeleteModal(live: LiveStream): void {
    this.liveToDelete = live;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.liveToDelete = null;
  }

  confirmDelete(): void {
    if (!this.liveToDelete || this.isDeleting) return;
    this.isDeleting = true;
    const idToRemove = this.liveToDelete.id;

    this.livesService.remove(idToRemove).subscribe({
      next: () => {
        this.lives = this.lives.filter((l) => l.id !== idToRemove);
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.liveToDelete = null;
      },
      error: (err: HttpErrorResponse) => {
        this.modalErrorMessage = this.parseApiError(
          err,
          'Impossible de supprimer le live.',
        );
        this.isDeleting = false;
      },
    });
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.form.coverImageFile = file;
    this.form.coverImageName = file?.name ?? '';
    this.form.removeCoverImage = false;

    this.revokeCoverPreview();
    if (file) {
      this.form.coverPreviewUrl = URL.createObjectURL(file);
    }
  }

  removeCoverInForm(): void {
    this.revokeCoverPreview();
    this.form.coverImageFile = null;
    this.form.coverImageName = '';
    this.form.existingCoverImageUrl = null;
    this.form.removeCoverImage = true;
  }

  getFormCoverPreview(): string | null {
    return this.form.coverPreviewUrl || this.form.existingCoverImageUrl;
  }

  /**
   * IDs des évènements qui ont déjà un live (hors live en cours d'édition).
   * Utilisé pour désactiver les options correspondantes dans le sélecteur.
   */
  takenEventIds(): Set<string> {
    const taken = new Set<string>();
    for (const l of this.lives) {
      if (this.modalMode === 'edit' && l.id === this.editingId) continue;
      taken.add(l.eventId);
    }
    return taken;
  }

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  private mapApiToItem(item: LiveApiItem): LiveStream {
    return {
      id: item.id,
      eventId: item.event.id,
      eventTitle: item.event.title,
      eventStartAt: item.event.startAt,
      startTime: item.startTime,
      endTime: item.endTime ?? null,
      liveUrl: item.liveUrl,
      replayUrl: item.replayUrl ?? null,
      coverImageUrl: item.coverImageUrl ?? null,
    };
  }

  private revokeCoverPreview(): void {
    if (this.form.coverPreviewUrl) {
      URL.revokeObjectURL(this.form.coverPreviewUrl);
    }
    this.form.coverPreviewUrl = null;
  }

  private isHttpUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private createEmptyForm(): LiveForm {
    return {
      eventId: '',
      startTime: '',
      endTime: '',
      liveUrl: '',
      replayUrl: '',
      coverImageFile: null,
      coverImageName: '',
      existingCoverImageUrl: null,
      coverPreviewUrl: null,
      removeCoverImage: false,
    };
  }

  private parseApiError(err: HttpErrorResponse, fallback: string): string {
    const apiMessage = err?.error?.message;
    if (Array.isArray(apiMessage)) {
      return apiMessage.join(' · ');
    }
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }
    return fallback;
  }
}
