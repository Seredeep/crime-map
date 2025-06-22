# Sistema de Chat - Documentación Técnica

## Introducción

El sistema de chat de la aplicación Crime Map está diseñado para permitir comunicación en tiempo real entre vecinos de un mismo barrio. Utiliza una arquitectura híbrida que combina WebSockets para comunicación en tiempo real con polling HTTP como fallback, además de un sistema de caché inteligente para optimizar el rendimiento.

## Arquitectura General

### Componentes Principales

1. **Frontend (React/Next.js)**
   - Componentes de UI para chat móvil y desktop
   - Hooks personalizados para manejo de estado
   - Sistema de caché local (localStorage)
   - Cliente WebSocket

2. **Backend (Node.js/Next.js API)**
   - Servidor WebSocket (Socket.IO)
   - APIs REST para operaciones CRUD
   - Integración con MongoDB
   - Sistema de autenticación

3. **Base de Datos (MongoDB)**
   - Colección `chats`: Información de chats por barrio
   - Colección `messages`: Mensajes del chat
   - Colección `users`: Usuarios y su asignación a chats

## Flujo de Funcionamiento

### 1. Asignación de Usuarios a Chats

```
Usuario completa onboarding →
Calcula barrio basado en blockNumber/lotNumber →
Busca chat existente para el barrio →
Si no existe, crea nuevo chat →
Asigna usuario al chat
```

### 2. Conexión al Chat

```
Usuario accede al chat →
Intenta conectar WebSocket →
Si falla, usa polling HTTP →
Carga mensajes desde caché →
Sincroniza con servidor →
Actualiza caché local
```

### 3. Envío de Mensajes

```
Usuario escribe mensaje →
Valida contenido →
Envía via WebSocket (o HTTP) →
Servidor valida permisos →
Guarda en MongoDB →
Broadcast a participantes →
Actualiza caché local
```

## Implementación Técnica

### WebSockets (Socket.IO)

El sistema utiliza Socket.IO para comunicación bidireccional en tiempo real:

#### Eventos del Cliente

- `chat:join`: Unirse a un chat específico
- `chat:leave`: Salir de un chat
- `message:send`: Enviar mensaje normal
- `panic:send`: Enviar mensaje de pánico
- `chat:typing`: Indicar que está escribiendo
- `chat:stop-typing`: Dejar de escribir

#### Eventos del Servidor

- `message:new`: Nuevo mensaje recibido
- `panic:alert`: Alerta de pánico recibida
- `chat:user-joined`: Usuario se unió al chat
- `chat:user-left`: Usuario salió del chat
- `chat:typing`: Alguien está escribiendo
- `message:error`: Error en operación

### Sistema de Caché

El sistema implementa un caché inteligente en localStorage:

#### Características

- **Límite de tamaño**: 50MB máximo
- **Expiración**: 24 horas
- **Limpieza automática**: Cada 6 horas
- **Límite por chat**: 500 mensajes máximo
- **Estrategia LRU**: Elimina entradas menos usadas

#### Funcionamiento

1. **Carga inicial**: Intenta cargar desde caché primero
2. **Sincronización**: Actualiza con datos del servidor
3. **Nuevos mensajes**: Agrega al caché existente
4. **Limpieza**: Elimina datos expirados automáticamente

### Polling como Fallback

Cuando WebSockets no están disponibles:

- **Intervalo**: 3 segundos por defecto
- **Incremental**: Solo obtiene mensajes nuevos
- **Eficiente**: Usa `lastMessageId` para optimizar

## Estructura de Datos

### Mensaje

```typescript
interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'panic';
  isOwn: boolean;
  metadata: Record<string, any>;
}
```

### Chat

```typescript
interface Chat {
  _id: string;
  neighborhood: string;
  participants: string[];
  createdAt: Date;
  updatedAt?: Date;
}
```

### Usuario

```typescript
interface User {
  _id: string;
  email: string;
  name: string;
  neighborhood: string;
  chatId: string;
  blockNumber: number;
  lotNumber: number;
}
```

## Seguridad

### Validaciones

1. **Autenticación**: Verificación de sesión en cada operación
2. **Autorización**: Usuario debe pertenecer al chat
3. **Validación de datos**: Sanitización de mensajes
4. **Rate limiting**: Control de frecuencia de mensajes

### Permisos

- Solo miembros del barrio pueden acceder al chat
- Verificación en cada operación (envío, lectura)
- Validación cruzada entre `users` y `chats`

## Optimizaciones

### Rendimiento

1. **Caché local**: Reduce carga del servidor
2. **Polling incremental**: Solo nuevos mensajes
3. **Paginación**: Carga mensajes por lotes
4. **Compresión**: Minimiza datos transferidos

### Escalabilidad

1. **Salas por barrio**: Aislamiento de tráfico
2. **Índices de BD**: Consultas optimizadas
3. **Conexiones persistentes**: Reutilización de WebSockets
4. **Limpieza automática**: Gestión de memoria

## Manejo de Errores

### Reconexión Automática

- **Intentos**: Máximo 5 intentos
- **Backoff exponencial**: Delay incremental
- **Fallback**: Cambio automático a polling

### Estados de Error

1. **Sin conexión**: Modo offline con caché
2. **Error de autenticación**: Redirección a login
3. **Chat no encontrado**: Reasignación automática
4. **Mensaje fallido**: Reintento automático

## Monitoreo y Logs

### Métricas Importantes

- Conexiones WebSocket activas
- Mensajes enviados/recibidos por minuto
- Errores de conexión
- Uso de caché (hit/miss ratio)

### Logs de Diagnóstico

- Conexiones/desconexiones
- Errores de envío de mensajes
- Operaciones de caché
- Cambios de estado de conexión

## Casos de Uso Especiales

### Mensajes de Pánico

- **Prioridad alta**: Procesamiento inmediato
- **Metadata especial**: Incluye ubicación
- **Notificación especial**: Alerta diferenciada
- **Persistencia**: Guardado con flag especial

### Indicadores de Escritura

- **Tiempo real**: Via WebSocket únicamente
- **Timeout**: Auto-limpieza después de inactividad
- **Optimización**: No se persiste en BD

### Modo Offline

- **Caché local**: Mensajes disponibles offline
- **Sincronización**: Al recuperar conexión
- **Indicador visual**: Estado de conexión visible

## Consideraciones de Desarrollo

### Testing

1. **Unit tests**: Funciones individuales
2. **Integration tests**: Flujo completo
3. **E2E tests**: Interfaz de usuario
4. **Load tests**: Rendimiento bajo carga

### Deployment

1. **Variables de entorno**: Configuración por ambiente
2. **Health checks**: Monitoreo de servicios
3. **Rollback**: Estrategia de reversión
4. **Scaling**: Escalado horizontal

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
