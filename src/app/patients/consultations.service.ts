import { Injectable } from '@angular/core';
import { DemoDataStore } from '../core/demo-data.store';
import type { Consultation } from '../core/models';

export interface ConsultationInput {
  consultationDate: string;
  consultationReason: string;
  studies: string;
  surgery: string;
}

/**
 * Demo build: reads/writes the in-memory/localStorage DemoDataStore instead
 * of Supabase. Method signatures match the production ConsultationsService
 * so every component above this layer is unchanged.
 */
@Injectable({ providedIn: 'root' })
export class ConsultationsService {
  constructor(private readonly store: DemoDataStore) {}

  async listByPatient(patientId: string): Promise<Consultation[]> {
    return this.store.listConsultations(patientId);
  }

  async create(patientId: string, input: ConsultationInput): Promise<Consultation> {
    return this.store.createConsultation(patientId, input);
  }

  async update(id: string, input: ConsultationInput): Promise<Consultation> {
    return this.store.updateConsultation(id, input);
  }

  async remove(id: string): Promise<void> {
    this.store.removeConsultation(id);
  }
}
