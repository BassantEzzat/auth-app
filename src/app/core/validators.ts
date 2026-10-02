import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** 8 حروف على الأقل، حرف كبير، حرف صغير، رقم */
export const strongPassword: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const v: string = control.value ?? '';
  if (!v) return null; // required بتتعامل مع الفاضي
  const errors: ValidationErrors = {};
  if (v.length < 8) errors['minLength'] = true;
  if (!/[A-Z]/.test(v)) errors['uppercase'] = true;
  if (!/[a-z]/.test(v)) errors['lowercase'] = true;
  if (!/\d/.test(v)) errors['number'] = true;
  return Object.keys(errors).length ? { strongPassword: errors } : null;
};

/** بيتحط على الـ FormGroup */
export const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
};

/** الإيميل مش متسجل قبل كده */
export const emailNotTaken = (exists: (email: string) => boolean): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null =>
    control.value && exists(control.value) ? { emailTaken: true } : null;