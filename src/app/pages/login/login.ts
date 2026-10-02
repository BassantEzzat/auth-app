import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    password: ['', [Validators.required]],
  });

  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly shake = signal(false);

  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
  }

  async submit(): Promise<void> {
    if (this.loading()) return;
    this.serverError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.triggerShake();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    const result = await this.auth.login(email, password);
    this.loading.set(false);

    if (result.ok) {
      this.router.navigate(['/home']);
    } else {
      this.serverError.set(result.error);
      this.triggerShake();
    }
  }

  private triggerShake(): void {
    this.shake.set(true);
    setTimeout(() => this.shake.set(false), 500);
  }
}