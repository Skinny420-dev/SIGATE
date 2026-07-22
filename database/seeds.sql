-- ============================================================================
-- PROYECTO: SIGATE (Sistema Integrado de Gestión Académica y Trámites Estudiantiles)
-- COMPONENTE: Semillas de Base de Datos PostgreSQL
-- ARCHIVO: seeds.sql (Datos de Prueba e Inyección Inicial - CORREGIDO UUID HEX)
-- AUTOR: Marlon
-- FECHA: Mayo de 2026
-- ============================================================================

-- Limpiar tablas existentes en orden de dependencia (por seguridad al re-ejecutar)
TRUNCATE TABLE tribunales_defensa, requisitos_egreso, expedientes_titulacion, 
               suficiencia_ingles, importaciones_excel, bitacoras_actividades, 
               practicas_proyectos, convenios_practicas, instituciones, 
               matricula_auditoria, matricula_detalle, matriculas, 
               periodos_academicos, materia_prerrequisitos, materias, 
               estudiantes, carreras, usuario_roles, usuarios, roles RESTART IDENTITY CASCADE;

-- ============================================================================
-- 1. POBLAR TABLA ROLES
-- ============================================================================
INSERT INTO roles (id, nombre, descripcion) VALUES
(1, 'STUDENT', 'Estudiante regular del instituto, realiza matrículas y bitácoras de prácticas.'),
(2, 'TEACHER', 'Docente tutor o revisor que aprueba bitácoras y audita materias asignadas.'),
(3, 'COORDINATOR', 'Coordinador académico encargado de verificar prerrequisitos y asignar directores.'),
(4, 'FINANCIAL', 'Auditor de la colecturía financiera, responsable del paz y salvo estudiantil.'),
(5, 'SECRETARY', 'Secretaría general de matrículas y titulación, legalización formal y emisión de actas.');

-- Ajustar secuencia del SERIAL de roles
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- ============================================================================
-- 2. POBLAR TABLA USUARIOS (Contraseña de prueba encriptada en BCrypt: 'password123')
-- ============================================================================
INSERT INTO usuarios (id, cedula, nombres, apellidos, correo, password_hash, celular) VALUES
-- Coordinador Académico
('c0a80101-0000-0000-0000-000000000001', '1712345678', 'Galo', 'Montalvo', 'gmontalvo@yavirac.edu.ec', '$2b$10$3sRbCDqoo2IJHIcMYFzYU.Z/gWruefk9/7wNhq7IxyVVYfg4MUe9K', '0991234561'),
-- Docente Tutor
('c0a80101-0000-0000-0000-000000000002', '1787654321', 'Lorena', 'Paredes', 'lparedes@yavirac.edu.ec', '$2b$10$3sRbCDqoo2IJHIcMYFzYU.Z/gWruefk9/7wNhq7IxyVVYfg4MUe9K', '0991234562'),
-- Auditor Financiero
('c0a80101-0000-0000-0000-000000000003', '1711223344', 'Ricardo', 'Albuja', 'ralbuja@yavirac.edu.ec', '$2b$10$3sRbCDqoo2IJHIcMYFzYU.Z/gWruefk9/7wNhq7IxyVVYfg4MUe9K', '0991234563'),
-- Secretaria General
('c0a80101-0000-0000-0000-000000000004', '1755667788', 'Carmen', 'Pazmiño', 'cpazmino@yavirac.edu.ec', '$2b$10$3sRbCDqoo2IJHIcMYFzYU.Z/gWruefk9/7wNhq7IxyVVYfg4MUe9K', '0991234564'),
-- Estudiante de Prueba 1 (Marlon - En fase de titulación)
('c0a80101-0000-0000-0000-000000000005', '1725364758', 'Marlon', 'Vallejos', 'marlon.vallejos@yavirac.edu.ec', '$2b$10$3sRbCDqoo2IJHIcMYFzYU.Z/gWruefk9/7wNhq7IxyVVYfg4MUe9K', '0987654321'),
-- Estudiante de Prueba 2 (Para matrícula activa)
('c0a80101-0000-0000-0000-000000000006', '1799887766', 'Ana', 'Gomez', 'ana.gomez@yavirac.edu.ec', '$2b$10$3sRbCDqoo2IJHIcMYFzYU.Z/gWruefk9/7wNhq7IxyVVYfg4MUe9K', '0988776655');


