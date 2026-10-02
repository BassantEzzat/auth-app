import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { emailNotTaken, passwordsMatch, strongPassword } from '../../core/validators';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*$/u;

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(40),
          Validators.pattern(NAME_PATTERN),
        ],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(EMAIL_PATTERN),
          emailNotTaken((email) => this.auth.emailExists(email)),
        ],
      ],
      password: ['', [Validators.required, strongPassword]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly shake = signal(false);

  private readonly passwordValue = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });

  readonly rules = computed(() => {
    const v = this.passwordValue();
    return [
      { label: '8+ characters', ok: v.length >= 8 },
      { label: 'Uppercase letter', ok: /[A-Z]/.test(v) },
      { label: 'Lowercase letter', ok: /[a-z]/.test(v) },
      { label: 'A number', ok: /\d/.test(v) },
    ];
  });
  readonly level = computed(() => this.rules().filter((r) => r.ok).length);
  readonly levelLabel = computed(() => ['', 'Weak', 'Fair', 'Good', 'Strong'][this.level()]);

  get name() {
    return this.form.controls.name;
  }
  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
  }
  get confirm() {
    return this.form.controls.confirmPassword;
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
    const { name, email, password } = this.form.getRawValue();
    const result = await this.auth.register(name, email, password);
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