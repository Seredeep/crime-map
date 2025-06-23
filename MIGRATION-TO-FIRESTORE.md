# Migración de WebSockets a Firestore

## 📋 Resumen

Este documento describe la migración del sistema de chat de WebSockets (Socket.IO) a Firebase Firestore para compatibilidad con Vercel serverless.

## 🎯 Motivación

- **Problema**: Vercel es serverless y no soporta WebSockets persistentes
- **Solución**: Firebase Firestore con listeners en tiempo real
- **Beneficios**:
  - ✅ Compatible con Vercel
  - ✅ Tiempo real nativo
  - ✅ Escalable automáticamente
  - ✅ Offline support
  - ✅ Menor complejidad de infraestructura

## 🏗️ Arquitectura Nueva

### **Arquitectura Híbrida**
- **Firestore**: Mensajes en tiempo real, indicadores de escritura
- **MongoDB**: Usuarios, chats, estadísticas (sin cambios)

### **Flujo de Datos**
```
Usuario → useFirestoreChat → FirestoreChatService → Firestore
                ↓
    Tiempo real ← onSnapshot ← Firestore Collections
```

## 📁 Archivos Creados/Modificados

### **Nuevos Archivos**
- `src/lib/firebase.ts` - Configuración de Firebase
- `src/lib/firestoreChatService.ts` - Servicio de chat con Firestore
- `src/lib/hooks/useFirestoreChat.ts` - Hook React para el chat
- `src/app/api/chat/firestore/send/route.ts` - API para enviar mensajes

### **Archivos Modificados**
- `src/app/components/MobileFullScreenChatView.tsx` - Actualizado para usar Firestore

### **Archivos Deprecados (conservados para compatibilidad)**
- `src/lib/socket.ts` - WebSocket service (legacy)
- `src/lib/hooks/useChatMessages.ts` - Hook con WebSockets (legacy)
- `src/app/api/socket/route.ts` - Socket.IO server (legacy)

## 🔧 Configuración Requerida

### **Variables de Entorno**
Agregar a tu archivo `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Opcional: Emulador Firebase (desarrollo)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

### **Reglas de Firestore**
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

## 📊 Estructura de Datos en Firestore

### **Colección: `messages`**
```typescript
{
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Timestamp;
  type: 'normal' | 'panic';
  metadata: {
    location?: { lat: number; lng: number };
    priority?: string;
    alertType?: string;
  }
}
```

### **Colección: `typing`**
```typescript
{
  chatId: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  isTyping: boolean;
}
```

### **Colección: `chat_stats`**
```typescript
{
  chatId: string;
  lastMessage: string;
  lastMessageBy: string;
  lastMessageAt: Timestamp;
  messageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🚀 Cómo Usar

### **En Componentes React**
```typescript
import { useFirestoreChat } from '@/lib/hooks/useFirestoreChat';

const ChatComponent = () => {
  const {
    chatData,
    typingUsers,
    isConnected,
    error,
    sendMessage,
    sendPanicMessage,
    startTyping,
    stopTyping
  } = useFirestoreChat();

  const handleSendMessage = async (message: string) => {
    const success = await sendMessage(message);
    if (!success) {
      console.error('Error enviando mensaje');
    }
  };

  return (
    <div>
      {chatData.messages.map(message => (
        <div key={message.id}>
          {message.userName}: {message.message}
        </div>
      ))}
    </div>
  );
};
```

### **Envío Directo via API**
```typescript
const response = await fetch('/api/chat/firestore/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hola vecinos!',
    type: 'normal'
  })
});
```

## 🔄 Plan de Migración

### **Fase 1: Preparación** ✅
- [x] Configurar Firebase
- [x] Crear servicios de Firestore
- [x] Crear nuevos hooks
- [x] Crear APIs de Firestore

### **Fase 2: Migración Gradual**
- [ ] Actualizar componentes principales
- [ ] Migrar mensajes de pánico
- [ ] Actualizar componentes móviles
- [ ] Testing exhaustivo

### **Fase 3: Limpieza**
- [ ] Remover dependencias de Socket.IO
- [ ] Limpiar código legacy
- [ ] Actualizar documentación
- [ ] Deploy a producción

## 🧪 Testing

### **Tests Locales**
1. Configurar Firebase Emulator (opcional)
2. Probar envío de mensajes
3. Verificar tiempo real
4. Probar indicadores de escritura
5. Verificar mensajes de pánico

### **Tests de Producción**
1. Deploy a Vercel
2. Verificar funcionamiento en serverless
3. Probar con múltiples usuarios
4. Verificar performance

## 🔧 Troubleshooting

### **Error: Firebase no inicializado**
- Verificar variables de entorno
- Comprobar configuración en `firebase.ts`

### **Error: Permisos de Firestore**
- Verificar reglas de seguridad
- Comprobar autenticación del usuario

### **Mensajes no aparecen en tiempo real**
- Verificar listeners de Firestore
- Comprobar conexión a internet
- Revisar consola del navegador

## 📈 Ventajas de la Nueva Arquitectura

### **Performance**
- ⚡ Tiempo real nativo sin polling
- 📱 Optimizado para móviles
- 🔄 Sincronización automática offline/online

### **Escalabilidad**
- 🚀 Auto-scaling de Firebase
- 💰 Costo basado en uso
- 🌍 CDN global automático

### **Mantenimiento**
- 🛠️ Menos infraestructura que mantener
- 🔒 Seguridad manejada por Firebase
- 📊 Analytics integrados

## 🚨 Consideraciones

### **Costos**
- Firebase cobra por operaciones de lectura/escritura
- Estimar ~1000-5000 operaciones por usuario activo/día
- Costo estimado: $1-5 USD por 100,000 operaciones

### **Limitaciones**
- Máximo 1MB por documento
- 500 campos por documento
- 1 escritura por segundo por documento

### **Migración de Datos**
- Los mensajes existentes en MongoDB se mantienen
- Nuevos mensajes van a Firestore
- Posible script de migración histórica (opcional)

## 📞 Soporte

Para dudas sobre la migración:
1. Revisar este documento
2. Consultar documentación de Firebase
3. Revisar logs de la aplicación
4. Contactar al equipo de desarrollo
