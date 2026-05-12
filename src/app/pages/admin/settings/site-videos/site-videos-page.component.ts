import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, Option } from '../../../../shared/components/form/select/select.component';
import { VideoTypesService, VideoType } from '../../../../core/services/video-types.service';
import { SiteVideo, SiteVideosService } from '../../../../core/services/site-videos.service';

type FormModel = {
  title: string;
  youtubeLink: string;
  videoTypeId: string;
};

@Component({
  selector: 'app-site-videos-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
    SelectComponent,
  ],
  templateUrl: './site-videos-page.component.html',
})
export class SiteVideosPageComponent implements OnInit {
  videos: SiteVideo[] = [];
  types: VideoType[] = [];
  typeOptions: Option[] = [{ value: '', label: 'Sélectionner un type' }];

  isLoading = false;
  errorMessage = '';
  modalErrorMessage = '';
  isModalOpen = false;
  isSaving = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;
  isDeleteModalOpen = false;
  isDeleting = false;
  videoToDelete: SiteVideo | null = null;
  form: FormModel = { title: '', youtubeLink: '', videoTypeId: '' };

  constructor(
    private readonly siteVideosService: SiteVideosService,
    private readonly videoTypesService: VideoTypesService,
  ) {}

  ngOnInit(): void {
    this.loadTypes();
    this.loadVideos();
  }

  private loadTypes(): void {
    this.videoTypesService.findAll().subscribe({
      next: (items) => {
        this.types = items;
        this.typeOptions = [
          { value: '', label: 'Sélectionner un type' },
          ...items.map((t) => ({ value: t.id, label: t.title })),
        ];
      },
      error: () => {
        this.types = [];
        this.typeOptions = [{ value: '', label: 'Sélectionner un type' }];
      },
    });
  }

  loadVideos(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.siteVideosService.findAll().subscribe({
      next: (items) => {
        this.videos = items;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les vidéos.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.form = { title: '', youtubeLink: '', videoTypeId: '' };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(v: SiteVideo): void {
    this.modalMode = 'edit';
    this.editingId = v.id;
    this.form = {
      title: v.title,
      youtubeLink: v.youtubeLink,
      videoTypeId: v.videoType.id,
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
    const title = this.form.title.trim();
    const youtubeLink = this.form.youtubeLink.trim();
    if (!title || !youtubeLink || !this.form.videoTypeId) {
      this.modalErrorMessage = 'Titre, lien YouTube et type sont obligatoires.';
      return;
    }
    this.isSaving = true;
    this.modalErrorMessage = '';
    const payload = {
      title,
      youtubeLink,
      videoTypeId: this.form.videoTypeId,
    };
    if (this.modalMode === 'create') {
      this.siteVideosService.create(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.loadVideos();
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
      this.modalErrorMessage = 'Vidéo introuvable.';
      return;
    }
    this.siteVideosService.update(this.editingId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isModalOpen = false;
        this.loadVideos();
      },
      error: (e: unknown) => {
        this.isSaving = false;
        this.modalErrorMessage = this.parseApiError(e);
      },
    });
  }

  openDeleteModal(v: SiteVideo): void {
    this.videoToDelete = v;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.videoToDelete = null;
  }

  confirmDelete(): void {
    if (!this.videoToDelete || this.isDeleting) return;
    this.isDeleting = true;
    this.siteVideosService.remove(this.videoToDelete.id).subscribe({
      next: () => this.loadVideos(),
      error: () => {
        this.errorMessage = 'Suppression impossible pour le moment.';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.videoToDelete = null;
      },
    });
  }

  truncateUrl(url: string, max = 56): string {
    const u = url.trim();
    return u.length <= max ? u : u.slice(0, max - 1) + '…';
  }

  private parseApiError(error: unknown): string {
    const message = (error as { error?: { message?: string | string[] } })?.error
      ?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
    return 'Une erreur est survenue.';
  }
}
