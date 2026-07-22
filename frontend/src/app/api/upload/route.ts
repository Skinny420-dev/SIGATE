import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Guardar en la carpeta public/uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Evitar colisiones de nombres añadiendo timestamp
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({ 
      success: true, 
      url: `/uploads/${fileName}`,
      name: file.name
    });
  } catch (error: any) {
    console.error('Error al guardar archivo:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el archivo.' }, { status: 500 });
  }
}
