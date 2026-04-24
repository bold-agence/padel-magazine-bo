import { Component } from '@angular/core';
import { SidebarService } from '../../../services/sidebar.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-backdrop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-backdrop.component.html',
})
export class AdminBackdropComponent {
  readonly isMobileOpen$;

  constructor(private sidebarService: SidebarService) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  closeSidebar() {
    this.sidebarService.setMobileOpen(false);
  }
}
