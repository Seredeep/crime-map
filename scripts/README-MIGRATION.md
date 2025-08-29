# Script de Migración MongoDB a Firestore

Este script migra los chats y mensajes de MongoDB a Firestore para el sistema de mensajería en tiempo real.

## 📋 Prerrequisitos

### 1. Variables de Entorno
Asegúrate de tener configuradas las siguientes variables en tu archivo `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/crime-map
MONGODB_DB=crime-map

# Firebase
FIREBASE_PROJECT_ID=tu-proyecto-firebase
```

### 2. Configuración de Firebase
Para que Firebase Admin SDK funcione, necesitas configurar las credenciales. Tienes tres opciones:

#### Opción A: Usar Application Default Credentials (Recomendado para desarrollo local)
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Configurar el proyecto
firebase use tu-proyecto-firebase
```

#### Opción B: Usar Service Account Key via Variable de Entorno (Recomendado para producción)
Esta es la opción más segura y flexible para despliegues en la nube:

1. Ve a Firebase Console > Project Settings > Service Accounts
2. Genera una nueva clave privada (descarga el archivo JSON)
3. Convierte el archivo JSON a Base64:
   ```bash
   # Ejecuta el script de conversión incluido
   node scripts/convert-service-account-to-base64.js
   ```
4. Copia el valor Base64 generado y configúralo como variable de entorno:
   ```env
   FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
   FIREBASE_PROJECT_ID=tu-proyecto-firebase
   ```

#### Opción C: Usar Service Account Key como archivo (Compatibilidad hacia atrás)
1. Ve a Firebase Console > Project Settings > Service Accounts
2. Genera una nueva clave privada
3. Guarda el archivo JSON como `service-account-key.json` en la raíz del proyecto
4. El sistema automáticamente usará este archivo si no encuentra la variable de entorno

## 🚀 Uso

### Instalar dependencias (si no están instaladas)
```bash
cd scripts
npm install firebase-admin mongodb dotenv ts-node @types/node
```

### Ejecutar la migración
```bash
# Desde la raíz del proyecto
npx ts-node scripts/migrateChatsToFirestore.ts

# O desde la carpeta scripts
npx ts-node migrateChatsToFirestore.ts
```

## 📊 Estructura de Datos

### MongoDB (Origen)
```javascript
// Colección: chats
{
  _id: ObjectId,
  neighborhood: string,
  participants: string[],
  lastMessage?: string,
  lastMessageAt?: Date,
  createdAt?: Date,
  updatedAt?: Date
}

// Colección: messages
{
  _id: ObjectId,
  chatId: ObjectId,
  userId: string,
  userName: string,
  message: string,
  timestamp: Date,
  type?: 'normal' | 'panic',
  metadata?: any
}
```

### Firestore (Destino)
```javascript
// Documento: /chats/{chatId}
{
  neighborhood: string,
  participants: string[],
  lastMessage?: string,
  lastMessageAt?: Timestamp,
  createdAt?: Timestamp,
  updatedAt?: Timestamp
}

// Subcolección: /chats/{chatId}/messages/{messageId}
{
  message: string,
  timestamp: Timestamp,
  type: 'normal' | 'panic',
  userId: string,
  userName: string,
  metadata?: any
}
```

## ✅ Características del Script

- **Idempotente**: Puedes ejecutarlo múltiples veces sin duplicar datos
- **Logging detallado**: Muestra progreso en tiempo real
- **Manejo de errores**: Continúa con el siguiente elemento si hay errores
- **Resumen final**: Estadísticas completas de la migración
- **Validación**: Verifica que las variables de entorno estén configuradas

## 🔧 Solución de Problemas

### Error: "FIREBASE_PROJECT_ID no está definida"
- Verifica que la variable esté en `.env.local`
- Asegúrate de que el archivo esté en la raíz del proyecto

### Error: "Application Default Credentials not found"
- Ejecuta `firebase login` y `firebase use tu-proyecto`
- O configura un service account key

### Error de conexión a MongoDB
- Verifica que `MONGODB_URI` sea correcta
- Asegúrate de que MongoDB esté ejecutándose

### Error de permisos en Firestore
- Verifica que las reglas de Firestore permitan escritura
- Asegúrate de que el service account tenga permisos adecuados

## 📝 Notas Importantes

- El script solo migra **chats** y **mensajes**
- **No migra usuarios ni barrios** (como solicitado)
- Los timestamps se convierten automáticamente al formato de Firestore
- Si un chat o mensaje ya existe en Firestore, se omite
- El script es seguro para ejecutar múltiples veces

## 🎯 Resultado Esperado

Después de la migración exitosa, verás algo como:

```
📊 RESUMEN DE MIGRACIÓN:
📝 Chats migrados: 5
⏭️  Chats omitidos: 0
💬 Mensajes migrados: 127
⏭️  Mensajes omitidos: 0
📊 Total de mensajes procesados: 127

🎉 ¡Migración completada exitosamente!
