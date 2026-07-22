'use client';

import { useState, useEffect } from 'react';
import { useEnglishStore } from '../hooks/useEnglishStore';
import { useSessionStore } from '@/core/auth/session.store';
import { 
  Calendar, MapPin, Ticket, AlertCircle, ChevronRight, CheckCircle2, X, Printer, Clock,
  Building2, Code, Megaphone, Scissors, Utensils, Compass, GraduationCap, CalendarDays, Award
} from 'lucide-react';
import { useToast } from '@/shared/ui/ToastProvider';
import styles from './PlacementTestRegistration.module.css';

export function PlacementTestRegistration() {
  const { testSessions, profile, registerForTest, skipPlacementTest, fetchProfileFromDB } = useEnglishStore();
  const { user } = useSessionStore();
  const { toast, success, error } = useToast();

  // Cargar nivel real desde la BD al montar el componente / Load actual English level from DB upon mounting
  useEffect(() => {
    // Si hay un usuario logueado, sincroniza su estado / If user is logged in, sync their profile data
    if (user?.id) {
      fetchProfileFromDB(user.id);
    }
  }, [user?.id]);
  
  const currentEmail = user?.email || 'mva.vallejos@yavirac.edu.ec';


  const [decision, setDecision] = useState<'UNDECIDED' | 'TEST'>('UNDECIDED');
  const [formStep, setFormStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    email: currentEmail,
    sede: '',
    apellidos: '',
    nombres: '',
    cedula: '',
    carrera: '',
    semestre: '',
    fecha: '',
    horario: ''
  });

  const [registeredTicket, setRegisteredTicket] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (profile.authorizedLevel !== 'PENDING_PLACEMENT') return null;

  if (decision === 'UNDECIDED') {
    return (
      <div className={styles.decisionWrapper}>
        <div className={styles.decisionHeader}>
          <h3>¿Cómo deseas iniciar tu aprendizaje de inglés?</h3>
          <p>Selecciona la opción que mejor se adapte a tus conocimientos actuales.</p>
        </div>

        <div className={styles.decisionGrid}>
          <div className={styles.decisionCard} onClick={() => setDecision('TEST')}>
            <div className={styles.decisionIcon}>
              <Calendar size={24} />
            </div>
            <h4 className={styles.decisionTitle}>Dar Prueba de Ubicación</h4>
            <p className={styles.decisionDesc}>
              Si posees conocimientos previos de inglés y deseas ser evaluado para ubicarte en un nivel superior al inicial (A1.2, A2.1 o A2.2).
            </p>
          </div>

          <div className={styles.decisionCard} onClick={() => {
            skipPlacementTest();
            success('Nivel inicial asignado correctamente', 'Se ha registrado tu solicitud para empezar desde el primer nivel (A1.1).');
          }}>
            <div className={styles.decisionIcon}>
              <Clock size={24} />
            </div>
            <h4 className={styles.decisionTitle}>Iniciar desde el Primer Nivel (A1.1)</h4>
            <p className={styles.decisionDesc}>
              Si no tienes conocimientos de inglés o prefieres empezar desde cero (Nivel A1.1) sin necesidad de rendir una evaluación de ubicación.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── If registration completed, render ticket ───
  if (registeredTicket) {
    return (
      <div className={styles.ticketCard}>
        <div className={styles.ticketHeader}>
          <CheckCircle2 size={48} className={styles.ticketHeaderIcon} />
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>¡Inscripción Exitosa!</h2>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '0.85rem' }}>Tu comprobante oficial de inscripción para la prueba de ubicación</p>
        </div>
        
        <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Estudiante</span>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{registeredTicket.apellidos} {registeredTicket.nombres}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Cédula</span>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{registeredTicket.cedula}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Sede Evaluadora</span>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{registeredTicket.sede}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Carrera / Semestre</span>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{registeredTicket.carrera} · {registeredTicket.semestre}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#eef2ff', padding: '1rem', borderRadius: 8 }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#4f46e5', textTransform: 'uppercase', fontWeight: 700 }}>Fecha Asignada</span>
              <strong style={{ fontSize: '1rem', color: '#1e1b4b' }}>{registeredTicket.fecha}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#4f46e5', textTransform: 'uppercase', fontWeight: 700 }}>Horario de Examen</span>
              <strong style={{ fontSize: '1rem', color: '#1e1b4b' }}>{registeredTicket.horario}</strong>
            </div>
          </div>
        </div>

        <div className={styles.ticketWarning}>
          <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
          <span className={styles.ticketWarningText}>
            Presenta tu Cédula y este ticket impreso o digital en la Sede Centro Histórico el día de la prueba presencial.
          </span>
        </div>

        <div className={styles.ticketActions}>
          <button 
            onClick={() => window.print()} 
            className={styles.backBtn}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Printer size={15} /> Imprimir Comprobante
          </button>
        </div>
      </div>
    );
  }

  /**
   * Valida los campos requeridos en el paso actual del formulario.
   * Validates required inputs for the current step of the registration wizard.
   * @returns {boolean} True si el paso es válido, de lo contrario False / True if step is valid, False otherwise.
   */
  const validateStep = () => {
    setErrorMsg('');
    if (formStep === 1) {
      if (!formData.email) {
        setErrorMsg('El correo institucional es obligatorio.');
        return false;
      }
      if (!formData.email.toLowerCase().endsWith('@yavirac.edu.ec')) {
        setErrorMsg('El correo debe tener dominio institucional @yavirac.edu.ec');
        return false;
      }
      if (!formData.sede) {
        setErrorMsg('Debes seleccionar la sede en la que estudias.');
        return false;
      }
    } else if (formStep === 2) {
      if (!formData.apellidos || !formData.nombres || !formData.cedula || !formData.carrera) {
        setErrorMsg('Todos los campos de datos personales son obligatorios.');
        return false;
      }
      if (formData.cedula.length !== 10) {
        setErrorMsg('La cédula de ciudadanía debe contener exactamente 10 dígitos.');
        return false;
      }
    } else if (formStep === 3) {
      if (!formData.semestre) {
        setErrorMsg('Debes escoger el semestre actual.');
        return false;
      }
    } else if (formStep === 4) {
      if (!formData.fecha) {
        setErrorMsg('Debes seleccionar un día para rendir la prueba.');
        return false;
      }
    }
    return true;
  };

  /**
   * Avanza al siguiente paso del formulario si la validación del paso actual es correcta.
   * Progresses to the next registration step if current validation passes.
   */
  const handleNextStep = () => {
    if (validateStep()) {
      setFormStep(prev => prev + 1);
    }
  };

  /**
   * Guarda los datos ingresados y registra al estudiante en la prueba de ubicación.
   * Saves entered details and confirms placement test registration.
   */
  const handleCompleteRegistration = () => {
    if (!formData.horario) {
      setErrorMsg('Debes seleccionar un horario para la evaluación.');
      return;
    }
    setRegisteredTicket({ ...formData });
    registerForTest('t1');
  };

  return (
    <div className={styles.container}>
      {/* Progress indicators */}
      <div className={styles.progressWrapper}>
        <div className={styles.progressBarBg}>
          <div className={styles.progressBar} style={{ width: `${(formStep / 5) * 100}%` }} />
        </div>
        <div className={styles.progressLabel}>Paso {formStep} de 5</div>
      </div>

      {/* Main header banner */}
      <div className={styles.card}>
        <h2 className={styles.bannerTitle}>
          INSCRIPCIÓN PARA PRUEBAS DE UBICACIÓN DE INGLÉS
        </h2>
        <p className={styles.bannerSubtitle}>
          Ciclo II - Yavirac English Center (YEC)
        </p>
        
        <div className={styles.bannerFooter}>
          <div>
            <strong>{currentEmail}</strong>
            <span style={{ color: '#94a3b8', margin: '0 8px' }}>·</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>Inscripción abierta</span>
          </div>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>* Obligatorio</span>
        </div>
      </div>

      {/* Inline Validation Warnings */}
      {errorMsg && (
        <div className={styles.inlineError}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Email and Sede */}
      {formStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={styles.sectionCard}>
            <label className={styles.sectionLabel}>
              Correo institucional registrado<span className={styles.requiredAsterisk}>*</span>
            </label>
            <input 
              type="email"
              placeholder="mva.vallejos@yavirac.edu.ec"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={styles.textInput}
            />
          </div>

          <div className={styles.sectionCard}>
            <label className={styles.sectionLabel}>
              SEDE EN LA QUE ESTUDIA<span className={styles.requiredAsterisk}>*</span>
            </label>
            <div className={styles.radioGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {[
                { name: 'Matriz - Centro Histórico', icon: Building2, desc: 'Edificio Central' },
                { name: 'Complejo Múltiple de Institutos (CMI)', icon: MapPin, desc: 'Zona Norte' },
                { name: 'Focalizados en territorio', icon: Compass, desc: 'Otras extensiones' }
              ].map(opt => {
                const IconComp = opt.icon;
                const isSelected = formData.sede === opt.name;
                return (
                  <div 
                    key={opt.name}
                    onClick={() => setFormData({ ...formData, sede: opt.name })}
                    className={`${styles.radioOption} ${isSelected ? styles.radioSelected : ''}`}
                    style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem 1rem', gap: '0.75rem', borderRadius: 12 }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: isSelected ? '#ffedd5' : '#f1f5f9', color: isSelected ? '#f46c22' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      <IconComp size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{opt.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 3 }}>{opt.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Personal details */}
      {formStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.sectionCard}>
              <label className={styles.sectionLabel}>
                APELLIDOS (mayúsculas)<span className={styles.requiredAsterisk}>*</span>
              </label>
              <input 
                type="text"
                placeholder="APELLIDOS"
                value={formData.apellidos}
                onChange={e => setFormData({ ...formData, apellidos: e.target.value.toUpperCase() })}
                className={styles.textInput}
              />
            </div>

            <div className={styles.sectionCard}>
              <label className={styles.sectionLabel}>
                NOMBRES (mayúsculas)<span className={styles.requiredAsterisk}>*</span>
              </label>
              <input 
                type="text"
                placeholder="NOMBRES"
                value={formData.nombres}
                onChange={e => setFormData({ ...formData, nombres: e.target.value.toUpperCase() })}
                className={styles.textInput}
              />
            </div>
          </div>

          <div className={styles.sectionCard}>
            <label className={styles.sectionLabel}>
              CÉDULA DE CIUDADANÍA (10 dígitos)<span className={styles.requiredAsterisk}>*</span>
            </label>
            <input 
              type="text"
              maxLength={10}
              placeholder="17XXXXXXXX"
              value={formData.cedula}
              onChange={e => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '') })}
              className={styles.textInput}
            />
          </div>

          <div className={styles.sectionCard}>
            <label className={styles.sectionLabel}>
              CARRERA INSTITUCIONAL<span className={styles.requiredAsterisk}>*</span>
            </label>
            <div className={styles.radioGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {[
                { name: 'DESARROLLO DE SOFTWARE', icon: Code },
                { name: 'MARKETING DIGITAL', icon: Megaphone },
                { name: 'DISEÑO DE MODAS', icon: Scissors },
                { name: 'ARTE CULINARIO', icon: Utensils },
                { name: 'GUÍA NACIONAL DE TURISMO', icon: Compass },
                { name: 'DOCENTE', icon: GraduationCap }
              ].map(opt => {
                const IconComp = opt.icon;
                const isSelected = formData.carrera === opt.name;
                return (
                  <div 
                    key={opt.name}
                    onClick={() => setFormData({ ...formData, carrera: opt.name })}
                    className={`${styles.radioOption} ${isSelected ? styles.radioSelected : ''}`}
                    style={{ padding: '0.85rem 1.15rem', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <IconComp size={16} style={{ color: isSelected ? '#f46c22' : '#94a3b8' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{opt.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Semestre */}
      {formStep === 3 && (
        <div className={styles.sectionCard}>
          <label className={styles.sectionLabel}>
            Escoja el semestre actual en el que se encuentra<span className={styles.requiredAsterisk}>*</span>
          </label>
          <div className={styles.radioGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {[
              { name: 'PRIMERO', desc: '1º Nivel' },
              { name: 'SEGUNDO', desc: '2º Nivel' },
              { name: 'TERCERO', desc: '3º Nivel' },
              { name: 'CUARTO', desc: '4º Nivel' },
              { name: 'QUINTO', desc: '5º Nivel' },
              { name: 'EGRESADO', desc: 'Proceso de Egreso' }
            ].map(opt => {
              const isSelected = formData.semestre === opt.name;
              return (
                <div 
                  key={opt.name}
                  onClick={() => setFormData({ ...formData, semestre: opt.name })}
                  className={`${styles.radioOption} ${isSelected ? styles.radioSelected : ''}`}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem 1.25rem', borderRadius: 10, gap: 4 }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{opt.name}</span>
                  <span style={{ fontSize: '0.72rem', color: isSelected ? '#ea580c' : '#94a3b8' }}>{opt.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Date selection */}
      {formStep === 4 && (
        <div className={styles.sectionCard}>
          <label className={styles.sectionLabel}>
            Escoja el día para rendir la Evaluación Presencial<span className={styles.requiredAsterisk}>*</span>
          </label>
          <div className={styles.radioGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
            {[
              { dateStr: 'Miércoles 08 de Julio, 2026', dayNum: '08', weekday: 'Miércoles', month: 'Julio 2026' },
              { dateStr: 'Jueves 09 de Julio, 2026', dayNum: '09', weekday: 'Jueves', month: 'Julio 2026' },
              { dateStr: 'Viernes 10 de Julio, 2026', dayNum: '10', weekday: 'Viernes', month: 'Julio 2026' }
            ].map(opt => {
              const isSelected = formData.fecha === opt.dateStr;
              return (
                <div 
                  key={opt.dateStr}
                  onClick={() => setFormData({ ...formData, fecha: opt.dateStr })}
                  className={`${styles.radioOption} ${isSelected ? styles.radioSelected : ''}`}
                  style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem 1rem', borderRadius: 12, gap: 8 }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? '#ea580c' : '#64748b', textTransform: 'uppercase' }}>{opt.weekday}</span>
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, color: isSelected ? '#ea580c' : '#182f59', lineHeight: 1 }}>{opt.dayNum}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{opt.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: Horarios */}
      {formStep === 5 && (
        <div className={styles.sectionCard}>
          <label className={styles.sectionLabel}>
            HORARIO PRESENCIAL - Selecciona una franja horaria<span className={styles.requiredAsterisk}>*</span>
          </label>
          <div className={styles.radioGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {[
              { time: '07:00 - 09:00', label: 'Jornada Matutina' },
              { time: '09:00 - 11:00', label: 'Jornada Matutina' },
              { time: '11:00 - 13:00', label: 'Jornada Media' },
              { time: '15:00 - 17:00', label: 'Jornada Vespertina' },
              { time: '17:00 - 19:00', label: 'Jornada Nocturna' }
            ].map(opt => {
              const isSelected = formData.horario === opt.time;
              return (
                <div 
                  key={opt.time}
                  onClick={() => setFormData({ ...formData, horario: opt.time })}
                  className={`${styles.radioOption} ${isSelected ? styles.radioSelected : ''}`}
                  style={{ padding: '1rem', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} style={{ color: isSelected ? '#ea580c' : '#94a3b8' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{opt.time}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: isSelected ? '#ea580c' : '#94a3b8' }}>{opt.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form control buttons */}
      <div className={styles.formFooter}>
        {formStep > 1 ? (
          <button 
            type="button" 
            onClick={() => setFormStep(prev => prev - 1)}
            className={styles.backBtn}
          >
            Atrás
          </button>
        ) : (
          <button 
            type="button" 
            onClick={() => setDecision('UNDECIDED')}
            className={styles.backBtn}
          >
            Regresar a opciones
          </button>
        )}
        
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Página {formStep} de 5
        </span>


        {formStep < 5 ? (
          <button 
            type="button" 
            onClick={handleNextStep}
            className={styles.nextBtn}
          >
            Siguiente <ChevronRight size={14} />
          </button>
        ) : (
          <button 
            type="button" 
            onClick={handleCompleteRegistration}
            className={styles.completeBtn}
          >
            Completar Registro
          </button>
        )}
      </div>
    </div>
  );
}
