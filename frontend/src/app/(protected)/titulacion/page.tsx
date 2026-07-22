'use client';
import { useState, useEffect } from 'react';
import { useSessionStore } from '@/core/auth/session.store';
import { FileText, Calendar, PlusCircle, CheckCircle2, Clock, Loader2, Link, FileCheck } from 'lucide-react';
import { useToast } from '@/shared/ui/ToastProvider';

const POSTGREST = process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005';

export default function TitulacionPage() {
  const { user } = useSessionStore();
  const { toast, success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [expediente, setExpediente] = useState<any>(null);
  
  const [tema, setTema] = useState('');
  const [anteproyecto, setAnteproyecto] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTitulacionData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Obtener estudiante_id
      const estRes = await fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${user.id}&select=id`, {
        headers: { 'Accept': 'application/json' }
      });
      const estData = await estRes.json();
      if (estData.length > 0) {
        const estudianteId = estData[0].id;

        // 2. Obtener expediente de titulación
        const expRes = await fetch(`${POSTGREST}/expedientes_titulacion?estudiante_id=eq.${estudianteId}&select=id,tema_proyecto,anteproyecto_url,estado,director_docente_id,usuarios(nombres,apellidos)`, {
          headers: { 'Accept': 'application/json' }
        });
        const expData = await expRes.json();
        if (expData.length > 0) {
          setExpediente(expData[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTitulacionData();
  }, [user?.id]);

  const handleSubmitExpediente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema || !anteproyecto) {
      toast({ type: 'warning', message: 'Campos incompletos', description: 'Por favor ingresa el tema y la URL del anteproyecto.' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Obtener estudianteId
      const estRes = await fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${user?.id}&select=id`, {
        headers: { 'Accept': 'application/json' }
      });
      const estData = await estRes.json();
      if (estData.length === 0) {
        error('Error', 'Estudiante no encontrado.');
        setSubmitting(false);
        return;
      }
      const estudianteId = estData[0].id;

      // 2. Registrar expediente
      const res = await fetch(`${POSTGREST}/expedientes_titulacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          estudiante_id: estudianteId,
          tema_proyecto: tema,
          anteproyecto_url: anteproyecto,
          estado: 'REQUISITOS_CHECK'
        })
      });

      if (res.ok) {
        fetchTitulacionData();
        success('Expediente registrado con éxito', 'Tu trámite de titulación se ha iniciado correctamente.');
      } else {
        error('Error al registrar el expediente', 'Verifica los datos y vuelve a intentarlo.');
      }
    } catch {
      error('Error de conexión', 'No se pudo contactar con el servidor.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: '#94a3b8' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Unidad de Integración Curricular (Titulación)
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Ingresa tu propuesta de anteproyecto e inicia tu proceso de egresamiento institucional.
        </p>
      </div>

      {expediente ? (
        /* Expediente ya registrado */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Estado del Proceso</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {expediente.estado === 'REQUISITOS_CHECK' ? 'Validación de Requisitos' : expediente.estado}
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '6px 12px', borderRadius: 20, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} /> Revisión Inicial
            </span>
          </div>

          <div style={{ background: 'white', border: '1px solid #e8edf3', borderRadius: 16, padding: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Datos de la Propuesta</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>TEMA APROBADO</div>
                <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, marginTop: 2 }}>{expediente.tema_proyecto}</div>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>PROPUESTA ANTEPROYECTO</div>
                <a href={expediente.anteproyecto_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#4f46e5', fontWeight: 700, textDecoration: 'none', marginTop: 4 }}>
                  <Link size={14} /> Abrir Propuesta PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Formulario de registro */
        <div style={{ background: 'white', border: '1px solid #e8edf3', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
            <FileCheck size={20} color="#4f46e5" />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Registro de Propuesta</h3>
          </div>

          <form onSubmit={handleSubmitExpediente} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Tema Propuesto</label>
              <input 
                type="text" 
                value={tema} 
                onChange={e => setTema(e.target.value)}
                placeholder="Ej. Sistema Web de Control de Inventario usando RFID para..."
                required
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: '0.875rem' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>URL Anteproyecto (PDF)</label>
              <input 
                type="url" 
                value={anteproyecto} 
                onChange={e => setAnteproyecto(e.target.value)}
                placeholder="Ej. https://drive.google.com/file/d/..."
                required
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: '0.875rem' }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              style={{ width: '100%', padding: '0.8rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {submitting ? 'Registrando...' : 'Iniciar Proceso de Titulación'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
