# Manual de Usuario Completo - Sistema SIGATE

Este manual de usuario describe detalladamente el funcionamiento de la plataforma **SIGATE** (Sistema Integrado de Gestión Académica y Trámites Estudiantiles) del **Instituto Superior Tecnológico de Turismo y Patrimonio "Yavirac"**. La plataforma automatiza los flujos de Matrículas, Registro de Bitácoras de Prácticas Pre-Profesionales, Suficiencia de Inglés y Expedientes de Titulación.

---

##  1. Módulo de Autenticación y Acceso Seguro

### Inicio de Sesión (Login)
1. Acceda a la URL principal de la aplicación.
2. Ingrese sus credenciales de acceso:
   * **Correo Institucional:** Debe utilizar su correo con dominio `@yavirac.edu.ec` (ej. `marlon.vallejos@yavirac.edu.ec`).
   * **Contraseña:** Digite su clave asignada.
3. Complete el **Captcha de Validación de Imágenes** (Turnstile):
   * Haga clic en la casilla "No soy un robot".
   * Se abrirá una cuadrícula interactiva con 9 imágenes.
   * Seleccione exactamente las **3 imágenes** correspondientes a la categoría objetivo indicada (ej. *Gato, Perro, Automóvil, Montaña o Computadora*).
   * Presione **Verificar**. Una vez validado, se habilitará el botón de acceso.
4. Presione en **Iniciar sesión**.

> [!NOTE]
> Para demostraciones rápidas, puede utilizar los accesos rápidos en la parte inferior para iniciar sesión automáticamente con cuentas demo de estudiante o docente.

### Recuperación de Contraseña (Paso a Paso)
Si olvidó su contraseña, puede restablecerla de forma segura:
1. En la pantalla de login, haga clic en el enlace **¿Olvidaste tu contraseña?**.
2. **Paso 1 (Ingreso de Correo):** Digite su dirección de correo institucional y haga clic en **Enviar código**.
3. **Paso 2 (Validación de Código):** Copie el código temporal de seguridad de 6 dígitos que se le muestra en el simulador de pantalla y haga clic en **Verificar código**.
4. **Paso 3 (Establecer Nueva Contraseña):** Ingrese su nueva contraseña y confírmela. Presione **Restablecer contraseña**.

> [!IMPORTANT]
> La nueva contraseña debe cumplir con los siguientes requisitos mínimos de seguridad:
> * Entre 6 y 12 caracteres.
> * Al menos una letra mayúscula (`A-Z`).
> * Al menos una letra minúscula (`a-z`).
> * Al menos un dígito numérico (`0-9`).
> * Al menos un carácter especial (ej. `@`, `$`, `!`, `%`, `*`, `?`, `&`).

---

## 🎓 2. Flujo y Operaciones del Estudiante

Al ingresar con una cuenta de estudiante, visualizará un panel unificado de control de progresión académica.

### 📝 Módulo de Matrícula (Stepper de 4 Pasos)
1. Ingrese al módulo **Matrículas** desde el menú principal.
2. **Paso 1 (Términos y Condiciones):** Revise la información introductoria del período académico y presione **Siguiente**.
3. **Paso 2 (Selección de Asignaturas):** El sistema detectará su semestre actual y listará únicamente las materias correspondientes que tiene habilitadas por prerrequisitos. Marque las asignaturas a cursar.
4. **Paso 3 (Carga de Documentación):** Adjunte obligatoriamente en formato PDF:
   * Su **Formulario del SIGA** firmado.
   * Su **Certificado de No Adeudar** solventado por colecturía.
5. **Paso 4 (Confirmación):** Revise el resumen del trámite y haga clic en **Completar Solicitud**. Su expediente pasará al estado `SUBMITTED` (Recibido).

### Módulo de Prácticas Pre-Profesionales
Este módulo le permite autogestionar su progreso laboral de 400 horas:
1. Ingrese a la sección **Prácticas**.
2. Si no posee un proyecto activo, el sistema auto-creará un proyecto de vinculación basado en su carrera asignándole un convenio y un docente tutor.
3. **Registro de Actividades Diarias (Bitácoras):**
   * En la pestaña **Bitácora**, ingrese la descripción detallada de la actividad realizada en su empresa formadora.
   * Ingrese el número de **horas trabajadas** en la jornada.
   * Seleccione la **fecha** de la actividad.
   * Presione **Registrar Actividad**. Ésta se guardará con estado *Pendiente* hasta que su tutor la evalúe.
