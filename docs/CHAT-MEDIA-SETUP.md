# Configuración del Sistema de Medios del Chat

## 🎯 Descripción

Este documento explica cómo configurar el sistema de medios del chat para usar Supabase Storage, manteniendo consistencia con el resto de la aplicación que ya usa Supabase para fotos de perfil y evidencias de incidentes.

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Route      │    │   Supabase      │
│   (Chat)        │───▶│   /upload-media  │───▶│   Storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Buckets de Supabase

La aplicación usa los siguientes buckets organizados por funcionalidad:

- **`profile-images`** - Fotos de perfil de usuarios
- **`incident-evidence`** - Evidencias de incidentes
- **`chat-media`** - Archivos multimedia del chat (imágenes, videos, audio, documentos)

## 🚀 Configuración

### 1. Variables de Entorno

Asegúrate de tener estas variables configuradas en tu `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 2. Crear el Bucket de Chat (Opcional)

Si quieres crear el bucket manualmente, ejecuta:

```bash
node scripts/setup-chat-storage.js
```

O crea el bucket manualmente en el dashboard de Supabase:

- **Nombre**: `chat-media`
- **Público**: ✅ Sí
- **Límite de archivo**: 50MB
- **Tipos MIME permitidos**: Imágenes, Videos, Audio, Documentos

### 3. Estructura de Archivos

Los archivos se organizan automáticamente en Supabase:

```
chat-media/
├── image/
│   └── {userId}/
│       └── image_{timestamp}_{uniqueId}.{ext}
├── video/
│   └── {userId}/
│       └── video_{timestamp}_{uniqueId}.{ext}
├── audio/
│   └── {userId}/
│       └── audio_{timestamp}_{uniqueId}.{ext}
└── document/
    └── {userId}/
        └── document_{timestamp}_{uniqueId}.{ext}
```

## 🔧 Funcionalidades

### Subida de Archivos

- **Imágenes**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, WebM, OGG, QuickTime
- **Audio**: WAV, MP3, OGG, M4A, WebM
- **Documentos**: PDF, Word, TXT, RTF

### Características Especiales

- **Detección automática de duración** para archivos de audio
- **Organización por usuario** para mejor gestión
- **URLs públicas** para acceso directo
- **Metadata completo** con información del archivo

## 📱 Uso en el Chat

### Enviar Audio

```typescript
const handleAudioSend = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('type', 'audio');

  const response = await fetch('/api/chat/upload-media', {
    method: 'POST',
    body: formData,
  });

  // El audio se sube a Supabase y se devuelve la URL
};
```

### Enviar Otros Medios

```typescript
const handleMediaSelect = async (file: File, type: 'image' | 'video' | 'document') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await fetch('/api/chat/upload-media', {
    method: 'POST',
    body: formData,
  });
};
```

## 🛡️ Seguridad

- **Autenticación requerida** para todas las subidas
- **Validación de tipos MIME** para prevenir archivos maliciosos
- **Límite de tamaño** de 50MB por archivo
- **Organización por usuario** para aislamiento de datos

## 🔍 Monitoreo

### Logs del Servidor

```bash
# Subida exitosa
✅ Audio uploaded successfully: { url: "...", duration: 15.5 }

# Errores
❌ Error al subir archivo a Supabase: { message: "..." }
```

### Dashboard de Supabase

- Ve todos los archivos en **Storage > chat-media**
- Monitorea el uso de almacenamiento
- Revisa los logs de acceso

## 🚨 Solución de Problemas

### Error: "Bucket no encontrado"

```bash
# Ejecuta el script de configuración
node scripts/setup-chat-storage.js
```

### Error: "No autorizado"

- Verifica que las variables de entorno estén configuradas
- Asegúrate de que el usuario esté autenticado
- Revisa que el `SUPABASE_SERVICE_ROLE_KEY` sea correcto

### Error: "Tipo de archivo no permitido"

- Verifica que el archivo sea de un tipo MIME válido
- Revisa la lista de tipos permitidos en el código

## 📈 Optimizaciones Futuras

- [ ] Compresión automática de imágenes
- [ ] Conversión de formatos de audio/video
- [ ] Cache de archivos frecuentemente accedidos
- [ ] Limpieza automática de archivos antiguos
- [ ] Backup automático a otro servicio

## 🔗 Enlaces Útiles

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [API de Storage](https://supabase.com/docs/reference/javascript/storage-createbucket)
- [Dashboard de Supabase](https://app.supabase.com)

