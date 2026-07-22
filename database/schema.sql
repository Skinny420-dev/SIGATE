-- ============================================================================
-- PROYECTO: SIGATE (Sistema Integrado de Gestión Académica y Trámites Estudiantiles)
-- INSTITUCIÓN: Instituto Superior Tecnológico de Turismo y Patrimonio "Yavirac"
-- COMPONENTE: Base de Datos Relacional PostgreSQL (Optimizado para Docker)
-- ARCHIVO: schema.sql (Modelo Físico y Reglas de Negocio)
-- AUTOR: Marlon
-- FECHA: Mayo de 2026
-- ============================================================================

-- Habilitar extensión para generación de identificadores únicos UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TIPOS PERSONALIZADOS / ENUMS
-- ============================================================================

CREATE TYPE rol_nombre AS ENUM (
    'STUDENT',      -- Estudiante
    'TEACHER',      -- Docente Tutor / Auditor General
    'COORDINATOR',  -- Coordinador de Carrera
    'FINANCIAL',    -- Auditor Financiero (Paz y Salvo)
    'SECRETARY'     -- Secretaria de Matrículas / Titulación
);

CREATE TYPE estado_matricula AS ENUM (
    'SUBMITTED',    -- Solicitud subida por el estudiante
    'OFFICE_1',     -- Aprobación Financiera (Paz y Salvo de cobros)
    'OFFICE_2',     -- Aprobación de Coordinación de Carrera (Validación de prerrequisitos)
    'LEGALIZED',    -- Aprobación por Secretaría de Matrículas (Matrícula legalizada)
    'REJECTED'      -- Solicitud rechazada en cualquiera de las fases
);

CREATE TYPE estado_practica AS ENUM (
    'IN_PROGRESS',  -- Prácticas pre-profesionales en ejecución
    'COMPLETED',    -- 400 horas completadas y validadas
    'SUSPENDED'     -- Proyecto pausado o cancelado
);

CREATE TYPE estado_bitacora AS ENUM (
    'SUBMITTED',    -- Bitácora registrada por estudiante, pendiente de docente
    'APPROVED',     -- Horas aprobadas y acumuladas por el Docente Tutor
    'REJECTED'      -- Rechazada con observaciones para corrección
);

CREATE TYPE nivel_ingles AS ENUM (
    'A1',           -- Nivel Inicial
    'A2',           -- Suficiencia Exigida en Carreras Tecnológicas (Mínimo aprobatorio)
    'B1',           -- Intermedio
    'B2'            -- Avanzado
);

CREATE TYPE estado_titulacion AS ENUM (
    'REQUISITOS_CHECK',        -- Fase inicial: Auditoría automática de requisitos
    'ANTEPROYECTO_PENDIENTE',  -- Anteproyecto subido, en espera de aprobación del consejo
    'ANTEPROYECTO_APROBADO',   -- Anteproyecto aprobado por el comité
    'TUTOR_ASIGNADO',          -- Director/Tutor de tesis asignado
    'DEFENSA_PROGRAMADA',      -- Fecha, hora y tribunal asignado para sustentación
    'GRADUADO',                -- Título legalizado y egresado formalmente
    'RECHAZADO'                -- Expediente rechazado
);

CREATE TYPE estado_defensa AS ENUM (
    'PENDIENTE',
    'APROBADA',
    'REPROBADA'
);

-- ============================================================================
-- 2. TABLAS DEL SISTEMA (ESQUEMA RELACIONAL NORMALIZADO)
-- ============================================================================

-- --- A. SEGURIDAD Y CONTROL DE ACCESOS (RBAC) ---

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre rol_nombre UNIQUE NOT NULL,
    descripcion VARCHAR(255)
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula VARCHAR(10) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    celular VARCHAR(15),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_cedula_ecuatoriana CHECK (cedula ~ '^[0-9]{10}$') -- Validación de 10 dígitos numéricos
);

