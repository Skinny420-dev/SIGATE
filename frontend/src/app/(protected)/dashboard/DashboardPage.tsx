'use client';
import { useState, useEffect } from 'react';

import { useSessionStore } from '@/core/auth/session.store';
import { Role } from '@/core/rbac/roles';
import {
  BookOpen, Briefcase, Languages, GraduationCap,
  Clock, CheckCircle, FileText, AlertTriangle, Calendar,
  Users, User
} from 'lucide-react';
import styles from './DashboardPage.module.css';

const POSTGREST = process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005';

const ADMIN_MODULES = [
  {
    icon: Users,
    href: '/matriculas/admin', // Redirige a la gestión de usuarios
    color: '#3b82f6', accent: '#eff6ff', bar: 100,
    chip: 'Usuarios', chipStatus: 'info' as const,
    title: 'Gestión de Usuarios',
    desc: 'Auditoría de cuentas registradas, asignación de roles y actualización de datos de carrera.',
    cta: 'Administrar Cuentas',
    disabled: false,
  },
  {
    icon: User,
    href: '/matriculas/admin',
    color: '#10b981', accent: '#ecfdf5', bar: 100,
    chip: 'Registro', chipStatus: 'success' as const,
    title: 'Registrar Nuevos Usuarios',
    desc: 'Alta de nuevos docentes, secretarias o estudiantes con validación de credenciales.',
    cta: 'Registrar Cuentas',
    disabled: false,
  }
];

const MODULES = [
  {
    icon: BookOpen,
    title: 'Matrículas',
    description: 'Registro de materias y validación de prerrequisitos',
    href: '/matriculas',
    status: 'info' as const,
    statusLabel: 'Período abierto',
    color: '#6366f1',
    accent: '#eef2ff',
    bar: 70,
  },
  {
    icon: Briefcase,
    title: 'Prácticas Pre-Profesionales',
    description: 'Seguimiento de horas, bitácoras y aprobaciones',
    href: '/practicas',
    status: 'warning' as const,
    statusLabel: 'En progreso',
    color: '#f59e0b',
    accent: '#fffbeb',
    bar: 80,
  },
  {
    icon: Languages,
    title: 'Inglés',
    description: 'Certificados de suficiencia y niveles aprobados',
    href: '/ingles',
    status: 'success' as const,
    statusLabel: 'Completado',
    color: '#10b981',
    accent: '#ecfdf5',
    bar: 100,
  },
  {
    icon: GraduationCap,
    title: 'Titulación',
    description: 'Requisitos, registro de tema y asignación de tribunal',
    href: '/titulacion',
    status: 'pending' as const,
    statusLabel: 'Pendiente',
    color: '#94a3b8',
    accent: '#f8fafc',
    bar: 60,
  },
];

const TEACHER_MODULES = [
  {
    icon: BookOpen,  href: '/matriculas/admin?tab=matriculas',
    color: '#6366f1', accent: '#eef2ff', bar: 60,
    chip: 'Matrículas', chipStatus: 'success' as const,
    title: 'Gestión de Matrículas',
    desc: 'Auditoría del expediente institucional del alumno, formulario SIGA y solvencia de no adeudar.',
    cta: 'Revisar Expedientes',
    disabled: false,
  },
  {
    icon: Briefcase, href: '/matriculas/admin?tab=practicas',
    color: '#f59e0b', accent: '#fffbeb', bar: 45,
    chip: 'Prácticas', chipStatus: 'warning' as const,
    title: 'Gestión de Prácticas y Vinculación',
    desc: 'Bandeja de proyectos pre-profesionales, revisión de bitácoras y aprobación de formatos oficiales.',
    cta: 'Auditar Bitácoras',
    disabled: false,
  },
  {
    icon: GraduationCap, href: '/matriculas/admin?tab=titulacion',
    color: '#7c3aed', accent: '#faf5ff', bar: 15,
    chip: 'Titulación', chipStatus: 'info' as const,
    title: 'Gestión de Titulación y Grado',
    desc: 'Evaluación de temas de proyectos propuestos, revisión de PDF de anteproyectos y asignación de directores.',
    cta: 'Auditar Propuestas',
    disabled: false,
  },
];

const TIMELINE = [
  { icon: CheckCircle,   type: 'ok'   as const, label: 'Certificado B2 aprobado por el Centro de Idiomas',      meta: 'Hace 2 días · Inglés' },
  { icon: FileText,      type: 'info' as const, label: 'Matrícula confirmada en 6 materias — 2025-A',           meta: 'Hace 5 días · Matrículas' },
  { icon: Clock,         type: 'warn' as const, label: '80h de práctica pendientes de registro en bitácora',    meta: 'Hace 1 semana · Prácticas' },
  { icon: AlertTriangle, type: 'err'  as const, label: 'Tema de tesis pendiente de aprobación por director',    meta: 'Hace 2 semanas · Titulación' },
];

