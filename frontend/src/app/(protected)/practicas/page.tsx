'use client';
import { useState, useEffect } from 'react';
import { useSessionStore } from '@/core/auth/session.store';
import { FileText, Calendar, PlusCircle, CheckCircle2, Clock, Loader2, AlertCircle, Printer, Save } from 'lucide-react';
import { useToast } from '@/shared/ui/ToastProvider';

const POSTGREST = process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005';

export default function PracticasPage() {
  const { user } = useSessionStore();
  const { toast, success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [proyecto, setProyecto] = useState<any>(null);
  const [bitacoras, setBitacoras] = useState<any[]>([]);
  const [horasRealizadas, setHorasRealizadas] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaActividad, setFechaActividad] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dbCedula, setDbCedula] = useState('—');

  // Pestaña de navegación interna de Fase Práctica
  const [faseSubTab, setFaseSubTab] = useState<'compromiso' | 'curriculum' | 'plan_marco' | 'rotacion' | 'asistencia' | 'eval_empresa' | 'eval_instituto'>('compromiso');

  // Datos completos de la Fase Práctica (Reemplazo total del XLSX)
  const [formFase, setFormFase] = useState({
    // Formato 01: Carta Compromiso y Datos Generales del Estudiante
    telefono: '',
    estado_civil: 'SOLTERO',
    tipo_sangre: 'O+',
    domicilio: '',
    contacto_emergencia: '',
    telefono_emergencia: '',
    compromiso_aceptado: false,

    // Formato 02: Currículo Estandarizado (Educación y Experiencia)
    edu_anio: '',
    edu_institucion: '',
    edu_titulo: '',
    edu_nota: '',
    exp_empresa: '',
    exp_cargo: '',
    exp_actividades: '',
    logros_relevantes: '',

    // Formato 03: Plan Marco de Formación
    institucion_nombre: '',
    area_departamento: '',
    tutor_empresarial_nombre: '',
    tutor_empresarial_cargo: '',
    tutor_empresarial_telefono: '',
    tutor_empresarial_email: '',
    direccion_empresa: '',
    actividades_planificadas: '',
    resultados_aprendizaje: '',
    horas_planificadas: '240',

    // Formato 04: Plan de Aprendizaje Práctico y Rotación
    rotacion_semanas: '8',
    rotacion_puesto: 'Desarrollador backend',
    rotacion_responsable: '',
    rotacion_competencias: '',

    // Formato 05: Acta de Asistencia y Rotación (Detalle de horario laboral)
    horario_ingreso: '08:30',
    horario_almuerzo: '12:30 - 13:30',
    horario_salida: '17:30',

    // Formato 07: Evaluación Empresarial
    calificacion_tutor: '10',
    eval_empresa_observaciones: '',

    // Formato 08: Evaluación por parte del Instituto
    calificacion_instituto: '10',
    eval_instituto_observaciones: '',

    // Campos opcionales de observaciones de tutoría para evitar errores de TS
    obs_f1: '',
    obs_f2: '',
    obs_f3: '',
    obs_f4: '',
    obs_f5: '',
    obs_f7_f8: '',
    observaciones: '',
  });

  /**
   * Obtiene la información del proyecto de prácticas y la bitácora de actividades del estudiante desde la base de datos PostgreSQL.
   * Fetches the student's internship project information and activity log from the PostgreSQL database.
   */
  const fetchPracticasData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Obtener la cédula del usuario / Fetch user national ID
      const userRes = await fetch(`${POSTGREST}/usuarios?id=eq.${user.id}&select=cedula`, {
        headers: { 'Accept': 'application/json' }
      });
      const userData = await userRes.json();
      if (userData && userData.length > 0) {
        setDbCedula(userData[0].cedula);
      }

      // 2. Obtener el ID del estudiante / Get the student's registered ID
      const estRes = await fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${user.id}&select=id`, {
        headers: { 'Accept': 'application/json' }
      });
      const estData = await estRes.json();
      if (estData.length > 0) {
        const estudianteId = estData[0].id;

        // 3. Obtener el proyecto activo de prácticas / Fetch the active internship project
        const projRes = await fetch(`${POSTGREST}/practicas_proyectos?estudiante_id=eq.${estudianteId}&select=id,estudiante_id,fecha_inicio,estado,total_horas_validadas,convenios_practicas(codigo_convenio,instituciones(nombre,direccion))`, {
          headers: { 'Accept': 'application/json' }
        });
        const projData = await projRes.json();
        if (projData.length > 0) {
          const activeProj = projData[0];
          setProyecto(activeProj);

          // 4. Obtener el listado de bitácoras registradas / Fetch all recorded internship activity logs
          const bitRes = await fetch(`${POSTGREST}/bitacoras_actividades?practica_proyecto_id=eq.${activeProj.id}&order=fecha_actividad.desc`, {
            headers: { 'Accept': 'application/json' }
          });
          const bitData = await bitRes.json();
          setBitacoras(Array.isArray(bitData) ? bitData : []);

          // 5. Cargar datos guardados del formulario desde localStorage / Load stored form progress from local cache
          const storedFase = localStorage.getItem(`yavirac-practicas-form-full-${activeProj.id}`);
          if (storedFase) {
            setFormFase(JSON.parse(storedFase));
          } else {
            // Valores iniciales por defecto desde la Base de Datos / Seed default values from DB
            setFormFase(prev => ({
              ...prev,
              institucion_nombre: activeProj.convenios_practicas?.instituciones?.nombre ?? '',
              direccion_empresa: activeProj.convenios_practicas?.instituciones?.direccion ?? ''
            }));
          }
        } else {
          // Si no tiene proyecto activo, se auto-crea uno / If no project exists, auto-generate one
          const convRes = await fetch(`${POSTGREST}/convenios_practicas?limit=1`, {
            headers: { 'Accept': 'application/json' }
          });
          const convData = await convRes.json();
          const convenioId = convData.length > 0 ? convData[0].id : 1;

          const studentInfoRes = await fetch(`${POSTGREST}/estudiantes?id=eq.${estudianteId}&select=carrera_id`, {
            headers: { 'Accept': 'application/json' }
          });
          const studentInfo = await studentInfoRes.json();
          const studentCarreraId = studentInfo.length > 0 ? studentInfo[0].carrera_id : null;

          let tutorId = null;
          if (studentCarreraId) {
            const docCarreraRes = await fetch(`${POSTGREST}/estudiantes?carrera_id=eq.${studentCarreraId}&nivel=eq.0&select=usuario_id&limit=1`, {
              headers: { 'Accept': 'application/json' }
            });
            const docCarreraData = await docCarreraRes.json();
            if (docCarreraData.length > 0) {
              tutorId = docCarreraData[0].usuario_id;
            }
          }

          if (!tutorId) {
            const docRes = await fetch(`${POSTGREST}/usuario_roles?select=usuario_id,roles!inner(nombre)&roles.nombre=eq.TEACHER&limit=1`, {
              headers: { 'Accept': 'application/json' }
            });
            const docData = await docRes.json();
            if (docData.length > 0) {
              tutorId = docData[0].usuario_id;
            } else {
              tutorId = 'c0a80101-0000-0000-0000-000000000002';
            }
          }

          const createProjRes = await fetch(`${POSTGREST}/practicas_proyectos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              estudiante_id: estudianteId,
              convenio_id: convenioId,
              tutor_docente_id: tutorId,
              fecha_inicio: new Date().toISOString().split('T')[0],
              estado: 'IN_PROGRESS',
              total_horas_validadas: 0
            })
          });
          if (createProjRes.ok) {
            const newProj = await createProjRes.json();
            if (newProj && newProj.length > 0) {
              setProyecto(newProj[0]);
              const bitRes = await fetch(`${POSTGREST}/bitacoras_actividades?practica_proyecto_id=eq.${newProj[0].id}&order=fecha_actividad.desc`, {
                headers: { 'Accept': 'application/json' }
              });
              const bitData = await bitRes.json();
              setBitacoras(Array.isArray(bitData) ? bitData : []);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPracticasData();
  }, [user?.id]);

  /**
   * Registra una nueva actividad diaria en la bitácora del estudiante.
   * Registers a new daily activity in the student's log.
   * @param {React.FormEvent} e - Form event / Evento de formulario.
   */
  const handleSubmitBitacora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyecto?.id) {
      error('No tienes un proyecto activo', 'Contacta a coordinación para asignar un proyecto de prácticas.');
      return;
    }
    if (!descripcion || !horasRealizadas || !fechaActividad) {
      toast({ type: 'warning', message: 'Campos Incompletos', description: 'Por favor completa todos los campos de la bitácora.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${POSTGREST}/bitacoras_actividades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          practica_proyecto_id: proyecto.id,
          fecha_actividad: fechaActividad,
          descripcion_actividad: descripcion,
          horas_realizadas: parseInt(horasRealizadas, 10),
          estado_auditoria: 'SUBMITTED'
        })
      });

      if (res.ok) {
        setDescripcion('');
        setHorasRealizadas('');
        setFechaActividad('');
        fetchPracticasData();
        success('Actividad registrada correctamente', 'Pendiente de aprobación por tu tutor docente.');
      } else {
        error('Error al registrar la actividad', 'Verifica los datos y vuelve a intentarlo.');
      }
    } catch {
      error('Error de conexión', 'No se pudo contactar con el servidor.');
    }
    setSubmitting(false);
  };

  const [activeTab, setActiveTab] = useState<'bitacora' | 'fase_practica'>('bitacora');

  /**
   * Guarda localmente en el navegador el estado de los formatos y documentos de la Fase Práctica (F1-F8).
   * Locally caches form inputs and documents for the Internship Stage (F1-F8).
   * @param {React.FormEvent} e - Form event / Evento de formulario.
   */
  const handleSaveFormFase = (e: React.FormEvent) => {
    e.preventDefault();
    if (proyecto?.id) {
      localStorage.setItem(`yavirac-practicas-form-full-${proyecto.id}`, JSON.stringify(formFase));
      if (proyecto.estudiante_id) {
        localStorage.setItem(`yavirac-practicas-form-full-${proyecto.estudiante_id}`, JSON.stringify(formFase));
      }
      toast({ type: 'success', message: 'Fase de Prácticas Guardada', description: 'Todos los formatos se guardaron de forma segura en la base de datos local de la plataforma.' });
    }
  };

  const handlePrintDocument = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: '#94a3b8' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Prácticas Pre-Profesionales
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Gestión y registro de bitácoras de actividades.
          </p>
        </div>
        
        <div style={{ background: 'white', border: '1px dashed #cbd5e1', borderRadius: 16, padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', marginBottom: '1.5rem' }}>
            <FileText size={32} />
          </div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Aún no tienes un proyecto de prácticas activo
          </h2>
          <p style={{ margin: '0 auto 2rem', maxWidth: 400, color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Para registrar bitácoras diarias, primero necesitas estar asignado a un Convenio y tener un Tutor Docente designado.
          </p>
          <button style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} />
            Contactar Coordinación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Fase de Prácticas Pre-Profesionales (Malla 2025)
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Llene la información de todos los formatos directamente en la plataforma digital.
          </p>
        </div>

        {/* Pestañas de Navegación */}
        <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
          <button onClick={() => setActiveTab('bitacora')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'bitacora' ? 'white' : 'transparent', color: activeTab === 'bitacora' ? '#f46c22' : '#64748b', boxShadow: activeTab === 'bitacora' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Registro de Actividades
          </button>
          <button onClick={() => setActiveTab('fase_practica')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: activeTab === 'fase_practica' ? 'white' : 'transparent', color: activeTab === 'fase_practica' ? '#f46c22' : '#64748b', boxShadow: activeTab === 'fase_practica' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Formatos Fase Práctica (Digital)
          </button>
        </div>
      </div>

      {activeTab === 'bitacora' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }} className="no-print">
          {/* Formulario */}
          <div style={{ background: 'white', border: '1px solid #e8edf3', borderRadius: 16, padding: '1.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
              <PlusCircle size={20} color="#4f46e5" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Nueva Actividad</h3>
            </div>

            <form onSubmit={handleSubmitBitacora} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Fecha de Actividad</label>
                <input 
                  type="date" 
                  value={fechaActividad} 
                  onChange={e => setFechaActividad(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: '0.85rem' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Horas Realizadas</label>
                <input 
                  type="number" 
                  min="1" 
                  max="8" 
                  value={horasRealizadas} 
                  onChange={e => setHorasRealizadas(e.target.value)}
                  placeholder="1 a 8 horas"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: '0.85rem' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Descripción de la Actividad</label>
                <textarea 
                  value={descripcion} 
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Detalla las tareas técnicas que realizaste..."
                  required
                  rows={4}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: '0.85rem', fontFamily: 'inherit', resize: 'none' }} 
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                style={{ width: '100%', padding: '0.75rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {submitting ? 'Guardando...' : 'Registrar en Bitácora'}
              </button>
            </form>
          </div>

          {/* Listado */}
          <div>
            {/* Tarjeta Resumen */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Horas Validadas</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{proyecto?.total_horas_validadas ?? 0} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ 240 hrs</span></div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#dbeafe', color: '#1e40af' }}>
                En progreso
              </span>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Historial de Actividades</h3>

            {bitacoras.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 16, border: '1px solid #e8edf3', color: '#94a3b8' }}>
                <FileText size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>No hay actividades registradas en este período</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bitacoras.map((b) => (
                  <div key={b.id} style={{ background: 'white', border: '1px solid #e8edf3', borderRadius: 12, padding: '1rem', display: 'flex', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: b.estado_auditoria === 'APROBADO' ? '#dcfce7' : '#fef3c7', color: b.estado_auditoria === 'APROBADO' ? '#15803d' : '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {b.estado_auditoria === 'APROBADO' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{b.horas_realizadas} horas registradas</div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{b.fecha_actividad}</span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                        {b.descripcion_actividad}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VISTA DIGITAL MULTI-FORMATOS DE FASE PRÁCTICA */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Bloque de Observaciones del Tutor Revisor por Secciones */}
          {(formFase.obs_f1 || formFase.obs_f2 || formFase.obs_f3 || formFase.obs_f4 || formFase.obs_f5 || formFase.obs_f7_f8 || formFase.observaciones) && (
            <div style={{ padding: '1rem', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 12, color: '#c2410c', fontSize: '0.825rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }} className="no-print">
              <span style={{ fontWeight: 800 }}>⚠️ Observaciones de Corrección del Tutor Docente Revisor:</span>
              <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4, color: '#7c2d12' }}>
                {formFase.obs_f1 && <li><strong>Acta Compromiso (F1):</strong> {formFase.obs_f1}</li>}
                {formFase.obs_f2 && <li><strong>Currículo (F2):</strong> {formFase.obs_f2}</li>}
                {formFase.obs_f3 && <li><strong>Plan Marco (F3):</strong> {formFase.obs_f3}</li>}
                {formFase.obs_f4 && <li><strong>Plan de Rotación (F4):</strong> {formFase.obs_f4}</li>}
                {formFase.obs_f5 && <li><strong>Asistencia (F5):</strong> {formFase.obs_f5}</li>}
                {formFase.obs_f7_f8 && <li><strong>Evaluaciones (F7/F8):</strong> {formFase.obs_f7_f8}</li>}
                {formFase.observaciones && <li><strong>General:</strong> {formFase.observaciones}</li>}
              </ul>
            </div>
          )}

          {/* Navegación de Sub-Formatos */}
          <div style={{ display: 'flex', gap: 4, background: '#f8fafc', borderRadius: 8, padding: 4, overflowX: 'auto', border: '1px solid #e2e8f0' }} className="no-print">
            {[
              { id: 'compromiso' as const, label: 'Acta Compromiso (F1)' },
              { id: 'curriculum' as const, label: 'Hoja de Vida (F2)' },
              { id: 'plan_marco' as const, label: 'Plan Marco (F3)' },
              { id: 'rotacion' as const, label: 'Plan de Rotación (F4)' },
              { id: 'asistencia' as const, label: 'Asistencia y Horario (F5)' },
              { id: 'eval_empresa' as const, label: 'Evaluación Empresa (F7)' },
              { id: 'eval_instituto' as const, label: 'Evaluación Instituto (F8)' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setFaseSubTab(tab.id)}
                style={{ flexShrink: 0, padding: '0.5rem 1rem', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.2s',
                  background: faseSubTab === tab.id ? '#1e293b' : 'transparent',
                  color: faseSubTab === tab.id ? 'white' : '#64748b'
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Formulario Principal de Entrada */}
          <form onSubmit={handleSaveFormFase} style={{ background: 'white', border: '1px solid #e8edf3', borderRadius: 16, padding: '1.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', textAlign: 'left' }} className="no-print">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#182f59' }}>
                  {faseSubTab === 'compromiso' && 'Datos F1: Acta Compromiso Estudiantil'}
                  {faseSubTab === 'curriculum' && 'Datos F2: Currículo Estandarizado'}
                  {faseSubTab === 'plan_marco' && 'Datos F3: Plan Marco de Prácticas'}
                  {faseSubTab === 'rotacion' && 'Datos F4: Plan de Rotación en Entidad'}
                  {faseSubTab === 'asistencia' && 'Datos F5: Asistencia y Horario Registrado'}
                  {faseSubTab === 'eval_empresa' && 'Datos F7: Evaluación Tutor Empresarial'}
                  {faseSubTab === 'eval_instituto' && 'Datos F8: Evaluación del Instituto'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>Ingrese los campos que requiere el archivo XLSX original de fase prácticas.</p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={handlePrintDocument} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.45rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                  <Printer size={14} /> Imprimir Pestaña Activa
                </button>
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f46c22', color: 'white', border: 'none', padding: '0.45rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                  <Save size={14} /> Guardar Cambios
                </button>
              </div>
            </div>

            {/* SECCIÓN COMPROMISO (F1) */}
            {faseSubTab === 'compromiso' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Teléfono Celular</label>
                    <input type="text" value={formFase.telefono} onChange={e => setFormFase({ ...formFase, telefono: e.target.value })} placeholder="Ej. 0999294011" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Estado Civil</label>
                    <select value={formFase.estado_civil} onChange={e => setFormFase({ ...formFase, estado_civil: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem', background: 'white' }}>
                      <option value="SOLTERO">Soltero/a</option>
                      <option value="CASADO">Casado/a</option>
                      <option value="DIVORCIADO">Divorciado/a</option>
                      <option value="UNIÓN LIBRE">Unión Libre</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Tipo de Sangre</label>
                    <input type="text" value={formFase.tipo_sangre} onChange={e => setFormFase({ ...formFase, tipo_sangre: e.target.value })} placeholder="Ej. O+" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Contacto de Emergencia</label>
                    <input type="text" value={formFase.contacto_emergencia} onChange={e => setFormFase({ ...formFase, contacto_emergencia: e.target.value })} placeholder="Ej. Mamá / Nombre" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Teléfono de Emergencia</label>
                    <input type="text" value={formFase.telefono_emergencia} onChange={e => setFormFase({ ...formFase, telefono_emergencia: e.target.value })} placeholder="Ej. 0987355363" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Dirección Domiciliaria</label>
                  <input type="text" value={formFase.domicilio} onChange={e => setFormFase({ ...formFase, domicilio: e.target.value })} placeholder="Av. Ajavi y Jose Maria Aleman" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <input type="checkbox" checked={formFase.compromiso_aceptado} onChange={e => setFormFase({ ...formFase, compromiso_aceptado: e.target.checked })} style={{ marginTop: 3 }} id="check-compromiso" />
                  <label htmlFor="check-compromiso" style={{ fontSize: '0.75rem', color: '#475569', cursor: 'pointer', lineHeight: 1.4 }}>
                    Declaro formalmente y acepto cumplir las prohibiciones de consumo de alcohol, estupefacientes y acatar el plan de rotación asignado por la institución receptora y el ISTY.
                  </label>
                </div>
              </div>
            )}

            {/* SECCIÓN HOJA DE VIDA (F2) */}
            {faseSubTab === 'curriculum' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>Historial Académico</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', marginBottom: 4 }}>Año</label>
                    <input type="text" value={formFase.edu_anio} onChange={e => setFormFase({ ...formFase, edu_anio: e.target.value })} placeholder="Ej. 2019" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', marginBottom: 4 }}>Institución</label>
                    <input type="text" value={formFase.edu_institucion} onChange={e => setFormFase({ ...formFase, edu_institucion: e.target.value })} placeholder="Unidad Educativa" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', marginBottom: 4 }}>Título o Mención</label>
                    <input type="text" value={formFase.edu_titulo} onChange={e => setFormFase({ ...formFase, edu_titulo: e.target.value })} placeholder="Bachiller Informática" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', marginBottom: 4 }}>Nota</label>
                    <input type="text" value={formFase.edu_nota} onChange={e => setFormFase({ ...formFase, edu_nota: e.target.value })} placeholder="9.50" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', marginTop: 8 }}>Experiencia Previa / Prácticas Previas</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 3fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', marginBottom: 4 }}>Empresa/Institución</label>
                    <input type="text" value={formFase.exp_empresa} onChange={e => setFormFase({ ...formFase, exp_empresa: e.target.value })} placeholder="Ej. Amauta-Tech" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', marginBottom: 4 }}>Cargo Desempeñado</label>
                    <input type="text" value={formFase.exp_cargo} onChange={e => setFormFase({ ...formFase, exp_cargo: e.target.value })} placeholder="Ej. Auxiliar Técnico" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', marginBottom: 4 }}>Actividades Realizadas</label>
                    <input type="text" value={formFase.exp_actividades} onChange={e => setFormFase({ ...formFase, exp_actividades: e.target.value })} placeholder="Soporte de sistemas, pruebas de API" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Logros Relevantes y Habilidades Técnicas</label>
                  <textarea rows={2} value={formFase.logros_relevantes} onChange={e => setFormFase({ ...formFase, logros_relevantes: e.target.value })} placeholder="Describa hechos relevantes, manejo de tecnologías o certificaciones..." style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem', fontFamily: 'inherit', resize: 'none' }} />
                </div>
              </div>
            )}

            {/* SECCIÓN PLAN MARCO (F3) */}
            {faseSubTab === 'plan_marco' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Entidad Formadora / Razón Social</label>
                    <input type="text" value={formFase.institucion_nombre} onChange={e => setFormFase({ ...formFase, institucion_nombre: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Dirección de la Entidad</label>
                    <input type="text" value={formFase.direccion_empresa} onChange={e => setFormFase({ ...formFase, direccion_empresa: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Tutor de la Empresa (Nombres y Apellidos)</label>
                    <input type="text" value={formFase.tutor_empresarial_nombre} onChange={e => setFormFase({ ...formFase, tutor_empresarial_nombre: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Contacto del Tutor</label>
                    <input type="text" value={formFase.tutor_empresarial_telefono} onChange={e => setFormFase({ ...formFase, tutor_empresarial_telefono: e.target.value })} placeholder="Ej. 0994287989" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Cargo del Tutor</label>
                    <input type="text" value={formFase.tutor_empresarial_cargo} onChange={e => setFormFase({ ...formFase, tutor_empresarial_cargo: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Área o Departamento de Trabajo</label>
                    <input type="text" value={formFase.area_departamento} onChange={e => setFormFase({ ...formFase, area_departamento: e.target.value })} placeholder="Ej. Desarrollo Backend" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Resumen de Actividades a Desarrollar</label>
                  <textarea rows={3} value={formFase.actividades_planificadas} onChange={e => setFormFase({ ...formFase, actividades_planificadas: e.target.value })} required placeholder="Escriba las metas generales, desarrollo backend y pruebas de software..." style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem', fontFamily: 'inherit', resize: 'none' }} />
                </div>
              </div>
            )}

            {/* SECCIÓN ROTACIÓN (F4) */}
            {faseSubTab === 'rotacion' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Número de Semanas</label>
                    <input type="number" value={formFase.rotacion_semanas} onChange={e => setFormFase({ ...formFase, rotacion_semanas: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Puesto de Aprendizaje</label>
                    <input type="text" value={formFase.rotacion_puesto} onChange={e => setFormFase({ ...formFase, rotacion_puesto: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Responsable del Puesto</label>
                    <input type="text" value={formFase.rotacion_responsable} onChange={e => setFormFase({ ...formFase, rotacion_responsable: e.target.value })} placeholder="Ej. Mauricio Tamayo" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Competencias a Desarrollar</label>
                  <textarea rows={3} value={formFase.rotacion_competencias} onChange={e => setFormFase({ ...formFase, rotacion_competencias: e.target.value })} placeholder="Desarrollo de microservicios, seguridad lógica y metodologías ágiles en software..." style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem', fontFamily: 'inherit', resize: 'none' }} />
                </div>
              </div>
            )}

            {/* SECCIÓN ASISTENCIA Y HORARIO (F5) */}
            {faseSubTab === 'asistencia' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Horario Ingreso</label>
                    <input type="text" value={formFase.horario_ingreso} onChange={e => setFormFase({ ...formFase, horario_ingreso: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Intervalo de Almuerzo</label>
                    <input type="text" value={formFase.horario_almuerzo} onChange={e => setFormFase({ ...formFase, horario_almuerzo: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Horario Salida</label>
                    <input type="text" value={formFase.horario_salida} onChange={e => setFormFase({ ...formFase, horario_salida: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: 8, textAlign: 'left' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6 }}>Cronograma de asistencia</span>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                    La asistencia diaria detallada se consolidará de forma automática en la sección inferior del reporte utilizando cada una de las bitácoras individuales que registre en la plataforma.
                  </p>
                </div>
              </div>
            )}

            {/* SECCIÓN EVALUACIÓN EMPRESA (F7) */}
            {faseSubTab === 'eval_empresa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Nota Ponderada (Tutor Empresa /10)</label>
                    <input type="number" min="1" max="10" step="0.1" value={formFase.calificacion_tutor} onChange={e => setFormFase({ ...formFase, calificacion_tutor: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Resultados / Competencias Demostradas</label>
                    <input type="text" value={formFase.resultados_aprendizaje} onChange={e => setFormFase({ ...formFase, resultados_aprendizaje: e.target.value })} placeholder="Ej. Excelente aplicación de algoritmos backend" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Observaciones / Comentarios del Tutor Empresarial</label>
                  <textarea rows={2} value={formFase.eval_empresa_observaciones} onChange={e => setFormFase({ ...formFase, eval_empresa_observaciones: e.target.value })} placeholder="Ninguna / Desempeño sobresaliente..." style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem', fontFamily: 'inherit', resize: 'none' }} />
                </div>
              </div>
            )}

            {/* SECCIÓN EVALUACIÓN INSTITUTO (F8) */}
            {faseSubTab === 'eval_instituto' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Nota Ponderada (Tutor Instituto /10)</label>
                    <input type="number" min="1" max="10" step="0.1" value={formFase.calificacion_instituto} onChange={e => setFormFase({ ...formFase, calificacion_instituto: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Observaciones del Tutor Académico</label>
                    <input type="text" value={formFase.eval_instituto_observaciones} onChange={e => setFormFase({ ...formFase, eval_instituto_observaciones: e.target.value })} placeholder="Revisión conforme de bitácoras académicas" style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Comentarios Generales del Docente Revisor</label>
                  <textarea rows={2} value={formFase.observaciones} onChange={e => setFormFase({ ...formFase, observaciones: e.target.value })} placeholder="Documentación de mallas curriculares y horas de prácticas completa..." style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.825rem', fontFamily: 'inherit', resize: 'none' }} />
                </div>
              </div>
            )}

          </form>

          {/* DOCUMENTO OFICIAL CONSOLIDADO IMPRIMIBLE (DINÁMICO SEGÚN PESTAÑA SELECCIONADA) */}
          <div style={{ background: 'white', border: '2px solid #1e293b', padding: '3.5rem', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontFamily: '"Times New Roman", Times, serif', color: 'black', lineHeight: 1.5, textAlign: 'left' }} id="print-area">
            
            {/* PAGINA 1: CARTA COMPROMISO (F1) */}
            {faseSubTab === 'compromiso' && (
              <div>
                <div style={{ textAlign: 'center', borderBottom: '2px double #000', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</h2>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Macroproceso 01 Docencia · Proceso de Formación Práctica</h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>FORMATO 01 · CARTA DE PRESENTACIÓN Y ACTA COMPROMISO ESTUDIANTES</p>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <strong>D.M. Quito,</strong> {new Date().toLocaleDateString('es-EC')}
                </div>

                <p style={{ fontSize: '0.9rem', textAlign: 'justify', marginBottom: '1.5rem' }}>
                  Yo, <strong>{user?.name ?? '—'}</strong>, con C.C. <strong>{dbCedula}</strong>, estudiante de la carrera de <strong>DESARROLLO DE SOFTWARE</strong> en modalidad dual del <strong>INSTITUTO SUPERIOR TECNOLÓGICO YAVIRAC</strong>, asignado/a a <strong>{formFase.institucion_nombre || '—'}</strong>.
                </p>

                <p style={{ fontSize: '0.9rem', textAlign: 'justify', marginBottom: '1rem' }}>
                  De acuerdo con el proyecto de carrera aprobado y vigente, en cumplimiento del currículo de la carrera y en el marco del convenio firmado, <u>me presento</u> y expreso <strong>mi interés y predisposición de realizar prácticas de formación dual</strong>, con el fin de cumplir con la planificación, ejecución, control y evaluación del desarrollo de mis competencias laborales.
                </p>

                <p style={{ fontSize: '0.9rem', textAlign: 'justify', marginBottom: '1rem' }}>
                  A la vez que, <u>me comprometo</u> con acatar la normativa general vigente con las obligaciones establecidas en el Artículo 16 del Reglamento para Carreras de Formación Dual, reconociendo prohibiciones como: consumo de alcohol, estupefacientes, desacatos a tutores y falta de respeto al entorno laboral real.
                </p>

                <p style={{ fontSize: '0.9rem', textAlign: 'justify', marginBottom: '1.5rem' }}>
                  De manera libre y voluntaria acepto lo expresado y firmo esta acta compromiso como constancia:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: '4px' }}>
                      <strong>{user?.name}</strong>
                      <div>C.C. {dbCedula}</div>
                      <div>Estudiante</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: '4px' }}>
                      <strong>Tutor Docente</strong>
                      <div>ISTY Revisor</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGINA 2: CURRÍCULO ESTANDARIZADO (F2) */}
            {faseSubTab === 'curriculum' && (
              <div>
                <div style={{ textAlign: 'center', borderBottom: '2px double #000', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>FORMATO 02 · CURRÍCULO ESTANDARIZADO DE FASE PRÁCTICA</p>
                </div>

                <h4 style={{ borderBottom: '1px solid #000', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem' }}>1. Datos Personales</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '30%', fontWeight: 'bold', padding: '4px 0' }}>Nombres Completos:</td>
                      <td>{user?.name}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Cédula:</td>
                      <td>{dbCedula}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Estado Civil:</td>
                      <td>{formFase.estado_civil}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Teléfono Celular:</td>
                      <td>{formFase.telefono || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Domicilio:</td>
                      <td>{formFase.domicilio || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Email Institucional:</td>
                      <td>{user?.email}</td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ borderBottom: '1px solid #000', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem' }}>2. Datos Académicos</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Año</th>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Institución</th>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Título / Mención</th>
                      <th style={{ textAlign: 'right', padding: '4px' }}>Nota Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px' }}>{formFase.edu_anio || '2019'}</td>
                      <td style={{ padding: '4px' }}>{formFase.edu_institucion || 'Colegio de Bachillerato'}</td>
                      <td style={{ padding: '4px' }}>{formFase.edu_titulo || 'Bachiller Informática'}</td>
                      <td style={{ padding: '4px', textAlign: 'right' }}>{formFase.edu_nota || '9.20'}</td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ borderBottom: '1px solid #000', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem' }}>3. Experiencia Laboral y Prácticas Duales</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Institución / Empresa</th>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Cargo</th>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Actividades Desarrolladas</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px' }}>{formFase.exp_empresa || 'Empresa de Soporte'}</td>
                      <td style={{ padding: '4px' }}>{formFase.exp_cargo || 'Pasante'}</td>
                      <td style={{ padding: '4px' }}>{formFase.exp_actividades || 'Instalación de Software y pruebas técnicas'}</td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ borderBottom: '1px solid #000', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem' }}>4. Información Adicional y Logros</h4>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>
                  {formFase.logros_relevantes || 'Manejo intermedio de bases de datos PostgreSQL y control de versiones Git.'}
                </p>
              </div>
            )}

            {/* PAGINA 3: PLAN MARCO DE FORMACIÓN (F3) */}
            {faseSubTab === 'plan_marco' && (
              <div>
                <div style={{ textAlign: 'center', borderBottom: '2px double #000', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>FORMATO 03 · PLAN MARCO DE FORMACIÓN PRÁCTICA</p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '35%', fontWeight: 'bold', padding: '4px 0' }}>Empresa Formadora:</td>
                      <td>{formFase.institucion_nombre || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Dirección de la Empresa:</td>
                      <td>{formFase.direccion_empresa || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Núcleo Estructurante Malla:</td>
                      <td>DESARROLLO DE SOFTWARE DUAL (NIVEL 3)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Horas de Formación Práctica:</td>
                      <td>{formFase.horas_planificadas} horas</td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ borderBottom: '1px solid #000', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Objetivos Generales de la Fase Práctica</h4>
                <p style={{ fontSize: '0.9rem', textAlign: 'justify', marginBottom: '1.5rem' }}>
                  Desarrollar aplicaciones web tanto del lado del cliente como del servidor utilizando lenguajes de programación web y aplicando algoritmos de búsqueda, ordenamiento y bases de datos robustas orientados a satisfacer necesidades tecnológicas específicas del perfil institucional.
                </p>

                <h4 style={{ borderBottom: '1px solid #000', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Actividades y Resultados de Aprendizaje Planificados</h4>
                <p style={{ fontSize: '0.9rem', textAlign: 'justify', margin: 0 }}>
                  {formFase.actividades_planificadas || '—'}
                </p>
              </div>
            )}

            {/* PAGINA 4: PLAN DE ROTACIÓN Y ASISTENCIA (F4) */}
            {faseSubTab === 'rotacion' && (
              <div>
                <div style={{ textAlign: 'center', borderBottom: '2px double #000', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>FORMATO 04 · PLAN DE APRENDIZAJE PRÁCTICO Y ROTACIÓN</p>
                </div>

                <h4 style={{ borderBottom: '1px solid #000', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Plan de Rotación de Puestos</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '35%', fontWeight: 'bold', padding: '4px 0' }}>Puesto de Aprendizaje:</td>
                      <td>{formFase.rotacion_puesto}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Semanas de Trabajo:</td>
                      <td>{formFase.rotacion_semanas} semanas</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Responsable / Tutor:</td>
                      <td>{formFase.rotacion_responsable || formFase.tutor_empresarial_nombre}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Competencias a Desarrollar:</td>
                      <td>{formFase.rotacion_competencias || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINA 5: REGISTRO DE ASISTENCIA Y HORARIO (F5) */}
            {faseSubTab === 'asistencia' && (
              <div>
                <div style={{ textAlign: 'center', borderBottom: '2px double #000', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>FORMATO 05 · REGISTRO DE ASISTENCIA DIARIA</p>
                </div>

                <h4 style={{ borderBottom: '1px solid #000', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Acta de Horario Laboral y Asistencia</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '35%', fontWeight: 'bold', padding: '4px 0' }}>Horario de Entrada:</td>
                      <td>{formFase.horario_ingreso}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Intervalo de Almuerzo:</td>
                      <td>{formFase.horario_almuerzo}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Horario de Salida:</td>
                      <td>{formFase.horario_salida}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINA 6: EVALUACIÓN EMPRESA (F7) */}
            {faseSubTab === 'eval_empresa' && (
              <div>
                <div style={{ textAlign: 'center', borderBottom: '2px double #000', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>FORMATO 07 · INFORME DE EVALUACIÓN POR PARTE DE LA ENTIDAD FORMADORA</p>
                </div>

                <h4 style={{ borderBottom: '1px solid #000', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Evaluación Consolidada de Desempeño</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', fontWeight: 'bold', padding: '6px 0' }}>Evaluación del Tutor Empresarial (Nota sobre 10):</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{formFase.calificacion_tutor} / 10</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', padding: '6px 0' }}>Observaciones / Comentarios:</td>
                      <td style={{ padding: '6px 0' }}>{formFase.eval_empresa_observaciones || 'Desempeño excelente y proactivo.'}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: '4px' }}>
                      <strong>Tutor Empresarial</strong>
                      <div>Firma y Sello</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: '4px' }}>
                      <strong>Estudiante</strong>
                      <div>Firma de Conformidad</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGINA 7: EVALUACIÓN INSTITUTO (F8) */}
            {faseSubTab === 'eval_instituto' && (
              <div>
                <div style={{ textAlign: 'center', borderBottom: '2px double #000', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Instituto Superior Tecnológico Yavirac</h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>FORMATO 08 · INFORME DE EVALUACIÓN POR PARTE DEL INSTITUTO</p>
                </div>

                <h4 style={{ borderBottom: '1px solid #000', fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Evaluación Consolidada de Horas de Bitácora y Tutorías</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '2rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th style={{ textAlign: 'left', padding: '5px 0', width: '20%' }}>Fecha</th>
                      <th style={{ textAlign: 'left', padding: '5px 0', width: '65%' }}>Descripción Técnica de la Actividad</th>
                      <th style={{ textAlign: 'right', padding: '5px 0', width: '15%' }}>Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bitacoras.slice(0, 10).map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px dashed #ddd' }}>
                        <td style={{ padding: '5px 0' }}>{b.fecha_actividad}</td>
                        <td style={{ padding: '5px 0' }}>{b.descripcion_actividad}</td>
                        <td style={{ padding: '5px 0', textAlign: 'right' }}>{b.horas_realizadas} hrs</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                      <td colSpan={2} style={{ padding: '6px 0' }}>Total Horas Registradas y Consolidadas:</td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>{proyecto?.total_horas_validadas ?? 0} horas</td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', fontWeight: 'bold', padding: '6px 0' }}>Evaluación del Tutor Instituto (Nota sobre 10):</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{formFase.calificacion_instituto} / 10</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold' }}>
                      <td style={{ padding: '6px 0' }}>Nota Promedio Final Consolidada:</td>
                      <td style={{ padding: '6px 0', color: '#16a34a' }}>
                        {((parseFloat(formFase.calificacion_tutor) + parseFloat(formFase.calificacion_instituto)) / 2).toFixed(2)} / 10
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '4rem', textAlign: 'center', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: '4px' }}>
                      <strong>Tutor Académico</strong>
                      <div>Docente Revisor / Yavirac</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: '4px' }}>
                      <strong>Coordinación de Carrera</strong>
                      <div>Firma y Sello</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      
      {/* Estilos adicionales para impresión Premium */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
