'use client';
import { create } from 'zustand';

export interface Subject {
  id: string;
  name: string;
  credits: number;
  level: number;
  prerequisites: string[];
  status: 'PENDING' | 'APPROVED' | 'LOCKED';
}

interface EnrollmentState {
  subjects: Subject[];
  cart: string[];
  loading: boolean;
  error: string | null;
  fetchSubjects: (carreraId?: number) => Promise<void>;
  toggleSubject: (subjectId: string) => void;
  clearCart: () => void;
}

const POSTGREST = process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005';

export const useEnrollment = create<EnrollmentState>((set, get) => ({
  subjects: [],
  cart: [],
  loading: false,
  error: null,

  fetchSubjects: async (carreraId = 1) => {
    set({ loading: true, error: null });
    try {
      // Paso 1: Cargar materias de la carrera desde PostgreSQL vía PostgREST
      const res = await fetch(
        `${POSTGREST}/materias?carrera_id=eq.${carreraId}&activa=eq.true&order=nivel.asc,id.asc`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!res.ok) throw new Error(`PostgREST error ${res.status}`);
      const rawMaterias = await res.json() as {
        id: number; nombre: string; creditos: number;
        nivel: number; codigo: string;
      }[];

      // Paso 2: Cargar los prerrequisitos desde la tabla de relación
      const prereqRes = await fetch(
        `${POSTGREST}/materia_prerrequisitos?select=materia_id,prerrequisito_id`,
        { headers: { 'Accept': 'application/json' } }
      );
      const prereqRows = prereqRes.ok ? await prereqRes.json() : [];

      // Construir mapa de prerrequisitos por materia_id
      const prereqMap: Record<string, string[]> = {};
      for (const row of prereqRows) {
        const key = String(row.materia_id);
        if (!prereqMap[key]) prereqMap[key] = [];
        prereqMap[key].push(String(row.prerrequisito_id));
      }

      // Paso 3: Determinar status de cada materia
      // Nivel 1 → APPROVED (ya aprobadas), del 2 al 5 → PENDING (cursables)
      const subjects: Subject[] = rawMaterias.map(m => ({
        id: String(m.id),
        name: m.nombre,
        credits: m.creditos,
        level: m.nivel,
        prerequisites: prereqMap[String(m.id)] ?? [],
        status: 'PENDING',
      }));

      set({ subjects, loading: false });
    } catch (err) {
      console.error('[useEnrollment] Error cargando materias:', err);
      set({
        error: 'No se pudieron cargar las materias. Verifica que Docker esté corriendo.',
        loading: false,
      });
    }
  },

  toggleSubject: (subjectId) => {
    const { subjects, cart } = get();
    const subject = subjects.find(s => s.id === subjectId);

    if (!subject || subject.status !== 'PENDING') return;

    if (cart.includes(subjectId)) {
      set({ cart: cart.filter(id => id !== subjectId) });
    } else {
      if (cart.length >= 6) {
        alert('Límite máximo de 6 materias por período alcanzado.');
        return;
      }
      set({ cart: [...cart, subjectId] });
    }
  },

  clearCart: () => set({ cart: [] }),
}));