4. **Carpeta Digital de Fase Práctica (Formatos F1-F8):**
   * Cambie a la pestaña **Fase Práctica**.
   * Rellene los datos de los formatos oficiales de control dual: Acta de Compromiso (F1), Currículo de Vida (F2), Plan Marco de Formación (F3), Plan de Rotación (F4), Control de Asistencia y Horario (F5) y Evaluaciones (F7/F8).
   * Presione **Guardar Progreso** en la parte inferior para almacenar sus datos de forma segura.

###  Módulo de Inglés (Yavirac English Center - YEC)
La aprobación de la suficiencia en una segunda lengua (nivel A2 mínimo) es indispensable para el egresamiento:
1. Ingrese a la sección **Inglés**.
2. El sistema evaluará su historial:
   * **Inscripción desde Cero:** Si no posee conocimientos previos y desea cursar la materia completa, seleccione **Iniciar desde el Primer Nivel (A1.1)**. Se le asignará dicho nivel automáticamente.
   * **Ficha de Prueba de Ubicación:** Si tiene conocimientos previos y desea rendir el examen presencial, seleccione **Dar Prueba de Ubicación**. Complete el formulario multipaso (sede, datos personales, carrera, semestre, fecha y franja horaria de examen). Al finalizar, se generará su **Comprobante Oficial de Inscripción** con un código QR simulado que podrá imprimir.

---

## 3. Flujo del Docente / Auditor Académico

El personal docente y coordinadores cuentan con bandejas de entrada centralizadas para auditar los expedientes de su respectiva carrera:

### Auditoría y Aprobación de Trámites
1. Acceda al panel de **Administración**.
2. **Revisión de Matrículas:**
   * Visualice los expedientes que se encuentran en etapa de Coordinación (`OFFICE_2`).
   * Al hacer clic en un estudiante, se abrirá el panel lateral de auditoría.
   * Revise los PDFs del formulario SIGA y No Adeudar en el visualizador lateral integrado.
   * **Aprobación:** Presione en **Firmar y Registrar Aprobación** para autorizar el trámite. El expediente pasará a Secretaría para su legalización final.
   * **Rechazo:** Si hay documentos incorrectos o deudas, escriba las observaciones en la caja de texto y presione **Devolver con Observaciones** para que el alumno corrija su trámite.
3. **Revisión de Bitácoras de Prácticas:**
   * En la pestaña **Prácticas**, audite la carpeta digital del estudiante (Formatos F1-F8) y el listado de actividades semanales de su bitácora.
   * Apruebe o rechace las horas cargadas por el estudiante para que se sumen a su acumulado de 400 horas obligatorias.

---

## 4. Flujo del Administrador General

El administrador central de la plataforma tiene control total sobre las cuentas y mallas del instituto Yavirac:

### Panel de Gestión de Usuarios (CRUD)
1. Acceda a la pestaña **Usuarios** en el menú de administrador.
2. **Creación de Cuentas:**
   * Haga clic en **Crear Nuevo Usuario**.
   * Seleccione el tipo de cuenta: *Estudiante, Docente, Secretaria o Coordinador*.
   * Ingrese la Cédula (valida algoritmo del módulo 10), nombres/apellidos (solo letras) y el correo electrónico institucional.
   * **Asociación de Carrera:** Si registra un **Docente** o un **Estudiante**, asócielo obligatoriamente a una de las **5 carreras oficiales** del instituto (*Desarrollo de Software, Arte Culinario Ecuatoriano, Marketing Digital, Guía Nacional de Turismo, Diseño de Modas*).
   * Presione **Registrar Cuenta** para persistir los datos en PostgreSQL.
3. **Edición y Baja de Usuarios:**
   * En el listado global de usuarios, puede buscar cuentas en tiempo real mediante nombres o correos.
   * Presione en **Editar** para modificar datos de carrera, nivel académico o contraseñas.
   * Presione en **Eliminar** (ícono de papelera) para dar de baja definitiva a una cuenta del sistema de forma segura.
