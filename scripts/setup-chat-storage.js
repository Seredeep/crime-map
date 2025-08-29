import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno para Supabase');
  console.log('Asegúrate de tener:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const CHAT_MEDIA_BUCKET = 'chat-media';

async function setupChatStorage() {
  try {
    console.log('🚀 Configurando bucket de chat-media en Supabase...');

    // Verificar si el bucket ya existe
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === CHAT_MEDIA_BUCKET);

    if (bucketExists) {
      console.log('✅ Bucket chat-media ya existe');
      return;
    }

    // Crear el bucket
    const { error } = await supabase.storage.createBucket(CHAT_MEDIA_BUCKET, {
      public: true, // Archivos públicamente accesibles
      fileSizeLimit: 52428800, // 50MB límite
      allowedMimeTypes: [
        // Imágenes
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        // Videos
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
        // Audio
        'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/webm',
        // Documentos
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/rtf'
      ]
    });

    if (error) {
      console.error('❌ Error creando bucket:', error);
      return;
    }

    console.log('✅ Bucket chat-media creado exitosamente');
    console.log('📁 Configuración:');
    console.log('   - Nombre: chat-media');
    console.log('   - Público: Sí');
    console.log('   - Límite de archivo: 50MB');
    console.log('   - Tipos MIME permitidos: Imágenes, Videos, Audio, Documentos');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
  }
}

// Ejecutar la configuración
setupChatStorage();