-- Asignar Roles
INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
('c0a80101-0000-0000-0000-000000000001', 3), -- Galo (Coordinador)
('c0a80101-0000-0000-0000-000000000002', 2), -- Lorena (Docente Tutor)
('c0a80101-0000-0000-0000-000000000003', 4), -- Ricardo (Financiero)
('c0a80101-0000-0000-0000-000000000004', 5), -- Carmen (Secretaria)
('c0a80101-0000-0000-0000-000000000005', 1), -- Marlon (Estudiante)
('c0a80101-0000-0000-0000-000000000006', 1); -- Ana (Estudiante)

-- ============================================================================
-- 3. POBLAR TABLA CARRERAS Y ESTUDIANTES
-- ============================================================================
INSERT INTO carreras (id, nombre, codigo) VALUES
(1, 'Tecnología Superior en Desarrollo de Software', 'DS'),
(2, 'Tecnología Superior en Guía Nacional de Turismo', 'GNT'),
(3, 'Tecnología Superior en Gastronomía', 'GAS');

SELECT setval('carreras_id_seq', (SELECT MAX(id) FROM carreras));

-- Insertar Estudiantes
INSERT INTO estudiantes (id, usuario_id, carrera_id, nivel, estado_academico) VALUES
('e0a80101-0000-0000-0000-000000000001', 'c0a80101-0000-0000-0000-000000000005', 1, 5, 'REGULAR'), -- Marlon en 5to Nivel
('e0a80101-0000-0000-0000-000000000002', 'c0a80101-0000-0000-0000-000000000006', 1, 3, 'REGULAR'); -- Ana en 3er Nivel

-- ============================================================================
-- 4. POBLAR MALLA CURRICULAR Y PRERREQUISITOS (Desarrollo de Software)
-- ============================================================================
INSERT INTO materias (id, carrera_id, codigo, nombre, nivel, creditos) VALUES
-- Nivel 1
(1, 1, 'DS-101', 'Fundamentos de Programación', 1, 4),
(2, 1, 'DS-102', 'Matemáticas Discretas', 1, 3),
(3, 1, 'DS-103', 'Metodologías de Desarrollo de Software', 1, 3),
-- Nivel 2
(4, 1, 'DS-201', 'Programación Orientada a Objetos', 2, 4),
(5, 1, 'DS-202', 'Estructuras de Datos', 2, 3),
(6, 1, 'DS-203', 'Base de Datos Relacionales', 2, 4),
-- Nivel 3
(7, 1, 'DS-301', 'Desarrollo de Aplicaciones Web I', 3, 4),
(8, 1, 'DS-302', 'Modelado y Diseño de Bases de Datos', 3, 4),
(9, 1, 'DS-303', 'Redes y Conectividad', 3, 3),
-- Nivel 4
(10, 1, 'DS-401', 'Desarrollo de Aplicaciones Web II', 4, 4),
(11, 1, 'DS-402', 'Arquitectura de Computadores', 4, 3),
(12, 1, 'DS-403', 'Sistemas Operativos', 4, 3),
-- Nivel 5
(13, 1, 'DS-501', 'Desarrollo de Aplicaciones Móviles', 5, 4),
(14, 1, 'DS-502', 'Gestión de Proyectos de Software', 5, 3),
(15, 1, 'DS-503', 'Seguridad en el Software', 5, 3);

SELECT setval('materias_id_seq', (SELECT MAX(id) FROM materias));

