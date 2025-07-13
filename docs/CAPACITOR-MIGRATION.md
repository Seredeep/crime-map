# Migración a Capacitor - Claridad

## 📱 Resumen de la Migración

Claridad ha sido migrada exitosamente de una aplicación web Next.js a una aplicación híbrida usando **Capacitor**, lo que permite ejecutarla como aplicación nativa en Android e iOS.

## 🛠️ Cambios Realizados

### 1. Configuración de Capacitor
- ✅ Instalación de Capacitor CLI y dependencias
- ✅ Configuración de `capacitor.config.ts` con settings específicos de Claridad
- ✅ Configuración de colores y tema oscuro (#040910, #B5CCF4)

### 2. Configuración de Next.js
- ✅ Actualización de `next.config.mjs` para export estático
- ✅ Configuración de `output: 'export'` para generar archivos estáticos
- ✅ Optimización de imágenes con `unoptimized: true`

### 3. Plugins Nativos Instalados
- ✅ **@capacitor/geolocation** - Para ubicación GPS
- ✅ **@capacitor/camera** - Para tomar fotos de evidencia
- ✅ **@capacitor/status-bar** - Control de la barra de estado
- ✅ **@capacitor/keyboard** - Manejo del teclado virtual
- ✅ **@capacitor/app** - Control de la aplicación
- ✅ **@capacitor/splash-screen** - Pantalla de carga
- ✅ **@capacitor/local-notifications** - Notificaciones locales
- ✅ **@capacitor/push-notifications** - Notificaciones push

### 4. Plataformas Configuradas
- ✅ **Android** - Configurado en `/android`
- ✅ **iOS** - Configurado en `/ios`

### 5. Scripts de Build Actualizados
```json
{
  "export": "next build",
  "cap:build": "npm run export && npx cap sync",
  "cap:android": "npm run cap:build && npx cap open android",
  "cap:ios": "npm run cap:build && npx cap open ios",
  "cap:sync": "npx cap sync",
  "cap:run:android": "npm run cap:build && npx cap run android",
  "cap:run:ios": "npm run cap:build && npx cap run ios"
}
```

## 🚀 Comandos de Desarrollo

### Desarrollo Web (como antes)
```bash
npm run dev
```

### Build para Móvil
```bash
# Generar archivos estáticos y sincronizar
npm run cap:build

# Abrir Android Studio
npm run cap:android

# Abrir Xcode
npm run cap:ios

# Solo sincronizar cambios
npm run cap:sync
```

### Ejecutar en Dispositivo
```bash
# Ejecutar en Android
npm run cap:run:android

# Ejecutar en iOS
npm run cap:run:ios
```

## 📋 Funcionalidades Nativas Disponibles

### 🌍 Geolocalización
```typescript
import { getCurrentPosition } from '../lib/capacitor-plugins';

const position = await getCurrentPosition();
console.log(position.latitude, position.longitude);
```

### 📷 Cámara
```typescript
import { takePhoto, pickImage } from '../lib/capacitor-plugins';

// Tomar foto
const photo = await takePhoto();

// Seleccionar de galería
const image = await pickImage();
```

### 🔔 Notificaciones
```typescript
import { scheduleLocalNotification } from '../lib/capacitor-plugins';

await scheduleLocalNotification(
  'Alerta de Seguridad',
  'Nuevo incidente reportado en tu zona'
);
```

## 🔧 Configuración Específica

### Colores y Tema
- **Background**: `#040910` (azul oscuro)
- **Theme**: `#B5CCF4` (azul claro)
- **Status Bar**: Estilo oscuro

### Permisos Configurados
- **Ubicación**: Siempre activa para reportes precisos
- **Cámara**: Requerida para evidencia fotográfica
- **Notificaciones**: Para alertas de seguridad

## 📱 Próximos Pasos

### Para Desarrollo
1. **Configurar Android Studio** (para Android)
2. **Configurar Xcode** (para iOS)
3. **Configurar dispositivos de prueba**

### Para Producción
1. **Configurar signing certificates**
2. **Configurar Firebase para push notifications**
3. **Configurar Google Play Console / App Store Connect**

## 🐛 Solución de Problemas

### Error: "missing out directory"
```bash
# Asegúrate de hacer el build primero
npm run export
npx cap sync
```

### Problemas de Permisos
- Verificar que los permisos estén configurados en `capacitor.config.ts`
- Revisar que se inicialicen correctamente en `capacitor-plugins.ts`

### Problemas de Build
- Limpiar cache: `rm -rf .next out`
- Reinstalar dependencias: `npm install`

## 📞 Contacto

Para cualquier problema con la migración, contactar al equipo de desarrollo de Claridad.

---

**Migración completada por:** Asistente IA
**Fecha:** $(date)
**Versión de Capacitor:** 7.x
