import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'pacientes',
    loadComponent: () =>
      import('./patients/patients-list/patients-list.component').then(
        (m) => m.PatientsListComponent,
      ),
  },
  {
    path: 'pacientes/nuevo',
    loadComponent: () =>
      import('./patients/patient-new/patient-new.component').then((m) => m.PatientNewComponent),
  },
  {
    path: 'pacientes/:id',
    loadComponent: () =>
      import('./patients/patient-detail/patient-detail.component').then(
        (m) => m.PatientDetailComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'pacientes' },
  { path: '**', redirectTo: 'pacientes' },
];
