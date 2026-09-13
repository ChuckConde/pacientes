import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PatientsService } from '../patients.service';
import type { Patient } from '../../core/models';
import { DemoDataStore } from '../../core/demo-data.store';
import { calculateAge } from '../../core/age.util';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-patients-list',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './patients-list.component.html',
  styleUrl: './patients-list.component.css',
})
export class PatientsListComponent implements OnInit, OnDestroy {
  protected readonly searchTerm = signal('');
  protected readonly patients = signal<Patient[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly calculateAge = calculateAge;

  private searchDebounceHandle: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly patientsService: PatientsService,
    private readonly demoDataStore: DemoDataStore,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    void this.loadPatients();
  }

  ngOnDestroy(): void {
    if (this.searchDebounceHandle) {
      clearTimeout(this.searchDebounceHandle);
    }
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
    if (this.searchDebounceHandle) {
      clearTimeout(this.searchDebounceHandle);
    }
    this.searchDebounceHandle = setTimeout(() => void this.loadPatients(), SEARCH_DEBOUNCE_MS);
  }

  protected openPatient(id: string): void {
    void this.router.navigate(['/pacientes', id]);
  }

  /** Demo-only: discards any edits and restores the original fictional dataset. */
  protected resetDemoData(): void {
    this.demoDataStore.reset();
    void this.loadPatients();
  }

  private async loadPatients(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const results = await this.patientsService.search(this.searchTerm());
      this.patients.set(results);
    } catch {
      this.errorMessage.set('No se pudo cargar la información.');
    } finally {
      this.loading.set(false);
    }
  }
}
