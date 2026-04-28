import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import {
  ArticleTag,
  ArticleCategory,
  ArticleSection,
  ArticlesService,
  CreateArticlePayload,
} from '../../../core/services/articles.service';

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

type CreateArticleForm = {
  isVisible: boolean;
  title: string;
  slug: string;
  author: string;
  date: string;
  readingTime: string;
  bannerImage: string;
  categoryId: string;
};

@Component({
  selector: 'app-admin-create-article',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputFieldComponent, LabelComponent],
  templateUrl: './create-article.component.html',
})
export class CreateArticleComponent implements OnInit {
  readonly sectionTypes: SectionType[] = [
    'paragraph',
    'heading',
    'quote',
    'image',
    'spacer',
    'info_box',
  ];

  isSaving = false;
  isLoadingCategories = false;
  isLoadingTags = false;
  errorMessage = '';
  successMessage = '';
  categories: ArticleCategory[] = [];
  allTags: ArticleTag[] = [];
  selectedTags: string[] = [];
  tagInput = '';

  form: CreateArticleForm = {
    isVisible: true,
    title: '',
    slug: '',
    author: '',
    date: '',
    readingTime: '',
    bannerImage: '',
    categoryId: '',
  };

  sections: SectionForm[] = [this.createDefaultSection(0)];

  constructor(
    private readonly articlesService: ArticlesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadTags();
  }

  onTitleChange(value: string | number): void {
    const title = String(value ?? '');
    this.form.title = title;
    this.form.slug = this.toSlug(title);
  }

  addSection(type: SectionType = 'paragraph'): void {
    const section = this.createDefaultSection(this.sections.length);
    section.type = type;
    this.sections.push(section);
  }

  removeSection(index: number): void {
    this.sections.splice(index, 1);
    this.reindexSections();
  }

  moveSectionUp(index: number): void {
    if (index <= 0) return;
    const current = this.sections[index];
    this.sections[index] = this.sections[index - 1];
    this.sections[index - 1] = current;
    this.reindexSections();
  }

  moveSectionDown(index: number): void {
    if (index >= this.sections.length - 1) return;
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

  submit(): void {
    if (this.isSaving) {
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.articlesService.create(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Article cree avec succes.';
        this.router.navigate(['/admin/articles']);
      },
      error: (error: unknown) => {
        this.isSaving = false;
        this.errorMessage = this.parseApiError(error);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/articles']);
  }

  private loadCategories(): void {
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

  private loadTags(): void {
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
    if (!value) {
      return;
    }
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
    if (!normalized) {
      return;
    }
    if (this.selectedTags.includes(normalized)) {
      return;
    }
    this.selectedTags = [...this.selectedTags, normalized];
  }

  private buildPayload(): CreateArticlePayload | null {
    const title = this.form.title.trim();
    const slug = this.form.slug.trim();
    const author = this.form.author.trim();
    const date = this.form.date.trim();
    const readingTime = this.form.readingTime.trim();

    if (!title || !slug || !author || !date || !readingTime) {
      this.errorMessage = 'Les champs titre, slug, auteur, date et lecture sont obligatoires.';
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

  private reindexSections(): void {
    this.sections = this.sections.map((section, index) => ({
      ...section,
      order: index,
    }));
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
