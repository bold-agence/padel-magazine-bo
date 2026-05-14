import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { AdminLayoutComponent } from './shared/layout/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin/dashboard/admin-dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { PlayersComponent } from './pages/admin/settings/players/players.component';
import { ClubsComponent } from './pages/admin/settings/clubs/clubs.component';
import { PortraitCategoriesComponent } from './pages/admin/settings/portraits/portrait-categories.component';
import { PortraitsComponent } from './pages/admin/settings/portraits/portraits.component';
import { ArticlesComponent } from './pages/admin/articles/articles.component';
import { ArticleTagsComponent } from './pages/admin/articles/tags/article-tags.component';
import { CreateArticleComponent } from './pages/admin/articles/create-article.component';
import { ArticleCategoriesComponent } from './pages/admin/articles/categories/article-categories.component';
import { ClientContentComponent } from './pages/admin/client-content/client-content.component';
import { ClassementsPageComponent } from './pages/admin/classements/classements-page.component';
import { VideoTypesPageComponent } from './pages/admin/settings/video-types/video-types-page.component';
import { SiteVideosPageComponent } from './pages/admin/settings/site-videos/site-videos-page.component';
import { FipRankingsPageComponent } from './pages/admin/resultats/fip-rankings/fip-rankings-page.component';
import { LatestResultScopesPageComponent } from './pages/admin/resultats/latest-result-scopes/latest-result-scopes-page.component';
import { LatestResultsPageComponent } from './pages/admin/resultats/latest-results/latest-results-page.component';
import { TournamentsComponent } from './pages/admin/evenements/tournaments/tournaments.component';
import { EventsListComponent } from './pages/admin/evenements/events-list/events-list.component';
import { LiveComponent } from './pages/admin/live/live.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'admin',
  },
  /*
  {
    path:'',
    component:AppLayoutComponent,
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'Dashboard | Padel Magazine Admin',
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Calendrier | Padel Magazine Admin'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Profil | Padel Magazine Admin'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Formulaires | Padel Magazine Admin'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Tables | Padel Magazine Admin'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Page vide | Padel Magazine Admin'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Facture | Padel Magazine Admin'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Graphique en ligne | Padel Magazine Admin'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Graphique en barres | Padel Magazine Admin'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Alertes | Padel Magazine Admin'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Avatars | Padel Magazine Admin'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Badges | Padel Magazine Admin'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Boutons | Padel Magazine Admin'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Images | Padel Magazine Admin'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Videos | Padel Magazine Admin'
      },
    ]
  },
  */
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Connexion | Padel Magazine Admin'
  },
  {
    path:'signup',
    component:SignUpComponent,
    title:'Inscription | Padel Magazine Admin'
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        component: AdminDashboardComponent,
        pathMatch: 'full',
        title: 'Admin Dashboard | Padel Magazine',
      },
      {
        path: 'settings/players',
        component: PlayersComponent,
        title: 'Parametres - Joueurs | Padel Magazine Admin',
      },
      {
        path: 'settings/clubs',
        component: ClubsComponent,
        title: 'Parametres - Clubs | Padel Magazine Admin',
      },
      {
        path: 'settings/portrait-categories',
        component: PortraitCategoriesComponent,
        title: 'Parametres - Categories de portraits | Padel Magazine Admin',
      },
      {
        path: 'settings/portraits',
        component: PortraitsComponent,
        title: 'Parametres - Portraits | Padel Magazine Admin',
      },
      {
        path: 'settings/video-types',
        component: VideoTypesPageComponent,
        title: 'Parametres - Types de video | Padel Magazine Admin',
      },
      {
        path: 'settings/site-videos',
        component: SiteVideosPageComponent,
        title: 'Parametres - Videos site | Padel Magazine Admin',
      },
      {
        path: 'articles',
        component: ArticlesComponent,
        title: 'Articles | Padel Magazine Admin',
      },
      {
        path: 'articles/create',
        component: CreateArticleComponent,
        title: 'Creer un article | Padel Magazine Admin',
      },
      {
        path: 'articles/:id/edit',
        component: CreateArticleComponent,
        title: 'Modifier un article | Padel Magazine Admin',
      },
      {
        path: 'articles/tags',
        component: ArticleTagsComponent,
        title: 'Tags des articles | Padel Magazine Admin',
      },
      {
        path: 'articles/categories',
        component: ArticleCategoriesComponent,
        title: 'Categories des articles | Padel Magazine Admin',
      },
      {
        path: 'client-content',
        component: ClientContentComponent,
        title: 'Breaking News & Pubs | Padel Magazine Admin',
      },
      {
        path: 'resultats/classements',
        component: LatestResultScopesPageComponent,
        title: 'Résultats - Classements | Padel Magazine Admin',
      },
      {
        path: 'resultats/derniers-resultats',
        component: LatestResultsPageComponent,
        title: 'Résultats - Derniers résultats | Padel Magazine Admin',
      },
      {
        path: 'resultats/premier-padel',
        component: FipRankingsPageComponent,
        title: 'Résultats - Top 10 Premier Padel | Padel Magazine Admin',
      },
      {
        path: 'classements',
        component: ClassementsPageComponent,
        title: 'Classements | Padel Magazine Admin',
      },
      {
        path: 'evenements/tournois',
        component: TournamentsComponent,
        title: 'Evenements - Tournois | Padel Magazine Admin',
      },
      {
        path: 'evenements/liste',
        component: EventsListComponent,
        title: 'Evenements - Liste | Padel Magazine Admin',
      },
      {
        path: 'live',
        component: LiveComponent,
        title: 'Live | Padel Magazine Admin',
      },
    ],
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Page introuvable | Padel Magazine Admin'
  },
];
