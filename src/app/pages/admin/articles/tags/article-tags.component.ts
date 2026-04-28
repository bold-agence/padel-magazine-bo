import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { ArticleTag, ArticlesService } from '../../../../core/services/articles.service';

@Component({
  selector: 'app-article-tags',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './article-tags.component.html',
})
export class ArticleTagsComponent implements OnInit {
  tags: ArticleTag[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  isCreateModalOpen = false;
  createValue = '';
  isRenameModalOpen = false;
  selectedTag: ArticleTag | null = null;
  renameValue = '';

  constructor(private readonly articlesService: ArticlesService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.articlesService.findAllTags().subscribe({
      next: (tags) => {
        this.tags = tags;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les tags.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.createValue = '';
    this.errorMessage = '';
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    if (this.isSaving) {
      return;
    }
    this.isCreateModalOpen = false;
    this.createValue = '';
  }

  createTag(): void {
    const name = this.createValue.trim();
    if (!name || this.isSaving) {
      this.errorMessage = 'Le nom du tag est obligatoire.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.articlesService.createTag({ name }).subscribe({
      next: () => {
        this.isSaving = false;
        this.isCreateModalOpen = false;
        this.successMessage = `Tag "${name}" cree.`;
        this.loadData();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Impossible de creer ce tag.';
      },
    });
  }

  openRenameModal(tag: ArticleTag): void {
    this.selectedTag = tag;
    this.renameValue = tag.name;
    this.errorMessage = '';
    this.isRenameModalOpen = true;
  }

  closeRenameModal(): void {
    if (this.isSaving) {
      return;
    }
    this.isRenameModalOpen = false;
    this.selectedTag = null;
    this.renameValue = '';
  }

  renameTag(): void {
    if (!this.selectedTag || this.isSaving) {
      return;
    }

    const oldName = this.selectedTag.name;
    const newName = this.renameValue.trim();
    if (!newName) {
      this.errorMessage = 'Le nouveau nom du tag est obligatoire.';
      return;
    }
    if (newName === oldName) {
      this.closeRenameModal();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.articlesService.updateTag(this.selectedTag.id, { name: newName }).subscribe({
      next: () => {
        this.isSaving = false;
        this.isRenameModalOpen = false;
        this.selectedTag = null;
        this.renameValue = '';
        this.successMessage = `Tag "${oldName}" renomme en "${newName}".`;
        this.loadData();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Impossible de renommer ce tag.';
      },
    });
  }

  deleteTag(tag: ArticleTag): void {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.articlesService.removeTag(tag.id).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = `Tag "${tag.name}" supprime.`;
        this.loadData();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Impossible de supprimer ce tag.';
      },
    });
  }
}
