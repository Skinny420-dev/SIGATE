import { create } from 'zustand';
import { useEnrollment } from './useEnrollment';

// 1: Bienvenida/Fechas
// 2: Documentos (Fase A)
// 3: Materias (Fase A)
// 4: Rastreo (Fase B)
export type EnrollmentStep = 1 | 2 | 3 | 4;

export type TrackerStatus = 'DRAFT' | 'OFFICE_1' | 'OFFICE_2' | 'SECRETARY' | 'LEGALIZED';

export interface EnrollmentApplication {
  id: string;
  studentName: string;
  career: string;
  level: number;
  sigaFile: string;
  siauFile: string;
  status: TrackerStatus;
  dateSubmitted: string;
}

const MOCK_APPLICATIONS: EnrollmentApplication[] = [
  { id: 'app1', studentName: 'Carlos Ruiz', career: 'Desarrollo de Software', level: 2, sigaFile: 'siga-carlos.pdf', siauFile: 'siau-carlos.pdf', status: 'OFFICE_1', dateSubmitted: '2026-04-25 10:30' },
  { id: 'app2', studentName: 'Ana Viteri', career: 'Desarrollo de Software', level: 3, sigaFile: 'siga-ana.pdf', siauFile: 'siau-ana.pdf', status: 'OFFICE_2', dateSubmitted: '2026-04-26 09:15' },
  { id: 'app3', studentName: 'Luis Macías', career: 'Diseño Gráfico', level: 1, sigaFile: 'siga-luis.pdf', siauFile: 'siau-luis.pdf', status: 'SECRETARY', dateSubmitted: '2026-04-27 14:00' },
  { id: 'app4', studentName: 'Sofía Castro', career: 'Gastronomía', level: 4, sigaFile: 'siga-sofia.pdf', siauFile: 'siau-sofia.pdf', status: 'LEGALIZED', dateSubmitted: '2026-04-20 08:00' },
];

interface EnrollmentWizardState {
  currentStep: EnrollmentStep;
  trackerStatus: TrackerStatus;
  
  // Archivos
  fichaEstudiantilUrl: string | null;
  certificadoNoAdeudarUrl: string | null;
  certificadoMatriculaUrl: string | null;

  // Panel de Admin
  applications: EnrollmentApplication[];
  
  // Acciones
  setStep: (step: EnrollmentStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  uploadFichaEstudiantil: (url: string) => void;
  uploadCertificadoNoAdeudar: (url: string) => void;
  uploadCertificadoMatricula: (url: string) => void;
  submitEnrollmentRequest: () => void;
  
  // Demo Actions
  adminSimulateApproval: () => void;
  adminApproveApplication: (id: string) => void;
}

export const useEnrollmentWizard = create<EnrollmentWizardState>((set, get) => ({
  currentStep: 1, // 1 es Welcome, restaurado a la normalidad
  trackerStatus: 'DRAFT',
  
  fichaEstudiantilUrl: null,
  certificadoNoAdeudarUrl: null,
  certificadoMatriculaUrl: null,

  applications: MOCK_APPLICATIONS,

  setStep: (step) => set({ currentStep: step }),
  
  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 4) set({ currentStep: (currentStep + 1) as EnrollmentStep });
  },
  
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) set({ currentStep: (currentStep - 1) as EnrollmentStep });
  },

  uploadFichaEstudiantil: (url) => set({ fichaEstudiantilUrl: url }),
  uploadCertificadoNoAdeudar: (url) => set({ certificadoNoAdeudarUrl: url }),
  uploadCertificadoMatricula: (url) => set({ certificadoMatriculaUrl: url }),

  submitEnrollmentRequest: async () => {
    // Al enviar materias, se pasa al paso 4 (Seguimiento) y entra a Oficina 1
    const { fichaEstudiantilUrl, certificadoNoAdeudarUrl, certificadoMatriculaUrl } = get();
    
    // Obtener los datos del usuario logueado desde la sesión persistida de Zustand
    const sessionText = typeof window !== 'undefined' ? localStorage.getItem('instituto-session') : null;
    const sessionObj = sessionText ? JSON.parse(sessionText) : null;
    const user_id = sessionObj?.state?.user?.id;

    // Obtener las materias elegidas en el carrito de useEnrollment
    const { cart } = useEnrollment.getState();

    try {
      // Guardar el tercer documento localmente por ID de usuario
      if (user_id && certificadoMatriculaUrl) {
        localStorage.setItem(`yavirac-matricula-extra-doc-${user_id}`, certificadoMatriculaUrl);
      }

      const res = await fetch('/api/enrollment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          carrera_id: 1, // Software
          sigaFile: fichaEstudiantilUrl,
          siauFile: certificadoNoAdeudarUrl,
          subjects: cart
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Ocurrió un error al enviar la solicitud.');
        return;
      }
      set({ 
        currentStep: 4, 
        trackerStatus: 'OFFICE_1' 
      });
    } catch {
      alert('Error de conexión al enviar la matrícula.');
    }
  },

  adminSimulateApproval: () => {
    const { trackerStatus } = get();
    if (trackerStatus === 'OFFICE_1') {
      set({ trackerStatus: 'OFFICE_2' });
    } else if (trackerStatus === 'OFFICE_2') {
      set({ trackerStatus: 'SECRETARY' });
    } else if (trackerStatus === 'SECRETARY') {
      set({ trackerStatus: 'LEGALIZED' });
    }
  },

  adminApproveApplication: (id) => {
    const { applications } = get();
    const newApps = applications.map((app): EnrollmentApplication => {
      if (app.id === id) {
        if (app.status === 'OFFICE_1') return { ...app, status: 'OFFICE_2' };
        if (app.status === 'OFFICE_2') return { ...app, status: 'SECRETARY' };
        if (app.status === 'SECRETARY') return { ...app, status: 'LEGALIZED' };
      }
      return app;
    });
    set({ applications: newApps });
  }
}));
