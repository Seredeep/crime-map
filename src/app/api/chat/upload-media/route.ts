import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image', 'video', 'audio', 'document'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo de archivo no válido' }, { status: 400 });
    }

    // Validar tamaño del archivo (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Archivo demasiado grande. Máximo 50MB' }, { status: 400 });
    }

    // Validar tipos MIME
    const allowedMimeTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
      audio: ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/rtf']
    };

    if (!allowedMimeTypes[type as keyof typeof allowedMimeTypes].includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    // Por ahora, simulamos la subida a Firebase Storage
    // En una implementación real, aquí se subiría el archivo a Firebase Storage
    // y se devolvería la URL de descarga
    
    // Simular URL temporal (esto se reemplazará con la implementación real)
    const mockUrl = `https://example.com/uploads/${Date.now()}_${file.name}`;
    
    // En una implementación real, aquí iría:
    // 1. Subir archivo a Firebase Storage
    // 2. Obtener URL de descarga
    // 3. Devolver la URL real

    return NextResponse.json({
      success: true,
      url: mockUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Error al subir archivo multimedia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

