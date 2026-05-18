import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { EventTag, EventTagsService } from '../../../../core/services/event-tags.service';

@Component({
  selector: 'app-event-tags',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './event-tags.component.html',
})
export class EventTagsComponent implements OnInit {
  tags: EventTag[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  isCreateModalOpen = false;
  createValue = '';
  isRenameModalOpen = false;
  selectedTag: EventTag | null = null;
  renameValue = '';

  constructor(private readonly eventTagsService: EventTagsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventTagsService.findAll().subscribe({
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
    if (this.isSaving) return;
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
    this.eventTagsService.create({ name }).subscribe({
      next: () => {
        this.isSaving = false;
        this.isCreateModalOpen = false;
        this.successMessage = `Tag « ${name} » créé.`;
        this.loadData();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Impossible de créer ce tag.';
      },
    });
  }

  openRenameModal(tag: EventTag): void {
    this.selectedTag = tag;
    this.renameValue = tag.name;
    this.errorMessage = '';
    this.isRenameModalOpen = true;
  }

  closeRenameModal(): void {
    if (this.isSaving) return;
    this.isRenameModalOpen = false;
    this.selectedTag = null;
    this.renameValue = '';
  }

  renameTag(): void {
    if (!this.selectedTag || this.isSaving) return;

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

    this.eventTagsService.update(this.selectedTag.id, { name: newName }).subscribe({
      next: () => {
        this.isSaving = false;
        this.isRenameModalOpen = false;
        this.selectedTag = null;
        this.renameValue = '';
        this.successMessage = `Tag « ${oldName} » renommé en « ${newName} ».`;
        this.loadData();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Impossible de renommer ce tag.';
      },
    });
  }

  deleteTag(tag: EventTag): void {
    if (this.isSaving) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.eventTagsService.remove(tag.id).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = `Tag « ${tag.name} » supprimé.`;
        this.loadData();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Impossible de supprimer ce tag.';
      },
    });
  }
}