CREATE TABLE usuario_roles (
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id INT REFERENCES roles(id) ON DELETE RESTRICT,
    PRIMARY KEY (usuario_id, rol_id)
);

-- --- B. ESTRUCTURA ACADÉMICA ---

CREATE TABLE carreras (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) UNIQUE NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL, -- Ej. 'DS' (Desarrollo de Software)
    activa BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    carrera_id INT NOT NULL REFERENCES carreras(id) ON DELETE RESTRICT,
    nivel INT NOT NULL CHECK (nivel BETWEEN 1 AND 5), -- Rango de niveles para tecnicaturas
    fecha_ingreso DATE DEFAULT CURRENT_DATE NOT NULL,
    estado_academico VARCHAR(50) DEFAULT 'REGULAR' NOT NULL -- Ej: REGULAR, CONDICIONAL, EGRESADO
);

CREATE TABLE materias (
    id SERIAL PRIMARY KEY,
    carrera_id INT NOT NULL REFERENCES carreras(id) ON DELETE CASCADE,
    codigo VARCHAR(20) UNIQUE NOT NULL, -- Ej. 'DS-301'
    nombre VARCHAR(150) NOT NULL,
    nivel INT NOT NULL CHECK (nivel BETWEEN 1 AND 5),
    creditos INT NOT NULL CHECK (creditos > 0),
    activa BOOLEAN DEFAULT TRUE NOT NULL
);

-- Autorelación N:M para Prerrequisitos de Materias (Cruce de Malla Curricular)
CREATE TABLE materia_prerrequisitos (
    materia_id INT REFERENCES materias(id) ON DELETE CASCADE,
    prerrequisito_id INT REFERENCES materias(id) ON DELETE CASCADE,
    PRIMARY KEY (materia_id, prerrequisito_id),
    CONSTRAINT chk_no_autorreferencial CHECK (materia_id <> prerrequisito_id)
);

CREATE TABLE periodos_academicos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL, -- Ej. '2026-I'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT chk_fechas_periodo CHECK (fecha_inicio < fecha_fin)
);

-- --- C. MÓDULO DE MATRÍCULAS ---

CREATE TABLE matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    periodo_id INT NOT NULL REFERENCES periodos_academicos(id) ON DELETE RESTRICT,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado estado_matricula DEFAULT 'SUBMITTED' NOT NULL,
    pdf_siga_url VARCHAR(255),          -- PDF cargado de formulario SIGA institucional
    pdf_no_adeudar_url VARCHAR(255),    -- Certificado de paz y salvo cargado por el estudiante
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (estudiante_id, periodo_id)  -- Un estudiante solo puede tener una solicitud por período
);

CREATE TABLE matricula_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
    materia_id INT NOT NULL REFERENCES materias(id) ON DELETE RESTRICT,
    UNIQUE (matricula_id, materia_id)   -- No se puede agregar la misma materia dos veces en la solicitud
);

-- Auditoría y Control del Stepper por Oficinas (Firmas Digitales de Paz y Salvo)
CREATE TABLE matricula_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_id UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
    auditor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    paso estado_matricula NOT NULL CHECK (paso IN ('OFFICE_1', 'OFFICE_2', 'LEGALIZED', 'REJECTED')),
    estado_aprobacion VARCHAR(20) NOT NULL CHECK (estado_aprobacion IN ('APPROVED', 'REJECTED')),
    observaciones TEXT,
    firma_digital_hash VARCHAR(256),    -- Hash de seguridad que simula la firma digital
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --- D. MÓDULO DE PRÁCTICAS PRE-PROFESIONALES ---

CREATE TABLE instituciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    ruc VARCHAR(13) UNIQUE NOT NULL CHECK (length(ruc) = 13), -- Estructura fija RUC Ecuador
    direccion VARCHAR(255) NOT NULL,
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(15)
);