-- Prerrequisitos (Materia_id requiere haber aprobado Prerrequisito_id)
INSERT INTO materia_prerrequisitos (materia_id, prerrequisito_id) VALUES
-- Programación Orientada a Objetos requiere Fundamentos
(4, 1),
-- Estructuras de Datos requiere Matemáticas Discretas
(5, 2),
-- Desarrollo de Aplicaciones Web I requiere Programación Orientada a Objetos
(7, 4),
-- Modelado e Ingeniería de BD requiere Bases de Datos Relacionales
(8, 6),
-- Desarrollo de Aplicaciones Web II requiere Desarrollo de Aplicaciones Web I
(10, 7),
-- Aplicaciones Móviles requiere Desarrollo de Aplicaciones Web II
(13, 10);

-- ============================================================================
-- 5. POBLAR PERIODOS ACADÉMICOS
-- ============================================================================
INSERT INTO periodos_academicos (id, codigo, fecha_inicio, fecha_fin, activo) VALUES
(1, '2025-II', '2025-10-15', '2026-03-15', false),
(2, '2026-I', '2026-04-15', '2026-09-15', true);

SELECT setval('periodos_academicos_id_seq', (SELECT MAX(id) FROM periodos_academicos));

-- ============================================================================
-- 6. MÓDULO DE MATRÍCULAS - FLUJO DE TRÁMITE E HISTORIAL (UUID HEX VÁLIDOS)
-- ============================================================================
-- Trámite de matrícula activa para Ana (Enviado al Financiero - OFFICE_1)
-- Reemplazado 'm' por 'a' para que sea un UUID hexadecimal válido
INSERT INTO matriculas (id, estudiante_id, periodo_id, fecha_solicitud, estado, pdf_siga_url, pdf_no_adeudar_url) VALUES
('a0a80101-0000-0000-0000-000000000001', 'e0a80101-0000-0000-0000-000000000002', 2, '2026-05-10 09:30:00-05', 'OFFICE_1', 
 '/uploads/documents/ana_siga_2026.pdf', '/uploads/documents/ana_no_adeudar_2026.pdf');

-- Detalles de asignaturas que Ana quiere cursar (3 asignaturas del Nivel 3)
INSERT INTO matricula_detalle (matricula_id, materia_id) VALUES
('a0a80101-0000-0000-0000-000000000001', 7), -- Desarrollo de Aplicaciones Web I
('a0a80101-0000-0000-0000-000000000001', 8), -- Modelado de BD
('a0a80101-0000-0000-0000-000000000001', 9); -- Redes y Conectividad

-- Trámite Histórico de Matrícula Legalizada para Marlon en periodo anterior
INSERT INTO matriculas (id, estudiante_id, periodo_id, fecha_solicitud, estado, pdf_siga_url, pdf_no_adeudar_url) VALUES
('a0a80101-0000-0000-0000-000000000002', 'e0a80101-0000-0000-0000-000000000001', 1, '2025-10-18 10:15:00-05', 'LEGALIZED', 
 '/uploads/documents/marlon_siga_2025.pdf', '/uploads/documents/marlon_no_adeudar_2025.pdf');

-- Detalles de asignaturas cursadas por Marlon (Nivel 4 completo)
INSERT INTO matricula_detalle (matricula_id, materia_id) VALUES
('a0a80101-0000-0000-0000-000000000002', 10),
('a0a80101-0000-0000-0000-000000000002', 11),
('a0a80101-0000-0000-0000-000000000002', 12);

