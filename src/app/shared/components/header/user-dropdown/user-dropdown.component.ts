import { Component } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService, AuthUser } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent {
  isOpen = false;
  userName = 'Utilisateur';
  userEmail = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.loadCurrentUser();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  logout() {
    this.authService.logout();
    this.closeDropdown();
    this.router.navigate(['/signin']);
  }

  private loadCurrentUser() {
    this.authService.me().subscribe({
      next: (user: AuthUser) => {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
        this.userName = fullName || user.email || 'Utilisateur';
        this.userEmail = user.email ?? '';
      },
      error: () => {
        this.userName = 'Utilisateur';
        this.userEmail = '';
      },
    });
  }
}