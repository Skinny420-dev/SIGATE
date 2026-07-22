import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EnglishCourse, StudentEnglishProfile, EnglishLevel, PlacementTestSession } from '../types/english.types';

const POSTGREST = process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005';


// ==========================================
// MOCK DATA: Cursos y Sesiones de Prueba
// ==========================================
const MOCK_COURSES: EnglishCourse[] = [
  { id: 'c1', schedule: '07:00-09:00', level: 'A1.1', totalSlots: 30, availableSlots: 0, teacher: 'Lic. Pérez' },
  { id: 'c2', schedule: '07:00-09:00', level: 'A1.2', totalSlots: 30, availableSlots: 8, teacher: 'Lic. Gómez' },
  { id: 'c3', schedule: '07:00-09:00', level: 'A2.1', totalSlots: 30, availableSlots: 0, teacher: 'Lic. Ruiz' },
  { id: 'c4', schedule: '09:00-11:00', level: 'A1.2', totalSlots: 30, availableSlots: 0, teacher: 'Lic. Gómez' },
  { id: 'c5', schedule: '09:00-11:00', level: 'A2.1', totalSlots: 30, availableSlots: 0, teacher: 'Lic. Ruiz' },
  { id: 'c6', schedule: '09:00-11:00', level: 'A2.2', totalSlots: 30, availableSlots: 17, teacher: 'Lic. Vega' },
  { id: 'c7', schedule: '13:00-15:00', level: 'A1.1', totalSlots: 30, availableSlots: 0, teacher: 'Lic. Pérez' },
  { id: 'c8', schedule: '13:00-15:00', level: 'A1.2', totalSlots: 30, availableSlots: 0, teacher: 'Lic. Gómez' },
  { id: 'c9', schedule: '13:00-15:00', level: 'A2.1', totalSlots: 30, availableSlots: 6, teacher: 'Lic. Ruiz' },
  { id: 'c10', schedule: '13:00-15:00', level: 'A2.2', totalSlots: 30, availableSlots: 9, teacher: 'Lic. Vega' },
  { id: 'c11', schedule: '15:00-17:00', level: 'A1.2', totalSlots: 30, availableSlots: 20, teacher: 'Lic. Gómez' },
  { id: 'c12', schedule: '15:00-17:00', level: 'A2.1', totalSlots: 30, availableSlots: 0, teacher: 'Lic. Ruiz' },
  { id: 'c13', schedule: '15:00-17:00', level: 'A2.2', totalSlots: 30, availableSlots: 17, teacher: 'Lic. Vega' },
];

const MOCK_TEST_SESSIONS: PlacementTestSession[] = [
  { id: 't1', dateStr: 'Sábado 25 de Mayo', timeStr: '09:00 - 11:00', location: 'Laboratorio 3 (Montecristi)', totalSlots: 40, availableSlots: 2 },
  { id: 't2', dateStr: 'Sábado 25 de Mayo', timeStr: '11:00 - 13:00', location: 'Laboratorio 3 (Montecristi)', totalSlots: 40, availableSlots: 0 },
  { id: 't3', dateStr: 'Domingo 26 de Mayo', timeStr: '09:00 - 11:00', location: 'Laboratorio 1', totalSlots: 30, availableSlots: 15 },
];

interface EnglishState {
  courses: EnglishCourse[];
  testSessions: PlacementTestSession[];
  profile: StudentEnglishProfile;
  
  // Acciones
  processExcelBatch: (level: EnglishLevel) => void;
  enrollInCourse: (courseId: string) => void;
  unenroll: () => void;
  registerForTest: (sessionId: string) => void;
  skipPlacementTest: () => void;
  resetEnglishProcess: () => void;
  fetchProfileFromDB: (userId: string) => Promise<void>;
}

