import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarService } from '../../../services/sidebar.service';
import { SafeHtmlPipe } from '../../../pipe/safe-html.pipe';
import { AdminSidebarWidgetComponent } from './admin-sidebar-widget.component';
import { AuthService } from '../../../../core/services/auth.service';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  subItems?: { name: string; path: string }[];
};

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe,
    AdminSidebarWidgetComponent,
  ],
  templateUrl: './admin-sidebar.component.html',
})
export class AdminSidebarComponent implements OnInit {
  navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM12.75 15C12.75 13.7574 13.7574 12.75 15 12.75H18.5C19.7426 12.75 20.75 13.7574 20.75 15V18.5C20.75 19.7426 19.7426 20.75 18.5 20.75H15C13.7574 20.75 12.75 19.7427 12.75 18.5V15Z" fill="currentColor"></path></svg>`,
    },
    {
      name: 'Articles',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M7 6.75H17M7 12H17M7 17.25H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="2.25" stroke="currentColor" stroke-width="1.5"/></svg>`,
      subItems: [
        { name: 'Categories', path: '/admin/articles/categories' },
        { name: 'Tags', path: '/admin/articles/tags' },
        { name: 'Liste des articles', path: '/admin/articles' },
        { name: 'Creer un article', path: '/admin/articles/create' },
      ],
    },
    {
      name: 'Breaking News & Pubs',
      path: '/admin/client-content',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M4.75 7.75C4.75 6.50736 5.75736 5.5 7 5.5H17C18.2426 5.5 19.25 6.50736 19.25 7.75V16.25C19.25 17.4926 18.2426 18.5 17 18.5H7C5.75736 18.5 4.75 17.4926 4.75 16.25V7.75Z" stroke="currentColor" stroke-width="1.5"/><path d="M8 9.5H16M8 12.5H13M8 15.5H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    },
    {
      name: 'Newsletter',
      path: '/admin/newsletter/inscriptions',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><rect x="3.75" y="5.75" width="16.5" height="14.5" rx="2.25" stroke="currentColor" stroke-width="1.5"/><path d="M3.75 8.25L12 13.25L20.25 8.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      name: 'Joueurs',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M12 9.25C10.4812 9.25 9.25 10.4812 9.25 12C9.25 13.5188 10.4812 14.75 12 14.75C13.5188 14.75 14.75 13.5188 14.75 12C14.75 10.4812 13.5188 9.25 12 9.25Z" stroke="currentColor" stroke-width="1.5"/><path d="M19.25 12C19.25 11.5094 19.2098 11.0283 19.1326 10.5599L21 9.25L19.25 6.25L17.11 6.86C16.3899 6.25316 15.5452 5.78902 14.625 5.5L14.25 3.25H9.75L9.375 5.5C8.4548 5.78902 7.61012 6.25316 6.89 6.86L4.75 6.25L3 9.25L4.8674 10.5599C4.79022 11.0283 4.75 11.5094 4.75 12C4.75 12.4906 4.79022 12.9717 4.8674 13.4401L3 14.75L4.75 17.75L6.89 17.14C7.61012 17.7468 8.4548 18.211 9.375 18.5L9.75 20.75H14.25L14.625 18.5C15.5452 18.211 16.3899 17.7468 17.11 17.14L19.25 17.75L21 14.75L19.1326 13.4401C19.2098 12.9717 19.25 12.4906 19.25 12Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      subItems: [
        {
          name: 'Liste des joueurs',
          path: '/admin/settings/players',
        },
        {
          name: 'Clubs',
          path: '/admin/settings/clubs',
        },
        {
          name: 'Catégories portraits',
          path: '/admin/settings/portrait-categories',
        },
        {
          name: 'Portraits',
          path: '/admin/settings/portraits',
        },
      ],
    },
    {
      name: 'Résultats',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M6.75 18.25V10.75M12 18.25V5.75M17.25 18.25V13.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="3.75" y="3.75" width="16.5" height="16.5" rx="2.25" stroke="currentColor" stroke-width="1.5"/></svg>`,
      subItems: [
        {
          name: 'Types de résultats',
          path: '/admin/resultats/classements',
        },
        {
          name: 'Derniers résultats',
          path: '/admin/resultats/derniers-resultats',
        },
        {
          name: 'Top 10 Premier Padel',
          path: '/admin/resultats/premier-padel',
        },
      ],
    },
    {
      name: 'Évènements',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><rect x="3.75" y="5.75" width="16.5" height="14.5" rx="2.25" stroke="currentColor" stroke-width="1.5"/><path d="M3.75 9.75H20.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 3.75V7.25M16 3.75V7.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      subItems: [
        { name: 'Tournois', path: '/admin/evenements/tournois' },
        { name: 'Liste évènements', path: '/admin/evenements/liste' },
        { name: 'Tags événements', path: '/admin/evenements/tags' },
      ],
    },
    {
      name: 'Classements',
      path: '/admin/classements',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M7 7.5H17M7 12H15M7 16.5H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="4.75" y="4.75" width="14.5" height="14.5" rx="2.25" stroke="currentColor" stroke-width="1.5"/></svg>`,
    },
    {
      name: 'Live',
      path: '/admin/live',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M5.5 12C5.5 8.41015 8.41015 5.5 12 5.5M18.5 12C18.5 15.5899 15.5899 18.5 12 18.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3.75 12C3.75 7.44365 7.44365 3.75 12 3.75M20.25 12C20.25 16.5563 16.5563 20.25 12 20.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    },
    {
      name: 'Videos',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><rect x="4.75" y="6.75" width="10.5" height="10.5" rx="2.25" stroke="currentColor" stroke-width="1.5"/><path d="M10.25 10.2V13.8L13.2 12L10.25 10.2Z" fill="currentColor"/><path d="M15.25 10.25L18.75 8.5V15.5L15.25 13.75V10.25Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      subItems: [
        { name: 'Types de vidéo', path: '/admin/settings/video-types' },
        { name: 'Vidéos (site)', path: '/admin/settings/site-videos' },
      ],
    },
    {
      name: 'A propos & Contact',
      path: '/admin/apropos',
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.5"/><path d="M12 16.25V11.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="8.75" r="0.75" fill="currentColor"/></svg>`,
    },
  ];
  openSubmenu: string | null = null;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private authService: AuthService,
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit(): void {
    this.syncOpenSubmenu();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.syncOpenSubmenu());
  }

  private syncOpenSubmenu(): void {
    const url = this.router.url.split('?')[0];
    for (const item of this.navItems) {
      if (
        item.subItems?.some(
          (sub) => url === sub.path || url.startsWith(`${sub.path}/`),
        )
      ) {
        this.openSubmenu = item.name;
        return;
      }
    }
  }

  isActive(path: string): boolean {
    if (path === '/admin') {
      return this.router.url === '/admin';
    }

    return this.router.url === path || this.router.url.startsWith(`${path}/`);
  }

  isSubItemActive(path: string): boolean {
    return this.isActive(path);
  }

  hasActiveSubItems(item: NavItem): boolean {
    return !!item.subItems?.some((subItem) => this.isSubItemActive(subItem.path));
  }

  toggleSubmenu(name: string) {
    this.openSubmenu = this.openSubmenu === name ? null : name;
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe((expanded) => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  onNavClick() {
    this.isMobileOpen$.subscribe((isMobile) => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }

  logout() {
    this.authService.logout();
    this.sidebarService.setMobileOpen(false);
    this.router.navigate(['/signin']);
  }
}
