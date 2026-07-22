export type EnglishLevel = 'A1.1' | 'A1.2' | 'A2.1' | 'A2.2' | 'B1';

export interface EnglishCourse {
  id: string;
  level: EnglishLevel;
  schedule: string; // Ej: '07:00-09:00'
  teacher: string;
  totalSlots: number;
  availableSlots: number;
}

export interface PlacementTestSession {
  id: string;
  dateStr: string; // Ej: 'Sábado 10 de Junio'
  timeStr: string; // Ej: '09:00 - 11:00'
  location: string; // Ej: 'Laboratorio 3'
  totalSlots: number;
  availableSlots: number;
}

export interface StudentEnglishProfile {
  studentId: string;
  authorizedLevel: EnglishLevel | 'PENDING_PLACEMENT';
  enrolledCourseId: string | null;
  registeredTestId: string | null; // ID de la sesión a la que se registró
  placementTestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}
