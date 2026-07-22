'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FileText, CheckCircle2, Clock, Search, X,
  AlertTriangle, Eye, Fingerprint, Award, Timer,
  Building2, Users, FileCheck, Briefcase, GraduationCap,
  Loader2, ArrowLeft, ShieldCheck, ShieldX, User, Trash2, Edit2, Plus
} from 'lucide-react';
import { useSessionStore } from '@/core/auth/session.store';
import { useToast } from '@/shared/ui/ToastProvider';
import styles from './AdminMatriculasPage.module.css';

const POSTGREST = process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface DBUsuario {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  correo: string;
  activo: boolean;
  rol?: string;
  carrera_id?: number;
  nivel?: number;
}

interface DBMatricula {
  id: string;
  estudiante_id: string;
  estado: string;
  pdf_siga_url?: string;
  pdf_no_adeudar_url?: string;
  total_horas_validadas?: number; // Para prácticas
  tema_proyecto?: string; // Para titulación
  anteproyecto_url?: string; // Para titulación
  created_at?: string;
  estudiantes?: { 
    usuario_id: string; 
    nivel: number; 
    carreras?: { nombre: string };
    usuarios?: { nombres: string; apellidos: string; cedula?: string; correo?: string };
  };
}

// ─── Configuración de estados de matrícula ───
const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}> = {
  SUBMITTED: {
    label: 'Recibido',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: <Clock size={12} />,
  },
  OFFICE_1: {
    label: 'Financiero',
    color: '#92400e',
    bg: '#fef3c7',
    border: '#fde68a',
    icon: <Building2 size={12} />,
  },
  OFFICE_2: {
    label: 'Coordinación',
    color: '#1e3a8a',
    bg: '#dbeafe',
    border: '#bfdbfe',
    icon: <Users size={12} />,
  },
  LEGALIZED: {
    label: 'Legalizado',
    color: '#14532d',
    bg: '#dcfce7',
    border: '#86efac',
    icon: <Award size={12} />,
  },
};

const STAGE_STEPS = [
  { key: 'SUBMITTED', label: 'Recibido', short: 'Rec.', icon: <Clock size={13} /> },
  { key: 'OFFICE_1', label: 'Financiero', short: 'Finan.', icon: <Building2 size={13} /> },
  { key: 'OFFICE_2', label: 'Coordinación', short: 'Coord.', icon: <Users size={13} /> },
  { key: 'LEGALIZED', label: 'Legalizado', short: 'Legal.', icon: <Award size={13} /> },
];

const STAGE_ORDER = ['SUBMITTED', 'OFFICE_1', 'OFFICE_2', 'LEGALIZED'];

function getStageIndex(status: string) {
  return STAGE_ORDER.indexOf(status) !== -1 ? STAGE_ORDER.indexOf(status) : 0;
}

