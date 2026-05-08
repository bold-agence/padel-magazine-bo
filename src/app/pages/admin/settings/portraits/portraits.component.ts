import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { SelectComponent, Option } from '../../../../shared/components/form/select/select.component';
import { PlayersService, Player } from '../../../../core/services/players.service';
import { ArticlesService, Article } from '../../../../core/services/articles.service';
import {
  Portrait,
  PortraitCategory,
  PortraitsService,
} from '../../../../core/services/portraits.service';

type PortraitForm = {
  playerId: string;
  categoryId: string;
  indice: number;
  pointNumber: number;
  signature: string;
  articleId: string;
};

@Component({
  selector: 'app-portraits',
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
  templateUrl: './portraits.component.html',
})
export class PortraitsComponent implements OnInit {
  portraits: Portrait[] = [];
  categories: PortraitCategory[] = [];
  players: Player[] = [];
  invisibleArticles: Article[] = [];

  playerOptions: Option[] = [{ value: '', label: 'Selectionner un joueur' }];
  categoryOptions: Option[] = [{ value: '', label: 'Selectionner une categorie' }];
  articleOptions: Option[] = [{ value: '', label: 'Aucun article (optionnel)' }];

  isLoading = false;
  errorMessage = '';
  modalErrorMessage = '';

  isModalOpen = false;
  isSaving = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;

  isDeleteModalOpen = false;
  isDeleting = false;
  portraitToDelete: Portrait | null = null;

  form: PortraitForm = {
    playerId: '',
    categoryId: '',
    indice: 0,
    pointNumber: 0,
    signature: '',
    articleId: '',
  };

  constructor(
    private readonly portraitsService: PortraitsService,
    private readonly playersService: PlayersService,
    private readonly articlesService: ArticlesService,
  ) {}

  ngOnInit(): void {
    this.loadRefs();
    this.loadPortraits();
  }

  private loadRefs(): void {
    this.playersService.findAll().subscribe({
      next: (players) => {
        this.players = players;
        this.playerOptions = [
          { value: '', label: 'Selectionner un joueur' },
          ...players.map((p) => ({ value: p.id, label: p.name })),
        ];
      },
      error: () => {
        this.players = [];
        this.playerOptions = [{ value: '', label: 'Selectionner un joueur' }];
      },
    });

    this.portraitsService.findAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.categoryOptions = [
          { value: '', label: 'Selectionner une categorie' },
          ...categories.map((c) => ({ value: c.id, label: c.libelle })),
        ];
      },
      error: () => {
        this.categories = [];
        this.categoryOptions = [{ value: '', label: 'Selectionner une categorie' }];
      },
    });

    // Simple list: first page only, and filter isVisible=false in BO (API also enforces isVisible=false if linked)
    this.articlesService.findPaginated(1, 50).subscribe({
      next: (res) => {
        this.invisibleArticles = res.items.filter((a) => a.isVisible === false);
        this.articleOptions = [
          { value: '', label: 'Aucun article (optionnel)' },
          ...this.invisibleArticles.map((a) => ({
            value: a.id,
            label: a.title,
          })),
        ];
      },
      error: () => {
        this.invisibleArticles = [];
        this.articleOptions = [{ value: '', label: 'Aucun article (optionnel)' }];
      },
    });
  }

  loadPortraits(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.portraitsService.findAllPortraits().subscribe({
      next: (items) => {
        this.portraits = items;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les portraits.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.form = {
      playerId: '',
      categoryId: '',
      indice: 0,
      pointNumber: 0,
      signature: '',
      articleId: '',
    };
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(p: Portrait): void {
    this.modalMode = 'edit';
    this.editingId = p.id;
    this.form = {
      playerId: p.player?.id ?? '',
      categoryId: p.category?.id ?? '',
      indice: p.indice,
      pointNumber: p.pointNumber,
      signature: p.signature ?? '',
      articleId: p.article?.id ?? '',
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

    if (!this.form.playerId || !this.form.categoryId) {
      this.modalErrorMessage = 'Joueur et categorie sont obligatoires.';
      return;
    }

    const payload = {
      playerId: this.form.playerId,
      categoryId: this.form.categoryId,
      indice: Number(this.form.indice),
      pointNumber: Number(this.form.pointNumber),
      signature: this.form.signature.trim() || null,
      articleId: this.form.articleId ? this.form.articleId : null,
    };

    this.isSaving = true;
    this.modalErrorMessage = '';

    if (this.modalMode === 'create') {
      this.portraitsService.createPortrait(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.loadPortraits();
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
      this.modalErrorMessage = 'Portrait introuvable.';
      return;
    }

    this.portraitsService.updatePortrait(this.editingId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isModalOpen = false;
        this.loadPortraits();
      },
      error: (e: unknown) => {
        this.isSaving = false;
        this.modalErrorMessage = this.parseApiError(e);
      },
    });
  }

  openDeleteModal(p: Portrait): void {
    this.portraitToDelete = p;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.portraitToDelete = null;
  }

  confirmDelete(): void {
    if (!this.portraitToDelete || this.isDeleting) return;
    this.isDeleting = true;
    this.portraitsService.removePortrait(this.portraitToDelete.id).subscribe({
      next: () => this.loadPortraits(),
      error: () => {
        this.errorMessage = 'Suppression impossible pour le moment.';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.portraitToDelete = null;
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

