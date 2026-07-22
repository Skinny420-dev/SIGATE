'use client';

import { useState, useEffect } from 'react';
import { useEnrollmentWizard } from '../../hooks/useEnrollmentWizard';
import { useEnrollment } from '../../hooks/useEnrollment';
import { BookOpen, Lock, CheckCircle2, ArrowLeft, X, Check, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';

export function StepSubjects() {
  const { prevStep, submitEnrollmentRequest } = useEnrollmentWizard();
  const { subjects, cart, toggleSubject, fetchSubjects, loading, error } = useEnrollment();
  const [activeLevel, setActiveLevel] = useState<number | null>(null);

  // Obtener los datos del usuario logueado y su nivel real desde localStorage
  const storedLevel = typeof window !== 'undefined' ? localStorage.getItem('yavirac-active-student-level') : null;
  const studentLevel = storedLevel ? parseInt(storedLevel, 10) : 1;

  // Cargar materias reales desde PostgreSQL al montar el componente
  useEffect(() => {
    fetchSubjects(1); // carrera_id = 1 → Desarrollo de Software
  }, [fetchSubjects]);

  const isCartEmpty = cart.length === 0;
  // Solo mostramos el nivel correspondiente a su semestre actual
  const LEVELS = [studentLevel];

  const LEVEL_COLORS: Record<number, { bg: string, text: string, border: string }> = {
    1: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    2: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    3: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    4: { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
    5: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
  };

  const activeLevelSubjects = activeLevel ? subjects.filter(s => s.level === activeLevel) : [];

  // ── Estado de carga ──
  if (loading) {
    return (
      <div style={{ background: 'white', padding: '4rem 2rem', borderRadius: '16px', border: '1px solid #e8edf3', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Loader2 size={36} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Cargando malla curricular desde la base de datos...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Estado de error ──
  if (error) {
    return (
      <div style={{ background: 'white', padding: '3rem 2rem', borderRadius: '16px', border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <AlertTriangle size={36} color="#dc2626" />
        <p style={{ color: '#991b1b', fontWeight: 700, margin: 0 }}>{error}</p>
        <button onClick={() => fetchSubjects(1)} style={{ padding: '0.6rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    );
  }



  return (
    <div className="am-subjects-card" style={{ background: 'white', padding: '2rem 2.5rem', borderRadius: '16px', border: '1px solid #e8edf3', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)', position: 'relative' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem', color: '#0f172a', letterSpacing: '-0.02em' }}>Selección de Materias</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Elige el nivel para explorar y matricularte en las asignaturas disponibles.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <BookOpen size={18} color="#4f46e5" />
          <span style={{ fontWeight: 800, color: '#0f172a' }}>{cart.length}</span>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>materias elegidas</span>
        </div>
      </div>

      {/* TARJETAS DE NIVELES */}
      <div className="am-levels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {LEVELS.map(level => {
          const count = subjects.filter(s => s.level === level).length;
          const selectedCount = subjects.filter(s => s.level === level && cart.includes(s.id)).length;
          const colors = LEVEL_COLORS[level];

          return (
            <div 
              key={level}
              onClick={() => setActiveLevel(level)}
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <h4 style={{ color: colors.text, fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Nivel {level}</h4>
              <p style={{ color: colors.text, fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>{count} asignaturas disponibles</p>
              
              {selectedCount > 0 && (
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#10b981', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}>
                  {selectedCount}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM ACTION BAR (CARRITO) */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Píldoras de materias */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Tu selección actual:
          </h4>
          {isCartEmpty ? (
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>No has agregado ninguna materia. Selecciona un nivel arriba para comenzar.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {cart.map(id => {
                const s = subjects.find(sub => sub.id === id);
                return (
                  <div key={id} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{s?.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Acciones e Info Total */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={prevStep} style={{
              background: 'transparent', color: '#475569', border: 'none', padding: 0,
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.color = '#0f172a'} onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
              <ArrowLeft size={16} /> Volver a Documentos
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Materias</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: cart.length >= 6 ? '#ef4444' : '#0f172a' }}>{cart.length} / 6</span>
            </div>

            <button onClick={submitEnrollmentRequest} disabled={isCartEmpty} style={{
              background: isCartEmpty ? '#e2e8f0' : 'linear-gradient(135deg, #10b981, #059669)',
              color: isCartEmpty ? '#94a3b8' : 'white', border: 'none', padding: '0.8rem 2rem',
              borderRadius: '12px', fontSize: '1rem', fontWeight: 800, cursor: isCartEmpty ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: isCartEmpty ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)', transition: 'all 0.2s'
            }}>
              Enviar Solicitud <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE MATERIAS */}
      {activeLevel !== null && (
        <div className="am-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="am-modal-content" style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 50px rgba(0,0,0,0.2)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '2rem 2.5rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Materias Nivel {activeLevel}</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Selecciona las materias que deseas cursar. Se han evaluado tus prerrequisitos.</p>
              </div>
              <button 
                onClick={() => setActiveLevel(null)}
                style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="am-modal-grid" style={{ padding: '2rem 2.5rem', overflowY: 'auto', display: activeLevelSubjects.length > 0 ? 'grid' : 'flex', gridTemplateColumns: activeLevelSubjects.length > 0 ? 'repeat(auto-fill, minmax(220px, 1fr))' : 'none', justifyContent: 'center', alignItems: 'center', gap: '1rem', minHeight: '150px' }}>
              {activeLevelSubjects.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <AlertTriangle size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>No existen asignaturas registradas para este nivel en este período académico.</p>
                </div>
              ) : (
                activeLevelSubjects.map(subject => {
                  const inCart = cart.includes(subject.id);
                  const isLocked = subject.status === 'LOCKED';
                  const isApproved = subject.status === 'APPROVED';

                  let bgColor = '#ffffff';
                  let borderColor = '#e2e8f0';
                  
                  if (inCart) {
                    bgColor = '#eef2ff';
                    borderColor = '#6366f1';
                  } else if (isApproved) {
                    bgColor = '#f8fafc';
                    borderColor = 'transparent';
                  } else if (isLocked) {
                    bgColor = '#f1f5f9';
                    borderColor = 'transparent';
                  }

                  return (
                    <div 
                      key={subject.id}
                      onClick={() => !isLocked && !isApproved && toggleSubject(subject.id)}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '16px',
                        border: `2px solid ${borderColor}`,
                        background: bgColor,
                        cursor: (isLocked || isApproved) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: isLocked ? 0.6 : 1,
                        position: 'relative',
                        boxShadow: inCart ? '0 4px 14px rgba(79, 70, 229, 0.15)' : '0 1px 3px rgba(15, 23, 42, 0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ background: isApproved ? '#e2e8f0' : isLocked ? '#e2e8f0' : inCart ? '#4f46e5' : '#f1f5f9', color: inCart ? 'white' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {subject.credits} CR
                        </div>
                        {isApproved && <CheckCircle2 size={18} color="#10b981" />}
                        {isLocked && <Lock size={16} color="#94a3b8" />}
                        {inCart && <CheckCircle2 size={18} color="#4f46e5" />}
                      </div>
                      
                      <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: isApproved ? '#94a3b8' : isLocked ? '#64748b' : '#0f172a', lineHeight: 1.3 }}>
                        {subject.name}
                      </h5>
                      
                      {isLocked && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Prerrequisitos pendientes</p>}
                      {isApproved && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Aprobada</p>}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
              <button 
                onClick={() => setActiveLevel(null)}
                style={{ background: '#0f172a', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,23,42,0.3)' }}
              >
                Guardar Selección
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
