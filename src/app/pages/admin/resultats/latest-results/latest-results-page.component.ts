import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import {
  LatestResult,
  LatestResultCategory,
  LatestResultPayload,
  LatestResultScope,
  LatestResultsService,
} from '../../../../core/services/latest-results.service';

type ResultForm = {
  tournamentName: string;
  location: string;
  startDate: string;
  endDate: string;
  resultDate: string;
  round: string;
  winners: string;
  score: string;
  losers: string;
  category: LatestResultCategory;
  scopeId: string;
  isPublished: boolean;
};

@Component({
  selector: 'app-latest-results-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ModalComponent],
  templateUrl: './latest-results-page.component.html',
})
export class LatestResultsPageComponent implements OnInit {
  items: LatestResult[] = [];
  scopes: LatestResultScope[] = [];
  isLoading = false;
  isLoadingScopes = false;
  errorMessage = '';
  activeScopeFilter: string | 'all' = 'all';

  isModalOpen = false;
  isSaving = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: string | null = null;
  modalErrorMessage = '';
  form: ResultForm = this.createEmptyForm();

  isDeleteModalOpen = false;
  isDeleting = false;
  resultToDelete: LatestResult | null = null;

  constructor(private readonly latestResultsService: LatestResultsService) {}

  ngOnInit(): void {
    this.loadScopes();
    this.load();
  }

  get filteredItems(): LatestResult[] {
    if (this.activeScopeFilter === 'all') {
      return this.items;
    }
    return this.items.filter((item) => item.scope?.id === this.activeScopeFilter);
  }

  setScopeFilter(scopeId: string | 'all'): void {
    this.activeScopeFilter = scopeId;
  }

  loadScopes(): void {
    this.isLoadingScopes = true;
    this.latestResultsService.findScopesAdmin().subscribe({
      next: (scopes) => {
        this.scopes = scopes;
        if (!this.form.scopeId) {
          this.form.scopeId = this.defaultScopeId();
        }
        if (
          this.activeScopeFilter !== 'all' &&
          !this.scopes.some((scope) => scope.id === this.activeScopeFilter)
        ) {
          this.activeScopeFilter = 'all';
        }
        this.isLoadingScopes = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les classements de résultats.';
        this.isLoadingScopes = false;
      },
    });
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.latestResultsService.findAdmin().subscribe({
      next: (items) => {
        this.items = items;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les derniers résultats.';
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.form = this.createEmptyForm();
    this.modalErrorMessage = '';
    this.isModalOpen = true;
  }

  openEditModal(row: LatestResult): void {
    this.modalMode = 'edit';
    this.editingId = row.id;
    this.form = {
      tournamentName: row.tournamentName,
      location: row.location ?? '',
      startDate: row.startDate ?? '',
      endDate: row.endDate ?? '',
      resultDate: row.resultDate,
      round: row.round,
      winners: row.winners,
      score: row.score,
      losers: row.losers,
      category: row.category,
      scopeId: row.scope?.id ?? this.defaultScopeId(),
      isPublished: row.isPublished,
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
    const payload = this.buildPayload();
    if (!payload) return;

    this.isSaving = true;
    this.modalErrorMessage = '';
    const request$ =
      this.modalMode === 'edit' && this.editingId
        ? this.latestResultsService.update(this.editingId, payload)
        : this.latestResultsService.create(payload);

    request$.subscribe({
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

  openDeleteModal(row: LatestResult): void {
    this.resultToDelete = row;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.resultToDelete = null;
  }

  confirmDelete(): void {
    if (!this.resultToDelete || this.isDeleting) return;
    this.isDeleting = true;
    this.latestResultsService.remove(this.resultToDelete.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.errorMessage = 'Suppression impossible pour le moment.';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.resultToDelete = null;
      },
    });
  }

  categoryLabel(category: LatestResultCategory): string {
    const labels: Record<LatestResultCategory, string> = {
      men: 'Hommes',
      women: 'Femmes',
    };
    return labels[category] ?? category;
  }

  categoryColor(category: LatestResultCategory): string {
    const colors: Record<LatestResultCategory, string> = {
      men: '#df4548',
      women: '#f59e1b',
    };
    return colors[category] ?? colors.men;
  }

  scopeLabel(scope?: LatestResultScope | null): string {
    return scope?.name ?? 'Non classé';
  }

  periodLabel(row: LatestResult): string {
    if (row.startDate && row.endDate) {
      return this.formatPeriod(row.startDate, row.endDate);
    }
    return this.formatDate(row.resultDate);
  }

  private createEmptyForm(): ResultForm {
    return {
      tournamentName: '',
      location: '',
      startDate: '',
      endDate: '',
      resultDate: '',
      round: 'Finale',
      winners: '',
      score: '',
      losers: '',
      category: 'men',
      scopeId: this.defaultScopeId(),
      isPublished: true,
    };
  }

  private buildPayload(): LatestResultPayload | null {
    const tournamentName = this.form.tournamentName.trim();
    const round = this.form.round.trim();
    const winners = this.form.winners.trim();
    const score = this.form.score.trim();
    const losers = this.form.losers.trim();
    const resultDate = this.form.endDate || this.form.startDate || this.form.resultDate;

    if (!tournamentName || !this.form.startDate || !this.form.endDate || !round || !winners || !score || !losers || !this.form.scopeId) {
      this.modalErrorMessage =
        'Tournoi, période, classement, tour, vainqueurs, score et perdants sont obligatoires.';
      return null;
    }

    return {
      tournamentName,
      location: this.form.location.trim() || null,
      startDate: this.form.startDate || null,
      endDate: this.form.endDate || null,
      resultDate,
      round,
      winners,
      score,
      losers,
      category: this.form.category,
      scopeId: this.form.scopeId,
      isPublished: this.form.isPublished,
    };
  }

  private defaultScopeId(): string {
    return (
      this.scopes.find((scope) => scope.slug === 'international')?.id ??
      this.scopes[0]?.id ??
      ''
    );
  }

  private formatPeriod(startDate: string, endDate: string): string {
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    if (!start || !end) return `${startDate} - ${endDate}`;

    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return `${start.getDate()}-${this.formatDate(endDate)}`;
    }

    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  }

  private formatDate(value: string): string {
    const date = this.parseDate(value);
    if (!date) return value;
    const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
      .format(date)
      .replace('.', '');
    return `${date.getDate()} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
  }

  private parseDate(value: string): Date | null {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  private parseApiError(error: unknown): string {
    const message = (error as { error?: { message?: string | string[] } })?.error
      ?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
    return 'Une erreur est survenue.';
  }
}
