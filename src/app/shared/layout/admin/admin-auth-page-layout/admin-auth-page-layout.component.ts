import { Component } from '@angular/core';
import { GridShapeComponent } from '../../../components/common/grid-shape/grid-shape.component';
import { RouterModule } from '@angular/router';
import { ThemeToggleTwoComponent } from '../../../components/common/theme-toggle-two/theme-toggle-two.component';

@Component({
  selector: 'app-admin-auth-page-layout',
  imports: [
    GridShapeComponent,
    RouterModule,
    ThemeToggleTwoComponent,
  ],
  templateUrl: './admin-auth-page-layout.component.html',
  styles: ``,
})
export class AdminAuthPageLayoutComponent {}
