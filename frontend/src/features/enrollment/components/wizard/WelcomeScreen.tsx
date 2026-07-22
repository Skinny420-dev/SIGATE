import { useState, useEffect } from 'react';
import { useEnrollmentWizard } from '../../hooks/useEnrollmentWizard';
import { Calendar, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';

interface Periodo {
  codigo: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export function WelcomeScreen() {
  const { nextStep } = useEnrollmentWizard();
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivePeriod = async () => {
      try {
        const serverUrl = process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005';
        const res = await fetch(`${serverUrl}/periodos_academicos?activo=eq.true&limit=1`, {
          headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
          setPeriodo(data[0]);
        }
      } catch (err) {
        console.error('Error fetching period:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivePeriod();
  }, []);

  // Calcular fechas dinámicas de matrículas:
  // Ordinarias: fecha_inicio a fecha_inicio + 15 días
  // Extraordinarias: fecha_inicio + 16 días a fecha_inicio + 25 días
  let ordText = 'Cargando...';
  let extText = 'Cargando...';
  let isWithinDates = true; // Por seguridad permitimos avanzar si no carga
  let codigoPeriodo = '2026-I';

  if (periodo) {
    codigoPeriodo = periodo.codigo;
    const start = new Date(periodo.fecha_inicio + 'T00:00:00');
    
    const ordEnd = new Date(start);
    ordEnd.setDate(start.getDate() + 15);
    
    const extStart = new Date(start);
    extStart.setDate(start.getDate() + 16);
    
    const extEnd = new Date(start);
    extEnd.setDate(start.getDate() + 25);

    const formatDate = (d: Date) => {
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    };

    ordText = `${formatDate(start)} - ${formatDate(ordEnd)}, 2026`;
    extText = `${formatDate(extStart)} - ${formatDate(extEnd)}, 2026`;

    const now = new Date();
    isWithinDates = now >= start && now <= extEnd;
  }

  return (
    <div className="am-welcome-card" style={{ background: 'white', padding: '1.75rem 2rem', borderRadius: '16px', border: '1px solid #e8edf3', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.15)' }}>
          <Calendar size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>Cronograma de Matrículas</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Semestre académico {codigoPeriodo}.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem', color: '#64748b' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="am-cronograma-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem', width: '100%', maxWidth: '800px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <h4 style={{ color: '#4338ca', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5' }} />
              Matrículas Ordinarias
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>{ordText}</p>
          </div>
          
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <h4 style={{ color: '#b45309', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }} />
              Matrículas Extraordinarias
            </h4>
            <p style={{ color: '#92400e', fontSize: '0.85rem', fontWeight: 500 }}>{extText}</p>
          </div>
        </div>
      )}

      <div style={{ padding: '1.25rem 1.5rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '1.5rem', width: '100%', maxWidth: '800px' }}>
        <h4 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Requisitos obligatorios para iniciar (Fase A):</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} /> Tener descargada y firmada tu <strong>Ficha Estudiantil</strong>.</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} /> Tener descargado el <strong>Certificado de No Adeudar</strong> actualizado (SIAU).</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} /> Tener a mano el comprobante o <strong>Certificado de Matrícula</strong> oficial.</li>
        </ul>
      </div>

      {!loading && (isWithinDates ? (
        <button onClick={nextStep} style={{
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
          color: 'white', border: 'none', padding: '0.8rem 2rem',
          borderRadius: '10px', fontSize: '0.95rem', fontWeight: 800,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)', transition: 'all 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          Comenzar Carga de Documentos <ChevronRight size={18} />
        </button>
      ) : (
        <div style={{ padding: '1rem 1.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.9rem' }}>El sistema se encuentra cerrado fuera del periodo académico establecido.</span>
        </div>
      ))}
    </div>
  );
}
