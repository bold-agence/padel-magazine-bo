import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import {
  AdImageItem,
  AdSlot,
  BreakingNewsItem,
  ClientContentService,
} from '../../../core/services/client-content.service';

type BreakingNewsForm = {
  title: string;
  linkUrl: string;
  isActive: boolean;
  displayOrder: number;
};

type AdImageForm = {
  title: string;
  slot: AdSlot;
  imageUrl: string;
  targetUrl: string;
  isActive: boolean;
};

@Component({
  selector: 'app-client-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './client-content.component.html',
})
export class ClientContentComponent implements OnInit {
  breakingNews: BreakingNewsItem[] = [];
  adImages: AdImageItem[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  modalErrorMessage = '';

  isBreakingModalOpen = false;
  editingBreakingId: string | null = null;
  breakingForm: BreakingNewsForm = this.getEmptyBreakingForm();

  isAdModalOpen = false;
  editingAdId: string | null = null;
  adForm: AdImageForm = this.getEmptyAdForm();
  adImageFile: File | null = null;
  adImageFileName = '';

  constructor(private readonly clientContentService: ClientContentService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.clientContentService.findAllBreakingNews().subscribe({
      next: (breakingNews) => {
        this.breakingNews = breakingNews;
        this.clientContentService.findAllAdImages().subscribe({
          next: (adImages) => {
            this.adImages = adImages;
            this.isLoading = false;
          },
          error: () => {
            this.errorMessage = 'Impossible de charger les publicites.';
            this.isLoading = false;
          },
        });
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les breaking news.';
        this.isLoading = false;
      },
    });
  }

  openCreateBreakingModal(): void {
    this.editingBreakingId = null;
    this.breakingForm = this.getEmptyBreakingForm();
    this.modalErrorMessage = '';
    this.isBreakingModalOpen = true;
  }

  openEditBreakingModal(item: BreakingNewsItem): void {
    this.editingBreakingId = item.id;
    this.breakingForm = {
      title: item.title,
      linkUrl: item.linkUrl ?? '',
      isActive: item.isActive,
      displayOrder: item.displayOrder ?? 0,
    };
    this.modalErrorMessage = '';
    this.isBreakingModalOpen = true;
  }

  closeBreakingModal(): void {
    if (this.isSaving) return;
    this.isBreakingModalOpen = false;
    this.modalErrorMessage = '';
  }

  saveBreakingNews(): void {
    if (this.isSaving) return;
    const title = this.breakingForm.title.trim();
    if (!title) {
      this.errorMessage = 'Le titre du breaking news est obligatoire.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.modalErrorMessage = '';
    const payload = {
      title,
      linkUrl: this.breakingForm.linkUrl.trim() || undefined,
      isActive: this.breakingForm.isActive,
      displayOrder: this.breakingForm.displayOrder ?? 0,
    };

    const request$ = this.editingBreakingId
      ? this.clientContentService.updateBreakingNews(this.editingBreakingId, payload)
      : this.clientContentService.createBreakingNews(payload);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.isBreakingModalOpen = false;
        this.successMessage = this.editingBreakingId
          ? 'Breaking news mis a jour.'
          : 'Breaking news cree.';
        this.loadData();
      },
      error: (error: unknown) => {
        this.isSaving = false;
        this.modalErrorMessage = this.parseApiError(
          error,
          'Enregistrement du breaking news impossible.',
        );
      },
    });
  }

  deleteBreakingNews(item: BreakingNewsItem): void {
    if (this.isSaving) return;
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.clientContentService.removeBreakingNews(item.id).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Breaking news supprime.';
        this.loadData();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Suppression du breaking news impossible.';
      },
    });
  }

  openCreateAdModal(): void {
    this.editingAdId = null;
    this.adForm = this.getEmptyAdForm();
    this.adImageFile = null;
    this.adImageFileName = '';
    this.modalErrorMessage = '';
    this.isAdModalOpen = true;
  }

  openEditAdModal(item: AdImageItem): void {
    this.editingAdId = item.id;
    this.adForm = {
      title: item.title,
      slot: item.slot,
      imageUrl: item.imageUrl,
      targetUrl: item.targetUrl ?? '',
      isActive: item.isActive,
    };
    this.adImageFile = null;
    this.adImageFileName = '';
    this.modalErrorMessage = '';
    this.isAdModalOpen = true;
  }

  closeAdModal(): void {
    if (this.isSaving) return;
    this.isAdModalOpen = false;
    this.modalErrorMessage = '';
  }

  onAdImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.adImageFile = file;
    this.adImageFileName = file?.name ?? '';
  }

  saveAdImage(): void {
    if (this.isSaving) return;
    const title = this.adForm.title.trim();
    if (!title) {
      this.errorMessage = "Le titre de l'encart pub est obligatoire.";
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.modalErrorMessage = '';

    this.clientContentService.findAllAdImages(this.adForm.slot).subscribe({
      next: (existingInSlot) => {
        const conflict = existingInSlot.find((item) => item.id !== this.editingAdId);
        if (conflict) {
          this.isSaving = false;
          this.modalErrorMessage = 'Ce slot est deja utilise.';
          return;
        }
        this.continueSaveAdImage(title);
      },
      error: (error: unknown) => {
        this.isSaving = false;
        this.modalErrorMessage = this.parseApiError(
          error,
          'Verification du slot impossible.',
        );
      },
    });
  }

  private continueSaveAdImage(title: string): void {
    this.isSaving = true;

    const persist = (imageUrl: string) => {
      const payload = {
        title,
        slot: this.adForm.slot,
        imageUrl,
        targetUrl: this.adForm.targetUrl.trim() || undefined,
        isActive: this.adForm.isActive,
      };
      const request$ = this.editingAdId
        ? this.clientContentService.updateAdImage(this.editingAdId, payload)
        : this.clientContentService.createAdImage(payload);
      request$.subscribe({
        next: () => {
          this.isSaving = false;
          this.isAdModalOpen = false;
          this.successMessage = this.editingAdId
            ? 'Publicite mise a jour.'
            : 'Publicite creee.';
          this.loadData();
        },
        error: (error: unknown) => {
          this.isSaving = false;
          this.modalErrorMessage = this.parseApiError(
            error,
            'Enregistrement de la publicite impossible.',
          );
        },
      });
    };

    if (this.adImageFile) {
      this.clientContentService.uploadAdImage(this.adImageFile).subscribe({
        next: (url) => persist(url),
        error: (error: unknown) => {
          this.isSaving = false;
          this.modalErrorMessage = this.parseApiError(
            error,
            "Upload de l'image publicitaire impossible.",
          );
        },
      });
      return;
    }

    const currentUrl = this.adForm.imageUrl.trim();
    if (!currentUrl) {
      this.isSaving = false;
      this.modalErrorMessage = "L'image publicitaire est obligatoire.";
      return;
    }
    persist(currentUrl);
  }

  deleteAdImage(item: AdImageItem): void {
    if (this.isSaving) return;
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.clientContentService.removeAdImage(item.id).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Publicite supprimee.';
        this.loadData();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Suppression de la publicite impossible.';
      },
    });
  }

  private getEmptyBreakingForm(): BreakingNewsForm {
    return {
      title: '',
      linkUrl: '',
      isActive: true,
      displayOrder: 0,
    };
  }

  private getEmptyAdForm(): AdImageForm {
    return {
      title: '',
      slot: 'header_main',
      imageUrl: '',
      targetUrl: '',
      isActive: true,
    };
  }

  private parseApiError(error: unknown, fallback: string): string {
    const message = (error as { error?: { message?: string | string[] } })?.error?.message;
    if (Array.isArray(message) && message.length) {
      return message.join(', ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    return fallback;
  }
}
