'use client';

import { useEffect } from 'react';
import { useEnrollmentWizard } from '@/features/enrollment/hooks/useEnrollmentWizard';
import { WelcomeScreen } from '@/features/enrollment/components/wizard/WelcomeScreen';
import { EnrollmentStepper } from '@/features/enrollment/components/wizard/EnrollmentStepper';
import { StepDocuments } from '@/features/enrollment/components/wizard/StepDocuments';
import { StepSubjects } from '@/features/enrollment/components/wizard/StepSubjects';
import { StepTracking } from '@/features/enrollment/components/wizard/StepTracking';
import { FileText } from 'lucide-react';
import styles from './MatriculasPage.module.css';

export default function MatriculasPage() {
  const { currentStep, setStep, trackerStatus, submitEnrollmentRequest } = useEnrollmentWizard();

  useEffect(() => {
    const checkActiveEnrollment = async () => {
      try {
        const sessionText = localStorage.getItem('instituto-session');
        if (!sessionText) return;
        const sessionObj = JSON.parse(sessionText);
        const userId = sessionObj?.state?.user?.id;
        if (!userId) return;

        // 1. Obtener estudiante_id y nivel real desde PostgreSQL
        const estRes = await fetch(`${process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005'}/estudiantes?usuario_id=eq.${userId}&select=id,nivel`, {
          headers: { 'Accept': 'application/json' }
        });
        const estData = await estRes.json();
        if (estData.length > 0) {
          const estudianteId = estData[0].id;
          const estudianteNivel = estData[0].nivel;
          
          // Guardar nivel real para que StepSubjects lo lea en vez del mock
          localStorage.setItem('yavirac-active-student-level', String(estudianteNivel));

          // 2. Revisar si tiene matrícula activa ya enviada
          const matRes = await fetch(`${process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005'}/matriculas?estudiante_id=eq.${estudianteId}&select=id,estado`, {
            headers: { 'Accept': 'application/json' }
          });
          const matData = await matRes.json();
          if (matData.length > 0) {
            const activeMat = matData[0];
            const hasObs = localStorage.getItem(`yavirac-matricula-obs-${activeMat.id}`);
            
            // Si la matrícula ya fue creada/enviada, pasamos automáticamente al paso de rastreo (Paso 4)
            // Si tiene observaciones de corrección, también lo enviamos al Paso 4 para que pueda leer las correcciones
            useEnrollmentWizard.setState({
              currentStep: 4,
              trackerStatus: activeMat.estado
            });
            // Guardar matricula_id en localStorage para recuperarlo en StepTracking
            localStorage.setItem('yavirac-active-matricula-id', activeMat.id);
          } else {
            useEnrollmentWizard.setState({
              currentStep: 1,
              trackerStatus: 'DRAFT'
            });
            localStorage.removeItem('yavirac-active-matricula-id');
          }
        }
      } catch (err) {
        console.error('Error verificando la matrícula activa:', err);
      }
    };
    checkActiveEnrollment();
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(244, 108, 34, 0.25)' }}>
              <FileText size={18} color="white" />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Proceso de Matrículas
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 46, margin: 0 }}>
            Semestre Académico 2024-S2 · Autogestión Estudiantil
          </p>
        </div>
      </div>

      {/* Stepper only if not tracking */}
      {currentStep < 4 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <EnrollmentStepper />
        </div>
      )}

      {/* Dynamic content */}
      <div style={{ width: '100%' }}>
        {currentStep === 1 && <WelcomeScreen />}
        {currentStep === 2 && <StepDocuments />}
        {currentStep === 3 && <StepSubjects />}
        {currentStep === 4 && <StepTracking />}
      </div>
    </div>
  );
}
