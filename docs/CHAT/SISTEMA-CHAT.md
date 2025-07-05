# Sistema de Chat - Documentación Técnica

## Introducción

El sistema de chat de la aplicación Crime Map está diseñado para permitir comunicación en tiempo real entre vecinos de un mismo barrio. **Utiliza exclusivamente Firestore para la gestión de mensajes y estados en tiempo real**, lo que garantiza una experiencia de usuario fluida y eficiente.

## Arquitectura General

### Componentes Principales

1.  **Frontend (React/Next.js)**
    - Componentes de UI para chat móvil y desktop
    - Hooks personalizados para manejo de estado
    - Sistema de caché local (localStorage)

2.  **Backend (Node.js/Next.js API)**
    - APIs REST para operaciones CRUD relacionadas con usuarios e incidentes (MongoDB)
    - APIs REST para operaciones de chat que interactúan con Firestore
    - Sistema de autenticación

3.  **Base de Datos**
    - **Firestore**:
        - Colección `chats`: Información de chats por barrio, incluyendo `lastMessage` y `lastMessageAt`.
        - Subcolección `messages` dentro de cada chat: Mensajes del chat.
        - Subcolección `onlineUsers` dentro de cada chat: Estado de usuarios online.
        - Subcolección `typingUsers` dentro de cada chat: Indicadores de escritura.
        - Colección `panic_alerts`: Registros de alertas de pánico.
    - **MongoDB**:
        - Colección `users`: Usuarios y su asignación a chats (compartido con Firestore).
        - Colección `incidents`: Información de incidentes (no relacionada con el chat).

## Flujo de Funcionamiento

### 1. Asignación de Usuarios a Chats

```
Usuario completa onboarding →
Calcula barrio basado en blockNumber/lotNumber →
Busca chat existente para el barrio en Firestore →
Si no existe, crea nuevo chat en Firestore →
Asigna usuario al chat en Firestore y actualiza el campo `chatId` en el documento del usuario en Firestore y MongoDB.
```

### 2. Conexión al Chat

```
Usuario accede al chat →
El servicio de chat establece un oyente en tiempo real de Firestore para los mensajes del chat, y para los estados de usuarios online y de escritura. →
Carga mensajes iniciales desde caché →
Las actualizaciones de Firestore notifican al frontend en tiempo real →
Actualiza caché local.
```

### 3. Envío de Mensajes

```
Usuario escribe mensaje →
Valida contenido →
Envía via API REST al backend →
Backend valida permisos →
Guarda el mensaje en la subcolección `messages` del chat correspondiente en Firestore. →
Actualiza el `lastMessage` y `lastMessageAt` en el documento del chat principal en Firestore. →
Los oyentes de Firestore notifican a todos los participantes en tiempo real. →
Actualiza caché local.
```

## Implementación Técnica

### Firestore Listeners (Tiempo Real)

El sistema utiliza los oyentes de Firestore (onSnapshot) para comunicación bidireccional en tiempo real para mensajes, y para estados de usuarios online y de escritura:

#### Flujo de Datos

- `firestore.collection('chats').doc(chatId).collection('messages').onSnapshot(...)`: Oyente para nuevos mensajes.
- `firestore.collection('chats').doc(chatId).collection('onlineUsers').onSnapshot(...)`: Oyente para el estado de usuarios online.
- `firestore.collection('chats').doc(chatId).collection('typingUsers').onSnapshot(...)`: Oyente para los indicadores de escritura.

### Sistema de Caché

El sistema implementa un caché inteligente en localStorage para optimizar la carga inicial y reducir lecturas redundantes de Firestore:

#### Características

-   **Límite de tamaño**: 50MB máximo
-   **Expiración**: 24 horas para mensajes, 5 minutos para información del chat.
-   **Limpieza automática**: Cada 5 minutos.
-   **Límite por chat**: 500 mensajes máximo.
-   **Estrategia LRU**: Elimina entradas menos usadas.

#### Funcionamiento

1.  **Carga inicial**: Intenta cargar desde caché primero.
2.  **Sincronización**: Las actualizaciones de Firestore sobrescriben o agregan datos al caché.
3.  **Nuevos mensajes**: Agrega al caché existente.
4.  **Limpieza**: Elimina datos expirados automáticamente.

### Persistencia de Datos

Los datos de chat (mensajes, estados online, indicadores de escritura, información de chat) se persisten en Firestore. Los datos de usuario se persisten en MongoDB y Firestore de forma sincronizada. Los incidentes se mantienen en MongoDB.

## Estructura de Datos

### Mensaje

```typescript
interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'panic';
  isOwn?: boolean;
  metadata?: Record<string, any>;
}
```

### Chat

```typescript
interface Chat {
  _id: string; // Corresponde al ID del documento de Firestore
  neighborhood: string;
  participants: string[]; // Array de user IDs de Firestore
  lastMessage?: string; // Último mensaje enviado
  lastMessageAt?: Date; // Fecha del último mensaje
  createdAt: Date;
  updatedAt?: Date;
}
```

