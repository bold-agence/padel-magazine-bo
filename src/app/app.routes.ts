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

export const routes: Routes = [
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
    ],
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Page introuvable | Padel Magazine Admin'
  },
];
