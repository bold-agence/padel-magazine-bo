import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../../shared/components/form/label/label.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import {
  Tournament,
  TournamentsService,
} from '../../../../core/services/tournaments.service';
import {
  TournamentCategoriesService,
  TournamentCategoryApiItem,
} from '../../../../core/services/tournament-categories.service';
import {
  EventApiItem,
  EventPayload,
  EventsService,
} from '../../../../core/services/events.service';
import { EventTag, EventTagsService } from '../../../../core/services/event-tags.service';

export type EventItem = {
  id: string;
  title: string;
  slug: string;
  startAt: string; // ISO datetime (from API)
  endAt: string | null;
  venue: string;
  tournamentId: string | null;
  tournamentLabel: string | null;
  tournamentColor: string | null;
  tournamentCategoryId: string | null;
  tournamentCategoryLabel: string | null;
  descriptionHtml: string;
  coverImageUrl: string | null;
  tagNames: string[];
};

type EventForm = {
  title: string;
  slug: string;
  startAt: string; // value of <input type="datetime-local"> => YYYY-MM-DDTHH:mm (local)
  endAt: string;
  venue: string;
  tournamentId: string;
  tournamentCategoryId: string;
  descriptionHtml: string;
  coverImageFile: File | null;
  coverImageName: string;
  existingCoverImageUrl: string | null;
  coverPreviewUrl: string | null;
  removeCoverImage: boolean;
};

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxEditorModule,
    ButtonComponent,
    InputFieldComponent,
    LabelComponent,
    ModalComponent,
  ],
  templateUrl: './events-list.component.html',
})
export class EventsListComponent implements OnInit, OnDestroy {
  /** Slug du tournoi pour lequel on propose les catégories dans le formulaire. */
  private readonly premierPadelTournamentSlug = 'premier-padel';

  events: EventItem[] = [];
  tournaments: Tournament[] = [];
  tournamentCategoriesForForm: TournamentCategoryApiItem[] = [];
  isLoadingEventCategories = false;

  isLoading = false;
  errorMessage = '';

  viewMode: 'cards' | 'list' = 'cards';
  filterTournamentId = '';

  isLoadingTournaments = false;
  isModalOpen = false;
  isSaving = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;
  modalErrorMessage = '';

  isDeleteModalOpen = false;
  isDeleting = false;
  eventToDelete: EventItem | null = null;

  editor: Editor | null = null;
  readonly editorToolbar: Toolbar = [
    ['bold', 'italic', 'underline'],
    ['ordered_list', 'bullet_list'],
    ['link'],
    ['blockquote'],
  ];

  form: EventForm = this.createEmptyForm();
  allTags: EventTag[] = [];
  isLoadingTags = false;
  selectedTags: string[] = [];
  tagInput = '';

  constructor(
    private readonly eventsService: EventsService,
    private readonly eventTagsService: EventTagsService,
    private readonly tournamentsService: TournamentsService,
    private readonly tournamentCategoriesService: TournamentCategoriesService,
  ) {}

  ngOnInit(): void {
    this.editor = new Editor();
    this.loadTournaments();
    this.loadTags();
    this.loadEvents();
  }

  loadTags(): void {
    this.isLoadingTags = true;
    this.eventTagsService.findAll().subscribe({
      next: (tags) => {
        this.allTags = tags;
        this.isLoadingTags = false;
      },
      error: () => {
        this.allTags = [];
        this.isLoadingTags = false;
      },
    });
  }

  getSuggestedTags(): string[] {
    const selected = new Set(this.selectedTags);
    return this.allTags
      .map((t) => t.name)
      .filter((name) => !selected.has(name));
  }

  addTagFromInput(): void {
    const name = this.tagInput.trim();
    if (!name) return;
    if (!this.selectedTags.includes(name)) {
      this.selectedTags = [...this.selectedTags, name];
    }
    this.tagInput = '';
  }

  addExistingTag(name: string): void {
    if (!this.selectedTags.includes(name)) {
      this.selectedTags = [...this.selectedTags, name];
    }
  }

  removeTag(name: string): void {
    this.selectedTags = this.selectedTags.filter((t) => t !== name);
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
    this.revokeCoverPreview();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.eventsService
      .findAll({ tournamentId: this.filterTournamentId || null })
      .subscribe({
        next: (list) => {
          this.events = list.map((item) => this.mapApiToItem(item));
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = this.parseApiError(
            err,
            'Impossible de charger les évènements.',
          );
          this.events = [];
          this.isLoading = false;
        },
      });
  }

  setFilterTournament(tournamentId: string): void {
    if (this.filterTournamentId === tournamentId) return;
    this.filterTournamentId = tournamentId;
    this.loadEvents();
  }

