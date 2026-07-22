'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Eye, EyeOff, Mail, Lock, ShieldCheck, Check, X, AlertTriangle, User, Key, KeyRound, CheckCircle2 } from 'lucide-react';
import { useSessionStore } from '@/core/auth/session.store';
import { Role } from '@/core/rbac/roles';
import { Button } from '@/shared/ui/Button/Button';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const router   = useRouter();
  const { login } = useSessionStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Modales toggles
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Registro form state
  const [regCedula, setRegCedula] = useState('');
  const [regNombres, setRegNombres] = useState('');
  const [regApellidos, setRegApellidos] = useState('');
  const [regCorreo, setRegCorreo] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regCarrera, setRegCarrera] = useState('1'); // Carrera predeterminada
  const [regNivel, setRegNivel] = useState('1');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Forgot password form state (4-Step Wizard)
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Carreras disponibles (sin YEC/Centro de idiomas YEC)
  const carreras = [
    { id: '1', nombre: 'Desarrollo de Software' },
    { id: '2', nombre: 'Diseño Gráfico' },
    { id: '3', nombre: 'Guía Nacional de Turismo' },
    { id: '4', nombre: 'Gastronomía' },
    { id: '5', nombre: 'Marketing' },
  ];

  // Algoritmo de validación de cédula ecuatoriana (Módulo 10)
  function validarCedulaEcuatoriana(cedula: string): boolean {
    if (cedula.length !== 10) return false;
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;
    
    const digitoVerificador = parseInt(cedula.substring(9, 10), 10);
    let suma = 0;
    
    for (let i = 0; i < 9; i++) {
      let temp = parseInt(cedula.charAt(i), 10);
      if (i % 2 === 0) {
        temp *= 2;
        if (temp > 9) temp -= 9;
      }
      suma += temp;
    }
    
    const decenaSuperior = Math.ceil(suma / 10) * 10;
    let resultado = decenaSuperior - suma;
    if (resultado === 10) resultado = 0;
    
    return resultado === digitoVerificador;
  }

  // Complejidad de la contraseña (6-12 caracteres, 1 mayus, 1 minus, 1 num, 1 especial)
  function validarPasswordCompleja(password: string): {
    length: boolean;
    number: boolean;
    upper: boolean;
    lower: boolean;
    special: boolean;
    isValid: boolean;
  } {
    const checks = {
      length: password.length >= 6 && password.length <= 12,
      number: /\d/.test(password),
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return {
      ...checks,
      isValid: Object.values(checks).every(Boolean),
    };
  }

  // Nombre/Apellido solo letras
  function validarSoloLetras(texto: string): boolean {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(texto);
  }

  // Correo institucional
  function validarCorreoInstitucional(correo: string): boolean {
    return correo.toLowerCase().endsWith('@yavirac.edu.ec');
  }

  /**
   * Procesa el envío del formulario de inicio de sesión y autentica al usuario.
   * Processes the login form submission and authenticates the user.
   * @param {React.FormEvent} e - Evento del formulario / Form submit event.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validación estricta del dominio de correo institucional / Strict validation of institutional email domain
    if (!validarCorreoInstitucional(email)) {
      setError('Solo se admiten correos con dominio institucional @yavirac.edu.ec');
      return;
    }

    setLoading(true);

    try {
      // Envía credenciales al endpoint de login / Sends credentials to the login endpoint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Credenciales incorrectas. Verifica tus datos.');
        return;
      }

      // Almacena token de sesión en cookies del navegador / Stores session token in browser cookies
      document.cookie = `instituto-token=${data.token}; path=/; max-age=86400`;

      // Inicializa el estado global de la sesión del usuario / Initializes global user session state
      login(
        {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role as Role,
        },
        data.token
      );

      // Redirige al panel privado / Redirects to private dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch {
      setError('No se pudo conectar con el servidor. Verifica que Docker esté corriendo.');
    } finally {
      setLoading(false);
    }
  }

  // Registro de estudiante
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!validarCedulaEcuatoriana(regCedula)) {
      setRegError('Cédula de identidad ecuatoriana inválida (Módulo 10).');
      return;
    }

    if (!validarSoloLetras(regNombres) || !validarSoloLetras(regApellidos)) {
      setRegError('Nombres y apellidos solo deben contener letras.');
      return;
    }

    if (!validarCorreoInstitucional(regCorreo)) {
      setRegError('El correo electrónico debe pertenecer al dominio @yavirac.edu.ec');
      return;
    }

    if (!validarPasswordCompleja(regPassword).isValid) {
      setRegError('La contraseña no cumple con los requisitos mínimos de seguridad.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: regCedula,
          nombres: regNombres,
          apellidos: regApellidos,
          correo: regCorreo,
          password: regPassword,
          rol: 'STUDENT',
          nivel: regNivel,
          carrera_id: regCarrera
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error ?? 'Error en el registro del estudiante.');
        return;
      }

      setRegSuccess('¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales.');
      setTimeout(() => {
        setShowRegisterModal(false);
        // Autocompletar login
        setEmail(regCorreo);
        setPassword(regPassword);
      }, 2500);

    } catch {
      setRegError('Error de red. No se pudo conectar con el servidor.');
    } finally {
      setRegLoading(false);
    }
  }

  // Recuperación paso a paso de contraseña (Wizard)
  async function handleForgotStep1(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');
    if (!validarCorreoInstitucional(forgotEmail)) {
      setForgotError('El correo debe pertenecer al dominio @yavirac.edu.ec');
      return;
    }

    setForgotLoading(true);

    try {
      // Simular llamada de verificación de existencia de cuenta
      const res = await fetch(`${process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://localhost:3005'}/usuarios?correo=eq.${encodeURIComponent(forgotEmail)}&select=id`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok || data.length === 0) {
        setForgotError('El correo electrónico no se encuentra registrado en el sistema.');
        return;
      }

      // Generar código temporal de 6 dígitos simulado
      const simulated = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedCode(simulated);

      // Avanzar al paso 2
      setForgotStep(2);
    } catch {
      setForgotError('Error al contactar con la base de datos.');
    } finally {
      setForgotLoading(false);
    }
  }

  function handleForgotStep2(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');
    if (forgotCode !== simulatedCode) {
      setForgotError('El código de verificación ingresado es incorrecto.');
      return;
    }
    setForgotStep(3);
  }

  async function handleForgotStep3(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');

    if (!validarPasswordCompleja(newPassword).isValid) {
      setForgotError('La contraseña no cumple con los requisitos mínimos de seguridad.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Las contraseñas no coinciden.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: forgotEmail, password: newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error ?? 'Error al actualizar la contraseña.');
        return;
      }

      setForgotStep(4);
    } catch {
      setForgotError('Error de red. No se pudo reestablecer la contraseña.');
    } finally {
      setForgotLoading(false);
    }
  }


  return (
    <div className={styles.root}>
      {/* Lado Izquierdo: Formulario */}
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          {/* Logo Mobile */}
          <div className={styles.mobileLogo}>
            <div className={styles.logoIcon}>
              <GraduationCap size={24} />
            </div>
            <span className={styles.logoTitle}>YAVIRAC</span>
          </div>

          <div className={styles.header}>
            <h1 className={styles.heading}>Bienvenido de vuelta</h1>
            <p className={styles.subheading}>Ingresa a la plataforma institucional académica.</p>
          </div>

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Correo institucional</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="usuario@yavirac.edu.ec"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Contraseña</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>



            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.75rem 0 1.25rem 0' }}>
              <button
                type="button"
                className={styles.captchaFooterBtn}
                style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f46c22', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotStep(1);
                  setForgotError('');
                  setForgotSuccess('');
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                type="button"
                className={styles.captchaFooterBtn}
                style={{ fontSize: '0.8rem', fontWeight: 600, color: '#182f59', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => {
                  setShowRegisterModal(true);
                  setRegError('');
                  setRegSuccess('');
                }}
              >
                Crear cuenta
              </button>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {loading ? 'Verificando accesos...' : 'Iniciar sesión'}
            </Button>
          </form>
        </div>
      </div>

      {/* Lado Derecho: Branding Visual */}
      <div className={styles.brandSection}>
        <div className={styles.brandOverlay} />
        
        <div className={styles.brandContent}>
          <div className={styles.brandLogo}>
            <div className={styles.brandLogoIcon}>
              <GraduationCap size={40} />
            </div>
            <div>
              <h2 className={styles.brandTitle}>YAVIRAC</h2>
              <p className={styles.brandSubtitle}>Educación Superior</p>
            </div>
          </div>

          <div className={styles.glassCard}>
            <div className={styles.glassIcon}>
              <ShieldCheck size={28} />
            </div>
            <h3 className={styles.glassTitle}>Sistema Académico Integral</h3>
            <p className={styles.glassDesc}>
              Gestiona tus matrículas, prácticas pre-profesionales, requisitos de titulación y niveles de inglés desde un solo lugar centralizado y seguro.
            </p>
          </div>
        </div>
      </div>

      {/* ─── MODAL: REGISTRARSE (ALUMNO) ─── */}
      {showRegisterModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '480px' }}>
            <button className={styles.closeBtn} onClick={() => setShowRegisterModal(false)}>
              <X size={20} />
            </button>
            
            <div className={styles.iconCircle}>
              <User size={24} />
            </div>
            <h2 className={styles.modalTitle}>Registro de Estudiante</h2>
            <p className={styles.modalSubtitle}>Crea tu cuenta institucional completando los campos obligatorios.</p>

            {regError && (
              <div className={styles.error} style={{ marginBottom: '1rem', fontSize: '0.8rem', padding: '0.6rem 0.8rem' }}>
                {regError}
              </div>
            )}
            {regSuccess && (
              <div className={styles.captchaSuccessText} style={{ marginBottom: '1rem', fontSize: '0.8rem', textAlign: 'center', background: '#dcfce7', padding: '0.6rem', borderRadius: '8px' }}>
                {regSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Cédula de Identidad</label>
                <input
                  type="text"
                  maxLength={10}
                  className={styles.input}
                  placeholder="Ej. 1726354890"
                  value={regCedula}
                  onChange={e => setRegCedula(e.target.value.replace(/\D/g, ''))}
                  required
                />
                {regCedula && (
                  <div style={{ marginTop: '0.25rem' }}>
                    {validarCedulaEcuatoriana(regCedula) ? (
                      <span style={{ color: '#16a34a', fontSize: '0.725rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={12} /> Cédula válida (módulo 10)
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: '0.725rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <X size={12} /> Cédula inválida
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.field}>
                  <label className={styles.label}>Nombres</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Solo letras"
                    value={regNombres}
                    onChange={e => setRegNombres(e.target.value)}
                    required
                  />
                  {regNombres && !validarSoloLetras(regNombres) && (
                    <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Solo letras permitidas</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Apellidos</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Solo letras"
                    value={regApellidos}
                    onChange={e => setRegApellidos(e.target.value)}
                    required
                  />
                  {regApellidos && !validarSoloLetras(regApellidos) && (
                    <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Solo letras permitidas</span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Correo Institucional</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="usuario@yavirac.edu.ec"
                  value={regCorreo}
                  onChange={e => setRegCorreo(e.target.value)}
                  required
                />
                {regCorreo && (
                  <div style={{ marginTop: '0.25rem' }}>
                    {validarCorreoInstitucional(regCorreo) ? (
                      <span style={{ color: '#16a34a', fontSize: '0.725rem', fontWeight: 700 }}>✓ Dominio institucional correcto</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: '0.725rem', fontWeight: 700 }}>✗ Debe finalizar en @yavirac.edu.ec</span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div className={styles.field}>
                  <label className={styles.label}>Carrera</label>
                  <select
                    className={styles.input}
                    value={regCarrera}
                    onChange={e => setRegCarrera(e.target.value)}
                    required
                    style={{ appearance: 'none', background: '#f8fafc', color: '#0f172a', paddingRight: '1rem' }}
                  >
                    {carreras.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Nivel</label>
                  <select
                    className={styles.input}
                    value={regNivel}
                    onChange={e => setRegNivel(e.target.value)}
                    required
                    style={{ appearance: 'none', background: '#f8fafc', color: '#0f172a' }}
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={String(n)}>Nivel {n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Contraseña</label>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    type={regShowPassword ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setRegShowPassword(v => !v)}
                  >
                    {regShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Chips de validación interactivos de contraseña */}
                {regPassword && (
                  <div className={styles.rulesRow} style={{ marginTop: '0.5rem' }}>
                    <span className={styles.ruleChip} style={{ borderColor: validarPasswordCompleja(regPassword).length ? '#16a34a' : '#ef4444', color: validarPasswordCompleja(regPassword).length ? '#15803d' : '#b91c1c', background: validarPasswordCompleja(regPassword).length ? '#f0fdf4' : '#fef2f2' }}>
                      6-12 caracteres
                    </span>
                    <span className={styles.ruleChip} style={{ borderColor: validarPasswordCompleja(regPassword).upper ? '#16a34a' : '#ef4444', color: validarPasswordCompleja(regPassword).upper ? '#15803d' : '#b91c1c', background: validarPasswordCompleja(regPassword).upper ? '#f0fdf4' : '#fef2f2' }}>
                      Mayúscula
                    </span>
                    <span className={styles.ruleChip} style={{ borderColor: validarPasswordCompleja(regPassword).lower ? '#16a34a' : '#ef4444', color: validarPasswordCompleja(regPassword).lower ? '#15803d' : '#b91c1c', background: validarPasswordCompleja(regPassword).lower ? '#f0fdf4' : '#fef2f2' }}>
                      Minúscula
                    </span>
                    <span className={styles.ruleChip} style={{ borderColor: validarPasswordCompleja(regPassword).number ? '#16a34a' : '#ef4444', color: validarPasswordCompleja(regPassword).number ? '#15803d' : '#b91c1c', background: validarPasswordCompleja(regPassword).number ? '#f0fdf4' : '#fef2f2' }}>
                      Número
                    </span>
                    <span className={styles.ruleChip} style={{ borderColor: validarPasswordCompleja(regPassword).special ? '#16a34a' : '#ef4444', color: validarPasswordCompleja(regPassword).special ? '#15803d' : '#b91c1c', background: validarPasswordCompleja(regPassword).special ? '#f0fdf4' : '#fef2f2' }}>
                      Carácter especial
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowRegisterModal(false)}>
                  Cancelar
                </button>
                <Button type="submit" loading={regLoading}>
                  Completar Registro
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: OLVIDÉ MI CONTRASEÑA (4-STEP WIZARD) ─── */}
      {showForgotModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <button className={styles.closeBtn} onClick={() => setShowForgotModal(false)}>
              <X size={20} />
            </button>

            {/* Icono dinámico según el paso */}
            <div className={styles.iconCircle}>
              {forgotStep === 1 && <Mail size={24} />}
              {forgotStep === 2 && <Key size={24} />}
              {forgotStep === 3 && <KeyRound size={24} />}
              {forgotStep === 4 && <CheckCircle2 size={24} color="#16a34a" />}
            </div>

            <h2 className={styles.modalTitle}>
              {forgotStep === 1 && 'Recuperar Contraseña'}
              {forgotStep === 2 && 'Código de Seguridad'}
              {forgotStep === 3 && 'Nueva Contraseña'}
              {forgotStep === 4 && '¡Listo!'}
            </h2>
            
            <p className={styles.modalSubtitle}>
              {forgotStep === 1 && 'Ingresa tu correo institucional y verificaremos tu cuenta.'}
              {forgotStep === 2 && 'Hemos enviado un código de verificación simulado en pantalla.'}
              {forgotStep === 3 && 'Establece tu nueva contraseña segura para el ingreso al sistema.'}
              {forgotStep === 4 && 'Tu contraseña ha sido actualizada con éxito en la base de datos.'}
            </p>

            {forgotError && (
              <div className={styles.error} style={{ marginBottom: '1rem', fontSize: '0.8rem', padding: '0.6rem 0.8rem' }}>
                {forgotError}
              </div>
            )}

            {/* WIZARD PASO 1: Ingreso de correo */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotStep1} className={styles.modalForm}>
                <div className={styles.field}>
                  <label className={styles.label}>Correo Institucional</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="usuario@yavirac.edu.ec"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowForgotModal(false)}>
                    Cancelar
                  </button>
                  <Button type="submit" loading={forgotLoading}>
                    Verificar Correo
                  </Button>
                </div>
              </form>
            )}

            {/* WIZARD PASO 2: Ingreso de código simulado */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotStep2} className={styles.modalForm}>
                {/* Alerta simulada del código enviado */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e70e6', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                  <ShieldCheck size={18} />
                  <span>Código de simulación enviado: <strong>{simulatedCode}</strong></span>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Código de Verificación</label>
                  <input
                    type="text"
                    maxLength={6}
                    className={styles.input}
                    style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.3em', fontWeight: 800 }}
                    placeholder="000000"
                    value={forgotCode}
                    onChange={e => setForgotCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setForgotStep(1)}>
                    Atrás
                  </button>
                  <Button type="submit">
                    Validar Código
                  </Button>
                </div>
              </form>
            )}

            {/* WIZARD PASO 3: Nueva contraseña */}
            {forgotStep === 3 && (
              <form onSubmit={handleForgotStep3} className={styles.modalForm}>
                <div className={styles.field}>
                  <label className={styles.label}>Nueva Contraseña</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={16} className={styles.inputIcon} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowNewPassword(v => !v)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className={styles.rulesRow} style={{ marginTop: '0.5rem' }}>
                      <span className={styles.ruleChip} style={{ borderColor: validarPasswordCompleja(newPassword).length ? '#16a34a' : '#ef4444', color: validarPasswordCompleja(newPassword).length ? '#15803d' : '#b91c1c', background: validarPasswordCompleja(newPassword).length ? '#f0fdf4' : '#fef2f2' }}>
                        6-12 caracteres
                      </span>
                      <span className={styles.ruleChip} style={{ borderColor: validarPasswordCompleja(newPassword).upper ? '#16a34a' : '#ef4444', color: validarPasswordCompleja(newPassword).upper ? '#15803d' : '#b91c1c', background: validarPasswordCompleja(newPassword).upper ? '#f0fdf4' : '#fef2f2' }}>
                        Mayúscula
                      </span>
                      <span className={styles.ruleChip} style={{ borderColor: validarPasswordCompleja(newPassword).lower ? '#16a34a' : '#ef4444', color: validarPasswordCompleja(newPassword).lower ? '#15803d' : '#b91c1c', background: validarPasswordCompleja(newPassword).lower ? '#f0fdf4' : '#fef2f2' }}>
                        Minúscula
                      </span>
                      <span className={styles.ruleChip} style={{ borderColor: validarPasswordCompleja(newPassword).number ? '#16a34a' : '#ef4444', color: validarPasswordCompleja(newPassword).number ? '#15803d' : '#b91c1c', background: validarPasswordCompleja(newPassword).number ? '#f0fdf4' : '#fef2f2' }}>
                        Número
                      </span>
                      <span className={styles.ruleChip} style={{ borderColor: validarPasswordCompleja(newPassword).special ? '#16a34a' : '#ef4444', color: validarPasswordCompleja(newPassword).special ? '#15803d' : '#b91c1c', background: validarPasswordCompleja(newPassword).special ? '#f0fdf4' : '#fef2f2' }}>
                        Carácter especial
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Confirmar Contraseña</label>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    required
                  />
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>Las contraseñas no coinciden</span>
                  )}
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setForgotStep(2)}>
                    Atrás
                  </button>
                  <Button type="submit" loading={forgotLoading}>
                    Actualizar Contraseña
                  </Button>
                </div>
              </form>
            )}

            {/* WIZARD PASO 4: Confirmación final */}
            {forgotStep === 4 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.5rem' }}>
                  Has actualizado la contraseña de tu cuenta institucional <strong>{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  className={styles.verifyGridBtn}
                  style={{ width: '100%', height: '40px' }}
                  onClick={() => {
                    setShowForgotModal(false);
                    // Autocompletar login
                    setEmail(forgotEmail);
                    setPassword(newPassword);
                  }}
                >
                  Volver al Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
