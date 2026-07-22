import { NextResponse } from 'next/server';

const POSTGREST = process.env.POSTGREST_INTERNAL_URL ?? 'http://localhost:3005';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, cedula, nombres, apellidos, correo, password, rol, activo, carrera_id, nivel } = body;

    if (!id || !cedula || !nombres || !apellidos || !correo || !rol) {
      return NextResponse.json({ error: 'Todos los campos excepto contraseña son obligatorios.' }, { status: 400 });
    }

    const updateFields: any = { cedula, nombres, apellidos, correo, activo };

    // 1. Si viene contraseña nueva, la hasheamos
    if (password && password.trim() !== '') {
      const bcrypt = await import('bcryptjs');
      updateFields.password_hash = await bcrypt.hash(password, 10);
    }

    // 2. Actualizar datos en tabla `usuarios`
    const updateRes = await fetch(`${POSTGREST}/usuarios?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(updateFields),
    });

    if (!updateRes.ok) {
      return NextResponse.json({ error: 'Error al actualizar el usuario en la base de datos.' }, { status: 502 });
    }

    // 3. Obtener el ID del rol desde la tabla `roles`
    const rolRes = await fetch(
      `${POSTGREST}/roles?nombre=eq.${encodeURIComponent(rol)}&select=id`,
      { headers: { 'Accept': 'application/json' } }
    );
    const roles = await rolRes.json();
    if (!roles || roles.length === 0) {
      return NextResponse.json({ error: `Rol '${rol}' no encontrado.` }, { status: 400 });
    }
    const rol_id = roles[0].id;

    // 4. Actualizar rol en `usuario_roles`
    await fetch(`${POSTGREST}/usuario_roles?usuario_id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });

    await fetch(`${POSTGREST}/usuario_roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ usuario_id: id, rol_id }),
    });

    // 5. Si es estudiante o docente, verificar o actualizar registro en `estudiantes`
    if (rol === 'STUDENT' || rol === 'TEACHER') {
      const estRes = await fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${id}`, {
        headers: { 'Accept': 'application/json' }
      });
      const estudiantes = await estRes.json();
      
      const nivelNum = rol === 'TEACHER' ? 0 : parseInt(nivel ?? '1', 10);
      const carreraNum = parseInt(carrera_id ?? '1', 10);

      if (estudiantes && estudiantes.length > 0) {
        // Actualizar existente
        await fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carrera_id: carreraNum,
            nivel: nivelNum
          })
        });
      } else {
        // Crear nuevo
        await fetch(`${POSTGREST}/estudiantes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            usuario_id: id,
            carrera_id: carreraNum,
            nivel: nivelNum
          }),
        });
      }
    } else {
      // Si ya no es estudiante ni docente, borramos su registro en estudiantes para mantener la consistencia
      await fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
    }

    return NextResponse.json({ message: 'Usuario actualizado exitosamente.' }, { status: 200 });

  } catch (err) {
    console.error('[UPDATE USER ERROR]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