const NOTICES = [
  { title: 'Entrega de bitácora mensual',     date: 'Viernes 24 enero',  type: 'warn' as const },
  { title: 'Cierre de período de matrículas', date: 'Martes 28 enero',   type: 'info' as const },
  { title: 'Defensa de tema de tesis',        date: 'Lunes 10 febrero',  type: 'err'  as const },
];

export default function DashboardPage() {
  const { user } = useSessionStore();
  const isAdmin = user?.email === 'admin@yavirac.edu.ec' || user?.role === 'admin';
  const isTeacher = user?.role === Role.Teacher;
  const isSecretaria = user?.role === 'secretaria';
  const firstName = user?.name?.split(' ')[0] ?? 'Usuario';

  // Cargar progreso real desde la base de datos
  const [progressVal, setProgressVal] = useState(0);
  const [docenteCarreraId, setDocenteCarreraId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role === 'docente' && user?.id) {
      fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${user.id}&nivel=eq.1&select=carrera_id`, {
        headers: { 'Accept': 'application/json' }
      })
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) setDocenteCarreraId(data[0].carrera_id);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin || isTeacher || isSecretaria || !user?.id) return;

    const fetchRealProgress = async () => {
      try {
        let score = 0;

        // 1. Verificar si tiene matrícula legalizada (25%)
        const matRes = await fetch(`${POSTGREST}/matriculas?select=estado,estudiantes(usuario_id)&estudiantes.usuario_id=eq.${user.id}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (matRes.ok) {
          const matData = await matRes.json();
          // Si el alumno tiene alguna matrícula registrada
          if (matData.length > 0) {
            const latest = matData[0];
            if (latest.estado === 'LEGALIZED') score += 25;
            else score += 10; // 10% por estar en trámite
          }
        }

        // 2. Verificar suficiencia de inglés (25%)
        const ingRes = await fetch(`${POSTGREST}/suficiencia_ingles?select=aprobado,estudiantes(usuario_id)&estudiantes.usuario_id=eq.${user.id}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (ingRes.ok) {
          const ingData = await ingRes.json();
          if (ingData.length > 0 && ingData[0].aprobado === true) {
            score += 25;
          }
        }

        // 3. Verificar si completó prácticas pre-profesionales (25%)
        const pracRes = await fetch(`${POSTGREST}/practicas_proyectos?select=horas_acumuladas,estudiantes(usuario_id)&estudiantes.usuario_id=eq.${user.id}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (pracRes.ok) {
          const pracData = await pracRes.json();
          if (pracData.length > 0) {
            const hrs = pracData[0].horas_acumuladas ?? 0;
            if (hrs >= 240) score += 25;
            else score += Math.round((hrs / 240) * 25);
          }
        }

        // 4. Verificar expediente de titulación (25%)
        const titRes = await fetch(`${POSTGREST}/expedientes_titulacion?select=estado,estudiantes(usuario_id)&estudiantes.usuario_id=eq.${user.id}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (titRes.ok) {
          const titData = await titRes.json();
          if (titData.length > 0 && titData[0].estado === 'APROBADO') {
            score += 25;
          }
        }

        setProgressVal(score);
      } catch (err) {
        console.error('Error calculando progreso:', err);
        setProgressVal(0);
      }
    };

    fetchRealProgress();
  }, [isAdmin, isTeacher, isSecretaria, user?.id]);

  const strokeDashoffset = Math.max(0, 226 - (226 * progressVal) / 100);

  return (
    <div className={styles.root}>

      {/* ── WELCOME ── */}
      <div className={styles.welcome}>
        <div className={styles.welcomeLeft}>
          <p className={styles.welcomeEyebrow}>Período académico · 2025-A</p>
          <h2 className={styles.welcomeTitle}>
            Buenos días, <em className={styles.welcomeEm}>{firstName}</em>
          </h2>
          <p className={styles.welcomeSub}>
            {isTeacher
              ? 'Tienes 12 expedientes pendientes de revisión y 3 retenciones que requieren atención.'
              : `Tienes tu expediente cargado al ${progressVal}% de avance en el ciclo académico.`}
          </p>
        </div>
        <div className={styles.welcomeRight}>
          <div className={`${styles.rolePill} ${isTeacher ? styles.rolePillTeacher : styles.rolePillStudent}`}>
            <span className={styles.roleDot} />
            {isTeacher ? 'Docente activo' : 'Estudiante activo'}
          </div>
          {!isTeacher && (
            <div className={styles.ringWrap}>
              <svg className={styles.ringSvg} width="88" height="88" viewBox="0 0 88 88">
                <circle className={styles.ringBg} cx="44" cy="44" r="36" />
                <circle className={styles.ringFill} cx="44" cy="44" r="36" style={{ strokeDashoffset }} />
              </svg>
              <div className={styles.ringInner}>
                <span className={styles.ringPct}>{progressVal}%</span>
                <span className={styles.ringSub}>avance</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION HEADER ── */}
      <div className={styles.sectionRow}>
        <h3 className={styles.sectionTitle}>
          {isAdmin ? 'Gestión de Cuentas Administrativas' : isTeacher ? 'Herramientas de gestión' : 'Módulos del sistema'}
        </h3>
        <a href="#" className={styles.seeAll}>Ver todos →</a>
      </div>

      {/* ── MODULES ── */}
      <div className={styles.modulesGrid}>
        {isAdmin ? (
          ADMIN_MODULES.map(({ icon: Icon, href, color, accent, bar, chip, chipStatus, title, desc, cta, disabled }) => (
            <a
              key={title}
              href={disabled ? '#' : href}
              className={styles.moduleCard}
              style={{
                '--mod-color': color,
                '--mod-accent': accent,
                opacity: disabled ? 0.55 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
              } as React.CSSProperties}
            >
              <div className={styles.moduleHeader}>
                <div className={styles.moduleIcon}><Icon size={22} /></div>
                <span className={`${styles.chip} ${styles[`chip_${chipStatus}`]}`}>{chip}</span>
              </div>
              <h4 className={styles.moduleTitle}>{title}</h4>
              <p className={styles.moduleDesc}>{desc}</p>
              <div className={styles.moduleFoot}>
                <div className={styles.progTrack}>
                  <div className={styles.progFill} style={{ width: `${bar}%`, background: color }} />
                </div>
                <span className={styles.moduleArrow}>{cta} →</span>
              </div>
            </a>
          ))
        ) : isTeacher || isSecretaria ? (
          TEACHER_MODULES
            .filter(({ chip }) => {
              if (isSecretaria) {
                return chip === 'Matrículas';
              }
              if (docenteCarreraId === 6) {
                return chip === 'Inglés';
              }
              // Docentes normales: ven prácticas y titulación
              return chip === 'Prácticas' || chip === 'Titulación';
            })
            .map(({ icon: Icon, href, color, accent, bar, chip, chipStatus, title, desc, cta, disabled }) => (
              <a
                key={title}
                href={disabled ? '#' : href}
                className={styles.moduleCard}
                style={{
                  '--mod-color': color,
                  '--mod-accent': accent,
                  opacity: disabled ? 0.55 : 1,
                  pointerEvents: disabled ? 'none' : 'auto',
                } as React.CSSProperties}
              >
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleIcon}><Icon size={22} /></div>
                  <span className={`${styles.chip} ${styles[`chip_${chipStatus}`]}`}>{chip}</span>
                </div>
                <h4 className={styles.moduleTitle}>{title}</h4>
                <p className={styles.moduleDesc}>{desc}</p>
                <div className={styles.moduleFoot}>
                  <div className={styles.progTrack}>
                    <div className={styles.progFill} style={{ width: `${bar}%`, background: color }} />
                  </div>
                  <span className={styles.moduleArrow}>{cta} →</span>
                </div>
              </a>
            ))
        ) : (
          MODULES.map(({ icon: Icon, title, description, href, status, statusLabel, color, accent, bar }) => (
            <a
              key={href}
              href={href}
              className={styles.moduleCard}
              style={{ '--mod-color': color, '--mod-accent': accent } as React.CSSProperties}
            >
              <div className={styles.moduleHeader}>
                <div className={styles.moduleIcon}><Icon size={22} /></div>
                <span className={`${styles.chip} ${styles[`chip_${status}`]}`}>{statusLabel}</span>
              </div>
              <h4 className={styles.moduleTitle}>{title}</h4>
              <p className={styles.moduleDesc}>{description}</p>
              <div className={styles.moduleFoot}>
                <div className={styles.progTrack}>
                  <div className={styles.progFill} style={{ width: `${bar}%`, background: color }} />
                </div>
                <span className={styles.moduleArrow}>Acceder →</span>
              </div>
            </a>
          ))
        )}
      </div>

    </div>
  );
}
