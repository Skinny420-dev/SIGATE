'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  GraduationCap, BookOpen, Briefcase, Languages,
  LayoutDashboard, LogOut, ChevronRight, Bell, User, UploadCloud, Menu, X, Users, UserPlus
} from 'lucide-react';
import { clsx } from 'clsx';
import { useSessionStore } from '@/core/auth/session.store';
import { Role } from '@/core/rbac/roles';
import styles from './DashboardLayout.module.css';

const NAV_ITEMS = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/matriculas',   icon: BookOpen,         label: 'Matrículas' },
  { href: '/practicas',    icon: Briefcase,        label: 'Prácticas'  },
  { href: '/ingles',       icon: Languages,        label: 'Inglés'     },
  { href: '/titulacion',   icon: GraduationCap,    label: 'Titulación' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const { user, logout } = useSessionStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [docenteCarreraId, setDocenteCarreraId] = useState<number | null>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    if (user?.role === 'docente' && user?.id) {
      const serverUrl = process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005';
      fetch(`${serverUrl}/estudiantes?usuario_id=eq.${user.id}&nivel=eq.1&select=carrera_id`, {
        headers: { 'Accept': 'application/json' }
      })
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) {
            setDocenteCarreraId(data[0].carrera_id);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  return (
    <div className={styles.root}>
      {/* ── Overlay for mobile ── */}
      <div 
        className={clsx(styles.sidebarOverlay, isSidebarOpen && styles.open)} 
        onClick={closeSidebar}
      />

      {/* ── Sidebar ── */}
      <aside className={clsx(styles.sidebar, isSidebarOpen && styles.open)}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <GraduationCap size={22} />
          </div>
          <div>
            <span className={styles.logoTitle}>YAVIRAC</span>
            <span className={styles.logoSub}>Educación Superior</span>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button className={styles.mobileMenuBtn} onClick={closeSidebar} style={{ marginLeft: 'auto', display: isSidebarOpen ? 'block' : 'none' }}>
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className={styles.nav}>
          {/* Navegación Estudiante */}
          {user?.role === Role.Student && (
            <>
              <span className={styles.navLabel}>Portal Estudiantil</span>
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeSidebar}
                    className={clsx(styles.navItem, active && styles.navItemActive)}
                  >
                    <Icon size={18} className={styles.navIcon} />
                    <span>{label}</span>
                    {active && <ChevronRight size={14} className={styles.navChevron} />}
                  </Link>
                );
              })}
            </>
          )}

          {/* Navegación Docente / Administrativa */}
          {user?.role !== Role.Student && (
            <>
              <span className={styles.navLabel}>
                {user?.email === 'admin@yavirac.edu.ec' ? 'Panel de Control' : 'Administración Docente'}
              </span>
              
              {user?.email === 'admin@yavirac.edu.ec' ? (
                <>
                  <Link href="/dashboard" onClick={closeSidebar} className={clsx(styles.navItem, pathname === '/dashboard' && styles.navItemActive)}>
                    <LayoutDashboard size={18} className={styles.navIcon} />
                    <span>Panel General</span>
                  </Link>
                  <Link href="/matriculas/admin" onClick={closeSidebar} className={clsx(styles.navItem, (pathname === '/matriculas/admin' && tabParam !== 'registrar') && styles.navItemActive)}>
                    <Users size={18} className={styles.navIcon} />
                    <span>Gestión de Usuarios</span>
                  </Link>
                  <Link href="/matriculas/admin?tab=registrar" onClick={closeSidebar} className={clsx(styles.navItem, (pathname === '/matriculas/admin' && tabParam === 'registrar') && styles.navItemActive)}>
                    <UserPlus size={18} className={styles.navIcon} />
                    <span>Registrar Usuario</span>
                  </Link>
                </>
              ) : user?.role === 'secretaria' ? (
                // Secretaría: solo ve gestión de matrículas ordinarias
                <>
                  <Link href="/dashboard" onClick={closeSidebar} className={clsx(styles.navItem, pathname === '/dashboard' && styles.navItemActive)}>
                    <LayoutDashboard size={18} className={styles.navIcon} />
                    <span>Panel General</span>
                  </Link>
                  <Link href="/matriculas/admin?tab=matriculas" onClick={closeSidebar} className={clsx(styles.navItem, (pathname === '/matriculas/admin' && (tabParam === 'matriculas' || !tabParam)) && styles.navItemActive)}>
                    <BookOpen size={18} className={styles.navIcon} />
                    <span>Gestión Matrículas</span>
                  </Link>
                </>
              ) : docenteCarreraId === 6 ? (
                // Docente de inglés: solo ve gestión del YEC
                <>
                  <Link href="/dashboard" onClick={closeSidebar} className={clsx(styles.navItem, pathname === '/dashboard' && styles.navItemActive)}>
                    <LayoutDashboard size={18} className={styles.navIcon} />
                    <span>Panel General</span>
                  </Link>
                  <Link href="/ingles/admin" onClick={closeSidebar} className={clsx(styles.navItem, pathname === '/ingles/admin' && styles.navItemActive)}>
                    <UploadCloud size={18} className={styles.navIcon} />
                    <span>Gestión YEC (Excel)</span>
                  </Link>
                </>
              ) : (
                // Docente Regular: ve prácticas y titulación
                <>
                  <Link href="/dashboard" onClick={closeSidebar} className={clsx(styles.navItem, pathname === '/dashboard' && styles.navItemActive)}>
                    <LayoutDashboard size={18} className={styles.navIcon} />
                    <span>Panel General</span>
                  </Link>
                  <Link href="/matriculas/admin?tab=practicas" onClick={closeSidebar} className={clsx(styles.navItem, (pathname === '/matriculas/admin' && tabParam === 'practicas') && styles.navItemActive)}>
                    <Briefcase size={18} className={styles.navIcon} />
                    <span>Gestión Prácticas</span>
                  </Link>
                  <Link href="/matriculas/admin?tab=titulacion" onClick={closeSidebar} className={clsx(styles.navItem, (pathname === '/matriculas/admin' && tabParam === 'titulacion') && styles.navItemActive)}>
                    <GraduationCap size={18} className={styles.navIcon} />
                    <span>Gestión Titulación</span>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Usuario */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              <User size={16} />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name ?? 'Usuario'}</span>
              <span className={styles.userRole}>{user?.role ?? 'estudiante'}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={() => {
            document.cookie = "instituto-token=; path=/; max-age=0";
            logout();
            router.push('/login');
          }} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        {/* Mobile Header */}
        <header className={styles.mobileHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className={styles.logoIcon} style={{ width: 32, height: 32 }}>
              <GraduationCap size={18} />
            </div>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>YAVIRAC</span>
          </div>
          <button className={styles.mobileMenuBtn} onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
        </header>

        {/* Contenido */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
