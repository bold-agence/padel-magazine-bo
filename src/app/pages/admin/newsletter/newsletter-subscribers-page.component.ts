import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import {
  NewsletterSubscriber,
  NewsletterSubscribersService,
} from '../../../core/services/newsletter-subscribers.service';

@Component({
  selector: 'app-newsletter-subscribers-page',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './newsletter-subscribers-page.component.html',
})
export class NewsletterSubscribersPageComponent implements OnInit {
  items: NewsletterSubscriber[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly newsletterSubscribersService: NewsletterSubscribersService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get totalCount(): number {
    return this.items.length;
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.newsletterSubscribersService.findAll().subscribe({
      next: (items) => {
        this.items = items ?? [];
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage =
            'Session expirée. Reconnectez-vous pour consulter les inscriptions.';
        } else if (err.status === 0) {
          this.errorMessage =
            'Impossible de joindre l’API. Vérifiez que le serveur est démarré.';
        } else {
          this.errorMessage =
            'Impossible de charger les inscriptions newsletter.';
        }
      },
    });
  }
}
