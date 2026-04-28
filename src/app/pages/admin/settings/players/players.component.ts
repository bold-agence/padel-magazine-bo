import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import {
  Player,
  PlayersService,
} from '../../../../core/services/players.service';
import { environment } from '../../../../../environments/environment';

type PlayerForm = {
  slug: string;
  name: string;
  nationality: string;
  profilePhotoFile: File | null;
  profilePhotoName: string;
  existingProfilePhotoUrl: string | null;
  photoPreviewUrl: string | null;
  removeProfilePhoto: boolean;
};

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ModalComponent,
    InputFieldComponent,
    LabelComponent,
  ],
  templateUrl: './players.component.html',
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  private readonly brokenPhotoIds = new Set<string>();
  isLoading = false;
  isModalOpen = false;
  isSaving = false;
  isDeleteModalOpen = false;
  isDeleting = false;
  playerToDelete: Player | null = null;
  modalMode: 'create' | 'edit' = 'create';
  editingPlayerId: string | null = null;
  errorMessage = '';
  modalErrorMessage = '';

  form: PlayerForm = {
    slug: '',
    name: '',
    nationality: '',
    profilePhotoFile: null,
    profilePhotoName: '',
    existingProfilePhotoUrl: null,
    photoPreviewUrl: null,
    removeProfilePhoto: false,
  };

  constructor(private readonly playersService: PlayersService) {}

  ngOnInit(): void {
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.playersService.findAll().subscribe({
      next: (players: Player[]) => {
        this.players = players;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les joueurs.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingPlayerId = null;
    this.form = {
      slug: '',
      name: '',
      nationality: '',
      profilePhotoFile: null,
      profilePhotoName: '',
      existingProfilePhotoUrl: null,
      photoPreviewUrl: null,
      removeProfilePhoto: false,
    };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(player: Player): void {
    this.modalMode = 'edit';
    this.editingPlayerId = player.id;
    this.form = {
      slug: player.slug,
      name: player.name,
      nationality: player.nationality,
      profilePhotoFile: null,
      profilePhotoName: '',
      existingProfilePhotoUrl: this.getAvatarUrl(player),
      photoPreviewUrl: null,
      removeProfilePhoto: false,
    };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSaving) {
      return;
    }
    this.isModalOpen = false;
  }

  submitModal(): void {
    if (this.isSaving) {
      return;
    }

    const payload = {
      slug: this.form.slug.trim(),
      name: this.form.name.trim(),
      nationality: this.form.nationality.trim(),
    };

    if (!payload.slug || !payload.name || !payload.nationality) {
      this.modalErrorMessage = 'Tous les champs sont obligatoires.';
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    if (this.modalMode === 'create') {
      this.playersService
        .create(payload, this.form.profilePhotoFile)
        .subscribe({
        next: () => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.loadPlayers();
        },
        error: (error: unknown) => {
          this.isSaving = false;
          this.modalErrorMessage = this.parseApiError(error);
        },
      });
      return;
    }

    if (!this.editingPlayerId) {
      this.isSaving = false;
      this.modalErrorMessage = 'Joueur introuvable.';
      return;
    }

    this.playersService
      .update(this.editingPlayerId, payload, {
        profilePhotoFile: this.form.profilePhotoFile,
        removeProfilePhoto: this.form.removeProfilePhoto,
      })
      .subscribe({
      next: () => {
        this.isSaving = false;
        this.isModalOpen = false;
        this.loadPlayers();
      },
      error: (error: unknown) => {
        this.isSaving = false;
        this.modalErrorMessage = this.parseApiError(error);
      },
      });
  }

  openDeleteModal(player: Player): void {
    this.playerToDelete = player;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) {
      return;
    }
    this.isDeleteModalOpen = false;
    this.playerToDelete = null;
  }

  confirmDeletePlayer(): void {
    if (!this.playerToDelete || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.playersService.remove(this.playerToDelete.id).subscribe({
      next: () => this.loadPlayers(),
      error: () => {
        this.errorMessage = 'Suppression impossible pour le moment.';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.playerToDelete = null;
      },
    });
  }

  getAvatarUrl(player: Player): string | null {
    if (!player.profilePhoto || this.brokenPhotoIds.has(player.id)) {
      return null;
    }

    // API usually returns an absolute URL from MinIO public URL.
    // Keep a safe fallback for relative values.
    if (player.profilePhoto.startsWith('http://') || player.profilePhoto.startsWith('https://')) {
      return player.profilePhoto;
    }

    return `${environment.apiUrl}${player.profilePhoto.startsWith('/') ? '' : '/'}${player.profilePhoto}`;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  onAvatarError(playerId: string): void {
    this.brokenPhotoIds.add(playerId);
  }

  onNameChange(value: string | number): void {
    const name = String(value ?? '');
    this.form.name = name;
    this.form.slug = this.toSlug(name);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.form.profilePhotoFile = file;
    this.form.profilePhotoName = file?.name ?? '';
    this.form.removeProfilePhoto = false;

    if (this.form.photoPreviewUrl) {
      URL.revokeObjectURL(this.form.photoPreviewUrl);
      this.form.photoPreviewUrl = null;
    }

    if (file) {
      this.form.photoPreviewUrl = URL.createObjectURL(file);
    }
  }

  removePhotoInForm(): void {
    if (this.form.photoPreviewUrl) {
      URL.revokeObjectURL(this.form.photoPreviewUrl);
    }
    this.form.profilePhotoFile = null;
    this.form.profilePhotoName = '';
    this.form.photoPreviewUrl = null;
    this.form.existingProfilePhotoUrl = null;
    this.form.removeProfilePhoto = true;
  }

  getModalPhotoPreview(): string | null {
    return this.form.photoPreviewUrl || this.form.existingProfilePhotoUrl;
  }

  private parseApiError(error: unknown): string {
    const message = (error as { error?: { message?: string | string[] } })?.error
      ?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    return 'Une erreur est survenue.';
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
