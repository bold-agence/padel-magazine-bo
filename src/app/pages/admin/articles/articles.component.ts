import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import {
  Article,
  ArticleCategory,
  ArticleSection,
  ArticleTag,
  ArticlesService,
  CreateArticlePayload,
} from '../../../core/services/articles.service';

type ArticleForm = {
  isVisible: boolean;
  title: string;
  slug: string;
  author: string;
  date: string;
  readingTime: string;
  bannerImage: string;
  categoryId: string;
};

type SectionType =
  | 'paragraph'
  | 'heading'
  | 'quote'
  | 'image'
  | 'spacer'
  | 'info_box';

type SectionForm = {
  type: SectionType;
  order: number;
  content: string;
  headingLevel: number | null;
  imageUrl: string;
  imageCaption: string;
  quoteAuthor: string;
  spacerHeight: number | null;
};

@Component({
  selector: 'app-admin-articles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    ModalComponent,
    InputFieldComponent,
    LabelComponent,
  ],
  templateUrl: './articles.component.html',
})
export class ArticlesComponent implements OnInit {
  articles: Article[] = [];
  categories: ArticleCategory[] = [];
  allTags: ArticleTag[] = [];
  isLoading = false;
  isLoadingCategories = false;
  isLoadingTags = false;
  isModalOpen = false;
  isSaving = false;
  isDeleteModalOpen = false;
  isDeleting = false;
  articleToDelete: Article | null = null;
  modalMode: 'create' | 'edit' = 'create';
  editingArticleId: string | null = null;
  errorMessage = '';
  modalErrorMessage = '';
  readonly sectionTypes: SectionType[] = [
    'paragraph',
    'heading',
    'quote',
    'image',
    'spacer',
    'info_box',
  ];

  form: ArticleForm = this.getEmptyForm();
  sections: SectionForm[] = [];
  selectedTags: string[] = [];
  tagInput = '';

  constructor(
    private readonly articlesService: ArticlesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadArticles();
    this.loadCategories();
    this.loadTags();
  }