### Usuario

```typescript
interface User {
  _id: string; // ID del documento en MongoDB y Firestore (sincronizado)
  email: string;
  name?: string;
  surname?: string;
  blockNumber?: number;
  lotNumber?: number;
  neighborhood?: string;
  chatId?: string; // ID del chat de barrio en Firestore
  onboarded: boolean;
  profileImage?: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

### Panic Alert (Firestore)

```typescript
interface PanicAlert {
  _id: string; // ID del documento de Firestore
  userId: string;
  userEmail: string;
  userName: string;
  neighborhood: string;
  chatId?: string;
  blockNumber?: number;
  lotNumber?: number;
  timestamp: Date;
  location?: { lat: number; lng: number }; // Objeto de ubicación si está disponible
  address?: string; // Dirección legible si está disponible
  status: 'active' | 'resolved';
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}
```

## Seguridad

### Validaciones

1.  **Autenticación**: Verificación de sesión en cada operación.
2.  **Autorización**: Usuario debe pertenecer al chat.
3.  **Validación de datos**: Sanitización de mensajes.

### Permisos

-   Solo miembros del barrio pueden acceder al chat.
-   Verificación en cada operación (envío, lectura).
-   Validación cruzada entre `users` y `chats` en Firestore.

## Optimizaciones

### Rendimiento

1.  **Caché local**: Reduce carga del servidor y lecturas de Firestore.
2.  **Oyentes en tiempo real de Firestore**: Actualizaciones instantáneas sin polling.
3.  **Paginación**: Carga mensajes por lotes (para historial si es necesario).
4.  **Uso eficiente de índices de Firestore**: Consultas optimizadas.

### Escalabilidad

1.  **Salas por barrio**: Utilizando documentos de chat en Firestore para agrupar mensajes.
2.  **Índices de BD**: Consultas optimizadas en Firestore y MongoDB.
3.  **Conexiones persistentes**: Los oyentes de Firestore mantienen una conexión abierta y eficiente.
4.  **Limpieza automática**: Gestión de memoria en el cliente.

## Manejo de Errores

### Reconexión Automática

-   Los oyentes de Firestore manejan automáticamente la reconexión y la sincronización de datos.

### Estados de Error

1.  **Sin conexión**: Modo offline con caché.
2.  **Error de autenticación**: Redirección a login.
3.  **Chat no encontrado**: Reasignación automática.
4.  **Mensaje fallido**: Reintento o notificación al usuario.

## Monitoreo y Logs

### Métricas Importantes

-   Conexiones de oyentes de Firestore activas.
-   Mensajes enviados/recibidos (vía API y Firestore).
-   Errores de conexión/Firestore.
-   Uso de caché (hit/miss ratio).

### Logs de Diagnóstico

-   Conexiones/desconexiones de oyentes de Firestore.
-   Errores de envío de mensajes.
-   Operaciones de caché.
-   Cambios de estado de conexión con Firestore.

## Casos de Uso Especiales

### Mensajes de Pánico

-   **Prioridad alta**: Procesamiento inmediato.
-   **Metadata especial**: Incluye ubicación.
-   **Notificación especial**: Alerta diferenciada (gestionada por los oyentes de Firestore).
-   **Persistencia**: Guardado en subcolección `messages` del chat y en la colección `panic_alerts` en Firestore.

### Indicadores de Escritura

-   **Tiempo real**: Gestionado por la subcolección `typingUsers` en Firestore.
-   **Timeout**: Auto-limpieza después de inactividad (gestionada por Firestore y en el frontend).
-   **Optimización**: Se persiste temporalmente en Firestore.

### Modo Offline

-   **Caché local**: Mensajes disponibles offline.
-   **Sincronización**: Al recuperar conexión, Firestore sincroniza automáticamente los datos.
-   **Indicador visual**: Estado de conexión visible.

## Consideraciones de Desarrollo

### Testing

1.  **Unit tests**: Funciones individuales.
2.  **Integration tests**: Flujo completo con Firestore.
3.  **E2E tests**: Interfaz de usuario.
4.  **Load tests**: Rendimiento bajo carga.

### Deployment

Asegurar que las credenciales de Firestore estén configuradas correctamente en el entorno de despliegue.

## Futuras Mejoras

### Funcionalidades Planeadas

1. **Mensajes multimedia**: Imágenes y archivos
2. **Mensajes temporales**: Auto-eliminación
3. **Moderación**: Sistema de reportes
4. **Notificaciones push**: Alertas móviles

### Optimizaciones Técnicas

1. **CDN**: Distribución de contenido
2. **Clustering**: Múltiples instancias
3. **Redis**: Caché distribuido
4. **Microservicios**: Separación de responsabilidades
