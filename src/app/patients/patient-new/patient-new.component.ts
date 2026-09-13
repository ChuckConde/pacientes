import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PatientsService } from '../patients.service';
import { notFutureDateValidator, todayIso } from '../../core/validators';

@Component({
  selector: 'app-patient-new',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './patient-new.component.html',
  styleUrl: './patient-new.component.css',
})
export class PatientNewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patientsService = inject(PatientsService);
  private readonly router = inject(Router);

  protected readonly todayIso = todayIso();
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    birthDate: ['', [Validators.required, notFutureDateValidator]],
    healthInsurance: [''],
  });
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected async submit(): Promise<void> {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    const value = this.form.getRawValue();

    try {
      const patient = await this.patientsService.create({
        name: value.name,
        birthDate: value.birthDate,
        healthInsurance: value.healthInsurance,
      });
      await this.router.navigate(['/pacientes', patient.id]);
    } catch {
      this.errorMessage.set('No se pudo guardar el paciente. Intentá nuevamente.');
      this.saving.set(false);
    }
  }
}