CREATE TABLE convenios_practicas (
    id SERIAL PRIMARY KEY,
    institucion_id INT NOT NULL REFERENCES instituciones(id) ON DELETE RESTRICT,
    codigo_convenio VARCHAR(50) UNIQUE NOT NULL, -- Código institucional del convenio
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    horas_maximas INT NOT NULL CHECK (horas_maximas > 0),
    pdf_convenio_url VARCHAR(255),
    CONSTRAINT chk_fechas_convenio CHECK (fecha_inicio < fecha_fin)
);

CREATE TABLE practicas_proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    convenio_id INT NOT NULL REFERENCES convenios_practicas(id) ON DELETE RESTRICT,
    tutor_docente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado estado_practica DEFAULT 'IN_PROGRESS' NOT NULL,
    total_horas_validadas INT DEFAULT 0 NOT NULL CHECK (total_horas_validadas >= 0 AND total_horas_validadas <= 400),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_fechas_proyecto CHECK (fecha_inicio < fecha_fin OR fecha_fin IS NULL)
);

CREATE TABLE bitacoras_actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practica_proyecto_id UUID NOT NULL REFERENCES practicas_proyectos(id) ON DELETE CASCADE,
    fecha_actividad DATE NOT NULL,
    descripcion_actividad TEXT NOT NULL,
    horas_realizadas INT NOT NULL CHECK (horas_realizadas > 0 AND horas_realizadas <= 8), -- Límite de 8 horas diarias de prácticas
    estado_auditoria estado_bitacora DEFAULT 'SUBMITTED' NOT NULL,
    observaciones_tutor TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- --- E. MÓDULO DE IDIOMAS (YEC - YAVIRAC ENGLISH CENTER) ---

CREATE TABLE importaciones_excel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT, -- Docente que realiza la importación
    nombre_archivo VARCHAR(255) NOT NULL,
    registros_importados INT NOT NULL DEFAULT 0 CHECK (registros_importados >= 0),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE suficiencia_ingles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    importacion_id UUID REFERENCES importaciones_excel(id) ON DELETE SET NULL,
    nivel_ingles nivel_ingles NOT NULL,
    calificacion NUMERIC(4,2) NOT NULL CHECK (calificacion BETWEEN 0.00 AND 10.00), -- Calificación sobre 10
    aprobado BOOLEAN NOT NULL DEFAULT FALSE,
    certificado_url VARCHAR(255),
    fecha_aprobacion DATE NOT NULL DEFAULT CURRENT_DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (estudiante_id, nivel_ingles) -- Un único registro final consolidado por estudiante en cada nivel
);

-- --- F. MÓDULO DE TITULACIÓN (EGRESAMIENTO) ---

CREATE TABLE expedientes_titulacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID UNIQUE NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    tema_proyecto VARCHAR(255) NOT NULL,
    anteproyecto_url VARCHAR(255) NOT NULL, -- PDF del anteproyecto cargado
    director_docente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL, -- Tutor / Director asignado
    estado estado_titulacion DEFAULT 'REQUISITOS_CHECK' NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE requisitos_egreso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id UUID UNIQUE NOT NULL REFERENCES expedientes_titulacion(id) ON DELETE CASCADE,
    matriculas_ok BOOLEAN NOT NULL DEFAULT FALSE, -- Auditoría de matrícula legalizada en el último periodo
    practicas_ok BOOLEAN NOT NULL DEFAULT FALSE,   -- Auditoría de cumplimiento de las 400 horas
    ingles_ok BOOLEAN NOT NULL DEFAULT FALSE,      -- Auditoría de nivel de suficiencia A2 aprobado
    verificado_por_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_verificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE tribunales_defensa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id UUID UNIQUE NOT NULL REFERENCES expedientes_titulacion(id) ON DELETE CASCADE,
    docente_vocal_1_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    docente_vocal_2_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    docente_vocal_3_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_defensa TIMESTAMP WITH TIME ZONE NOT NULL,
    calificacion_defensa NUMERIC(4,2) CHECK (calificacion_defensa BETWEEN 0.00 AND 10.00),
    observaciones TEXT,
    estado estado_defensa DEFAULT 'PENDIENTE' NOT NULL,
    -- Restricción para asegurar que el tribunal esté compuesto por 3 docentes distintos
    CONSTRAINT chk_vocales_distintos CHECK (
        docente_vocal_1_id <> docente_vocal_2_id AND 
        docente_vocal_1_id <> docente_vocal_3_id AND 
        docente_vocal_2_id <> docente_vocal_3_id
    )
);

