import { NextResponse } from 'next/server';

const POSTGREST = process.env.POSTGREST_INTERNAL_URL ?? 'http://localhost:3005';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cedula, nombres, apellidos, correo, password, rol, nivel, carrera_id } = body;

    // Validaciones básicas
    if (!cedula || !nombres || !apellidos || !correo || !password || !rol) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios.' },
        { status: 400 }
      );
    }
    if (!/^\d{10}$/.test(cedula)) {
      return NextResponse.json({ error: 'La cédula debe tener exactamente 10 dígitos.' }, { status: 400 });
    }

    // 1. Hashear la contraseña con BCrypt
    const bcrypt = await import('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);

    // 2. Insertar usuario en tabla `usuarios`
    const insertUserRes = await fetch(`${POSTGREST}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ cedula, nombres, apellidos, correo, password_hash }),
    });

    if (!insertUserRes.ok) {
      const errBody = await insertUserRes.json().catch(() => ({}));
      // Manejo de duplicado
      if (insertUserRes.status === 409 || errBody?.code === '23505') {
        return NextResponse.json({ error: 'La cédula o correo ya está registrado.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error al crear el usuario en la base de datos.' }, { status: 502 });
    }

    const [newUser] = await insertUserRes.json();

    // 3. Obtener el ID del rol desde tabla `roles`
    const rolRes = await fetch(
      `${POSTGREST}/roles?nombre=eq.${encodeURIComponent(rol)}&select=id`,
      { headers: { 'Accept': 'application/json' } }
    );
    const roles = await rolRes.json();
    if (!roles || roles.length === 0) {
      return NextResponse.json({ error: `Rol '${rol}' no encontrado en la base de datos.` }, { status: 400 });
    }
    const rol_id = roles[0].id;

    // 4. Asignar rol al usuario en `usuario_roles`
    await fetch(`${POSTGREST}/usuario_roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ usuario_id: newUser.id, rol_id }),
    });

    // 5. Si es estudiante, crear registro en tabla `estudiantes`
    if (rol === 'STUDENT') {
      const nivelNum = parseInt(nivel ?? '1', 10);
      const carreraNum = parseInt(carrera_id ?? '1', 10);
      await fetch(`${POSTGREST}/estudiantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          usuario_id: newUser.id,
          carrera_id: carreraNum,
          nivel: nivelNum,
        }),
      });
    }

    if (rol === 'TEACHER' && carrera_id) {
      const carreraNum = parseInt(carrera_id, 10);
      if (!isNaN(carreraNum)) {
        await fetch(`${POSTGREST}/estudiantes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            usuario_id: newUser.id,
            carrera_id: carreraNum,
            nivel: 1, // 1 = docente asociado a esa carrera (nivel representativo)
          }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      message: 'Usuario registrado exitosamente.',
      user: {
        id: newUser.id,
        nombre: `${nombres} ${apellidos}`,
        correo,
        rol,
      },
    }, { status: 201 });

  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
