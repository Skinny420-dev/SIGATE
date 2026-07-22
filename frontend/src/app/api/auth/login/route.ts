import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const POSTGREST = process.env.POSTGREST_INTERNAL_URL ?? 'http://localhost:3005';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'sigate_secret_key_yavirac_2026'
);

export async function POST(req: Request) {
  try {
    const { correo, password } = await req.json();

    if (!correo || !password) {
      return NextResponse.json(
        { error: 'Correo y contraseña son requeridos.' },
        { status: 400 }
      );
    }

    // 1. Buscar el usuario en PostgreSQL vía PostgREST
    const userRes = await fetch(
      `${POSTGREST}/usuarios?correo=eq.${encodeURIComponent(correo)}&activo=eq.true&select=id,cedula,nombres,apellidos,correo,password_hash`,
      { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Error al consultar la base de datos.' }, { status: 502 });
    }

    const users = await userRes.json();
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
    }

    const user = users[0];

    // 2. Verificar contraseña (comparación directa para desarrollo - en producción usar bcrypt)
    // Como bcrypt requiere el paquete en servidor, verificamos con el hash almacenado
    // Para demo con seeds.sql usamos la contraseña en texto plano almacenada como hash "$2b$..."
    // Importamos bcryptjs para comparación real
    const bcrypt = await import('bcryptjs');
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
    }

    // 3. Obtener el rol del usuario desde usuario_roles + roles
    const rolesRes = await fetch(
      `${POSTGREST}/usuario_roles?usuario_id=eq.${user.id}&select=rol_id,roles(nombre)`,
      { headers: { 'Accept': 'application/json' } }
    );

    let role = 'estudiante';
    if (rolesRes.ok) {
      const rolesData = await rolesRes.json();
      const dbRol = rolesData[0]?.roles?.nombre;
      if (dbRol === 'TEACHER') role = 'docente';
      else if (dbRol === 'COORDINATOR') role = 'admin';
      else if (dbRol === 'STUDENT') role = 'estudiante';
      else if (dbRol === 'SECRETARY') role = 'secretaria';
    }

    // 4. Firmar un JWT con los datos del usuario
    const token = await new SignJWT({
      sub: user.id,
      name: `${user.nombres} ${user.apellidos}`,
      email: user.correo,
      cedula: user.cedula,
      role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: `${user.nombres} ${user.apellidos}`,
        email: user.correo,
        cedula: user.cedula,
        role,
      },
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
