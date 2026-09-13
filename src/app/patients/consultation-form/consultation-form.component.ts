import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Consultation } from '../../core/models';
import type { ConsultationInput } from '../consultations.service';
import { todayIso } from '../../core/validators';

@Component({
  selector: 'app-consultation-form',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './consultation-form.component.html',
  styleUrl: './consultation-form.component.css',
})
export class ConsultationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  @Input() consultation: Consultation | null = null;
  @Input() saving = false;
  @Input() errorMessage: string | null = null;
  @Output() readonly save = new EventEmitter<ConsultationInput>();
  @Output() readonly cancel = new EventEmitter<void>();

  protected readonly todayIso = todayIso();
  protected readonly form = this.fb.nonNullable.group({
    consultationDate: ['', [Validators.required]],
    consultationReason: [''],
    studies: [''],
    surgery: [''],
  });

  ngOnInit(): void {
    if (this.consultation) {
      this.form.setValue({
        consultationDate: this.consultation.consultationDate,
        consultationReason: this.consultation.consultationReason ?? '',
        studies: this.consultation.studies ?? '',
        surgery: this.consultation.surgery ?? '',
      });
    } else {
      this.form.patchValue({ consultationDate: this.todayIso });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }

  protected onCancel(): void {
    this.cancel.emit();
  }
}