-- Auditoría de la matrícula legalizada de Marlon
INSERT INTO matricula_auditoria (matricula_id, auditor_id, paso, estado_aprobacion, observaciones, firma_digital_hash) VALUES
-- Paz y salvo del Financiero
('a0a80101-0000-0000-0000-000000000002', 'c0a80101-0000-0000-0000-000000000003', 'OFFICE_1', 'APPROVED', 'Sin deudas pendientes en colecturía.', 'hash_firma_digital_financiero_ricardo_2025'),
-- Aprobación del Coordinador Académico
('a0a80101-0000-0000-0000-000000000002', 'c0a80101-0000-0000-0000-000000000001', 'OFFICE_2', 'APPROVED', 'Cumple con prerrequisitos de malla.', 'hash_firma_digital_coordinador_galo_2025'),
-- Legalización en Secretaría
('a0a80101-0000-0000-0000-000000000002', 'c0a80101-0000-0000-0000-000000000004', 'LEGALIZED', 'APPROVED', 'Matrícula legalizada exitosamente.', 'hash_firma_digital_secretaria_carmen_2025');

-- ============================================================================
-- 7. MÓDULO DE PRÁCTICAS PRE-PROFESIONALES (400 HORAS CON AUDITORÍA - UUID HEX VÁLIDOS)
-- ============================================================================
INSERT INTO instituciones (id, nombre, ruc, direccion, contacto_nombre, contacto_telefono) VALUES
(1, 'Consorcio Tecnológico Pichincha S.A.', '1791234567001', 'Av. 10 de Agosto N24-100 y Colón', 'Ing. Ramiro Vaca', '022987654');

SELECT setval('instituciones_id_seq', (SELECT MAX(id) FROM instituciones));

INSERT INTO convenios_practicas (id, institucion_id, codigo_convenio, fecha_inicio, fecha_fin, horas_maximas, pdf_convenio_url) VALUES
(1, 1, 'CONV-DS-2025-01', '2025-01-15', '2027-01-15', 2000, '/uploads/agreements/conv_pichincha_2025.pdf');

SELECT setval('convenios_practicas_id_seq', (SELECT MAX(id) FROM convenios_practicas));

-- Proyecto de Práctica Pre-profesional de Marlon
-- Reemplazado 'p' por 'b' para que sea un UUID hexadecimal válido
INSERT INTO practicas_proyectos (id, estudiante_id, convenio_id, tutor_docente_id, fecha_inicio, fecha_fin, estado, total_horas_validadas) VALUES
('b0a80101-0000-0000-0000-000000000001', 'e0a80101-0000-0000-0000-000000000001', 1, 'c0a80101-0000-0000-0000-000000000002', '2025-11-01', NULL, 'IN_PROGRESS', 0);

-- Insertar Bitácoras de Actividades de Marlon. Al insertar con estado APPROVED, el disparador trg_actualizar_acumulado_horas sumará las horas automáticamente
INSERT INTO bitacoras_actividades (practica_proyecto_id, fecha_actividad, descripcion_actividad, horas_realizadas, estado_auditoria) VALUES
('b0a80101-0000-0000-0000-000000000001', '2025-11-03', 'Diseño inicial de pantallas de la interfaz web en Next.js.', 8, 'APPROVED'),
('b0a80101-0000-0000-0000-000000000001', '2025-11-04', 'Configuración de componentes del Stepper de matrículas.', 8, 'APPROVED'),
('b0a80101-0000-0000-0000-000000000001', '2025-11-05', 'Desarrollo de módulos e integración de API REST en Spring Boot.', 8, 'APPROVED');

-- Para simular de forma realista, insertamos un registro que completa 384 horas restantes aprobadas
INSERT INTO bitacoras_actividades (practica_proyecto_id, fecha_actividad, descripcion_actividad, horas_realizadas, estado_auditoria) VALUES
('b0a80101-0000-0000-0000-000000000001', '2025-12-01', 'Carga consolidada de actividades y validación final de desarrollo de software.', 8, 'APPROVED'),
('b0a80101-0000-0000-0000-000000000001', '2025-12-02', 'Pruebas e implementación en contenedores Docker.', 8, 'APPROVED');

