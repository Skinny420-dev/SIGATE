import { NextResponse } from 'next/server';

const POSTGREST = process.env.POSTGREST_INTERNAL_URL ?? 'http://localhost:3005';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'El ID del usuario es requerido.' }, { status: 400 });
    }

    // 1. Obtener estudiante_id si existe
    const estRes = await fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${id}&select=id`, {
      headers: { 'Accept': 'application/json' }
    });
    const estData = await estRes.json();
    const estudianteId = estData.length > 0 ? estData[0].id : null;

    if (estudianteId) {
      // 2. Borrar bitácoras de actividades
      const pracRes = await fetch(`${POSTGREST}/practicas_proyectos?estudiante_id=eq.${estudianteId}&select=id`, {
        headers: { 'Accept': 'application/json' }
      });
      const pracData = await pracRes.json();
      for (const prac of pracData) {
        await fetch(`${POSTGREST}/bitacoras_actividades?practica_proyecto_id=eq.${prac.id}`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });
      }

      // 3. Borrar proyectos de prácticas
      await fetch(`${POSTGREST}/practicas_proyectos?estudiante_id=eq.${estudianteId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });

      // 4. Borrar expedientes de titulación
      await fetch(`${POSTGREST}/expedientes_titulacion?estudiante_id=eq.${estudianteId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });

      // 5. Borrar matrículas
      await fetch(`${POSTGREST}/matriculas?estudiante_id=eq.${estudianteId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });

      // 6. Borrar suficiencia de inglés
      await fetch(`${POSTGREST}/suficiencia_ingles?estudiante_id=eq.${estudianteId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });

      // 7. Borrar estudiante
      await fetch(`${POSTGREST}/estudiantes?id=eq.${estudianteId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
    }

    // 8. Reasignar o borrar registros dependientes del docente si corresponde
    // Si era tutor docente, le reasignamos a otro docente o al admin principal
    // (Por ejemplo, al admin con ID 7023ad4a-94a9-4853-87fb-d8db4f0b5853)
    await fetch(`${POSTGREST}/practicas_proyectos?tutor_docente_id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutor_docente_id: '7023ad4a-94a9-4853-87fb-d8db4f0b5853' })
    });

    // 9. Borrar importaciones de excel asociadas al usuario
    await fetch(`${POSTGREST}/importaciones_excel?usuario_id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });

    // 10. Borrar roles del usuario
    await fetch(`${POSTGREST}/usuario_roles?usuario_id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });

    // 11. Borrar usuario final
    const deleteRes = await fetch(`${POSTGREST}/usuarios?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });

    if (!deleteRes.ok) {
      return NextResponse.json({ error: 'Error al eliminar el usuario de la base de datos.' }, { status: 502 });
    }

    return NextResponse.json({ message: 'Usuario y sus dependencias eliminados con éxito.' }, { status: 200 });

  } catch (err) {
    console.error('[DELETE USER ERROR]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