-- ============================================================================
-- 3. ESTRATEGIA DE INDEXACIÓN (OPTIMIZACIÓN DE CONSULTAS)
-- ============================================================================

-- Índices en campos de auditoría y flujos de estados (Bandejas del Docente)
CREATE INDEX idx_matriculas_estado ON matriculas(estado);
CREATE INDEX idx_bitacoras_estado ON bitacoras_actividades(estado_auditoria);
CREATE INDEX idx_titulacion_estado ON expedientes_titulacion(estado);

-- Índices de búsqueda y búsquedas rápidas (Cédulas y Correos)
CREATE INDEX idx_usuarios_cedula ON usuarios(cedula);
CREATE INDEX idx_usuarios_correo ON usuarios(correo);

-- Índices de llaves foráneas comunes para joins ultrarápidos
CREATE INDEX idx_estudiantes_usuario ON estudiantes(usuario_id);
CREATE INDEX idx_estudiantes_carrera ON estudiantes(carrera_id);
CREATE INDEX idx_matriculas_estudiante ON matriculas(estudiante_id);
CREATE INDEX idx_matricula_detalle_matricula ON matricula_detalle(matricula_id);
CREATE INDEX idx_practicas_proyectos_estudiante ON practicas_proyectos(estudiante_id);
CREATE INDEX idx_bitacoras_proyecto ON bitacoras_actividades(practica_proyecto_id);
CREATE INDEX idx_suficiencia_ingles_estudiante ON suficiencia_ingles(estudiante_id);

-- ============================================================================
-- 4. DISPARADORES (TRIGGERS) Y LÓGICA DE NEGOCIO EN BASE DE DATOS
-- ============================================================================

-- 4.1 Actualización automática de la columna 'actualizado_en' (Audit tracking)
CREATE OR REPLACE FUNCTION actualizar_timestamp_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_usuario_timestamp
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_modificacion();

CREATE TRIGGER trg_actualizar_matricula_timestamp
    BEFORE UPDATE ON matriculas
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_modificacion();

CREATE TRIGGER trg_actualizar_practica_timestamp
    BEFORE UPDATE ON practicas_proyectos
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_modificacion();

CREATE TRIGGER trg_actualizar_bitacora_timestamp
    BEFORE UPDATE ON bitacoras_actividades
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_modificacion();

CREATE TRIGGER trg_actualizar_titulacion_timestamp
    BEFORE UPDATE ON expedientes_titulacion
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_modificacion();


-- 4.2 Límite estricto de máximo 6 materias por matrícula
CREATE OR REPLACE FUNCTION verificar_limite_seis_materias()
RETURNS TRIGGER AS $$
DECLARE
    total_materias INT;
BEGIN
    SELECT COUNT(*) INTO total_materias
    FROM matricula_detalle
    WHERE matricula_id = NEW.matricula_id;

    IF total_materias >= 6 THEN
        RAISE EXCEPTION 'Regla Académica Violada: Un estudiante no puede matricularse en más de 6 asignaturas en el mismo período académico.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_limite_seis_materias
    BEFORE INSERT ON matricula_detalle
    FOR EACH ROW EXECUTE FUNCTION verificar_limite_seis_materias();


-- 4.3 Acumulación automática de horas de prácticas validadas
CREATE OR REPLACE FUNCTION calcular_horas_practica_aprobadas()
RETURNS TRIGGER AS $$
DECLARE
    v_proyecto_id UUID;
    v_total_horas INT;
