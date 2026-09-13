import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PatientsService } from '../patients.service';
import { ConsultationsService, type ConsultationInput } from '../consultations.service';
import type { Consultation, Patient } from '../../core/models';
import { calculateAge } from '../../core/age.util';
import { notFutureDateValidator, todayIso } from '../../core/validators';
import { ConsultationFormComponent } from '../consultation-form/consultation-form.component';

@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, ConsultationFormComponent],
  templateUrl: './patient-detail.component.html',
  styleUrl: './patient-detail.component.css',
})
export class PatientDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientsService = inject(PatientsService);
  private readonly consultationsService = inject(ConsultationsService);

  protected readonly calculateAge = calculateAge;
  protected readonly todayIso = todayIso();

  protected readonly patient = signal<Patient | null>(null);
  protected readonly loadingPatient = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly consultations = signal<Consultation[]>([]);
  protected readonly loadingConsultations = signal(true);

  protected readonly editingPatient = signal(false);
  protected readonly savingPatient = signal(false);
  protected readonly patientErrorMessage = signal<string | null>(null);
  protected readonly patientForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    birthDate: ['', [Validators.required, notFutureDateValidator]],
    healthInsurance: [''],
  });

  protected readonly showNewConsultationForm = signal(false);
  protected readonly savingNewConsultation = signal(false);
  protected readonly newConsultationError = signal<string | null>(null);

  protected readonly editingConsultationId = signal<string | null>(null);
  protected readonly savingConsultationEdit = signal(false);
  protected readonly editConsultationError = signal<string | null>(null);

  protected readonly confirmDeleteConsultationId = signal<string | null>(null);
  protected readonly deletingConsultation = signal(false);

  protected readonly confirmDeletePatient = signal(false);
  protected readonly deletingPatient = signal(false);
  protected readonly deletePatientError = signal<string | null>(null);

  private patientId = '';

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') ?? '';
    void this.loadPatient();
    void this.loadConsultations();
  }

  private async loadPatient(): Promise<void> {
    this.loadingPatient.set(true);
    this.loadError.set(null);
    try {
      const patient = await this.patientsService.getById(this.patientId);
      this.patient.set(patient);
      if (!patient) {
        this.loadError.set('No se pudo cargar la información.');
      }
    } catch {
      this.loadError.set('No se pudo cargar la información.');
    } finally {
      this.loadingPatient.set(false);
    }
  }

  private async loadConsultations(): Promise<void> {
    this.loadingConsultations.set(true);
    try {
      const consultations = await this.consultationsService.listByPatient(this.patientId);
      this.consultations.set(consultations);
    } catch {
      this.consultations.set([]);
    } finally {
      this.loadingConsultations.set(false);
    }
  }

  // Editar datos del paciente

  protected startEditPatient(): void {
    const patient = this.patient();
    if (!patient) {
      return;
    }
    this.patientForm.setValue({
      name: patient.name,
      birthDate: patient.birthDate,
      healthInsurance: patient.healthInsurance ?? '',
    });
    this.patientErrorMessage.set(null);
    this.editingPatient.set(true);
  }

  protected cancelEditPatient(): void {
    this.editingPatient.set(false);
    this.patientErrorMessage.set(null);
  }

  protected async savePatientEdits(): Promise<void> {
    if (this.savingPatient()) {
      return;
    }
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }
    this.savingPatient.set(true);
    this.patientErrorMessage.set(null);
    const value = this.patientForm.getRawValue();
    try {
      const updated = await this.patientsService.update(this.patientId, {
        name: value.name,
        birthDate: value.birthDate,
        healthInsurance: value.healthInsurance,
      });
      this.patient.set({
        ...updated,
        lastConsultationDate: this.patient()?.lastConsultationDate ?? null,
      });
      this.editingPatient.set(false);
    } catch {
      this.patientErrorMessage.set('No se pudo guardar los cambios. Intentá nuevamente.');
    } finally {
      this.savingPatient.set(false);
    }
  }

  // Nueva consulta

  protected openNewConsultationForm(): void {
    this.editingConsultationId.set(null);
    this.newConsultationError.set(null);
    this.showNewConsultationForm.set(true);
  }

  protected cancelNewConsultationForm(): void {
    this.showNewConsultationForm.set(false);
    this.newConsultationError.set(null);
  }

  protected async saveNewConsultation(input: ConsultationInput): Promise<void> {
    this.savingNewConsultation.set(true);
    this.newConsultationError.set(null);
    try {
      const created = await this.consultationsService.create(this.patientId, input);
      this.consultations.update((list) => [created, ...list]);
      this.patient.update((patient) =>
        patient ? { ...patient, lastConsultationDate: created.consultationDate } : patient,
      );
      this.showNewConsultationForm.set(false);
    } catch {
      this.newConsultationError.set('No se pudo guardar la consulta. Intentá nuevamente.');
    } finally {
      this.savingNewConsultation.set(false);
    }
  }

  // Editar consulta

  protected startEditConsultation(consultationId: string): void {
    this.showNewConsultationForm.set(false);
    this.editConsultationError.set(null);
    this.editingConsultationId.set(consultationId);
  }

  protected cancelEditConsultation(): void {
    this.editingConsultationId.set(null);
    this.editConsultationError.set(null);
  }

  protected async saveConsultationEdit(
    consultationId: string,
    input: ConsultationInput,
  ): Promise<void> {
    this.savingConsultationEdit.set(true);
    this.editConsultationError.set(null);
    try {
      const updated = await this.consultationsService.update(consultationId, input);
      this.consultations.update((list) =>
        list
          .map((item) => (item.id === consultationId ? updated : item))
          .sort((a, b) => b.consultationDate.localeCompare(a.consultationDate)),
      );
      const mostRecent = this.consultations()[0];
      this.patient.update((patient) =>
        patient
          ? { ...patient, lastConsultationDate: mostRecent?.consultationDate ?? null }
          : patient,
      );
      this.editingConsultationId.set(null);
    } catch {
      this.editConsultationError.set('No se pudo guardar los cambios. Intentá nuevamente.');
    } finally {
      this.savingConsultationEdit.set(false);
    }
  }

  // Eliminar consulta

  protected requestDeleteConsultation(consultationId: string): void {
    this.confirmDeleteConsultationId.set(consultationId);
  }

  protected cancelDeleteConsultation(): void {
    this.confirmDeleteConsultationId.set(null);
  }

  protected async confirmDeleteConsultationAction(): Promise<void> {
    const consultationId = this.confirmDeleteConsultationId();
    if (!consultationId || this.deletingConsultation()) {
      return;
    }
    this.deletingConsultation.set(true);
    try {
      await this.consultationsService.remove(consultationId);
      this.consultations.update((list) => list.filter((item) => item.id !== consultationId));
      const mostRecent = this.consultations()[0];
      this.patient.update((patient) =>
        patient
          ? { ...patient, lastConsultationDate: mostRecent?.consultationDate ?? null }
          : patient,
      );
      this.confirmDeleteConsultationId.set(null);
    } catch {
      this.loadError.set('No se pudo eliminar la consulta. Intentá nuevamente.');
    } finally {
      this.deletingConsultation.set(false);
    }
  }

  // Eliminar paciente

  protected requestDeletePatient(): void {
    this.deletePatientError.set(null);
    this.confirmDeletePatient.set(true);
  }

  protected cancelDeletePatient(): void {
    this.confirmDeletePatient.set(false);
  }

  protected async confirmDeletePatientAction(): Promise<void> {
    if (this.deletingPatient()) {
      return;
    }
    this.deletingPatient.set(true);
    this.deletePatientError.set(null);
    try {
      await this.patientsService.remove(this.patientId);
      await this.router.navigateByUrl('/pacientes');
    } catch {
      this.deletePatientError.set('No se pudo eliminar el paciente. Intentá nuevamente.');
      this.deletingPatient.set(false);
    }
  }
}
