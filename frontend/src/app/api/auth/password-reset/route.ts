import { NextResponse } from 'next/server';

const POSTGREST = process.env.POSTGREST_INTERNAL_URL ?? 'http://localhost:3005';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { correo, password } = body;

    if (!correo || !password) {
      return NextResponse.json({ error: 'El correo y la contraseña son obligatorios.' }, { status: 400 });
    }

    // 1. Verificar si existe el usuario por su correo
    const userRes = await fetch(`${POSTGREST}/usuarios?correo=eq.${encodeURIComponent(correo)}&select=id`, {
      headers: { 'Accept': 'application/json' }
    });
    const users = await userRes.json();
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'El correo electrónico no se encuentra registrado en el sistema.' }, { status: 404 });
    }

    const userId = users[0].id;

    // 2. Hashear la nueva contraseña
    const bcrypt = await import('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Actualizar la contraseña en la base de datos
    const updateRes = await fetch(`${POSTGREST}/usuarios?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ password_hash })
    });

    if (!updateRes.ok) {
      return NextResponse.json({ error: 'Error al actualizar la contraseña en la base de datos.' }, { status: 502 });
    }

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente.' }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno de red o servidor.', details: err.message }, { status: 500 });
  }
}
