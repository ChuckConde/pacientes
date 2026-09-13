import type { AbstractControl, ValidationErrors } from '@angular/forms';

/** Rejects dates later than today. Expects an ISO (yyyy-MM-dd) date string. */
export function notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(`${value}T00:00:00`);
  return inputDate.getTime() > today.getTime() ? { futureDate: true } : null;
}

/** Returns today's date as an ISO (yyyy-MM-dd) string, for date input defaults/max. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
