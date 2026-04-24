
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-signin-form',
  imports: [
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule
],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  showPassword = false;
  isChecked = false;
  isLoading = false;
  errorMessage = '';
  loginError = '';
  passwordError = '';

  email = '';
  password = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    if (this.isLoading) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.getApiErrorMessage(error);
      },
    });
  }

  private validateForm(): boolean {
    this.loginError = '';
    this.passwordError = '';

    const login = this.email.trim();
    const password = this.password.trim();

    if (!login) {
      this.loginError = 'Le login est obligatoire.';
    } else if (!this.isValidEmail(login)) {
      this.loginError = 'Le login doit etre un email valide.';
    }

    if (!password) {
      this.passwordError = 'Le mot de passe est obligatoire.';
    }

    return !this.loginError && !this.passwordError;
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private getApiErrorMessage(error: unknown): string {
    const apiMessage = (error as { error?: { message?: string | string[] } })?.error?.message;
    if (Array.isArray(apiMessage)) {
      return apiMessage.join(', ');
    }
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }
    return 'Identifiants invalides.';
  }
}