  loadArticles(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.articlesService.findAll().subscribe({
      next: (articles) => {
        this.articles = articles;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les articles.';
        this.isLoading = false;
      },
    });
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.articlesService.findAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoadingCategories = false;
      },
      error: () => {
        this.isLoadingCategories = false;
      },
    });
  }

  loadTags(): void {
    this.isLoadingTags = true;
    this.articlesService.findAllTags().subscribe({
      next: (tags) => {
        this.allTags = tags;
        this.isLoadingTags = false;
      },
      error: () => {
        this.isLoadingTags = false;
      },
    });
  }

  openCreateModal(): void {
    this.router.navigate(['/admin/articles/create']);
  }

  openEditModal(article: Article): void {
    this.modalMode = 'edit';
    this.editingArticleId = article.id;
    this.form = {
      isVisible: article.isVisible,
      title: article.title,
      slug: article.slug,
      author: article.author,
      date: this.toDateInputValue(article.date),
      readingTime: article.readingTime,
      bannerImage: article.bannerImage ?? '',
      categoryId: article.category?.id ?? '',
    };
    this.selectedTags = article.tags.map((tag) => tag.name);
    this.tagInput = '';
    this.sections = this.mapSectionsForForm(article.sections ?? []);
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

    const payload = this.buildPayloadFromForm();
    if (!payload) {
      return;
    }

    this.isSaving = true;
    this.modalErrorMessage = '';

    if (this.modalMode === 'create') {
      this.articlesService.create(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.isModalOpen = false;
          this.loadArticles();
        },
        error: (error: unknown) => {
          this.isSaving = false;
          this.modalErrorMessage = this.parseApiError(error);
        },
      });
      return;
    }

    if (!this.editingArticleId) {
      this.isSaving = false;
      this.modalErrorMessage = 'Article introuvable.';
      return;
    }

    this.articlesService.update(this.editingArticleId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isModalOpen = false;
        this.loadArticles();
      },
      error: (error: unknown) => {
        this.isSaving = false;
        this.modalErrorMessage = this.parseApiError(error);
      },
    });
  }

  openDeleteModal(article: Article): void {
    this.articleToDelete = article;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) {
      return;
    }
    this.isDeleteModalOpen = false;
    this.articleToDelete = null;
  }

  confirmDeleteArticle(): void {
    if (!this.articleToDelete || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.articlesService.remove(this.articleToDelete.id).subscribe({
      next: () => this.loadArticles(),
      error: () => {
        this.errorMessage = 'Suppression impossible pour le moment.';
        this.isDeleting = false;
      },
      complete: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.articleToDelete = null;
      },
    });
  }

  onTitleChange(value: string | number): void {
    const title = String(value ?? '');
    this.form.title = title;
    this.form.slug = this.toSlug(title);
  }

  getTagsPreview(article: Article): string {
    if (!article.tags?.length) {
      return '-';
    }
    return article.tags.map((tag) => tag.name).join(', ');
  }

  getSuggestedTags(): string[] {
    const query = this.tagInput.trim().toLowerCase();
    return this.allTags
      .map((tag) => tag.name)
      .filter((name) => !this.selectedTags.includes(name))
      .filter((name) => !query || name.toLowerCase().includes(query))
      .slice(0, 8);
  }

  addTagFromInput(): void {
    const value = this.tagInput.trim();
    if (!value) return;
    this.addTag(value);
    this.tagInput = '';
  }

  addExistingTag(name: string): void {
    this.addTag(name);
    this.tagInput = '';
  }

  removeTag(name: string): void {
    this.selectedTags = this.selectedTags.filter((tag) => tag !== name);
  }

  private addTag(name: string): void {
    const normalized = name.trim();
    if (!normalized || this.selectedTags.includes(normalized)) {
      return;
    }
    this.selectedTags = [...this.selectedTags, normalized];
  }

  addSection(type: SectionType = 'paragraph'): void {
    const nextOrder = this.sections.length;
    const section = this.createDefaultSection(nextOrder);
    section.type = type;
    this.sections.push(section);
  }

  removeSection(index: number): void {
    this.sections.splice(index, 1);
    this.reindexSections();
  }

  moveSectionUp(index: number): void {
    if (index <= 0) {
      return;
    }
    const current = this.sections[index];
    this.sections[index] = this.sections[index - 1];
    this.sections[index - 1] = current;
    this.reindexSections();
  }

  moveSectionDown(index: number): void {
    if (index >= this.sections.length - 1) {
      return;
    }
    const current = this.sections[index];
    this.sections[index] = this.sections[index + 1];
    this.sections[index + 1] = current;
    this.reindexSections();
  }

  onSectionTypeChange(index: number): void {
    const current = this.sections[index];
    this.sections[index] = {
      ...this.createDefaultSection(current.order),
      type: current.type,
      content: current.content,
    };
  }

  private buildPayloadFromForm(): CreateArticlePayload | null {
    const title = this.form.title.trim();
    const slug = this.form.slug.trim();
    const author = this.form.author.trim();
    const date = this.form.date.trim();
    const readingTime = this.form.readingTime.trim();

    if (!title || !slug || !author || !date || !readingTime) {
      this.modalErrorMessage = 'Les champs titre, slug, auteur, date et lecture sont obligatoires.';
      return null;
    }

    const tags = this.selectedTags.map((tag) => tag.trim()).filter(Boolean);

    const sections: ArticleSection[] = this.sections.map((section, index) => ({
      type: section.type,
      order: index,
      content: section.content.trim() || undefined,
      headingLevel: section.headingLevel ?? undefined,
      imageUrl: section.imageUrl.trim() || undefined,
      imageCaption: section.imageCaption.trim() || undefined,
      quoteAuthor: section.quoteAuthor.trim() || undefined,
      spacerHeight: section.spacerHeight ?? undefined,
    }));

    return {
      isVisible: this.form.isVisible,
      title,
      slug,
      author,
      date,
      readingTime,
      bannerImage: this.form.bannerImage.trim() || undefined,
      categoryId: this.form.categoryId.trim() || undefined,
      tags,
      sections,
    };
  }

  private getEmptyForm(): ArticleForm {
    return {
      isVisible: true,
      title: '',
      slug: '',
      author: '',
      date: '',
      readingTime: '',
      bannerImage: '',
      categoryId: '',
    };
  }

  private createDefaultSection(order: number): SectionForm {
    return {
      type: 'paragraph',
      order,
      content: '',
      headingLevel: 2,
      imageUrl: '',
      imageCaption: '',
      quoteAuthor: '',
      spacerHeight: 24,
    };
  }

  private mapSectionsForForm(sections: ArticleSection[]): SectionForm[] {
    if (!sections.length) {
      return [this.createDefaultSection(0)];
    }

    const sorted = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sorted.map((section, index) => ({
      type: (section.type as SectionType) ?? 'paragraph',
      order: index,
      content: section.content ?? '',
      headingLevel: section.headingLevel ?? 2,
      imageUrl: section.imageUrl ?? '',
      imageCaption: section.imageCaption ?? '',
      quoteAuthor: section.quoteAuthor ?? '',
      spacerHeight: section.spacerHeight ?? 24,
    }));
  }

  private reindexSections(): void {
    this.sections = this.sections.map((section, index) => ({
      ...section,
      order: index,
    }));
  }

  private toDateInputValue(value: string): string {
    return value ? value.slice(0, 10) : '';
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
