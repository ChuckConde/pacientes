import { Injectable } from '@angular/core';
import type { Consultation, Patient } from './models';

/**
 * Demo build has no backend: this is an in-memory + localStorage-backed
 * stand-in for what the production app does via Supabase + Postgres RLS
 * (see supabase/migrations in the production repo). All data here is
 * fictional and reset on demand — see `reset()`.
 */

interface StoredPatient {
  id: string;
  name: string;
  birthDate: string;
  healthInsurance: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredState {
  patients: StoredPatient[];
  consultations: Consultation[];
}

const STORAGE_KEY = 'pacientes-demo-data-v1';

function seedState(): StoredState {
  const now = new Date().toISOString();
  return {
    patients: [
      {
        id: 'demo-1',
        name: 'Lucía Fernández',
        birthDate: '1988-04-12',
        healthInsurance: 'OSDE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-2',
        name: 'Martín Gómez',
        birthDate: '1975-11-02',
        healthInsurance: 'Swiss Medical',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-3',
        name: 'Sofía Rodríguez',
        birthDate: '2001-07-23',
        healthInsurance: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-4',
        name: 'Ezequiel Torres',
        birthDate: '1960-01-30',
        healthInsurance: 'PAMI',
        createdAt: now,
        updatedAt: now,
      },
    ],
    consultations: [
      {
        id: 'demo-c1',
        patientId: 'demo-1',
        consultationDate: '2026-08-14',
        consultationReason: 'Control anual',
        studies: 'Análisis de sangre completo',
        surgery: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-c2',
        patientId: 'demo-1',
        consultationDate: '2025-05-02',
        consultationReason: 'Dolor lumbar',
        studies: 'Radiografía de columna',
        surgery: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-c3',
        patientId: 'demo-2',
        consultationDate: '2026-06-30',
        consultationReason: 'Seguimiento post-operatorio',
        studies: null,
        surgery: 'Artroscopía de rodilla derecha en 2025.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-c4',
        patientId: 'demo-4',
        consultationDate: '2026-02-18',
        consultationReason: 'Control de presión arterial',
        studies: 'Electrocardiograma',
        surgery: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return seedState();
    }
    return JSON.parse(raw) as StoredState;
  } catch {
    return seedState();
  }
}

@Injectable({ providedIn: 'root' })
export class DemoDataStore {
  private state: StoredState = loadState();

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // localStorage unavailable (private browsing, quota, etc.) — demo
      // still works for the current page lifetime, just doesn't persist.
    }
  }

  /** Restores the original fictional demo dataset, discarding any edits. */
  reset(): void {
    this.state = seedState();
    this.persist();
  }

  private lastConsultationDateFor(patientId: string): string | null {
    const dates = this.state.consultations
      .filter((c) => c.patientId === patientId)
      .map((c) => c.consultationDate)
      .sort()
      .reverse();
    return dates[0] ?? null;
  }

  private toPatient(row: StoredPatient): Patient {
    return { ...row, lastConsultationDate: this.lastConsultationDateFor(row.id) };
  }

  search(term: string): Patient[] {
    const needle = normalize(term.trim());
    const matches = this.state.patients.filter((p) => {
      if (!needle) {
        return true;
      }
      return normalize(p.name).includes(needle) || normalize(p.healthInsurance ?? '').includes(needle);
    });
    return matches.map((p) => this.toPatient(p)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  getPatientById(id: string): Patient | null {
    const row = this.state.patients.find((p) => p.id === id);
    return row ? this.toPatient(row) : null;
  }

  createPatient(input: { name: string; birthDate: string; healthInsurance: string }): Patient {
    const now = new Date().toISOString();
    const row: StoredPatient = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      birthDate: input.birthDate,
      healthInsurance: input.healthInsurance.trim() || null,
      createdAt: now,
      updatedAt: now,
    };
    this.state.patients.push(row);
    this.persist();
    return this.toPatient(row);
  }

  updatePatient(
    id: string,
    input: { name: string; birthDate: string; healthInsurance: string },
  ): Patient {
    const row = this.state.patients.find((p) => p.id === id);
    if (!row) {
      throw new Error('not found');
    }
    row.name = input.name.trim();
    row.birthDate = input.birthDate;
    row.healthInsurance = input.healthInsurance.trim() || null;
    row.updatedAt = new Date().toISOString();
    this.persist();
    return this.toPatient(row);
  }

  removePatient(id: string): void {
    this.state.patients = this.state.patients.filter((p) => p.id !== id);
    this.state.consultations = this.state.consultations.filter((c) => c.patientId !== id);
    this.persist();
  }

  listConsultations(patientId: string): Consultation[] {
    return this.state.consultations
      .filter((c) => c.patientId === patientId)
      .slice()
      .sort((a, b) => {
        if (a.consultationDate !== b.consultationDate) {
          return b.consultationDate.localeCompare(a.consultationDate);
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }

  createConsultation(
    patientId: string,
    input: { consultationDate: string; consultationReason: string; studies: string; surgery: string },
  ): Consultation {
    const now = new Date().toISOString();
    const row: Consultation = {
      id: crypto.randomUUID(),
      patientId,
      consultationDate: input.consultationDate,
      consultationReason: input.consultationReason.trim() || null,
      studies: input.studies.trim() || null,
      surgery: input.surgery.trim() || null,
      createdAt: now,
      updatedAt: now,
    };
    this.state.consultations.push(row);
    this.persist();
    return row;
  }

  updateConsultation(
    id: string,
    input: { consultationDate: string; consultationReason: string; studies: string; surgery: string },
  ): Consultation {
    const row = this.state.consultations.find((c) => c.id === id);
    if (!row) {
      throw new Error('not found');
    }
    row.consultationDate = input.consultationDate;
    row.consultationReason = input.consultationReason.trim() || null;
    row.studies = input.studies.trim() || null;
    row.surgery = input.surgery.trim() || null;
    row.updatedAt = new Date().toISOString();
    this.persist();
    return row;
  }

  removeConsultation(id: string): void {
    this.state.consultations = this.state.consultations.filter((c) => c.id !== id);
    this.persist();
  }
}
