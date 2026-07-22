// Roles del sistema institucional
export enum Role {
  Student   = 'estudiante',
  Teacher   = 'docente',
  Admin     = 'admin',
  Secretary = 'secretaria',
}

// Permisos por módulo
export const PERMISSIONS: Record<Role, string[]> = {
  [Role.Student]: [
    'matriculas:view',
    'matriculas:create',
    'practicas:view',
    'practicas:upload_log',
    'ingles:view',
    'ingles:upload_cert',
    'titulacion:view',
    'titulacion:register_topic',
  ],
  [Role.Teacher]: [
    'matriculas:view',
    'practicas:view',
    'practicas:approve_hours',
    'practicas:panel',
    'ingles:view',
    'ingles:validate_cert',
    'titulacion:view',
    'titulacion:tribunal_panel',
    'titulacion:assign_tutor',
  ],
  [Role.Secretary]: [
    'matriculas:view',
    'matriculas:create',
    'matriculas:admin',
  ],
  [Role.Admin]: [
    'matriculas:view', 'matriculas:create', 'matriculas:admin',
    'practicas:view', 'practicas:approve_hours', 'practicas:panel',
    'ingles:view', 'ingles:validate_cert',
    'titulacion:view', 'titulacion:tribunal_panel',
    'titulacion:assign_tutor', 'titulacion:admin',
    'admin:dashboard',
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