// ─── Componente para Configuración de Fechas de Matrícula ───
function PeriodConfigTab() {
  const { toast } = useToast();
  const [periodo, setPeriodo] = useState<{ id: number; codigo: string; fecha_inicio: string; fecha_fin: string; activo: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${POSTGREST}/periodos_academicos?activo=eq.true&limit=1`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) setPeriodo(data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodo) return;
    setSaving(true);
    try {
      const res = await fetch(`${POSTGREST}/periodos_academicos?id=eq.${periodo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          fecha_inicio: periodo.fecha_inicio,
          fecha_fin: periodo.fecha_fin
        })
      });
      if (res.ok) {
        toast({ type: 'success', message: 'Cronograma Guardado', description: 'Las fechas del período académico se actualizaron exitosamente.' });
      } else {
        toast({ type: 'error', message: 'Error', description: 'No se pudieron guardar las fechas.' });
      }
    } catch {
      toast({ type: 'error', message: 'Error', description: 'Ocurrió un error de red.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#94a3b8' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!periodo) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: 12, border: '1px solid #e8edf3' }}>
        <AlertTriangle size={36} color="#eab308" style={{ marginBottom: 8 }} />
        <p style={{ fontWeight: 600, color: '#182f59' }}>No se encontró un período académico activo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '2rem', maxWidth: '580px', margin: '0 auto', boxShadow: '0 4px 24px rgba(0,0,0,0.02)', textAlign: 'left' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#182f59', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>Configuración del Período de Matrículas</h3>
      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem 0' }}>Establezca el cronograma oficial de matrículas para el período activo del instituto.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Período Activo</label>
          <input type="text" value={periodo.codigo} disabled style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Fecha de Inicio</label>
            <input type="date" value={periodo.fecha_inicio} onChange={e => setPeriodo({ ...periodo, fecha_inicio: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.875rem', color: '#1e293b' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Fecha de Fin</label>
            <input type="date" value={periodo.fecha_fin} onChange={e => setPeriodo({ ...periodo, fecha_fin: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.875rem', color: '#1e293b' }} />
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: '#f46c22', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(244,108,34,0.15)' }}>
          {saving ? 'Guardando...' : <>Guardar Cambios y Habilitar</>}
        </button>
      </div>
    </form>
  );
}

// ─── Barra de progreso de etapas ───
function StageProgress({ status }: { status: string }) {
  const currentIdx = getStageIndex(status);

  return (
    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 12, border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {STAGE_STEPS.map((step, i) => {
          const done = i < currentIdx || status === 'LEGALIZED';
          const active = i === currentIdx && status !== 'LEGALIZED';

          return (
            <div key={step.key} style={{ flex: i === STAGE_STEPS.length - 1 ? 'none' : 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#22c55e' : active ? '#f46c22' : '#e2e8f0',
                  color: done || active ? 'white' : '#94a3b8',
                  border: active ? '3px solid #ffd8be' : done ? '2px solid #86efac' : '2px solid #e2e8f0',
                  fontSize: 13, transition: 'all 0.3s',
                  boxSizing: 'border-box',
                }}>
                  {done ? <CheckCircle2 size={14} /> : step.icon}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
                  color: done ? '#15803d' : active ? '#ea580c' : '#94a3b8',
                }}>
                  {step.short}
                </span>
              </div>
              {i < STAGE_STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, marginBottom: 16,
                  background: done ? '#86efac' : '#e2e8f0',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Validación de Cédula Ecuatoriana (Algoritmo oficial del dígito verificador)
function isValidEcuadorianCedula(cedula: string): boolean {
  if (cedula.length !== 10) return false;
  if (!/^\d+$/.test(cedula)) return false;

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = parseInt(cedula.substring(2, 3), 10);
  if (tercerDigito < 0 || tercerDigito > 6) return false;

  const digitoVerificador = parseInt(cedula.substring(9, 10), 10);
  let suma = 0;
  
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i), 10);
    if (i % 2 === 0) {
      valor = valor * 2;
      if (valor > 9) valor -= 9;
    }
    suma += valor;
  }

  const modulo = suma % 10;
  const resultado = modulo === 0 ? 0 : 10 - modulo;

  return resultado === digitoVerificador;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminMatriculasPage() {
  const router = useRouter();
  const { user } = useSessionStore();
  const { toast, success, error } = useToast();

  const isAdmin = user?.email === 'admin@yavirac.edu.ec' || user?.role === 'admin';
  const isSecretaria = user?.role === 'secretaria';

  const [activeMainTab, setActiveMainTab] = useState<'matriculas' | 'periodo'>('matriculas');
  const [selectedMat, setSelectedMat] = useState<DBMatricula | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [matriculas, setMatriculas] = useState<DBMatricula[]>([]);
  const [loadingMat, setLoadingMat] = useState(true);

  // Estados de carga detallada
  const [practicas, setPracticas] = useState<any>(null);
  const [bitacoras, setBitacoras] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<Record<string, { estado: string; archivo: string }>>({});
  const [titulacion, setTitulacion] = useState<any>(null);
  const [loadingExt, setLoadingExt] = useState(false);
  const [formFase, setFormFase] = useState<any>(null);

  // MÓDULO GESTIÓN DE USUARIOS (Para Rol Admin)
  const [users, setUsers] = useState<DBUsuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<DBUsuario | null>(null);
  
  // Formulario Registro/Edición de Usuario
  const [formData, setFormData] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    correo: '',
    password: '',
    rol: 'STUDENT',
    carrera_id: '1',
    nivel: '1',
    activo: true
  });

  // Horas adicionales a validar
  const [addHoursVal, setAddHoursVal] = useState('40');
  const [detailSuccess, setDetailSuccess] = useState('');
  const [rejectionObs, setRejectionObs] = useState('');
  const [thirdDocUrl, setThirdDocUrl] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    setShowDetail(false);
    setSelectedMat(null);
    setEditingUser(null);
  }, [tabParam]);

  // Cargar usuarios para el panel administrativo
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      // Obtener todos los usuarios
      const uRes = await fetch(`${POSTGREST}/usuarios?order=nombres.asc`, {
        headers: { 'Accept': 'application/json' }
      });
      const uData = await uRes.json();
      
      // Obtener roles de usuario
      const rRes = await fetch(`${POSTGREST}/usuario_roles?select=usuario_id,roles(nombre)`, {
        headers: { 'Accept': 'application/json' }
      });
      const rData = await rRes.json();
      const roleMap: Record<string, string> = {};
      for (const r of rData) {
        roleMap[r.usuario_id] = r.roles?.nombre ?? 'STUDENT';
      }

      // Obtener datos carrera del estudiante/docente
      const sRes = await fetch(`${POSTGREST}/estudiantes?select=usuario_id,carrera_id,nivel`, {
        headers: { 'Accept': 'application/json' }
      });
      const sData = await sRes.json();
      const studentMap: Record<string, { carrera_id: number; nivel: number }> = {};
      for (const s of sData) {
        studentMap[s.usuario_id] = { carrera_id: s.carrera_id, nivel: s.nivel };
      }

      const mappedUsers = uData.map((u: any) => ({
        ...u,
        rol: roleMap[u.id] ?? 'STUDENT',
        carrera_id: studentMap[u.id]?.carrera_id ?? 1,
        nivel: studentMap[u.id]?.nivel ?? 1
      }));

      setUsers(mappedUsers);
    } catch {
      toast({ type: 'error', message: 'Error', description: 'No se pudieron cargar los usuarios.' });
    }
    setLoadingUsers(false);
  }, [toast]);

  useEffect(() => {
    if (isAdmin && (tabParam === 'usuarios' || !tabParam)) {
      fetchUsers();
    }
  }, [isAdmin, tabParam, fetchUsers]);

  const fetchMatriculas = useCallback(async () => {
    setLoadingMat(true);
    try {
      let endpoint = '/matriculas';
      let selectFields = 'id,estado,creado_en,pdf_siga_url,pdf_no_adeudar_url,estudiante_id,estudiantes!inner(usuario_id,nivel,carrera_id,carreras(nombre),usuarios(nombres,apellidos))';

      if (tabParam === 'practicas') {
        endpoint = '/practicas_proyectos';
        selectFields = 'id,estado,total_horas_validadas,estudiante_id,estudiantes!inner(nivel,carrera_id,carreras(nombre),usuarios(nombres,apellidos))';
      } else if (tabParam === 'titulacion') {
        endpoint = '/expedientes_titulacion';
        selectFields = 'id,estado,tema_proyecto,anteproyecto_url,estudiante_id,estudiantes!inner(nivel,carrera_id,carreras(nombre),usuarios(nombres,apellidos))';
      }

      let filterQuery = '';
      if (user?.role === 'docente' && user?.id) {
        // Docentes/Coordinadores solo revisan expedientes en etapa de Coordinación (OFFICE_2)
        filterQuery = '&estado=eq.OFFICE_2';
        
        // Obtener carrera del docente
        const docRes = await fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${user.id}&nivel=eq.1&select=carrera_id`, {
          headers: { 'Accept': 'application/json' }
        });
        const docData = await docRes.json();
        if (docData && docData.length > 0) {
          const docCarreraId = docData[0].carrera_id;
          filterQuery += `&estudiantes.carrera_id=eq.${docCarreraId}`;
        }
      } else if (user?.role === 'secretaria') {
        // Secretaría Financiera solo revisa expedientes en etapa Financiera (OFFICE_1)
        filterQuery = '&estado=eq.OFFICE_1';
      }

      const res = await fetch(
        `${POSTGREST}${endpoint}?select=${selectFields}&order=creado_en.desc&limit=50${filterQuery}`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      const data = await res.json();
      setMatriculas(Array.isArray(data) ? data : []);
    } catch { 
      setMatriculas([]); 
    }
    setLoadingMat(false);
  }, [tabParam, user]);

  useEffect(() => {
    if (!isAdmin) {
      fetchMatriculas();
    }
  }, [fetchMatriculas, isAdmin]);

  // Cargar información extendida al seleccionar un expediente
  useEffect(() => {
    if (!selectedMat?.estudiante_id) {
      setPracticas(null);
      setBitacoras([]);
      setDocumentos({});
      setTitulacion(null);
      return;
    }

    const fetchExtendedInfo = async () => {
      setLoadingExt(true);
      setDetailSuccess('');
      try {
        const pracRes = await fetch(`${POSTGREST}/practicas_proyectos?estudiante_id=eq.${selectedMat.estudiante_id}&select=id,estado,total_horas_validadas`, {
          headers: { 'Accept': 'application/json' }
        });
        if (pracRes.ok) {
          const pracData = await pracRes.json();
          if (pracData.length > 0) {
            setPracticas(pracData[0]);
            
            // Cargar documentos desde localStorage (con fallbacks robustos)
            const projectId = pracData[0].id;
            const studentId = selectedMat.estudiante_id;
            const matId = selectedMat.id;
            
            console.log("DEBUG: admin loading practice data keys:", { projectId, studentId, matId });
            
            const storedDocs = localStorage.getItem(`yavirac-practicas-docs-${projectId}`) || 
                               localStorage.getItem(`yavirac-practicas-docs-${studentId}`) ||
                               localStorage.getItem(`yavirac-practicas-docs-${matId}`);
            if (storedDocs) {
              setDocumentos(JSON.parse(storedDocs));
            } else {
              setDocumentos({});
            }

            // Cargar datos del formulario fase
            const storedFase = localStorage.getItem(`yavirac-practicas-form-full-${projectId}`) || 
                               localStorage.getItem(`yavirac-practicas-form-full-${studentId}`) ||
                               localStorage.getItem(`yavirac-practicas-form-full-${matId}`);
            console.log("DEBUG: storedFase found:", !!storedFase);
            if (storedFase) {
              setFormFase(JSON.parse(storedFase));
            } else {
              setFormFase(null);
            }

            const bitRes = await fetch(`${POSTGREST}/bitacoras_actividades?practica_proyecto_id=eq.${projectId}&order=fecha_actividad.desc`, {
              headers: { 'Accept': 'application/json' }
            });
            if (bitRes.ok) {
              const bitData = await bitRes.json();
              setBitacoras(bitData);
            }
          }
        }

        // Cargar observaciones de matrícula rechazadas y el tercer documento desde localStorage
        const storedObs = localStorage.getItem(`yavirac-matricula-obs-${selectedMat.id}`);
        setRejectionObs(storedObs || '');

        // Obtener usuario_id del estudiante para cargar su tercer documento subido
        const userId = selectedMat.estudiantes?.usuario_id;
        if (userId) {
          const storedThirdDoc = localStorage.getItem(`yavirac-matricula-extra-doc-${userId}`);
          setThirdDocUrl(storedThirdDoc || null);
        } else {
          setThirdDocUrl(null);
        }

        const titRes = await fetch(`${POSTGREST}/expedientes_titulacion?estudiante_id=eq.${selectedMat.estudiante_id}&select=tema_proyecto,anteproyecto_url,estado`, {
          headers: { 'Accept': 'application/json' }
        });
        if (titRes.ok) {
          const titData = await titRes.json();
          if (titData.length > 0) setTitulacion(titData[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExt(false);
      }
    };

    fetchExtendedInfo();
  }, [selectedMat]);

  const handleApproveMatricula = async (mat: DBMatricula) => {
    // Restricciones de Firma Digital por Roles y Estados
    if (user?.role === 'secretaria' && mat.estado !== 'OFFICE_1') {
      toast({ type: 'error', message: 'Acceso Denegado', description: 'Secretaría de Finanzas solo puede firmar solvencias en etapa Financiera.' });
      return;
    }
    if (user?.role === 'docente' && mat.estado !== 'OFFICE_2') {
      toast({ type: 'error', message: 'Acceso Denegado', description: 'Coordinación de Carrera solo puede firmar en la etapa de Coordinación Académica.' });
      return;
    }

    let nextEstado = 'OFFICE_2';
    if (mat.estado === 'OFFICE_2') nextEstado = 'LEGALIZED';

    try {
      const res = await fetch(`${POSTGREST}/matriculas?id=eq.${mat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nextEstado })
      });
      if (res.ok) {
        setDetailSuccess(`Firma digital estampada. Estado: ${nextEstado}`);
        // Limpiar observaciones anteriores al aprobar
        localStorage.removeItem(`yavirac-matricula-obs-${mat.id}`);
        setRejectionObs('');
        toast({ type: 'success', message: 'Aprobación Exitosa', description: 'El expediente avanzó en el flujo formal.' });
        fetchMatriculas();
        setSelectedMat(prev => prev ? { ...prev, estado: nextEstado } : null);
      }
    } catch {
      toast({ type: 'error', message: 'Error', description: 'No se pudo firmar el expediente.' });
    }
  };

  const handleRejectMatricula = async (mat: DBMatricula) => {
    if (!rejectionObs.trim()) {
      toast({ type: 'error', message: 'Observación requerida', description: 'Debe especificar el motivo del rechazo para informar al alumno.' });
      return;
    }

    try {
      // Guardar motivo de rechazo en localStorage para que el alumno pueda verlo
      localStorage.setItem(`yavirac-matricula-obs-${mat.id}`, rejectionObs);

      // Colocar la solicitud en estado inicial de corrección
      const res = await fetch(`${POSTGREST}/matriculas?id=eq.${mat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'SUBMITTED' }) // Regresa al inicio para corrección
      });
      if (res.ok) {
        setDetailSuccess(`Trámite devuelto al alumno con observaciones.`);
        toast({ type: 'success', message: 'Expediente Devuelto', description: 'El estudiante recibirá las observaciones para corregir sus documentos.' });
        fetchMatriculas();
        setSelectedMat(prev => prev ? { ...prev, estado: 'SUBMITTED' } : null);
      }
    } catch {
      toast({ type: 'error', message: 'Error', description: 'No se pudo reportar las correcciones.' });
    }
  };

  const handleAddPracticeHours = async () => {
    if (!practicas?.id) return;
    const hours = parseInt(addHoursVal, 10);
    const newTotal = (practicas.total_horas_validadas ?? 0) + hours;

    try {
      const res = await fetch(`${POSTGREST}/practicas_proyectos?id=eq.${practicas.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_horas_validadas: newTotal })
      });
      if (res.ok) {
        setPracticas({ ...practicas, total_horas_validadas: newTotal });
        toast({ type: 'success', message: 'Horas Validadas', description: `Se añadieron ${hours} horas válidas.` });
      }
    } catch {
      toast({ type: 'error', message: 'Error', description: 'No se pudieron registrar las horas.' });
    }
  };

  const handleApproveTitulacion = async () => {
    if (!selectedMat?.estudiante_id) return;
    try {
      const res = await fetch(`${POSTGREST}/expedientes_titulacion?estudiante_id=eq.${selectedMat.estudiante_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'APROBADO' })
      });
      if (res.ok) {
        setTitulacion((prev: any) => prev ? { ...prev, estado: 'APROBADO' } : null);
        toast({ type: 'success', message: 'Propuesta Aprobada', description: 'El tema de tesis fue aprobado formalmente.' });
      }
    } catch {
      toast({ type: 'error', message: 'Error', description: 'No se pudo aprobar la propuesta.' });
    }
  };

  /**
   * Registra un nuevo usuario o actualiza los datos de un usuario existente.
   * Registers a new user or updates the details of an existing user.
   * @param {React.FormEvent} e - Form event / Evento de formulario.
   */
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar Cédula Ecuatoriana (Algoritmo de módulo 10) / Validate Ecuadorian ID
    if (!isValidEcuadorianCedula(formData.cedula)) {
      toast({ type: 'error', message: 'Cédula Inválida', description: 'El número de cédula ingresado es inválido para el territorio ecuatoriano.' });
      return;
    }

    // 2. Validar Correo Institucional / Validate institutional email domain
    if (!formData.correo.toLowerCase().endsWith('@yavirac.edu.ec')) {
      toast({ type: 'error', message: 'Correo Inválido', description: 'Únicamente se permiten correos con dominio @yavirac.edu.ec' });
      return;
    }

    // 3. Validar Contraseña (Solo si es nuevo usuario o si se ingresa texto para cambiarla al editar)
    // Validate password (Only if creating new user or if password field is filled during editing)
    const isPasswordRequired = !editingUser || (formData.password && formData.password.length > 0);
    if (isPasswordRequired) {
      const pwd = formData.password;
      const validLength = pwd.length >= 6 && pwd.length <= 12;
      const hasUpper = /[A-Z]/.test(pwd);
      const hasLower = /[a-z]/.test(pwd);
      const hasNum = /\d/.test(pwd);
      const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

      if (!validLength || !hasUpper || !hasLower || !hasNum || !hasSpecial) {
        toast({
          type: 'error',
          message: 'Contraseña Débil',
          description: 'La contraseña debe tener de 6 a 12 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial.'
        });
        return;
      }
    }

    const endpoint = editingUser ? '/api/auth/update-user' : '/api/auth/register';
    const payload = editingUser ? { id: editingUser.id, ...formData } : formData;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast({ type: 'success', message: editingUser ? 'Usuario Actualizado' : 'Usuario Registrado', description: 'Los datos fueron almacenados exitosamente.' });
        fetchUsers();
        router.push('/matriculas/admin');
      } else {
        toast({ type: 'error', message: 'Error', description: data.error || 'No se pudo guardar el usuario.' });
      }
    } catch {
      toast({ type: 'error', message: 'Error', description: 'Ocurrió un error de red.' });
    }
  };

  /**
   * Elimina de forma permanente un usuario y sus registros académicos asociados.
   * Permanently deletes a user and their associated academic records.
   * @param {string} id - User ID / Identificador del usuario.
   */
  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar permanentemente este usuario y todas sus dependencias asociadas?')) return;
    try {
      const res = await fetch('/api/auth/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ type: 'success', message: 'Usuario Eliminado', description: 'El registro y sus dependencias fueron removidos.' });
        fetchUsers();
      } else {
        toast({ type: 'error', message: 'Error', description: data.error || 'No se pudo borrar el usuario.' });
      }
    } catch {
      toast({ type: 'error', message: 'Error', description: 'Error de red.' });
    }
  };

  // Nombres de las páginas según tabParam
  let pageTitle = 'Bandeja de Matrículas';
  let pageDesc = 'Auditoría de expedientes estudiantiles y validación de solvencia de no adeudar';
  let pageIcon = <FileText size={16} color="white" />;

  if (tabParam === 'practicas') {
    pageTitle = 'Auditoría de Prácticas Pre-Profesionales';
    pageDesc = 'Validación de bitácoras de actividades de los alumnos y carpetas oficiales';
    pageIcon = <Briefcase size={16} color="white" />;
  } else if (tabParam === 'titulacion') {
    pageTitle = 'Auditoría de Propuestas de Titulación';
    pageDesc = 'Evaluación de temas registrados, revisión de anteproyectos PDF y actas de tribunal';
    pageIcon = <GraduationCap size={16} color="white" />;
  } else if (isAdmin) {
    if (tabParam === 'registrar') {
      pageTitle = 'Registrar Nuevo Usuario';
      pageDesc = 'Formulario oficial para registrar docentes, secretarias y alumnos en PostgreSQL';
      pageIcon = <User size={16} color="white" />;
    } else {
      pageTitle = 'Gestión Global de Usuarios';
      pageDesc = 'Listado del personal administrativo, estudiantes y docentes del Yavirac';
      pageIcon = <Users size={16} color="white" />;
    }
  }

  const selectedStudentName = selectedMat?.estudiantes?.usuarios
    ? `${selectedMat.estudiantes.usuarios.nombres} ${selectedMat.estudiantes.usuarios.apellidos}`
    : 'Estudiante';

  const sigaFile = selectedMat?.pdf_siga_url ? selectedMat.pdf_siga_url.split('/').pop() : 'No cargado';
  const siauFile = selectedMat?.pdf_no_adeudar_url ? selectedMat.pdf_no_adeudar_url.split('/').pop() : 'No cargado';

  return (
    <div className={styles.container}>
      {/* ── Cabecera ── */}
      <div className={styles.toolbar} style={{ justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f46c22', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(244, 108, 34, 0.25)' }}>
              {pageIcon}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#182f59', letterSpacing: '-0.03em', margin: 0 }}>
              {pageTitle}
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: 42, margin: 0 }}>
            {pageDesc}
          </p>
        </div>
      </div>

      {/* Selector de pestañas para Secretaría */}
      {isSecretaria && (
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
          {[
            { id: 'matriculas' as const, label: 'Expedientes de Matrículas', icon: <FileText size={15} /> },
            { id: 'periodo' as const, label: 'Configuración Cronograma', icon: <Timer size={15} /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveMainTab(tab.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '0.6rem', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.15s',
                background: activeMainTab === tab.id ? 'white' : 'transparent',
                color: activeMainTab === tab.id ? '#f46c22' : '#64748b',
                boxShadow: activeMainTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* VISTA PARA ADMINISTRADOR GENERAL */}
      {isAdmin ? (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {tabParam === 'registrar' || editingUser ? (
            <form onSubmit={handleSubmitUser} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'left', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              
              {/* Columna Izquierda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Rol Académico */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Rol Académico</label>
                  <select value={formData.rol} onChange={e => setFormData({ ...formData, rol: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.825rem', background: 'white', color: '#1e293b' }}>
                    <option value="STUDENT">Estudiante</option>
                    <option value="TEACHER">Docente</option>
                    <option value="SECRETARY">Secretaría</option>
                    <option value="COORDINATOR">Coordinación (Admin)</option>
                  </select>
                </div>

                {/* Cédula */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Cédula de ciudadanía</label>
                  <input type="text" maxLength={10} value={formData.cedula} onChange={e => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })} required 
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: `1.5px solid ${formData.cedula.length === 10 ? '#86efac' : '#fecaca'}`, borderRadius: 8, fontSize: '0.825rem', color: '#1e293b', background: formData.cedula.length === 10 ? '#f0fdf4' : '#fff5f5', outline: 'none' }} />
                  
                  {/* Badges de Validación Cédula (Mostrar solo cuando no cumple y ha escrito algo) */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {formData.cedula.length > 0 && (!/^\d+$/.test(formData.cedula)) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✗</span>
                        Solo dígitos
                      </span>
                    )}
                    {formData.cedula.length > 0 && formData.cedula.length !== 10 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✗</span>
                        10 Díg.
                      </span>
                    )}
                    {formData.cedula.length > 0 && !isValidEcuadorianCedula(formData.cedula) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✗</span>
                        Inválida (Civil)
                      </span>
                    )}
                  </div>
                </div>

                {/* Nombres y Apellidos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Nombres</label>
                    <input type="text" placeholder="Nombres" value={formData.nombres} onChange={e => setFormData({ ...formData, nombres: e.target.value })} required 
                      style={{ width: '100%', padding: '0.65rem 0.85rem', border: `1.5px solid ${formData.nombres.length >= 3 ? '#86efac' : '#cbd5e1'}`, borderRadius: 8, fontSize: '0.825rem', color: '#1e293b', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Apellidos</label>
                    <input type="text" placeholder="Apellidos" value={formData.apellidos} onChange={e => setFormData({ ...formData, apellidos: e.target.value })} required 
                      style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: '0.825rem', color: '#1e293b', outline: 'none' }} />
                  </div>
                </div>

                {/* Correo institucional */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Correo institucional</label>
                  <input type="email" value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })} required 
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: `1.5px solid ${formData.correo.includes('@yavirac.edu.ec') ? '#86efac' : '#fecaca'}`, borderRadius: 8, fontSize: '0.825rem', color: '#1e293b', background: formData.correo.includes('@yavirac.edu.ec') ? '#f0fdf4' : '#fff5f5', outline: 'none' }} />
                  
                  {/* Badges de Validación Correo (Mostrar solo cuando no cumple y ha escrito algo) */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {formData.correo.length > 0 && !formData.correo.includes('@') && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✗</span>
                        Falta @
                      </span>
                    )}
                    {formData.correo.length > 0 && !formData.correo.endsWith('@yavirac.edu.ec') && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✗</span>
                        Debe ser @yavirac.edu.ec
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna Derecha */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Contraseña */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Contraseña</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingUser} 
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: '0.825rem', color: '#1e293b', outline: 'none' }} />
                  
                  {/* Badges de Validación Contraseña (Mostrar solo cuando no cumple y ha escrito algo) */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {formData.password.length > 0 && (formData.password.length < 6 || formData.password.length > 12) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✗</span>
                        6-12 carac.
                      </span>
                    )}
                    {formData.password.length > 0 && !/[A-Z]/.test(formData.password) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✗</span>
                        Falta Mayús.
                      </span>
                    )}
                    {formData.password.length > 0 && !/[a-z]/.test(formData.password) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✗</span>
                        Falta Minús.
                      </span>
                    )}
                    {formData.password.length > 0 && !/\d/.test(formData.password) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✗</span>
                        Falta Número
                      </span>
                    )}
                    {formData.password.length > 0 && !/[^A-Za-z0-9]/.test(formData.password) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}>✗</span>
                        Falta Carac. Especial
                      </span>
                    )}
                  </div>
                </div>

                {/* Campos Condicionales de Carrera y Semestre */}
                {(formData.rol === 'STUDENT' || formData.rol === 'TEACHER') && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Carrera Asignada</label>
                      <select value={formData.carrera_id} onChange={e => setFormData({ ...formData, carrera_id: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.825rem', background: 'white' }}>
                        <option value="1">Desarrollo de Software</option>
                        <option value="2">Guía Nacional de Turismo</option>
                        <option value="3">Arte Culinario Ecuatoriano</option>
                        <option value="4">Marketing Digital</option>
                        <option value="5">Diseño de Modas</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Nivel / Semestre Actual</label>
                      <select value={formData.nivel} onChange={e => setFormData({ ...formData, nivel: e.target.value })} style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.825rem', background: 'white' }}>
                        <option value="1">1er Nivel</option>
                        <option value="2">2do Nivel</option>
                        <option value="3">3er Nivel</option>
                        <option value="4">4to Nivel</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button type="button" onClick={() => { setEditingUser(null); router.push('/matriculas/admin'); }} style={{ flex: 1, padding: '0.65rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer', color: '#475569' }}>
                Cancelar
              </button>
              <button type="submit" style={{ flex: 1, padding: '0.65rem', background: '#f46c22', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer', color: 'white', boxShadow: '0 4px 12px rgba(244,108,34,0.15)' }}>
                {editingUser ? 'Guardar Cambios' : 'Registrar Cuenta'}
              </button>
            </div>
          </form>
        ) : (
          /* LISTADO DE USUARIOS */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className={styles.searchWrapper} style={{ maxWidth: '400px' }}>
                <Search size={16} color="#94a3b8" />
                <input className="am-search-input" type="text" placeholder="Buscar por nombres, correo o rol..."
                  value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem' }} />
              </div>
              
              <button onClick={() => {
                setFormData({
                  cedula: '', nombres: '', apellidos: '', correo: '', password: '', rol: 'STUDENT', carrera_id: '1', nivel: '1', activo: true
                });
                router.push('/matriculas/admin?tab=registrar');
              }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.6rem 1.2rem', background: '#f46c22', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(244,108,34,0.15)' }}>
                <Plus size={16} /> Crear Nuevo Usuario
              </button>
            </div>

            {loadingUsers ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#94a3b8' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {users
                  .filter(u => {
                    const match = `${u.nombres} ${u.apellidos} ${u.correo} ${u.rol}`.toLowerCase();
                    return match.includes(search.toLowerCase());
                  })
                  .map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #cbd5e1', borderRadius: 12, padding: '1rem', gap: '1.5rem', flexWrap: 'wrap', textAlign: 'left' }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.925rem', fontWeight: 800, color: '#182f59' }}>{u.nombres} {u.apellidos}</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: u.activo ? '#dcfce7' : '#fee2e2', color: u.activo ? '#16a34a' : '#991b1b' }}>
                            {u.rol}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                          CI: {u.cedula} · Correo: {u.correo}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => {
                          setEditingUser(u);
                          setFormData({
                            cedula: u.cedula,
                            nombres: u.nombres,
                            apellidos: u.apellidos,
                            correo: u.correo,
                            password: '',
                            rol: u.rol ?? 'STUDENT',
                            carrera_id: String(u.carrera_id ?? 1),
                            nivel: String(u.nivel ?? 1),
                            activo: u.activo
                          });
                        }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.45rem 0.85rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: '#2563eb' }}>
                          <Edit2 size={13} /> Editar
                        </button>
                        
                        <button onClick={() => handleDeleteUser(u.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.45rem 0.85rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: '#dc2626' }}>
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
      ) : (
        /* VISTA PARA DOCENTES / SECRETARÍA */
        activeMainTab === 'periodo' ? (
          <PeriodConfigTab />
        ) : (
          <div className={styles.transitionContainer}>
            <div className={styles.slidingWrapper} style={{ transform: showDetail ? 'translateX(-50%)' : 'translateX(0%)' }}>
              
              {/* PANEL 1: Listado de Alumnos */}
              <div className={styles.listPanel} style={{ opacity: showDetail ? 0.3 : 1, width: '50%' }}>
                <div className={styles.toolbar} style={{ marginBottom: '1rem' }}>
                  <div className={styles.searchWrapper}>
                    <Search size={16} color="#94a3b8" />
                    <input className="am-search-input" type="text" placeholder="Buscar alumno..."
                      value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem' }} />
                    {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}><X size={14} /></button>}
                  </div>
                </div>

                {loadingMat ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : matriculas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: 12, border: '1px solid #e8edf3' }}>
                    <FileText size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontWeight: 600 }}>No hay expedientes pendientes</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {matriculas
                      .filter(m => {
                        const name = m.estudiantes?.usuarios 
                          ? `${m.estudiantes.usuarios.nombres} ${m.estudiantes.usuarios.apellidos}`.toLowerCase()
                          : '';
                        return name.includes(search.toLowerCase());
                      })
                      .map(mat => {
                        const cfg = STATUS_CONFIG[mat.estado] ?? STATUS_CONFIG['SUBMITTED'];
                        const isCompletedPrac = mat.total_horas_validadas !== undefined && mat.total_horas_validadas >= 240;

                        return (
                          <div key={mat.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', background: 'white', borderRadius: 10, border: '1px solid #e8edf3', textAlign: 'left' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {tabParam === 'practicas' ? <Briefcase size={16} color="#f46c22" /> : tabParam === 'titulacion' ? <GraduationCap size={16} color="#7c3aed" /> : cfg.icon}
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#182f59' }}>
                                {mat.estudiantes?.usuarios ? `${mat.estudiantes.usuarios.nombres} ${mat.estudiantes.usuarios.apellidos}` : 'Estudiante'}
                              </div>
                              
                              {tabParam === 'practicas' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                  <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden', maxWidth: 180 }}>
                                    <div style={{ height: '100%', background: '#f46c22', width: `${((mat.total_horas_validadas || 0) / 240) * 100}%` }} />
                                  </div>
                                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                    {mat.total_horas_validadas ?? 0}/240 hrs
                                  </span>
                                </div>
                              ) : tabParam === 'titulacion' ? (
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {mat.tema_proyecto ? `Tema: "${mat.tema_proyecto}"` : 'Sin tema registrado'}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                                  {mat.estudiantes?.carreras?.nombre ?? 'Carrera'} · Nivel {mat.estudiantes?.nivel ?? '—'}
                                </div>
                              )}
                            </div>

                            {tabParam === 'practicas' ? (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: isCompletedPrac ? '#dcfce7' : '#f1f5f9', color: isCompletedPrac ? '#15803d' : '#475569', border: `1px solid ${isCompletedPrac ? '#bbf7d0' : '#cbd5e1'}` }}>
                                {isCompletedPrac ? 'Completado' : 'En Progreso'}
                              </span>
                            ) : tabParam === 'titulacion' ? (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: mat.estado === 'APROBADO' ? '#dcfce7' : '#fffbeb', color: mat.estado === 'APROBADO' ? '#15803d' : '#b45309', border: `1px solid ${mat.estado === 'APROBADO' ? '#bbf7d0' : '#fed7aa'}` }}>
                                {mat.estado}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                {cfg.label}
                              </span>
                            )}

                            <button onClick={() => { setSelectedMat(mat); setShowDetail(true); }}
                              style={{ padding: '0.45rem 0.875rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Eye size={13} /> Auditar
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* PANEL 2: Detalle Deslizable */}
              <div className={styles.detailPanel} style={{ opacity: showDetail ? 1 : 0 }}>
                {selectedMat && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8edf3', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => { setShowDetail(false); setSelectedMat(null); }}
                          style={{ padding: '0.4rem', border: '1.5px solid #cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', cursor: 'pointer' }}>
                          <ArrowLeft size={16} />
                        </button>
                        <div style={{ textAlign: 'left' }}>
                          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#182f59' }}>Expediente de {selectedStudentName}</h2>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                            {selectedMat.estudiantes?.carreras?.nombre ?? 'Carrera'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {detailSuccess && (
                      <div style={{ padding: '8px 12px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, marginBottom: 12 }}>
                        {detailSuccess}
                      </div>
                    )}

                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginTop: '0.5rem' }}>
                      {loadingExt ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#cbd5e1' }}>
                          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                      ) : (
                        <>
                          {/* 1. MÓDULO MATRÍCULAS */}
                          {(!tabParam || tabParam === 'matriculas') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              <StageProgress status={selectedMat.estado} />
                              
                              <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 800, color: '#182f59', textTransform: 'uppercase', textAlign: 'left' }}>
                                  Documentación Cargada
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                                    <FileText size={18} color="#f46c22" />
                                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#182f59' }}>Formulario de Matrícula (SIGA)</div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sigaFile}</div>
                                    </div>
                                    {selectedMat.pdf_siga_url && (
                                      <a href={selectedMat.pdf_siga_url.startsWith('http') ? selectedMat.pdf_siga_url : `${window.location.origin}${selectedMat.pdf_siga_url}`} target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.75rem', background: '#fff7ed', color: '#f46c22', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', border: '1px solid #fed7aa' }}>
                                        Ver PDF
                                      </a>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                                    <FileText size={18} color="#22c55e" />
                                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#182f59' }}>Certificado de No Adeudar (SIAU)</div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{siauFile}</div>
                                    </div>
                                    {selectedMat.pdf_no_adeudar_url && (
                                      <a href={selectedMat.pdf_no_adeudar_url.startsWith('http') ? selectedMat.pdf_no_adeudar_url : `${window.location.origin}${selectedMat.pdf_no_adeudar_url}`} target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.75rem', background: '#f0fdf4', color: '#16a34a', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', border: '1px solid #bbf7d0' }}>
                                        Ver PDF
                                      </a>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                                    <FileText size={18} color="#ec4899" />
                                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#182f59' }}>Certificado de Matrícula</div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {thirdDocUrl ? thirdDocUrl.split('/').pop() : 'No cargado'}
                                      </div>
                                    </div>
                                    {thirdDocUrl && (
                                      <a href={thirdDocUrl.startsWith('http') ? thirdDocUrl : `${window.location.origin}${thirdDocUrl}`} target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.75rem', background: '#fdf2f8', color: '#db2777', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', border: '1px solid #fbcfe8' }}>
                                        Ver PDF
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {selectedMat.estado !== 'LEGALIZED' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 4, textAlign: 'left' }}>
                                      Observaciones / Motivo de Corrección (Alumno):
                                    </label>
                                    <textarea 
                                      value={rejectionObs} 
                                      onChange={e => setRejectionObs(e.target.value)} 
                                      placeholder="Escriba los errores de los documentos aquí para informar al estudiante..."
                                      style={{ width: '100%', height: '60px', padding: '8px', fontSize: '0.78rem', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none', resize: 'none' }}
                                    />
                                  </div>
                                  
                                  <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => handleRejectMatricula(selectedMat)}
                                      style={{ flex: 1, padding: '0.65rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                      <X size={14} /> Devolver con Observaciones
                                    </button>
                                    <button onClick={() => handleApproveMatricula(selectedMat)}
                                      style={{ flex: 1, padding: '0.65rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                      <Fingerprint size={14} /> Firmar y Registrar Aprobación
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2. MÓDULO PRÁCTICAS */}
                          {tabParam === 'practicas' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '1rem', textAlign: 'left' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#182f59', display: 'block', marginBottom: 8 }}>PROGRESO ACUMULADO</span>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#182f59' }}>
                                  {practicas?.total_horas_validadas ?? 0} / 240 <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>horas validadas</span>
                                </div>
                                <div style={{ width: '100%', height: 8, background: '#cbd5e1', borderRadius: 9999, overflow: 'hidden', marginTop: 10 }}>
                                  <div style={{ height: '100%', background: '#f46c22', width: `${Math.min(100, ((practicas?.total_horas_validadas || 0) / 240) * 100)}%` }} />
                                </div>
                              </div>

                              {/* Validación de Formatos Fase Práctica */}
                              {practicas && (
                                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '1rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#182f59', textTransform: 'uppercase' }}>
                                    Carpeta Digital de Fase Práctica
                                  </h4>
                                  
                                  {formFase ? (
                                    <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, padding: 12 }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {/* F1: Compromiso */}
                                        <details style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }} open>
                                          <summary style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                                            F1 · Acta Compromiso e Inicio
                                          </summary>
                                          <div style={{ padding: 12, fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 8, background: 'white' }}>
                                            {/* Documento F1 */}
                                            <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: 6, background: '#fafafa', fontFamily: '"Times New Roman", Times, serif' }}>
                                              <div style={{ textAlign: 'center', borderBottom: '1px double #000', paddingBottom: 6, marginBottom: 12 }}>
                                                <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</strong>
                                                <div style={{ fontSize: '0.7rem' }}>FORMATO 01 · CARTA DE PRESENTACIÓN Y ACTA COMPROMISO ESTUDIANTES</div>
                                              </div>
                                              <div style={{ fontSize: '0.75rem', lineHeight: 1.4, textAlign: 'justify', marginBottom: 10 }}>
                                                Yo, <strong>{selectedStudentName}</strong>, con C.C. <strong>{selectedMat?.estudiantes?.usuarios?.cedula ?? '—'}</strong>, estudiante de la carrera de <strong>DESARROLLO DE SOFTWARE</strong> en modalidad dual del <strong>INSTITUTO SUPERIOR TECNOLÓGICO YAVIRAC</strong>, asignado/a a <strong>{formFase.institucion_nombre || '—'}</strong>. Me comprometo con acatar la normativa general vigente con las obligaciones establecidas en el Artículo 16 del Reglamento para Carreras de Formación Dual.
                                              </div>
                                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                                                <tbody>
                                                  <tr><td><strong>Teléfono Celular:</strong></td><td>{formFase.telefono || '—'}</td></tr>
                                                  <tr><td><strong>Estado Civil / Tipo Sangre:</strong></td><td>{formFase.estado_civil || '—'} / {formFase.tipo_sangre || '—'}</td></tr>
                                                  <tr><td><strong>Domicilio:</strong></td><td>{formFase.domicilio || '—'}</td></tr>
                                                  <tr><td><strong>Contacto Emergencia:</strong></td><td>{formFase.contacto_emergencia || '—'} (Telf: {formFase.telefono_emergencia || '—'})</td></tr>
                                                </tbody>
                                              </table>
                                            </div>
                                            <div style={{ marginTop: 6, borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                                              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#c2410c', marginBottom: 4 }}>Correcciones F1:</label>
                                              <input type="text" value={formFase.obs_f1 || ''} 
                                                onChange={e => {
                                                  const updated = { ...formFase, obs_f1: e.target.value };
                                                  setFormFase(updated);
                                                  localStorage.setItem(`yavirac-practicas-form-full-${practicas.id}`, JSON.stringify(updated));
                                                }}
                                                placeholder="Escriba observaciones para F1..."
                                                style={{ width: '100%', padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #cbd5e1', borderRadius: 4 }} 
                                              />
                                            </div>
                                          </div>
                                        </details>

                                        {/* F2: Currículo */}
                                        <details style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                          <summary style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                                            F2 · Currículo Estandarizado (Hoja de Vida)
                                          </summary>
                                          <div style={{ padding: 12, fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 8, background: 'white' }}>
                                            {/* Vista de Documento Oficial de Hoja de Vida */}
                                            <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: 6, background: '#fafafa', fontFamily: '"Times New Roman", Times, serif' }}>
                                              <div style={{ textAlign: 'center', borderBottom: '1px double #000', paddingBottom: 6, marginBottom: 12 }}>
                                                <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</strong>
                                                <div style={{ fontSize: '0.7rem' }}>FORMATO 02 · CURRÍCULO ESTANDARIZADO DE FASE PRÁCTICA</div>
                                              </div>

                                              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 4 }}>1. Datos Personales</div>
                                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginBottom: 10 }}>
                                                <div><strong>Nombres:</strong> {selectedStudentName}</div>
                                                <div><strong>Cédula:</strong> {selectedMat?.estudiantes?.usuarios?.cedula ?? '—'}</div>
                                                <div><strong>Estado Civil:</strong> {formFase.estado_civil || '—'}</div>
                                                <div><strong>Teléfono Celular:</strong> {formFase.telefono || '—'}</div>
                                                <div style={{ gridColumn: 'span 2' }}><strong>Domicilio:</strong> {formFase.domicilio || '—'}</div>
                                                <div style={{ gridColumn: 'span 2' }}><strong>Email Institucional:</strong> {selectedMat?.estudiantes?.usuarios?.correo ?? '—'}</div>
                                              </div>

                                              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 4 }}>2. Datos Académicos</div>
                                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', marginBottom: 10 }}>
                                                <thead>
                                                  <tr style={{ background: '#eee', borderBottom: '1px solid #000' }}>
                                                    <th style={{ padding: 4 }}>Año</th>
                                                    <th style={{ padding: 4 }}>Institución</th>
                                                    <th style={{ padding: 4 }}>Título / Mención</th>
                                                    <th style={{ padding: 4 }}>Nota Final</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                    <td style={{ padding: 4 }}>{formFase.edu_anio || '—'}</td>
                                                    <td style={{ padding: 4 }}>{formFase.edu_institucion || '—'}</td>
                                                    <td style={{ padding: 4 }}>{formFase.edu_titulo || '—'}</td>
                                                    <td style={{ padding: 4 }}>{formFase.edu_nota || '—'}</td>
                                                  </tr>
                                                </tbody>
                                              </table>

                                              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 4 }}>3. Experiencia Laboral y Prácticas Duales</div>
                                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', marginBottom: 10 }}>
                                                <thead>
                                                  <tr style={{ background: '#eee', borderBottom: '1px solid #000' }}>
                                                    <th style={{ padding: 4 }}>Empresa / Institución</th>
                                                    <th style={{ padding: 4 }}>Cargo</th>
                                                    <th style={{ padding: 4 }}>Actividades Desarrolladas</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                    <td style={{ padding: 4 }}>{formFase.exp_empresa || '—'}</td>
                                                    <td style={{ padding: 4 }}>{formFase.exp_cargo || '—'}</td>
                                                    <td style={{ padding: 4 }}>{formFase.exp_actividades || '—'}</td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                              <div><strong>Habilidades y Logros Relevantes:</strong> {formFase.logros_relevantes || '—'}</div>
                                            </div>
                                            
                                            <div style={{ marginTop: 6, borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                                              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#c2410c', marginBottom: 4 }}>Correcciones F2:</label>
                                              <input type="text" value={formFase.obs_f2 || ''} 
                                                onChange={e => {
                                                  const updated = { ...formFase, obs_f2: e.target.value };
                                                  setFormFase(updated);
                                                  localStorage.setItem(`yavirac-practicas-form-full-${practicas.id}`, JSON.stringify(updated));
                                                }}
                                                placeholder="Escriba observaciones para F2..."
                                                style={{ width: '100%', padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #cbd5e1', borderRadius: 4 }} 
                                              />
                                            </div>
                                          </div>
                                        </details>

                                        {/* F3: Plan Marco */}
                                        <details style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                          <summary style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                                            F3 · Plan Marco de Prácticas
                                          </summary>
                                          <div style={{ padding: 12, fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, background: 'white' }}>
                                            {/* Documento F3 */}
                                            <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: 6, background: '#fafafa', fontFamily: '"Times New Roman", Times, serif' }}>
                                              <div style={{ textAlign: 'center', borderBottom: '1px double #000', paddingBottom: 6, marginBottom: 12 }}>
                                                <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</strong>
                                                <div style={{ fontSize: '0.7rem' }}>FORMATO 03 · PLAN MARCO DE FORMACIÓN PRÁCTICA DUAL</div>
                                              </div>
                                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', marginBottom: 8 }}>
                                                <tbody>
                                                  <tr><td><strong>Empresa Formadora:</strong></td><td>{formFase.institucion_nombre || '—'}</td></tr>
                                                  <tr><td><strong>Dirección Empresa:</strong></td><td>{formFase.direccion_empresa || '—'}</td></tr>
                                                  <tr><td><strong>Área / Departamento:</strong></td><td>{formFase.area_departamento || '—'}</td></tr>
                                                  <tr><td><strong>Tutor Empresarial:</strong></td><td>{formFase.tutor_empresarial_nombre || '—'} ({formFase.tutor_empresarial_cargo || '—'})</td></tr>
                                                  <tr><td><strong>Contacto Tutor:</strong></td><td>Telf: {formFase.tutor_empresarial_telefono || '—'} · Email: {formFase.tutor_empresarial_email || '—'}</td></tr>
                                                </tbody>
                                              </table>
                                              <div style={{ fontSize: '0.7rem', borderTop: '1px solid #cbd5e1', paddingTop: 4 }}>
                                                <strong>Actividades Planificadas:</strong>
                                                <p style={{ margin: '2px 0 0 0', fontStyle: 'italic' }}>{formFase.actividades_planificadas || '—'}</p>
                                              </div>
                                            </div>
                                            
                                            <div style={{ marginTop: 6, borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                                              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#c2410c', marginBottom: 4 }}>Correcciones F3:</label>
                                              <input type="text" value={formFase.obs_f3 || ''} 
                                                onChange={e => {
                                                  const updated = { ...formFase, obs_f3: e.target.value };
                                                  setFormFase(updated);
                                                  localStorage.setItem(`yavirac-practicas-form-full-${practicas.id}`, JSON.stringify(updated));
                                                }}
                                                placeholder="Escriba observaciones para F3..."
                                                style={{ width: '100%', padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #cbd5e1', borderRadius: 4 }} 
                                              />
                                            </div>
                                          </div>
                                        </details>

                                        {/* F4: Rotación */}
                                        <details style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                          <summary style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                                            F4 · Plan de Rotación en Empresa
                                          </summary>
                                          <div style={{ padding: 12, fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, background: 'white' }}>
                                            {/* Documento F4 */}
                                            <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: 6, background: '#fafafa', fontFamily: '"Times New Roman", Times, serif' }}>
                                              <div style={{ textAlign: 'center', borderBottom: '1px double #000', paddingBottom: 6, marginBottom: 12 }}>
                                                <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</strong>
                                                <div style={{ fontSize: '0.7rem' }}>FORMATO 04 · PLAN DE APRENDIZAJE PRÁCTICO Y ROTACIÓN DE PUESTOS</div>
                                              </div>
                                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                                                <tbody>
                                                  <tr><td><strong>Semanas Planificadas:</strong></td><td>{formFase.rotacion_semanas || '—'} semanas</td></tr>
                                                  <tr><td><strong>Puesto de Aprendizaje:</strong></td><td>{formFase.rotacion_puesto || '—'}</td></tr>
                                                  <tr><td><strong>Responsable de Puesto:</strong></td><td>{formFase.rotacion_responsable || '—'}</td></tr>
                                                  <tr><td><strong>Competencias a Desarrollar:</strong></td><td>{formFase.rotacion_competencias || '—'}</td></tr>
                                                </tbody>
                                              </table>
                                            </div>
                                            
                                            <div style={{ marginTop: 6, borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                                              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#c2410c', marginBottom: 4 }}>Correcciones F4:</label>
                                              <input type="text" value={formFase.obs_f4 || ''} 
                                                onChange={e => {
                                                  const updated = { ...formFase, obs_f4: e.target.value };
                                                  setFormFase(updated);
                                                  localStorage.setItem(`yavirac-practicas-form-full-${practicas.id}`, JSON.stringify(updated));
                                                }}
                                                placeholder="Escriba observaciones para F4..."
                                                style={{ width: '100%', padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #cbd5e1', borderRadius: 4 }} 
                                              />
                                            </div>
                                          </div>
                                        </details>

                                        {/* F5: Asistencia y Horario */}
                                        <details style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                          <summary style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                                            F5 · Registro de Asistencia y Horario
                                          </summary>
                                          <div style={{ padding: 12, fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, background: 'white' }}>
                                            {/* Documento F5 */}
                                            <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: 6, background: '#fafafa', fontFamily: '"Times New Roman", Times, serif' }}>
                                              <div style={{ textAlign: 'center', borderBottom: '1px double #000', paddingBottom: 6, marginBottom: 12 }}>
                                                <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</strong>
                                                <div style={{ fontSize: '0.7rem' }}>FORMATO 05 · REGISTRO CONTROL DE ASISTENCIA DIARIA Y ROTACIÓN</div>
                                              </div>
                                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                                                <tbody>
                                                  <tr><td><strong>Horario Ingreso:</strong></td><td>{formFase.horario_ingreso || '—'}</td></tr>
                                                  <tr><td><strong>Horario Almuerzo:</strong></td><td>{formFase.horario_almuerzo || '—'}</td></tr>
                                                  <tr><td><strong>Horario Salida:</strong></td><td>{formFase.horario_salida || '—'}</td></tr>
                                                </tbody>
                                              </table>
                                            </div>
                                            
                                            <div style={{ marginTop: 6, borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                                              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#c2410c', marginBottom: 4 }}>Correcciones F5:</label>
                                              <input type="text" value={formFase.obs_f5 || ''} 
                                                onChange={e => {
                                                  const updated = { ...formFase, obs_f5: e.target.value };
                                                  setFormFase(updated);
                                                  localStorage.setItem(`yavirac-practicas-form-full-${practicas.id}`, JSON.stringify(updated));
                                                }}
                                                placeholder="Escriba observaciones para F5..."
                                                style={{ width: '100%', padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #cbd5e1', borderRadius: 4 }} 
                                              />
                                            </div>
                                          </div>
                                        </details>

                                        {/* F7 y F8: Evaluaciones */}
                                        <details style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                                          <summary style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', cursor: 'pointer', userSelect: 'none' }}>
                                            F7 & F8 · Evaluaciones Empresa e Instituto
                                          </summary>
                                          <div style={{ padding: 12, fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, background: 'white' }}>
                                            {/* Documento F7 y F8 */}
                                            <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: 6, background: '#fafafa', fontFamily: '"Times New Roman", Times, serif' }}>
                                              <div style={{ textAlign: 'center', borderBottom: '1px double #000', paddingBottom: 6, marginBottom: 12 }}>
                                                <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</strong>
                                                <div style={{ fontSize: '0.7rem' }}>FORMATO 07 & 08 · EVALUACIÓN DE COMPETENCIAS Y CALIFICACIÓN FINAL</div>
                                              </div>
                                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', marginBottom: 6 }}>
                                                <tbody>
                                                  <tr><td><strong>Calificación Tutor Empresa (F7):</strong></td><td>{formFase.calificacion_tutor || '—'} / 10</td></tr>
                                                  <tr><td><strong>Observaciones de la Empresa:</strong></td><td>{formFase.eval_empresa_observaciones || '—'}</td></tr>
                                                  <tr style={{ borderTop: '1px dashed #cbd5e1' }}><td style={{ paddingTop: 4 }}><strong>Calificación Tutor Instituto (F8):</strong></td><td style={{ paddingTop: 4 }}>{formFase.calificacion_instituto || '—'} / 10</td></tr>
                                                  <tr><td><strong>Observaciones del Instituto:</strong></td><td>{formFase.eval_instituto_observaciones || '—'}</td></tr>
                                                  <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold', background: '#eee' }}>
                                                    <td style={{ padding: 4 }}>Promedio de Calificación Consolidado:</td>
                                                    <td style={{ padding: 4 }}>
                                                      {((parseFloat(formFase.calificacion_tutor || '0') + parseFloat(formFase.calificacion_instituto || '0')) / 2).toFixed(2)} / 10
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </div>
                                            
                                            <div style={{ marginTop: 6, borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                                              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#c2410c', marginBottom: 4 }}>Correcciones F7 y F8:</label>
                                              <input type="text" value={formFase.obs_f7_f8 || ''} 
                                                onChange={e => {
                                                  const updated = { ...formFase, obs_f7_f8: e.target.value };
                                                  setFormFase(updated);
                                                  localStorage.setItem(`yavirac-practicas-form-full-${practicas.id}`, JSON.stringify(updated));
                                                }}
                                                placeholder="Escriba observaciones para las evaluaciones..."
                                                style={{ width: '100%', padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #cbd5e1', borderRadius: 4 }} 
                                              />
                                            </div>
                                          </div>
                                        </details>
                                      </div>
                                      
                                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }} className="no-print">
                                        <button 
                                          onClick={() => {
                                            const printWin = window.open('', '_blank');
                                            if (printWin) {
                                              const cedulaEst = selectedMat?.estudiantes?.usuarios?.cedula ?? '—';
                                              const telefonoEst = formFase.telefono || '—';
                                              const estadoCivilEst = formFase.estado_civil || '—';
                                              const tipoSangreEst = formFase.tipo_sangre || '—';
                                              const domicilioEst = formFase.domicilio || '—';
                                              const contactoEmergenciaEst = formFase.contacto_emergencia || '—';
                                              const telefonoEmergenciaEst = formFase.telefono_emergencia || '—';
                                              
                                              const eduAnioEst = formFase.edu_anio || '—';
                                              const eduInstitucionEst = formFase.edu_institucion || '—';
                                              const eduTituloEst = formFase.edu_titulo || '—';
                                              const eduNotaEst = formFase.edu_nota || '—';
                                              
                                              const expEmpresaEst = formFase.exp_empresa || '—';
                                              const expCargoEst = formFase.exp_cargo || '—';
                                              const expActividadesEst = formFase.exp_actividades || '—';
                                              const logrosEst = formFase.logros_relevantes || '—';

                                              const institucionEst = formFase.institucion_nombre || '—';
                                              const direccionEst = formFase.direccion_empresa || '—';
                                              const areaEst = formFase.area_departamento || '—';
                                              const tutorEst = formFase.tutor_empresarial_nombre || '—';
                                              const tutorCargoEst = formFase.tutor_empresarial_cargo || '—';
                                              const tutorTelfEst = formFase.tutor_empresarial_telefono || '—';
                                              const actividadesEst = formFase.actividades_planificadas || '—';
                                              
                                              const rotacionSemanasEst = formFase.rotacion_semanas || '—';
                                              const rotacionPuestoEst = formFase.rotacion_puesto || '—';
                                              const rotacionRespEst = formFase.rotacion_responsable || '—';
                                              const rotacionCompEst = formFase.rotacion_competencias || '—';

                                              const ingresoEst = formFase.horario_ingreso || '—';
                                              const almuerzoEst = formFase.horario_almuerzo || '—';
                                              const salidaEst = formFase.horario_salida || '—';

                                              const califTutorEst = formFase.calificacion_tutor || '0';
                                              const califInstEst = formFase.calificacion_instituto || '0';
                                              const promedioEst = ((parseFloat(califTutorEst) + parseFloat(califInstEst)) / 2).toFixed(2);
                                              
                                              printWin.document.write(`
                                                <html>
                                                <head>
                                                  <title>Expediente Prácticas - ${selectedStudentName}</title>
                                                  <style>
                                                    body { font-family: "Times New Roman", Times, serif; padding: 2rem; line-height: 1.5; color: black; }
                                                    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
                                                    td, th { padding: 6px; text-align: left; border: 1px solid #ddd; }
                                                    th { background-color: #f2f2f2; }
                                                    .header { text-align: center; border-bottom: 2px double black; padding-bottom: 10px; margin-bottom: 20px; }
                                                    .section-title { border-bottom: 1px solid black; font-weight: bold; text-transform: uppercase; margin-top: 20px; margin-bottom: 10px; }
                                                  </style>
                                                </head>
                                                <body>
                                                  <div class="header">
                                                    <h2>INSTITUTO SUPERIOR TECNOLÓGICO YAVIRAC</h2>
                                                    <h3>Expediente de Prácticas Pre-Profesionales (Formatos F1 a F8 Mapeados)</h3>
                                                  </div>
                                                  
                                                  <div class="section-title">1. Formato F1 · Acta Compromiso e Inicio</div>
                                                  <table>
                                                    <tr><td><strong>Nombre Estudiante:</strong></td><td>${selectedStudentName}</td></tr>
                                                    <tr><td><strong>Cédula:</strong></td><td>${cedulaEst}</td></tr>
                                                    <tr><td><strong>Teléfono Celular:</strong></td><td>${telefonoEst}</td></tr>
                                                    <tr><td><strong>Estado Civil / Tipo Sangre:</strong></td><td>${estadoCivilEst} / ${tipoSangreEst}</td></tr>
                                                    <tr><td><strong>Domicilio:</strong></td><td>${domicilioEst}</td></tr>
                                                    <tr><td><strong>Contacto Emergencia:</strong></td><td>${contactoEmergenciaEst} (${telefonoEmergenciaEst})</td></tr>
                                                  </table>

                                                  <div class="section-title">2. Formato F2 · Currículo Estandarizado</div>
                                                  <table>
                                                    <tr><th>Año</th><th>Institución</th><th>Título/Mención</th><th>Nota</th></tr>
                                                    <tr><td>${eduAnioEst}</td><td>${eduInstitucionEst}</td><td>${eduTituloEst}</td><td>${eduNotaEst}</td></tr>
                                                  </table>
                                                  <table>
                                                    <tr><th>Empresa/Institución</th><th>Cargo</th><th>Actividades Desarrolladas</th></tr>
                                                    <tr><td>${expEmpresaEst}</td><td>${expCargoEst}</td><td>${expActividadesEst}</td></tr>
                                                  </table>
                                                  <p><strong>Logros y Habilidades Relevantes:</strong> ${logrosEst}</p>

                                                  <div class="section-title">3. Formato F3 · Plan Marco de Prácticas</div>
                                                  <table>
                                                    <tr><td><strong>Empresa Formadora:</strong></td><td>${institucionEst}</td></tr>
                                                    <tr><td><strong>Dirección Empresa:</strong></td><td>${direccionEst}</td></tr>
                                                    <tr><td><strong>Área de Trabajo:</strong></td><td>${areaEst}</td></tr>
                                                    <tr><td><strong>Tutor Empresarial:</strong></td><td>${tutorEst} (${tutorCargoEst}) - Telf: ${tutorTelfEst}</td></tr>
                                                  </table>
                                                  <p><strong>Actividades a Desarrollar:</strong> ${actividadesEst}</p>

                                                  <div class="section-title">4. Formato F4 · Plan de Rotación</div>
                                                  <table>
                                                    <tr><td><strong>Semanas:</strong></td><td>${rotacionSemanasEst} semanas</td></tr>
                                                    <tr><td><strong>Puesto Asignado:</strong></td><td>${rotacionPuestoEst}</td></tr>
                                                    <tr><td><strong>Responsable Puesto:</strong></td><td>${rotacionRespEst}</td></tr>
                                                    <tr><td><strong>Competencias:</strong></td><td>${rotacionCompEst}</td></tr>
                                                  </table>

                                                  <div class="section-title">5. Formato F5 · Horario y Asistencia</div>
                                                  <table>
                                                    <tr><td><strong>Horario Ingreso:</strong></td><td>${ingresoEst}</td></tr>
                                                    <tr><td><strong>Almuerzo:</strong></td><td>${almuerzoEst}</td></tr>
                                                    <tr><td><strong>Horario Salida:</strong></td><td>${salidaEst}</td></tr>
                                                  </table>

                                                  <div class="section-title">6. Formato F7 y F8 · Evaluaciones y Calificación</div>
                                                  <table>
                                                    <tr><td><strong>Nota del Tutor Empresarial (F7):</strong></td><td>${califTutorEst} / 10</td></tr>
                                                    <tr><td><strong>Nota del Tutor Académico (F8):</strong></td><td>${califInstEst} / 10</td></tr>
                                                    <tr style="font-weight: bold; background-color: #eee;"><td><strong>Promedio Final Consolidado:</strong></td><td>${promedioEst} / 10</td></tr>
                                                  </table>
                                                </body>
                                                </html>
                                              `);
                                              printWin.document.close();
                                              printWin.print();
                                            }
                                          }}
                                          style={{ width: '100%', padding: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', cursor: 'pointer', marginBottom: 12 }}>
                                          🖨️ Imprimir Todo el Expediente Estudiantil
                                        </button>
                                      </div>

                                      <div style={{ marginTop: 12, borderTop: '1px solid #cbd5e1', paddingTop: 12 }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#c2410c', marginBottom: 6 }}>Observaciones de Corrección (Se muestra al alumno)</label>
                                        <textarea
                                          value={formFase.observaciones || ''}
                                          onChange={e => {
                                            const updated = { ...formFase, observaciones: e.target.value };
                                            setFormFase(updated);
                                            localStorage.setItem(`yavirac-practicas-form-full-${practicas.id}`, JSON.stringify(updated));
                                          }}
                                          placeholder="Escriba aquí los errores encontrados, sugerencias o lo que le falta corregir al expediente..."
                                          rows={3}
                                          style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem', resize: 'none', fontFamily: 'inherit' }}
                                        />
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>* Se guarda automáticamente mientras escribe.</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>El estudiante no ha llenado el formulario de Fase Práctica digital aún.</div>
                                  )}
                                </div>
                              )}

                              <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 800, color: '#182f59', textTransform: 'uppercase', textAlign: 'left' }}>
                                  Actividades Registradas (Bitácora)
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {bitacoras.length === 0 ? (
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', padding: 8, background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1', textAlign: 'left' }}>
                                      Sin actividades registradas.
                                    </div>
                                  ) : (
                                    bitacoras.map((b, i) => (
                                      <div key={i} style={{ padding: '8px 12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                          <div style={{ fontWeight: 700, color: '#182f59' }}>{b.fecha_actividad} · {b.horas_realizadas} horas</div>
                                          <div style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{b.descripcion_actividad}</div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 3. MÓDULO TITULACIÓN */}
                          {tabParam === 'titulacion' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '1.25rem', textAlign: 'left' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#182f59' }}>ESTADO DE PROPUESTA</span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#fef3c7', color: '#b45309' }}>
                                    {titulacion?.estado ?? 'PENDIENTE'}
                                  </span>
                                </div>

                                {titulacion ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div>
                                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#182f59', marginBottom: 4 }}>Tema Propuesto:</div>
                                      <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', background: 'white', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', lineHeight: 1.4 }}>
                                        "{titulacion.tema_proyecto}"
                                      </div>
                                    </div>

                                    {titulacion.anteproyecto_url && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <a href={titulacion.anteproyecto_url} target="_blank" rel="noreferrer"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.5rem 1rem', background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                                          Ver Anteproyecto PDF
                                        </a>
                                      </div>
                                    )}

                                    {titulacion.estado !== 'APROBADO' && (
                                      <button onClick={handleApproveTitulacion}
                                        style={{ width: '100%', padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                                        <Fingerprint size={16} /> Validar y Aprobar Proyecto
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>El alumno no tiene registrado un tema de titulación.</div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )
      )}
    </div>
  );
}