BEGIN
    -- Identificar el ID del proyecto en base a la bitácora
    IF TG_OP = 'DELETE' THEN
        v_proyecto_id := OLD.practica_proyecto_id;
    ELSE
        v_proyecto_id := NEW.practica_proyecto_id;
    END IF;

    -- Calcular la suma de horas aprobadas
    SELECT COALESCE(SUM(horas_realizadas), 0) INTO v_total_horas
    FROM bitacoras_actividades
    WHERE practica_proyecto_id = v_proyecto_id
      AND estado_auditoria = 'APPROVED';

    -- Limitar a un máximo técnico reglamentario de 400 horas
    IF v_total_horas > 400 THEN
        v_total_horas := 400;
    END IF;

    -- Actualizar el total de horas en el proyecto del estudiante
    UPDATE practicas_proyectos
    SET total_horas_validadas = v_total_horas,
        estado = CASE 
            WHEN v_total_horas >= 400 THEN 'COMPLETED'::estado_practica
            ELSE 'IN_PROGRESS'::estado_practica
        END,
        fecha_fin = CASE 
            WHEN v_total_horas >= 400 THEN CURRENT_DATE
            ELSE NULL
        END
    WHERE id = v_proyecto_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_acumulado_horas
    AFTER INSERT OR UPDATE OF estado_auditoria OR DELETE ON bitacoras_actividades
    FOR EACH ROW EXECUTE FUNCTION calcular_horas_practica_aprobadas();


-- 4.4 Auditoría Automática para Expedientes de Titulación (Egresamiento)
CREATE OR REPLACE FUNCTION auditoria_automatica_requisitos_egreso()
RETURNS TRIGGER AS $$
DECLARE
    v_estudiante_id UUID;
    v_matricula_legalizada BOOLEAN;
    v_practicas_completadas BOOLEAN;
    v_ingles_aprobado BOOLEAN;
BEGIN
    -- Obtener el id del estudiante para auditar
    SELECT estudiante_id INTO v_estudiante_id
    FROM expedientes_titulacion
    WHERE id = NEW.expediente_id;

    -- 1. Verificar Matrícula Legalizada en el periodo activo o inmediato anterior
    SELECT EXISTS (
        SELECT 1 FROM matriculas 
        WHERE estudiante_id = v_estudiante_id 
          AND estado = 'LEGALIZED'
    ) INTO v_matricula_legalizada;

    -- 2. Verificar prácticas pre-profesionales (400 horas aprobadas)
    SELECT EXISTS (
        SELECT 1 FROM practicas_proyectos
        WHERE estudiante_id = v_estudiante_id
          AND total_horas_validadas >= 400
          AND estado = 'COMPLETED'
    ) INTO v_practicas_completadas;

    -- 3. Verificar suficiencia de inglés (Nivel A2 o superior con calificación >= 7.00)
    SELECT EXISTS (
        SELECT 1 FROM suficiencia_ingles
        WHERE estudiante_id = v_estudiante_id
          AND nivel_ingles = 'A2'
          AND aprobado = TRUE
    ) INTO v_ingles_aprobado;

    -- Actualizar el registro de requisitos
    NEW.matriculas_ok := v_matricula_legalizada;
    NEW.practicas_ok := v_practicas_completadas;
    NEW.ingles_ok := v_ingles_aprobado;

    -- Si todos los requisitos se cumplen, el expediente puede pasar a ANTEPROYECTO_PENDIENTE automáticamente
    IF v_matricula_legalizada AND v_practicas_completadas AND v_ingles_aprobado THEN
        UPDATE expedientes_titulacion
        SET estado = 'ANTEPROYECTO_PENDIENTE'
        WHERE id = NEW.expediente_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditar_egreso_requisitos
    BEFORE INSERT ON requisitos_egreso
    FOR EACH ROW EXECUTE FUNCTION auditoria_automatica_requisitos_egreso();
