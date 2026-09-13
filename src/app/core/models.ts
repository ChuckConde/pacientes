export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  healthInsurance: string | null;
  createdAt: string;
  updatedAt: string;
  lastConsultationDate: string | null;
}

export interface Consultation {
  id: string;
  patientId: string;
  consultationDate: string;
  consultationReason: string | null;
  studies: string | null;
  surgery: string | null;
  createdAt: string;
  updatedAt: string;
}
