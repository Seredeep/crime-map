import { createSupabaseServerClient } from '@/lib/config/db/supabaseServer';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

// Definir el bucket para archivos del chat
const CHAT_MEDIA_BUCKET = 'chat-media';

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
      audio: ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/webm'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/rtf']
    };

    if (!allowedMimeTypes[type as keyof typeof allowedMimeTypes].includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    // Crear cliente de Supabase
    const supabase = createSupabaseServerClient();

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'bin';
    const fileName = `${type}_${timestamp}_${uniqueId}.${fileExtension}`;

    // Ruta en Supabase Storage - organizado por tipo y usuario
    const filePath = `${type}/${session.user.id}/${fileName}`;

    // Convertir File a Buffer para Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CHAT_MEDIA_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
        metadata: {
          originalName: file.name,
          uploadedBy: session.user.email,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
          fileType: type
        }
      });

    if (uploadError) {
      console.error('Error al subir archivo a Supabase:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir archivo' },
        { status: 500 }
      );
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from(CHAT_MEDIA_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Para archivos de audio, intentar obtener duración si es posible
    let duration = null;
    if (type === 'audio') {
      try {
        // Crear un blob temporal para analizar el audio
        const audioBlob = new Blob([buffer], { type: file.type });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Esperar a que se cargue el metadata del audio
        await new Promise((resolve, reject) => {
          audio.addEventListener('loadedmetadata', resolve);
          audio.addEventListener('error', reject);
          audio.load();
        });

        duration = audio.duration;
        URL.revokeObjectURL(audioUrl);
      } catch (error) {
        console.warn('No se pudo obtener la duración del audio:', error);
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      duration: duration,
      storagePath: filePath
    });

  } catch (error) {
    console.error('Error al subir archivo multimedia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