  setViewMode(mode: 'cards' | 'list'): void {
    this.viewMode = mode;
  }

  loadTournaments(): void {
    this.isLoadingTournaments = true;
    this.tournamentsService.findAll().subscribe({
      next: (list) => {
        this.tournaments = list;
        this.isLoadingTournaments = false;
      },
      error: () => {
        this.tournaments = [];
        this.isLoadingTournaments = false;
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.form = this.createEmptyForm();
    this.selectedTags = [];
    this.tagInput = '';
    this.tournamentCategoriesForForm = [];
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(event: EventItem): void {
    this.modalMode = 'edit';
    this.editingId = event.id;
    this.revokeCoverPreview();
    this.form = {
      title: event.title,
      slug: event.slug,
      startAt: this.toLocalInputValue(event.startAt),
      endAt: event.endAt ? this.toLocalInputValue(event.endAt) : '',
      venue: event.venue,
      tournamentId: event.tournamentId ?? '',
      tournamentCategoryId: event.tournamentCategoryId ?? '',
      descriptionHtml: event.descriptionHtml,
      coverImageFile: null,
      coverImageName: '',
      existingCoverImageUrl: event.coverImageUrl,
      coverPreviewUrl: null,
      removeCoverImage: false,
    };
    this.selectedTags = [...event.tagNames];
    this.tagInput = '';
    this.modalErrorMessage = '';
    this.syncTournamentCategoriesForModal();
    this.isModalOpen = true;
  }

  onSelectTournamentForEvent(tournamentId: string): void {
    this.form.tournamentId = tournamentId;
    if (!tournamentId) {
      this.form.tournamentCategoryId = '';
      this.tournamentCategoriesForForm = [];
      this.isLoadingEventCategories = false;
      return;
    }
    const t = this.tournaments.find((x) => x.id === tournamentId);
    if (t?.slug !== this.premierPadelTournamentSlug) {
      this.form.tournamentCategoryId = '';
      this.tournamentCategoriesForForm = [];
      this.isLoadingEventCategories = false;
      return;
    }
    this.loadTournamentCategoriesForForm(tournamentId);
  }

  isPremierPadelFormTournament(): boolean {
    const t = this.tournaments.find((x) => x.id === this.form.tournamentId);
    return !!t && t.slug === this.premierPadelTournamentSlug;
  }

  onTitleChange(value: string | number): void {
    const title = String(value ?? '');
    this.form.title = title;
    if (this.modalMode === 'create') {
      this.form.slug = this.toSlug(title);
    }
  }

  private toSlug(value: string): string {
    return (value || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.isModalOpen = false;
  }

  submitModal(): void {
    if (this.isSaving) return;

    const title = this.form.title.trim();
    const slug = (this.form.slug || this.toSlug(title)).trim();
    const venue = this.form.venue.trim();
    const startAtLocal = this.form.startAt;
    const endAtLocal = this.form.endAt || '';

    if (!title) {
      this.modalErrorMessage = 'Le titre est obligatoire.';
      return;
    }
    if (!slug) {
      this.modalErrorMessage = 'Le slug est obligatoire.';
      return;
    }
    if (!startAtLocal) {
      this.modalErrorMessage = 'La date et l’heure de début sont obligatoires.';
      return;
    }
    if (!venue) {
      this.modalErrorMessage = 'Le lieu est obligatoire.';
      return;
    }
    if (
      endAtLocal &&
      new Date(endAtLocal).getTime() < new Date(startAtLocal).getTime()
    ) {
      this.modalErrorMessage =
        'La date de fin doit être postérieure à la date de début.';
      return;
    }

    const selectedTournament = this.tournaments.find(
      (t) => t.id === this.form.tournamentId,
    );
    const isPremierPadel =
      !!selectedTournament &&
      selectedTournament.slug === this.premierPadelTournamentSlug;
    const tournamentCategoryId =
      this.form.tournamentId &&
      isPremierPadel &&
      this.form.tournamentCategoryId.trim()
        ? this.form.tournamentCategoryId.trim()
        : null;

    const payload: EventPayload = {
      title,
      slug,
      startAt: this.toApiIso(startAtLocal),
      endAt: endAtLocal ? this.toApiIso(endAtLocal) : null,
      venue,
      tournamentId: this.form.tournamentId || null,
      tournamentCategoryId,
      descriptionHtml: this.form.descriptionHtml ?? '',
      tags: this.selectedTags.map((t) => t.trim()).filter(Boolean),
    };

    this.isSaving = true;
    this.modalErrorMessage = '';

    if (this.modalMode === 'create') {
      this.eventsService
        .create(payload, this.form.coverImageFile)
        .subscribe({
          next: (created) => {
            this.events = [this.mapApiToItem(created), ...this.events];
            this.isSaving = false;
            this.isModalOpen = false;
          },
          error: (err: HttpErrorResponse) => {
            this.modalErrorMessage = this.parseApiError(
              err,
              "Impossible de créer l'évènement.",
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

    this.eventsService
      .update(this.editingId, payload, {
        coverImageFile: this.form.coverImageFile,
        removeCoverImage: this.form.removeCoverImage,
      })
      .subscribe({
        next: (updated) => {
          const mapped = this.mapApiToItem(updated);
          this.events = this.events.map((ev) =>
            ev.id === mapped.id ? mapped : ev,
          );
          this.isSaving = false;
          this.isModalOpen = false;
        },
        error: (err: HttpErrorResponse) => {
          this.modalErrorMessage = this.parseApiError(
            err,
            "Impossible de mettre à jour l'évènement.",
          );
          this.isSaving = false;
        },
      });
  }

  openDeleteModal(event: EventItem): void {
    this.eventToDelete = event;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.eventToDelete = null;
  }

  confirmDelete(): void {
    if (!this.eventToDelete || this.isDeleting) return;
    this.isDeleting = true;
    const idToRemove = this.eventToDelete.id;

    this.eventsService.remove(idToRemove).subscribe({
      next: () => {
        this.events = this.events.filter((ev) => ev.id !== idToRemove);
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.eventToDelete = null;
      },
      error: (err: HttpErrorResponse) => {
        this.modalErrorMessage = this.parseApiError(
          err,
          "Impossible de supprimer l'évènement.",
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

  formatStartDate(event: EventItem): string {
    const d = new Date(event.startAt);
    if (Number.isNaN(d.getTime())) return event.startAt;
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  formatEndDate(event: EventItem): string | null {
    if (!event.endAt) return null;
    const d = new Date(event.endAt);
    if (Number.isNaN(d.getTime())) return event.endAt;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  private mapApiToItem(item: EventApiItem): EventItem {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      startAt: item.startAt,
      endAt: item.endAt ?? null,
      venue: item.venue,
      tournamentId: item.tournament?.id ?? null,
      tournamentLabel: item.tournament?.label ?? null,
      tournamentColor: item.tournament?.colorCode ?? null,
      tournamentCategoryId: item.tournamentCategory?.id ?? null,
      tournamentCategoryLabel: item.tournamentCategory?.label ?? null,
      descriptionHtml: item.descriptionHtml ?? '',
      coverImageUrl: item.coverImageUrl ?? null,
      tagNames: (item.tags ?? []).map((t) => t.name),
    };
  }

  private toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private toApiIso(localValue: string): string {
    // <input type="datetime-local"> returns "YYYY-MM-DDTHH:mm" interpreted as local time.
    const d = new Date(localValue);
    if (Number.isNaN(d.getTime())) return localValue;
    return d.toISOString();
  }

  private revokeCoverPreview(): void {
    if (this.form.coverPreviewUrl) {
      URL.revokeObjectURL(this.form.coverPreviewUrl);
    }
    this.form.coverPreviewUrl = null;
  }

  private createEmptyForm(): EventForm {
    return {
      title: '',
      slug: '',
      startAt: '',
      endAt: '',
      venue: '',
      tournamentId: '',
      tournamentCategoryId: '',
      descriptionHtml: '',
      coverImageFile: null,
      coverImageName: '',
      existingCoverImageUrl: null,
      coverPreviewUrl: null,
      removeCoverImage: false,
    };
  }

  private syncTournamentCategoriesForModal(): void {
    const tid = this.form.tournamentId;
    const t = this.tournaments.find((x) => x.id === tid);
    if (!tid || t?.slug !== this.premierPadelTournamentSlug) {
      this.tournamentCategoriesForForm = [];
      this.isLoadingEventCategories = false;
      return;
    }
    this.loadTournamentCategoriesForForm(tid);
  }

  private loadTournamentCategoriesForForm(tournamentId: string): void {
    this.isLoadingEventCategories = true;
    this.tournamentCategoriesService.findAll({ tournamentId }).subscribe({
      next: (list) => {
        this.tournamentCategoriesForForm = list;
        this.isLoadingEventCategories = false;
        if (
          this.form.tournamentCategoryId &&
          !list.some((c) => c.id === this.form.tournamentCategoryId)
        ) {
          this.form.tournamentCategoryId = '';
        }
      },
      error: () => {
        this.tournamentCategoriesForForm = [];
        this.isLoadingEventCategories = false;
      },
    });
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
