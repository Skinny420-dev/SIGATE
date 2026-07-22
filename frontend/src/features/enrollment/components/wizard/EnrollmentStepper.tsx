'use client';

import { useEnrollmentWizard } from '../../hooks/useEnrollmentWizard';
import { User, BookOpen, FileText, Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Inicio', icon: User },
  { id: 2, label: 'Documentos', icon: FileText },
  { id: 3, label: 'Materias', icon: BookOpen },
];

export function EnrollmentStepper() {
  const { currentStep } = useEnrollmentWizard();

  if (currentStep === 4) return null;

  return (
    <div className="am-root am-stepper-card" style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '0.75rem 1.5rem', borderRadius: 12, border: '1px solid #e8edf3', boxShadow: '0 2px 10px rgba(15,23,42,0.02)', width: '100%' }}>
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            {/* Nodo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: isCompleted ? '#10b981' : isActive ? '#eef2ff' : '#f8fafc',
                color: isCompleted ? 'white' : isActive ? '#4338ca' : '#94a3b8',
                border: isActive ? '2px solid #c7d2fe' : isCompleted ? '2px solid #10b981' : '1px solid #e2e8f0',
                transition: 'all 0.3s'
              }}>
                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <div className="am-stepper-label" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paso {step.id}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: isActive || isCompleted ? 800 : 600, color: isActive ? '#0f172a' : isCompleted ? '#065f46' : '#64748b', whiteSpace: 'nowrap' }}>
                  {step.label}
                </span>
              </div>
            </div>

            {/* Linea */}
            {i < STEPS.length - 1 && (
              <div className="am-stepper-line" style={{ flex: 1, height: 2, background: isCompleted ? '#10b981' : '#e2e8f0', margin: '0 1.5rem', transition: 'background 0.3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
