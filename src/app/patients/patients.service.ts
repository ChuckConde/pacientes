import { Injectable } from '@angular/core';
import { DemoDataStore } from '../core/demo-data.store';
import type { Patient } from '../core/models';

export interface PatientInput {
  name: string;
  birthDate: string;
  healthInsurance: string;
}

/**
 * Demo build: reads/writes the in-memory/localStorage DemoDataStore instead
 * of Supabase. Method signatures match the production PatientsService so
 * every component above this layer is unchanged.
 */
@Injectable({ providedIn: 'root' })
export class PatientsService {
  constructor(private readonly store: DemoDataStore) {}

  async search(term: string): Promise<Patient[]> {
    return this.store.search(term);
  }

  async getById(id: string): Promise<Patient | null> {
    return this.store.getPatientById(id);
  }

  async create(input: PatientInput): Promise<Patient> {
    return this.store.createPatient(input);
  }

  async update(id: string, input: PatientInput): Promise<Patient> {
    return this.store.updatePatient(id, input);
  }

  async remove(id: string): Promise<void> {
    this.store.removePatient(id);
  }
}
