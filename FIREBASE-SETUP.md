# 🔥 Configuración de Firebase para Crime Map

## ✅ Estado Actual

La migración de WebSockets a Firebase Firestore está **COMPLETADA**. La aplicación funciona tanto con Firebase configurado como sin configurar (modo demo).

## 🚀 Configuración de Firebase

### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Clic en "Crear un proyecto"
3. Nombre del proyecto: `crime-map-[tu-nombre]`
4. Habilita Google Analytics (opcional)
5. Selecciona tu cuenta de Analytics

### 2. Configurar Firestore Database

1. En el panel de Firebase, ve a **Firestore Database**
2. Clic en "Crear base de datos"
3. Selecciona "Iniciar en modo de prueba" (por ahora)
4. Elige la ubicación más cercana a tus usuarios

### 3. Configurar Reglas de Firestore

Ve a **Firestore Database > Reglas** y reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Mensajes: solo usuarios autenticados pueden leer/escribir
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }

    // Indicadores de escritura: solo usuarios autenticados
    match /typing/{typingId} {
      allow read, write: if request.auth != null;
    }

    // Estadísticas de chat: solo lectura para usuarios autenticados
    match /chat_stats/{chatId} {
      allow read: if request.auth != null;
      allow write: if false; // Solo el servidor puede escribir
    }
  }
}
```

### 4. Obtener Configuración

1. Ve a **Configuración del proyecto** (⚙️)
2. Selecciona la pestaña **General**
3. En "Tus apps", clic en **Web** (`</>`)
4. Registra tu app: `crime-map-web`
5. **NO** configures Firebase Hosting por ahora
6. Copia la configuración que aparece

### 5. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aquí
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Opcional: Emulador Firebase (desarrollo)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false

# Variables existentes (mantén las que ya tienes)
NEXTAUTH_SECRET=tu_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=tu_mongodb_uri
GOOGLE_MAPS_API_KEY=tu_google_maps_key
```

## 🧪 Probar la Configuración

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a `http://localhost:3000`

3. Abre las herramientas de desarrollador (F12)

4. Si ves estos mensajes, Firebase está funcionando:
   ```
   🚀 Iniciando suscripciones de Firestore...
   📨 Mensajes recibidos de Firestore: 0
   ```

5. Si ves este mensaje, está en modo demo:
   ```
   ⚠️ Firebase no configurado, usando mensajes vacíos
   ```

## 📊 Estructura de Datos en Firestore

### Colección: `messages`
```javascript
{
  id: "auto-generated",
  chatId: "neighborhood-chat-id",
  userId: "user-id",
  userName: "Nombre Usuario",
  message: "Contenido del mensaje",
  timestamp: Timestamp,
  type: "normal" | "panic",
  metadata: {
    location: { lat: -34.123, lng: -58.456 },
    priority: "high",
    alertType: "emergency"
  }
}
```

### Colección: `typing`
```javascript
{
  chatId: "neighborhood-chat-id",
  userId: "user-id",
  userName: "Nombre Usuario",
  timestamp: Timestamp,
  isTyping: true
}
```

### Colección: `chat_stats`
```javascript
{
  chatId: "neighborhood-chat-id",
  lastMessage: "Último mensaje...",
  lastMessageBy: "Nombre Usuario",
  lastMessageAt: Timestamp,
  messageCount: 42,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔧 Solución de Problemas

### Error: "Firebase no está configurado"
- Verifica que todas las variables de entorno estén en `.env.local`
- Reinicia el servidor después de agregar las variables
- Asegúrate de que `NEXT_PUBLIC_FIREBASE_PROJECT_ID` no sea "demo-project"

### Error: "Permission denied"
- Verifica que las reglas de Firestore estén configuradas correctamente
- Asegúrate de que el usuario esté autenticado con NextAuth

### Error: "Module not found @grpc/grpc-js"
- Este error ya está solucionado en `next.config.mjs`
- Si persiste, ejecuta: `npm install --save-dev @grpc/grpc-js`

## 🚀 Deploy a Producción

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Agrega las variables de entorno en el dashboard de Vercel
3. Deploy automático

### Otras Plataformas
- Firebase Hosting
- Netlify
- Railway

## 📈 Beneficios de la Migración

- ✅ **Tiempo real**: Mensajes instantáneos sin polling
- ✅ **Escalable**: Firebase maneja millones de usuarios
- ✅ **Offline**: Funciona sin conexión
- ✅ **Serverless**: Compatible con Vercel y otras plataformas
- ✅ **Seguro**: Reglas de seguridad integradas

## 🔄 Migración de Datos (Opcional)

Si tienes mensajes existentes en MongoDB, puedes migrarlos:

```javascript
// Script de migración (crear en scripts/migrate-to-firestore.js)
// TODO: Implementar migración de mensajes existentes
```

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa la consola del navegador para errores
2. Verifica que todas las variables de entorno estén correctas
3. Asegúrate de que Firestore esté habilitado en Firebase Console

¡La migración está completa y lista para usar! 🎉
