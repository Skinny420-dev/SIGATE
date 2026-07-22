'use client';

import { useEnglishStore } from '../hooks/useEnglishStore';
import { Clock, UserCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button/Button';
import styles from './EnglishEnrollmentGrid.module.css';

export function EnglishEnrollmentGrid() {
  const { courses, profile, enrollInCourse, unenroll, resetEnglishProcess } = useEnglishStore();

  if (profile.authorizedLevel === 'PENDING_PLACEMENT') {
    if (!profile.registeredTestId) return null; // Aún ni se registra a la prueba

    return (
      <div className={styles.lockedContainer}>
        <div className={styles.lockedContent}>
          <h3>Esperando Resultados de Ubicación</h3>
          <p>Asiste a tu prueba. Una vez que Coordinación procese las notas masivamente, podrás ver y tomar tus cupos aquí.</p>
        </div>
      </div>
    );
  }

  // Filtrar los cursos SOLO por el nivel autorizado (Magia de la automatización)
  const availableCourses = courses.filter(c => c.level === profile.authorizedLevel);

  return (
    <div className={styles.gridContainer}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className={styles.title}>Plazas Disponibles YEC</h3>
          <p className={styles.subtitle}>
            Mostrando únicamente horarios para tu nivel: <strong>{profile.authorizedLevel}</strong>
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          {!profile.enrolledCourseId && (
            <button
              onClick={resetEnglishProcess}
              style={{
                background: 'white',
                border: '1.5px solid #ef4444',
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: 8,
                padding: '8px 16px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              ← Cambiar decisión / Dar Prueba
            </button>
          )}

          {profile.enrolledCourseId && (
            <div className={styles.enrolledBadge}>
              <CheckCircle2 size={18} />
              <span>Ya tienes un cupo asegurado</span>
              <button className={styles.unenrollBtn} onClick={unenroll}>Cancelar Cupo</button>
            </div>
          )}
        </div>
      </div>


      <div className={styles.cardsGrid}>
        {availableCourses.map(course => {
          const isEnrolled = profile.enrolledCourseId === course.id;
          const isFull = course.availableSlots === 0;
          const disabled = !!profile.enrolledCourseId || isFull;

          // Porcentaje para pintar la barra
          const percent = (course.availableSlots / course.totalSlots) * 100;
          let barColor = 'var(--color-success-500)';
          if (percent < 30) barColor = 'var(--color-danger-500)';
          else if (percent < 60) barColor = 'var(--color-warning-500)';
          if (isFull) barColor = 'var(--color-gray-300)';

          return (
            <div 
              key={course.id} 
              className={`${styles.courseCard} ${isEnrolled ? styles.enrolledCard : ''} ${isFull ? styles.fullCard : ''}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.timeTag}>
                  <Clock size={16} />
                  <span>{course.schedule}</span>
                </div>
                <span className={styles.levelTag}>{course.level}</span>
              </div>

              <div className={styles.teacherInfo}>
                <UserCircle size={18} />
                <span>{course.teacher}</span>
              </div>

              <div className={styles.slotsInfo}>
                <div className={styles.slotsText}>
                  <span className={styles.slotsLabel}>Cupos:</span>
                  <span className={`${styles.slotsCount} ${isFull ? styles.slotsFull : ''}`}>
                    {course.availableSlots} / {course.totalSlots}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${percent}%`, backgroundColor: barColor }} 
                  />
                </div>
              </div>

              <Button 
                variant={isEnrolled ? 'outline' : 'primary'} 
                fullWidth 
                disabled={disabled && !isEnrolled}
                onClick={() => {
                  if (!isEnrolled && !isFull) enrollInCourse(course.id);
                }}
              >
                {isEnrolled ? 'Cupo Tomado' : isFull ? 'Agotado' : 'Tomar Cupo'}
              </Button>
            </div>
          );
        })}

        {availableCourses.length === 0 && (
          <div className={styles.emptyState}>
            <p>No hay horarios programados para tu nivel en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
