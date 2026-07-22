import { NextResponse } from 'next/server';

const POSTGREST = process.env.POSTGREST_INTERNAL_URL ?? 'http://localhost:3005';

export async function POST(req: Request) {
  try {
    const { user_id, carrera_id, sigaFile, siauFile, subjects } = await req.json();

    if (!user_id || !subjects || subjects.length === 0) {
      return NextResponse.json({ error: 'Datos de matrícula incompletos.' }, { status: 400 });
    }

    // 1. Obtener el estudiante_id basado en el usuario_id
    const estRes = await fetch(`${POSTGREST}/estudiantes?usuario_id=eq.${user_id}&select=id`, {
      headers: { 'Accept': 'application/json' }
    });
    const estData = await estRes.json();
    if (!estData || estData.length === 0) {
      return NextResponse.json({ error: 'Estudiante no registrado.' }, { status: 404 });
    }
    const estudiante_id = estData[0].id;

    // 2. Obtener el periodo académico activo
    const perRes = await fetch(`${POSTGREST}/periodos_academicos?activo=eq.true&select=id`, {
      headers: { 'Accept': 'application/json' }
    });
    const perData = await perRes.json();
    const periodo_id = perData?.[0]?.id ?? 2; // Fallback al periodo 2 si no se halla

    // 3. Revisar si ya existe una matrícula para este estudiante y período
    const checkMatRes = await fetch(`${POSTGREST}/matriculas?estudiante_id=eq.${estudiante_id}&periodo_id=eq.${periodo_id}&select=id`, {
      headers: { 'Accept': 'application/json' }
    });
    const checkMatData = await checkMatRes.json();
    
    let matricula_id: string;

    if (checkMatData && checkMatData.length > 0) {
      // Caso: Modificación/Actualización de trámite existente devuelto para corrección
      matricula_id = checkMatData[0].id;
      
      const updateMatRes = await fetch(`${POSTGREST}/matriculas?id=eq.${matricula_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          estado: 'OFFICE_1', // Re-entra al flujo de revisión
          pdf_siga_url: sigaFile,
          pdf_no_adeudar_url: siauFile,
          actualizado_en: new Date().toISOString()
        })
      });

      if (!updateMatRes.ok) {
        return NextResponse.json({ error: 'Error al actualizar la solicitud de matrícula existente.' }, { status: 502 });
      }

      // Eliminar asignaturas seleccionadas anteriormente para registrar las nuevas de este semestre
      await fetch(`${POSTGREST}/matricula_detalle?matricula_id=eq.${matricula_id}`, {
        method: 'DELETE'
      });
    } else {
      // Caso: Creación de matrícula nueva
      const insertMatRes = await fetch(`${POSTGREST}/matriculas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          estudiante_id,
          periodo_id,
          estado: 'OFFICE_1',
          pdf_siga_url: sigaFile,
          pdf_no_adeudar_url: siauFile
        })
      });

      if (!insertMatRes.ok) {
        const err = await insertMatRes.json().catch(() => ({}));
        if (insertMatRes.status === 409 || err?.code === '23505') {
          return NextResponse.json({ error: 'El estudiante ya tiene una solicitud de matrícula para este periodo.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Error al registrar matrícula.' }, { status: 502 });
      }

      const [newMat] = await insertMatRes.json();
      matricula_id = newMat.id;
    }

    // 4. Registrar cada asignatura seleccionada en `matricula_detalle`
    for (const materia_id of subjects) {
      await fetch(`${POSTGREST}/matricula_detalle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matricula_id,
          materia_id: parseInt(materia_id, 10)
        })
      });
    }

    return NextResponse.json({ success: true, matricula_id });
  } catch (error) {
    console.error('[SUBMIT ENROLLMENT API ERROR]', error);
    return NextResponse.json({ error: 'Error interno al enviar la matrícula.' }, { status: 500 });
  }
}
