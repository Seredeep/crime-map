# Sistema de Chat Barrial Automático

## 📋 Descripción General

Este sistema implementa un chat automático por barrios para la aplicación de seguridad ciudadana. Los usuarios son asignados automáticamente a chats barriales basados en su ubicación (número de manzana y lote).

## 🏗️ Arquitectura

### Colecciones de MongoDB

#### `users`
- `_id`: ObjectId del usuario
- `email`: Email único del usuario
- `name`: Nombre del usuario
- `surname`: Apellido del usuario
- `blockNumber`: Número de manzana
- `lotNumber`: Número de lote
- `neighborhood`: Nombre del barrio asignado (ej: "Barrio 0", "Barrio 1")
- `chatId`: ID del chat al que pertenece
- `onboarded`: Boolean indicando si completó el onboarding
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

#### `chats`
- `_id`: ObjectId del chat
- `neighborhood`: Nombre del barrio (ej: "Barrio 0", "Barrio 1")
- `participants`: Array de IDs de usuarios participantes
- `createdAt`: Fecha de creación del chat
- `updatedAt`: Fecha de última actualización

## 🔧 Funcionalidades Implementadas

### 1. Asignación Automática de Barrio

**Función:** `calculateNeighborhood(blockNumber, lotNumber)`
- **Lógica:** `Math.floor(blockNumber / 10)`
- **Ejemplo:**
  - Manzana 15 → Barrio 1
  - Manzana 25 → Barrio 2
  - Manzana 5 → Barrio 0

### 2. Gestión de Chats

**Función:** `assignUserToNeighborhood(userId, blockNumber, lotNumber)`
- Calcula el barrio del usuario
- Busca si existe un chat para ese barrio
- Si no existe, crea uno nuevo con el usuario como primer participante
- Si existe, agrega al usuario a la lista de participantes
- Actualiza el usuario con `neighborhood` y `chatId`

## 🛠️ API Endpoints

### POST `/api/user/onboarding`
**Descripción:** Endpoint existente actualizado para incluir asignación automática de chat.

**Body:**
```json
{
  "name": "Juan",
  "surname": "Pérez",
  "blockNumber": 15,
  "lotNumber": 3,
  "email": "juan@example.com"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Información de perfil actualizada correctamente",
  "data": {
    "neighborhood": "Barrio 1",
    "chatId": "507f1f77bcf86cd799439011"
  }
}
```

### GET `/api/chat/mine`
**Descripción:** Obtiene el chat del usuario logueado con todos sus participantes.

**Headers:** Requiere autenticación (session)

**Respuesta:**
```json
{
  "success": true,
  "message": "Chat obtenido exitosamente",
  "data": {
    "chatId": "507f1f77bcf86cd799439011",
    "neighborhood": "Barrio 1",
    "participantsCount": 3,
    "participants": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Juan",
        "surname": "Pérez",
        "email": "juan@example.com",
        "blockNumber": 15,
        "lotNumber": 3
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

### GET `/api/chat/participants?chatId={chatId}`
**Descripción:** Obtiene los participantes de un chat específico.

**Parámetros:**
- `chatId`: ID del chat

**Headers:** Requiere autenticación

**Respuesta:**
```json
{
  "success": true,
  "message": "Participantes obtenidos exitosamente",
  "data": {
    "chatId": "507f1f77bcf86cd799439011",
    "participantsCount": 3,
    "participants": [...]
  }
}
```

### POST `/api/chat/reassign`
**Descripción:** Reasigna un usuario a su chat correspondiente (útil para migración).

**Body:**
```json
{
  "userEmail": "juan@example.com",
  "forceReassign": false
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario asignado exitosamente",
  "data": {
    "userEmail": "juan@example.com",
    "userId": "507f1f77bcf86cd799439012",
    "neighborhood": "Barrio 1",
    "chatId": "507f1f77bcf86cd799439011"
  }
}
```

### GET `/api/chat/reassign`
**Descripción:** Lista usuarios que necesitan ser asignados a un chat.

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuarios sin chat obtenidos exitosamente",
  "data": {
    "count": 2,
    "users": [
      {
        "id": "507f1f77bcf86cd799439013",
        "email": "maria@example.com",
        "name": "María",
        "surname": "González",
        "blockNumber": 8,
        "lotNumber": 2,
        "currentNeighborhood": null,
        "currentChatId": null
      }
    ]
  }
}
```

## 🔄 Flujo de Trabajo

1. **Usuario completa onboarding:**
   - Se guarda información básica
   - Se calcula automáticamente el `neighborhood`
   - Se busca o crea el chat del barrio
   - Se agrega al usuario al chat
   - Se actualiza el usuario con `neighborhood` y `chatId`

2. **Usuario consulta su chat:**
   - Usa `/api/chat/mine` para obtener su chat y participantes
   - Puede usar `/api/chat/participants` para obtener solo los participantes

3. **Administración:**
   - Usar `/api/chat/reassign` GET para ver usuarios sin chat
   - Usar `/api/chat/reassign` POST para asignar usuarios manualmente

## 🚀 Uso en el Frontend

```javascript
// Obtener mi chat
const response = await fetch('/api/chat/mine');
const { data } = await response.json();

if (data) {
  console.log(`Perteneces al ${data.neighborhood}`);
  console.log(`Participantes: ${data.participantsCount}`);
  data.participants.forEach(participant => {
    console.log(`${participant.name} ${participant.surname} - Manzana ${participant.blockNumber}`);
  });
}
```

## 🔧 Personalización

Para cambiar la lógica de agrupación de barrios, modifica la función `calculateNeighborhood` en `/src/lib/chatService.ts`:

```typescript
export function calculateNeighborhood(blockNumber: number, lotNumber: number): string {
  // Ejemplo: Agrupar cada 5 manzanas
  const neighborhoodId = Math.floor(blockNumber / 5);
  return `Barrio ${neighborhoodId}`;

  // Ejemplo: Lógica más compleja considerando lotes
  // const zone = Math.floor(blockNumber / 10) * 100 + Math.floor(lotNumber / 5);
  // return `Zona ${zone}`;
}
```

## ⚠️ Consideraciones

1. **Seguridad:** Los endpoints verifican autenticación antes de mostrar información de chats
2. **Privacidad:** Solo se muestra información básica de los participantes
3. **Escalabilidad:** El sistema está diseñado para manejar múltiples barrios automáticamente
4. **Migración:** El endpoint `/api/chat/reassign` permite migrar usuarios existentes

## 🧪 Testing

Para probar el sistema:

1. Completa el onboarding de varios usuarios con diferentes `blockNumber`
2. Verifica que se asignen a barrios correctos
3. Usa `/api/chat/mine` para confirmar la asignación
4. Prueba con usuarios en el mismo rango de manzanas para verificar que se unan al mismo chat