-- Aumentamos directamente las horas del proyecto mediante UPDATE para simular que Marlon completó efectivamente las 400 horas requeridas por la normativa.
UPDATE practicas_proyectos 
SET total_horas_validadas = 400, 
    estado = 'COMPLETED', 
    fecha_fin = '2026-03-01' 
WHERE id = 'b0a80101-0000-0000-0000-000000000001';

-- ============================================================================
-- 8. MÓDULO DE IDIOMAS (YEC - EXCEL IMPORT MOCK - UUID HEX VÁLIDOS)
-- ============================================================================
-- Reemplazado 'i' por 'd' para que sea un UUID hexadecimal válido
INSERT INTO importaciones_excel (id, usuario_id, nombre_archivo, registros_importados) VALUES
('d0a80101-0000-0000-0000-000000000001', 'c0a80101-0000-0000-0000-000000000002', 'acta_calificaciones_ingles_2026.xlsx', 45);

-- Inyectar Calificaciones de Suficiencia de Inglés
INSERT INTO suficiencia_ingles (estudiante_id, importacion_id, nivel_ingles, calificacion, aprobado, certificado_url, fecha_aprobacion) VALUES
-- Marlon aprobó suficiencia de inglés (A2 mínimo exigido)
('e0a80101-0000-0000-0000-000000000001', 'd0a80101-0000-0000-0000-000000000001', 'A1', 8.50, true, '/uploads/certs/marlon_a1.pdf', '2025-06-15'),
('e0a80101-0000-0000-0000-000000000001', 'd0a80101-0000-0000-0000-000000000001', 'A2', 9.00, true, '/uploads/certs/marlon_a2.pdf', '2025-12-15');

-- ============================================================================
-- 9. MÓDULO DE TITULACIÓN (PROYECTO DE GRADO EN EJECUCIÓN - UUID HEX VÁLIDOS)
-- ============================================================================
-- Crear expediente de graduación de Marlon
-- Reemplazado 't' por 'f' para que sea un UUID hexadecimal válido
INSERT INTO expedientes_titulacion (id, estudiante_id, tema_proyecto, anteproyecto_url, director_docente_id, estado) VALUES
('f0a80101-0000-0000-0000-000000000001', 'e0a80101-0000-0000-0000-000000000001', 
 'SIGATE: Diseño e Implementación de una Plataforma Web Full-Stack Distribuida para la Automatización y Auditoría de Matrículas, Prácticas y Egresamiento en el IST Yavirac', 
 '/uploads/theses/anteproyecto_marlon_sigate.pdf', 'c0a80101-0000-0000-0000-000000000002', 'TUTOR_ASIGNADO');

-- Insertar requisitos de egreso (Se auto-calcularán y verificarán mediante el trigger 'trg_auditar_egreso_requisitos')
INSERT INTO requisitos_egreso (expediente_id, verificado_por_id) VALUES
('f0a80101-0000-0000-0000-000000000001', 'c0a80101-0000-0000-0000-000000000001');

-- Programar Tribunal de Defensa de Grado para Marlon
INSERT INTO tribunales_defensa (expediente_id, docente_vocal_1_id, docente_vocal_2_id, docente_vocal_3_id, fecha_defensa, calificacion_defensa, observaciones, estado) VALUES
('f0a80101-0000-0000-0000-000000000001', 
 'c0a80101-0000-0000-0000-000000000001', -- Vocal 1: Coordinador Galo
 'c0a80101-0000-0000-0000-000000000002', -- Vocal 2: Docente Lorena
 'c0a80101-0000-0000-0000-000000000003', -- Vocal 3: Auditor Ricardo
 '2026-06-25 10:00:00-05', 9.50, 'Excelente defensa técnica y gran aporte práctico para el instituto.', 'APROBADA');

-- Consolidar egresamiento del expediente de titulación una vez aprobada la defensa
UPDATE expedientes_titulacion 
SET estado = 'GRADUADO' 
WHERE id = 'f0a80101-0000-0000-0000-000000000001';