export const useEnglishStore = create<EnglishState>()(
  persist(
    (set, get) => ({
      courses: MOCK_COURSES,
      testSessions: MOCK_TEST_SESSIONS,
      profile: {
        studentId: '1',
        authorizedLevel: 'PENDING_PLACEMENT', 
        enrolledCourseId: null,
        registeredTestId: null,
      },

      fetchProfileFromDB: async (userId: string) => {
        try {
          // 1. Obtener estudiante_id
          const estRes = await fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${userId}&select=id`, {
            headers: { 'Accept': 'application/json' }
          });
          const estData = await estRes.json();
          if (!estData || estData.length === 0) return;
          const estudianteId = estData[0].id;

          // 2. Consultar el registro de suficiencia más reciente y aprobado
          const sufRes = await fetch(
            `${POSTGREST}/suficiencia_ingles?estudiante_id=eq.${estudianteId}&aprobado=eq.true&order=fecha_aprobacion.desc&limit=1`,
            { headers: { 'Accept': 'application/json' } }
          );
          const sufData = await sufRes.json();

          if (sufData && sufData.length > 0) {
            const registro = sufData[0];
            // Verificar vigencia: la prueba dura 6 meses desde fecha_aprobacion
            const fechaAprobacion = registro.fecha_aprobacion ? new Date(registro.fecha_aprobacion) : null;
            const ahora = new Date();
            let estaVigente = false;
            if (fechaAprobacion) {
              const fechaVencimiento = new Date(fechaAprobacion);
              fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 6);
              estaVigente = fechaVencimiento > ahora;
            }

            if (estaVigente && registro.nivel_ingles) {
              // nivel_ingles es un enum tipo 'A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1'
              const nivelMap: Record<string, EnglishLevel> = {
                'A1.1': 'A1.1', 'A1.2': 'A1.2', 'A2.1': 'A2.1', 'A2.2': 'A2.2', 'B1': 'B1',
                'A11': 'A1.1', 'A12': 'A1.2', 'A21': 'A2.1', 'A22': 'A2.2',
              };
              const nivel = nivelMap[registro.nivel_ingles] ?? null;
              if (nivel) {
                set(state => ({ profile: { ...state.profile, authorizedLevel: nivel, studentId: estudianteId } }));
                return;
              }
            }
          }
          // Si no hay registro aprobado vigente → el alumno debe iniciar el proceso
          set(state => ({ profile: { ...state.profile, authorizedLevel: 'PENDING_PLACEMENT', studentId: estudianteId } }));
        } catch {
          // Mantener estado actual en caso de error de red
        }
      },

      registerForTest: (sessionId) => {
        const { testSessions, profile } = get();
        if (profile.registeredTestId) return;

        const idx = testSessions.findIndex(s => s.id === sessionId);
        if (idx === -1) return;
        
        const session = testSessions[idx];
        if (session.availableSlots <= 0) return;

        const newSessions = [...testSessions];
        newSessions[idx] = { ...session, availableSlots: session.availableSlots - 1 };

        set({
          testSessions: newSessions,
          profile: {
            ...profile,
            registeredTestId: sessionId
          }
        });
      },

      processExcelBatch: (level) => {
        set(state => ({
          profile: {
            ...state.profile,
            authorizedLevel: level,
            placementTestStatus: 'APPROVED'
          }
        }));
      },

      enrollInCourse: (courseId) => {
        const { courses, profile } = get();
        
        if (profile.enrolledCourseId) return;

        const courseIndex = courses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) return;

        const course = courses[courseIndex];

        if (course.level !== profile.authorizedLevel) {
          return;
        }

        if (course.availableSlots <= 0) {
          return;
        }

        const newCourses = [...courses];
        newCourses[courseIndex] = {
          ...course,
          availableSlots: course.availableSlots - 1
        };

        set({
          courses: newCourses,
          profile: {
            ...profile,
            enrolledCourseId: courseId
          }
        });
      },

      unenroll: () => {
        const { courses, profile } = get();
        if (!profile.enrolledCourseId) return;

        const courseIndex = courses.findIndex(c => c.id === profile.enrolledCourseId);
        if (courseIndex !== -1) {
          const newCourses = [...courses];
          newCourses[courseIndex] = {
            ...newCourses[courseIndex],
            availableSlots: newCourses[courseIndex].availableSlots + 1
          };
          set({ courses: newCourses, profile: { ...profile, enrolledCourseId: null } });
        }
      },

      skipPlacementTest: () => {
        // El alumno eligió empezar sin dar la prueba: se asigna A1.1
        set(state => ({
          profile: {
            ...state.profile,
            authorizedLevel: 'A1.1'
          }
        }));
      },

      resetEnglishProcess: () => {
        set(state => ({
          profile: {
            ...state.profile,
            authorizedLevel: 'PENDING_PLACEMENT',
            enrolledCourseId: null,
            registeredTestId: null
          }
        }));
      }
    }),
    {
      name: 'yavirac-english-process',
      partialize: (state) => ({
        profile: state.profile,
        courses: state.courses,
        testSessions: state.testSessions
      })
    }
  )
);
