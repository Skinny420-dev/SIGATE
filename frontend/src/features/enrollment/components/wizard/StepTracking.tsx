'use client';

import { useEnrollmentWizard } from '../../hooks/useEnrollmentWizard';
import { CheckCircle2, Clock, FileText, ArrowRight, Building2, Users, FileCheck, Award, Hash, AlertCircle } from 'lucide-react';

export function StepTracking() {
  const { trackerStatus, adminSimulateApproval } = useEnrollmentWizard();

  const isOff1Done = trackerStatus === 'OFFICE_2' || trackerStatus === 'SECRETARY' || trackerStatus === 'LEGALIZED';
  const isOff2Done = trackerStatus === 'SECRETARY' || trackerStatus === 'LEGALIZED';
  const isSecDone = trackerStatus === 'LEGALIZED';

  // Obtener los datos del usuario logueado en tiempo real
  const sessionText = typeof window !== 'undefined' ? localStorage.getItem('instituto-session') : null;
  const sessionObj = sessionText ? JSON.parse(sessionText) : null;
  const rawUser = sessionObj?.state?.user;

  const studentName = rawUser?.name ?? 'Estudiante'; 
  const career = rawUser?.role === 'estudiante' ? 'Desarrollo de Software' : 'Carrera';
  const level = '3';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

        .am-root * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }

        @keyframes pulse-ring {
          0% { transform: scale(0.85); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(79, 70, 229, 0); }
          100% { transform: scale(0.85); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .pulsing-node {
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }

        .am-btn-primary {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          border: none;
          box-shadow: 0 2px 8px rgba(79,70,229,0.35);
          transition: all 0.15s;
          cursor: pointer;
        }
        .am-btn-primary:hover { opacity: 0.92; box-shadow: 0 4px 14px rgba(79,70,229,0.4); }
      `}</style>

      <div className="am-root am-tracking-card" style={{
        background: 'white',
        border: '1px solid #e8edf3',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        minHeight: '560px'
      }}>
        {/* COLUMNA IZQUIERDA: Resumen del Expediente */}
        <div className="am-tracking-left" style={{ width: 330, background: '#f8fafc', borderRight: '1px solid #e8edf3', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          
          <div style={{ padding: '2rem 1.75rem' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: '1.75rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                AV
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eef2ff', color: '#4338ca', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 20, marginBottom: 6, textTransform: 'uppercase' }}>
                  <Hash size={10} /> Mi Expediente
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {studentName}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {career} · Nvl {level}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { label: 'N° Solicitud', value: '#EXP-2024-0412' },
                { label: 'Período', value: '2024-S2' },
                { label: 'Recibido el', value: '15 Jun 2024' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.875rem', background: 'white', border: '1px solid #e8edf3', borderRadius: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 800 }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              {(() => {
                const activeId = typeof window !== 'undefined' ? localStorage.getItem('yavirac-active-matricula-id') : null;
                const obs = activeId ? localStorage.getItem(`yavirac-matricula-obs-${activeId}`) : null;

                if (obs) {
                  return (
                    <div style={{ padding: '1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12 }}>
                      <AlertCircle size={22} color="#ef4444" style={{ marginBottom: '0.6rem' }} />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.25rem' }}>Correcciones requeridas</h4>
                      <p style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 700, margin: '4px 0 8px 0', padding: '6px 10px', background: '#fee2e2', borderRadius: 6, textAlign: 'left' }}>
                        Nota: "{obs}"
                      </p>
                      <button onClick={() => {
                        // Regresar al paso de subir documentos (Paso 2)
                        useEnrollmentWizard.setState({ currentStep: 2 });
                      }} className="am-btn-primary" style={{ padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, width: '100%', background: '#ef4444', border: 'none', color: 'white' }}>
                        Subir Documentos Nuevamente
                      </button>
                    </div>
                  );
                }

                if (isSecDone) {
                  return (
                    <div style={{ textAlign: 'center', background: '#f0fdf4', padding: '1.25rem', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                      <CheckCircle2 size={28} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#15803d', marginBottom: '0.4rem' }}>¡Trámite Finalizado!</h4>
                      <p style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '1rem', lineHeight: 1.4 }}>Tu certificado de matrícula ya está listo.</p>
                      <button className="am-btn-primary" style={{ padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, width: '100%' }}>
                        Descargar Certificado
                      </button>
                    </div>
                  );
                }

                return (
                  <div style={{ padding: '1.25rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
                    <Clock size={22} color="#d97706" style={{ marginBottom: '0.6rem' }} />
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400e', marginBottom: '0.25rem' }}>En revisión por autoridades</h4>
                    <p style={{ fontSize: '0.8rem', color: '#b45309', lineHeight: 1.5 }}>
                      Te notificaremos cuando tu expediente haya sido legalizado. No requiere acción de tu parte.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Rastreo en Tiempo Real */}
        <div className="am-tracking-right" style={{ flex: 1, padding: '2.5rem 3.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>Línea de Tiempo del Trámite</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Rastreo en tiempo real de la validación de tu matrícula.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            
            {/* FASE A */}
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, position: 'relative', boxShadow: '0 3px 10px rgba(16, 185, 129, 0.25)', flexShrink: 0 }}>
                  <FileText size={18} />
                </div>
                <div style={{ width: 2, flex: 1, background: '#10b981', margin: '4px 0', minHeight: 24 }} />
              </div>
              <div style={{ paddingBottom: '2.5rem', flex: 1, paddingTop: '0.15rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#065f46' }}>Fase A: Recepción de Documentos</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>Formulario SIGA y Certificado SIAU cargados correctamente al sistema.</p>
              </div>
            </div>

            {/* OFICINA 1: Financiero */}
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
                <div className={trackerStatus === 'OFFICE_1' ? 'pulsing-node' : ''} style={{ width: 40, height: 40, borderRadius: '50%', background: isOff1Done ? '#10b981' : (trackerStatus === 'OFFICE_1' ? '#4f46e5' : '#f1f5f9'), color: isOff1Done || trackerStatus === 'OFFICE_1' ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, position: 'relative', boxShadow: isOff1Done ? '0 3px 10px rgba(16, 185, 129, 0.25)' : (trackerStatus === 'OFFICE_1' ? '0 3px 10px rgba(79, 70, 229, 0.25)' : 'none'), flexShrink: 0 }}>
                  {isOff1Done ? <CheckCircle2 size={18} /> : <Building2 size={18} />}
                </div>
                <div style={{ width: 2, flex: 1, background: isOff1Done ? '#10b981' : '#f1f5f9', margin: '4px 0', minHeight: 24, transition: 'background 0.5s' }} />
              </div>
              <div style={{ paddingBottom: '2.5rem', flex: 1, paddingTop: '0.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: isOff1Done ? '#065f46' : (trackerStatus === 'OFFICE_1' ? '#0f172a' : '#94a3b8') }}>Verificación Financiera</h4>
                  {trackerStatus === 'OFFICE_1' && <span style={{ background: '#eef2ff', color: '#4338ca', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>EN REVISIÓN</span>}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>Cruce de datos con la base SIAU para confirmar que no existan retenciones por deudas pendientes.</p>
              </div>
            </div>

            {/* OFICINA 2: Coordinación */}
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
                <div className={trackerStatus === 'OFFICE_2' ? 'pulsing-node' : ''} style={{ width: 40, height: 40, borderRadius: '50%', background: isOff2Done ? '#10b981' : (trackerStatus === 'OFFICE_2' ? '#4f46e5' : '#f1f5f9'), color: isOff2Done || trackerStatus === 'OFFICE_2' ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, position: 'relative', boxShadow: isOff2Done ? '0 3px 10px rgba(16, 185, 129, 0.25)' : (trackerStatus === 'OFFICE_2' ? '0 3px 10px rgba(79, 70, 229, 0.25)' : 'none'), flexShrink: 0 }}>
                  {isOff2Done ? <CheckCircle2 size={18} /> : <Users size={18} />}
                </div>
                <div style={{ width: 2, flex: 1, background: isOff2Done ? '#10b981' : '#f1f5f9', margin: '4px 0', minHeight: 24, transition: 'background 0.5s' }} />
              </div>
              <div style={{ paddingBottom: '2.5rem', flex: 1, paddingTop: '0.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: isOff2Done ? '#065f46' : (trackerStatus === 'OFFICE_2' ? '#0f172a' : '#94a3b8') }}>Coordinación de Carrera</h4>
                  {trackerStatus === 'OFFICE_2' && <span style={{ background: '#eef2ff', color: '#4338ca', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>EN REVISIÓN</span>}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>Auditoría de tu solicitud SIGA y revisión de paralelos y prerrequisitos académicos.</p>
              </div>
            </div>

            {/* SECRETARÍA GENERAL */}
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
                <div className={trackerStatus === 'SECRETARY' ? 'pulsing-node' : ''} style={{ width: 40, height: 40, borderRadius: '50%', background: isSecDone ? '#10b981' : (trackerStatus === 'SECRETARY' ? '#4f46e5' : '#f1f5f9'), color: isSecDone || trackerStatus === 'SECRETARY' ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, position: 'relative', boxShadow: isSecDone ? '0 3px 10px rgba(16, 185, 129, 0.25)' : (trackerStatus === 'SECRETARY' ? '0 3px 10px rgba(79, 70, 229, 0.25)' : 'none'), flexShrink: 0 }}>
                  {isSecDone ? <Award size={18} /> : <FileCheck size={18} />}
                </div>
              </div>
              <div style={{ flex: 1, paddingTop: '0.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: isSecDone ? '#065f46' : (trackerStatus === 'SECRETARY' ? '#0f172a' : '#94a3b8') }}>Secretaría General</h4>
                  {trackerStatus === 'SECRETARY' && <span style={{ background: '#eef2ff', color: '#4338ca', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>LEGALIZANDO</span>}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>Emisión de certificado oficial con firmas digitales de las autoridades de la institución.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
